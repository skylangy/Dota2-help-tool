// Phone second-screen bridge.
//
// Safety design: this is an ISOLATED, READ-ONLY, PIN-gated server that the user starts on
// demand. It binds to the LAN so a phone on the same Wi-Fi can VIEW the live recommendation.
// It deliberately exposes nothing else — no /gsi ingestion, no state mutation, no game data
// beyond the same recommendation the desktop already shows. The main API server stays bound
// to 127.0.0.1. There is no game-process interaction of any kind here.

const http = require("node:http");
const os = require("node:os");
const crypto = require("node:crypto");
const { WebSocketServer } = require("ws");
const QRCode = require("qrcode");

// Minimal, self-contained mobile page (no build step). Reads the PIN from its own URL and
// opens a websocket back to this bridge; renders only hero + next item + recommended items.
const MOBILE_HTML = `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Dota 2 Help Tool · 手机查看</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 16px; background: #0c1114; color: #edf3f2;
    font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; }
  .eyebrow { color: #d65c4f; font-size: 12px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
  h1 { margin: 4px 0 16px; font-size: 26px; }
  .conn { font-size: 13px; font-weight: 800; }
  .conn.ok { color: #8df0c8; } .conn.off { color: #e59a91; }
  .label { color: #8c9d9b; font-size: 11px; font-weight: 900; text-transform: uppercase; }
  .next { margin: 14px 0; padding: 14px; border: 1px solid rgba(222,87,74,.4); border-radius: 12px;
    background: linear-gradient(150deg, rgba(222,87,74,.22), transparent 60%), #10181c; }
  .next h2 { margin: 6px 0 6px; font-size: 24px; color: #fff8ef; }
  .next p { margin: 0; color: #b7c4c2; font-size: 14px; line-height: 1.5; }
  .rec { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  .chip { padding: 8px 12px; border: 1px solid rgba(137,158,158,.2); border-radius: 10px;
    background: #0f171b; font-size: 15px; font-weight: 800; }
  .notes { margin-top: 16px; display: grid; gap: 8px; }
  .notes p { margin: 0; padding: 9px 12px; border-left: 3px solid #7bd5c1; border-radius: 6px;
    background: rgba(123,213,193,.08); color: #b7c4c2; font-size: 13px; line-height: 1.5; }
  .empty { color: #8fa3a1; font-size: 15px; }
  .foot { margin-top: 20px; color: #6f807e; font-size: 11px; line-height: 1.5; }
</style>
</head>
<body>
  <div class="eyebrow">Dota 2 Help Tool · 手机查看</div>
  <h1 id="hero">连接中…</h1>
  <div class="conn off" id="conn">● 未连接</div>
  <div class="next">
    <span class="label">下一件</span>
    <h2 id="next-name">等待数据</h2>
    <p id="next-reason">在电脑上进入比赛后，这里会实时显示建议。</p>
  </div>
  <span class="label">推荐</span>
  <div class="rec" id="rec"></div>
  <div class="notes" id="notes"></div>
  <p class="foot">只读视图 · 通过同一局域网查看 · 不读取游戏内存、不注入、不自动操作。</p>
<script>
  var pin = new URLSearchParams(location.search).get("pin") || "";
  var connEl = document.getElementById("conn");
  function render(s) {
    var rec = (s && s.recommendation) || {};
    var sugg = rec.suggestions || [];
    document.getElementById("hero").textContent = rec.heroName || "等待 GSI";
    var first = sugg[0];
    document.getElementById("next-name").textContent = first ? first.itemName : "等待数据";
    document.getElementById("next-reason").textContent = first ? (first.reason || "") : "在电脑上进入比赛后，这里会实时显示建议。";
    var recEl = document.getElementById("rec");
    recEl.innerHTML = "";
    sugg.slice(1, 3).forEach(function (it) {
      var d = document.createElement("div"); d.className = "chip"; d.textContent = it.itemName; recEl.appendChild(d);
    });
    if (sugg.length < 2) { var e = document.createElement("span"); e.className = "empty"; e.textContent = "暂无其它推荐"; recEl.appendChild(e); }
    var notesEl = document.getElementById("notes");
    notesEl.innerHTML = "";
    (rec.notes || []).forEach(function (n) { var p = document.createElement("p"); p.textContent = n; notesEl.appendChild(p); });
  }
  function connect() {
    var ws = new WebSocket("ws://" + location.host + "/?pin=" + encodeURIComponent(pin));
    ws.onopen = function () { connEl.className = "conn ok"; connEl.textContent = "● 已连接"; };
    ws.onclose = function () { connEl.className = "conn off"; connEl.textContent = "● 已断开，重连中…"; setTimeout(connect, 1500); };
    ws.onmessage = function (ev) { try { var m = JSON.parse(ev.data); if (m.type === "snapshot") render(m.payload); } catch (e) {} };
  }
  connect();
</script>
</body>
</html>`;

// Virtual adapters (WSL/Docker/Hyper-V/VPN) hand out IPs a phone can't reach. Skip them by name
// so the popup shows the real Wi-Fi/Ethernet address the user should actually open.
const VIRTUAL_ADAPTER = /(vethernet|wsl|docker|virtualbox|vmware|hyper-v|loopback|tailscale|zerotier|bluetooth)/i;

function rankAddress(ip) {
  if (ip.startsWith("192.168.")) return 0; // typical home Wi-Fi/LAN
  if (ip.startsWith("10.")) return 1;
  return 2; // 172.16-31.x is often virtual; keep last
}

function collectAddresses(skipVirtual) {
  const nets = os.networkInterfaces();
  const out = [];
  for (const name of Object.keys(nets)) {
    if (skipVirtual && VIRTUAL_ADAPTER.test(name)) {
      continue;
    }
    for (const ni of nets[name] ?? []) {
      if (ni.family === "IPv4" && !ni.internal) {
        out.push(ni.address);
      }
    }
  }
  return out;
}

function lanAddresses() {
  let list = collectAddresses(true);
  if (list.length === 0) {
    list = collectAddresses(false); // fallback: don't hide everything if name-filtering misses
  }
  return list.sort((a, b) => rankAddress(a) - rankAddress(b));
}

// Probe upward from startPort until a free one is found (matches the user's "auto-detect" ask).
function findFreePort(startPort, host, maxTries = 30) {
  return new Promise((resolve, reject) => {
    let port = startPort;
    const attempt = () => {
      const tester = http.createServer();
      tester.once("error", (error) => {
        tester.close();
        if (error.code === "EADDRINUSE" && port - startPort < maxTries) {
          port += 1;
          attempt();
        } else {
          reject(error);
        }
      });
      tester.listen(port, host, () => {
        tester.close(() => resolve(port));
      });
    };
    attempt();
  });
}

async function startPhoneBridge({ getSnapshot, startPort = 8000, host = "0.0.0.0" }) {
  const pin = String(crypto.randomInt(1000, 10000));
  const port = await findFreePort(startPort, host);

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      res.end(MOBILE_HTML);
      return;
    }
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  });

  const wss = new WebSocketServer({ server });
  wss.on("connection", (socket, req) => {
    const url = new URL(req.url, "http://localhost");
    if (url.searchParams.get("pin") !== pin) {
      socket.close(4001, "invalid pin");
      return;
    }
    socket.send(JSON.stringify({ type: "snapshot", payload: getSnapshot() }));
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });

  function broadcast(payload) {
    const message = JSON.stringify({ type: "snapshot", payload });
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    }
  }

  function stop() {
    return new Promise((resolve) => {
      try {
        for (const client of wss.clients) client.terminate();
        wss.close();
      } catch {
        // ignore
      }
      server.close(() => resolve());
    });
  }

  const addresses = lanAddresses();
  const urls = addresses.map((ip) => `http://${ip}:${port}/?pin=${pin}`);

  // Generate the QR locally (offline) for the primary LAN url so the phone can just scan it —
  // no copy/paste across devices. The url (with PIN) never leaves this machine.
  let qr = null;
  if (urls.length > 0) {
    try {
      qr = await QRCode.toDataURL(urls[0], { margin: 1, width: 240 });
    } catch {
      qr = null;
    }
  }

  return { port, pin, addresses, urls, qr, broadcast, stop };
}

module.exports = {
  findFreePort,
  lanAddresses,
  startPhoneBridge
};
