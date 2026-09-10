const API_BASE = "http://127.0.0.1:3008";
const LANG_KEY = "dota2-help-tool-language";

function lang() {
  return localStorage.getItem(LANG_KEY) || (navigator.language?.toLowerCase().startsWith("zh") ? "zh" : "en");
}

function copy() {
  return lang() === "en" ? {
    title: "Anonymous usage statistics",
    body: "Help improve Dota 2 Help Tool by allowing minimal anonymous usage statistics. The app will send only an app-open event, app version, time, and a random installation ID used to estimate unique installations. It will not send Steam IDs, Dota account IDs, match IDs, heroes, items, game state, machine name, hardware identifiers, or automated input data.",
    accept: "Allow anonymous statistics",
    decline: "No thanks",
    note: "Your choice does not affect app features. You can change it later by deleting the local telemetry preference or through a future privacy settings panel.",
    legal: "This project is an independent read-only learning assistant. It is not affiliated with, endorsed by, or part of Valve, Steam, Dota 2, or Dota Plus."
  } : {
    title: "匿名使用统计",
    body: "你可以选择帮助改进 Dota 2 Help Tool。开启后，软件只会上报启动事件、应用版本、时间，以及一个用于估算“匿名独立安装数”的随机安装 ID。不会上报 Steam ID、Dota 账号 ID、Match ID、英雄、装备、游戏状态、机器名、硬件标识，也不会上报任何自动操作数据。",
    accept: "同意匿名统计",
    decline: "不同意",
    note: "是否同意不会影响任何功能。你可以之后通过本地隐私设置撤回；撤回后本地随机安装 ID 会删除。",
    legal: "本项目是独立开发的只读学习辅助工具，与 Valve、Steam、Dota 2 或 Dota Plus 无隶属、授权或背书关系。"
  };
}

async function status() {
  const response = await fetch(`${API_BASE}/api/telemetry/status`);
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

async function setConsent(consented) {
  const response = await fetch(`${API_BASE}/api/telemetry/consent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consented })
  });
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

function addStyle() {
  if (document.getElementById("telemetry-consent-style")) return;
  const style = document.createElement("style");
  style.id = "telemetry-consent-style";
  style.textContent = `
    #telemetry-consent-backdrop{position:fixed;inset:0;z-index:10050;background:rgba(4,8,10,.72);display:flex;align-items:center;justify-content:center;padding:20px}
    #telemetry-consent-card{max-width:620px;width:100%;background:#11191d;color:#edf3f2;border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:22px;box-shadow:0 24px 80px rgba(0,0,0,.45);font-family:system-ui,sans-serif}
    #telemetry-consent-card h2{margin:0 0 10px;font-size:21px}#telemetry-consent-card p{margin:8px 0;color:#b7c4c2;line-height:1.6;font-size:13px}
    .telemetry-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.telemetry-actions button{border-radius:9px;padding:9px 13px;font-weight:800;cursor:pointer}
    .telemetry-accept{border:0;background:#d65c4f;color:white}.telemetry-decline{border:1px solid rgba(255,255,255,.16);background:#0c1316;color:#edf3f2}
    .telemetry-legal{font-size:11px!important;opacity:.72}
  `;
  document.head.appendChild(style);
}

function showDialog() {
  if (document.getElementById("telemetry-consent-backdrop")) return;
  addStyle();
  const t = copy();
  const backdrop = document.createElement("div");
  backdrop.id = "telemetry-consent-backdrop";
  backdrop.innerHTML = `<section id="telemetry-consent-card" role="dialog" aria-modal="true" aria-labelledby="telemetry-title">
    <h2 id="telemetry-title">${t.title}</h2>
    <p>${t.body}</p>
    <p>${t.note}</p>
    <p class="telemetry-legal">${t.legal}</p>
    <div class="telemetry-actions">
      <button class="telemetry-accept" id="telemetry-accept">${t.accept}</button>
      <button class="telemetry-decline" id="telemetry-decline">${t.decline}</button>
    </div>
  </section>`;
  document.body.appendChild(backdrop);

  document.getElementById("telemetry-accept")?.addEventListener("click", async () => {
    try { await setConsent(true); } finally { backdrop.remove(); }
  });
  document.getElementById("telemetry-decline")?.addEventListener("click", async () => {
    try { await setConsent(false); } finally { backdrop.remove(); }
  });
}

async function init() {
  try {
    const info = await status();
    if (!info.enabled || !info.endpointConfigured) return;
    if (info.consent?.decided) return;
    showDialog();
  } catch {
    // Telemetry consent must never block the app.
  }
}

setTimeout(init, 1200);
