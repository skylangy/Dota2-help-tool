// Minimal privacy-conscious telemetry receiver for Dota 2 Help Tool.
// Deploy this on infrastructure you control. No third-party analytics SDK required.
//
// Environment variables:
//   PORT=8788
//   TELEMETRY_HMAC_SECRET=<long random secret>
//   ADMIN_TOKEN=<long random secret>
//   DATA_FILE=/var/lib/dota2-help-tool/stats.json
//
// POST /events  -> receives minimal anonymous telemetry
// GET  /stats   -> returns aggregate stats; requires Authorization: Bearer <ADMIN_TOKEN>

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT || 8788);
const SECRET = process.env.TELEMETRY_HMAC_SECRET || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const DATA_FILE = process.env.DATA_FILE || path.resolve(process.cwd(), "telemetry-stats.json");

if (!SECRET || SECRET.length < 24) {
  console.error("TELEMETRY_HMAC_SECRET must be set to a long random value.");
  process.exit(1);
}
if (!ADMIN_TOKEN || ADMIN_TOKEN.length < 24) {
  console.error("ADMIN_TOKEN must be set to a long random value.");
  process.exit(1);
}

function readStats() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return { totalOpens: 0, installs: {}, versions: {}, lastEventAt: null };
  }
}

function writeStats(stats) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(stats, null, 2), "utf8");
  fs.renameSync(tmp, DATA_FILE);
}

function hashInstallId(value) {
  return crypto.createHmac("sha256", SECRET).update(String(value)).digest("hex");
}

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  });
  res.end(JSON.stringify(body));
}

function authorized(req) {
  const value = req.headers.authorization || "";
  return value === `Bearer ${ADMIN_TOKEN}`;
}

function readBody(req, limit = 16 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let body = "";
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("payload_too_large"));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); } catch { reject(new Error("invalid_json")); }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return json(res, 204, {});

  const url = new URL(req.url, "http://localhost");

  if (req.method === "POST" && url.pathname === "/events") {
    try {
      const payload = await readBody(req);
      if (payload.event !== "app_open") return json(res, 400, { ok: false, error: "unsupported_event" });

      const stats = readStats();
      stats.totalOpens = Number(stats.totalOpens || 0) + 1;
      stats.lastEventAt = new Date().toISOString();

      const version = String(payload.appVersion || "unknown").slice(0, 32);
      stats.versions[version] = Number(stats.versions[version] || 0) + 1;

      if (payload.installId) {
        const installHash = hashInstallId(payload.installId);
        const existing = stats.installs[installHash];
        stats.installs[installHash] = {
          firstSeenAt: existing?.firstSeenAt || stats.lastEventAt,
          lastSeenAt: stats.lastEventAt
        };
      }

      writeStats(stats);
      return json(res, 200, { ok: true });
    } catch (error) {
      return json(res, error.message === "payload_too_large" ? 413 : 400, { ok: false, error: error.message });
    }
  }

  if (req.method === "GET" && url.pathname === "/stats") {
    if (!authorized(req)) return json(res, 401, { ok: false, error: "unauthorized" });
    const stats = readStats();
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const active7d = Object.values(stats.installs || {}).filter((x) => now - Date.parse(x.lastSeenAt) <= 7 * day).length;
    const active30d = Object.values(stats.installs || {}).filter((x) => now - Date.parse(x.lastSeenAt) <= 30 * day).length;
    return json(res, 200, {
      totalOpens: Number(stats.totalOpens || 0),
      anonymousUniqueInstalls: Object.keys(stats.installs || {}).length,
      activeInstalls7d: active7d,
      activeInstalls30d: active30d,
      versions: stats.versions || {},
      lastEventAt: stats.lastEventAt || null
    });
  }

  return json(res, 404, { ok: false, error: "not_found" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Telemetry receiver listening on :${PORT}`);
  console.log("This server intentionally does not log request IP addresses in application code.");
});
