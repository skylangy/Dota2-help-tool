const API_BASE = "http://127.0.0.1:3008";
const LANG_KEY = "dota2-help-tool-language";

function lang() {
  return localStorage.getItem(LANG_KEY) || (navigator.language?.toLowerCase().startsWith("zh") ? "zh" : "en");
}

function copy() {
  const en = lang() === "en";
  return en ? {
    title: "Context Coach",
    why: "Why this item?",
    whatIf: "What-if Simulator",
    patch: "Patch Intelligence",
    chooseA: "Item A",
    chooseB: "Item B",
    compare: "Compare",
    waiting: "Enter a match to receive contextual analysis.",
    detected: "Detected pressure",
    none: "No extra threats detected",
    phase: "Phase",
    level: "Level",
    gold: "Gold",
    more: "more gold needed",
    afford: "Affordable now",
    score: "Fit score",
    heuristic: "Explainable heuristic score, not a win-probability prediction.",
    synced: "Latest public hero/item data is synced automatically.",
    patchUnknown: "Patch not synced yet",
    auto: "Auto-checks on startup and every 6 hours",
    current: "Current recommendation",
    privacy: "No hidden information is used."
  } : {
    title: "局势教练",
    why: "为什么推荐这件？",
    whatIf: "What-if 装备模拟",
    patch: "版本情报",
    chooseA: "装备 A",
    chooseB: "装备 B",
    compare: "对比",
    waiting: "进入比赛后，这里会给出基于局势的分析。",
    detected: "识别到的主要压力",
    none: "当前没有额外威胁标签",
    phase: "阶段",
    level: "等级",
    gold: "金钱",
    more: "金后可购买",
    afford: "现在买得起",
    score: "适配分",
    heuristic: "这是可解释的启发式评分，不是胜率预测。",
    synced: "英雄/装备公开数据会自动保持最新。",
    patchUnknown: "当前还未同步版本",
    auto: "启动时检查，并每 6 小时自动检查一次",
    current: "当前推荐",
    privacy: "不会使用隐藏信息。"
  };
}

const THREAT = {
  en: {
    control_heavy: "heavy control", magic_burst: "magic burst", physical_burst: "physical burst",
    single_target_catch: "single-target catch", evasion: "evasion/blind", tank_frontline: "durable frontline",
    gap_close: "gap close", kite: "kiting pressure", high_healing: "high healing", illusion_enemy: "illusions/summons",
    invisible_enemy: "invisibility", silence_heavy: "silence", mana_burn: "mana burn", armor_needed: "armor need", dispel_needed: "dispel need"
  },
  zh: {
    control_heavy: "控制密度高", magic_burst: "法术爆发高", physical_burst: "物理爆发高",
    single_target_catch: "单点先手强", evasion: "闪避/致盲", tank_frontline: "前排很肉",
    gap_close: "切入强", kite: "拉扯压力", high_healing: "回复强", illusion_enemy: "幻象/召唤物多",
    invisible_enemy: "隐身多", silence_heavy: "沉默多", mana_burn: "削蓝压力", armor_needed: "缺护甲", dispel_needed: "需要驱散"
  }
};

const COUNTERS = {
  control_heavy: ["black_king_bar", "manta", "lotus_orb"],
  magic_burst: ["black_king_bar", "pipe", "glimmer_cape"],
  physical_burst: ["shivas_guard", "ghost", "crimson_guard"],
  single_target_catch: ["sphere", "lotus_orb", "black_king_bar"],
  evasion: ["monkey_king_bar", "bloodthorn"],
  high_healing: ["spirit_vessel", "skadi", "shivas_guard"],
  illusion_enemy: ["bfury", "maelstrom", "shivas_guard"],
  silence_heavy: ["black_king_bar", "manta", "lotus_orb"],
  dispel_needed: ["manta", "lotus_orb", "cyclone", "guardian_greaves"]
};

let latestState = null;
let latestData = null;
let heroesLoaded = false;

async function json(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function normalizeItem(value = "") {
  return String(value).replace(/^item_/, "");
}

function fitScore(itemKey, threats, cost, gold) {
  let score = 50;
  if (cost > 0 && gold >= cost) score += 10;
  if (cost > 5000) score -= 5;
  for (const threat of threats) {
    if ((COUNTERS[threat] || []).includes(itemKey)) score += threat === "evasion" || threat === "single_target_catch" ? 24 : 20;
  }
  return Math.max(0, Math.min(100, score));
}

function style() {
  if (document.getElementById("insights-style")) return;
  const s = document.createElement("style");
  s.id = "insights-style";
  s.textContent = `
    #dota-insights{margin:18px 0;padding:16px;border:1px solid rgba(137,158,158,.2);border-radius:14px;background:#0f171b;color:#edf3f2;font-family:system-ui,sans-serif}
    #dota-insights h2{margin:0 0 12px;font-size:18px}#dota-insights h3{margin:14px 0 8px;font-size:14px;color:#d9e5e3}
    #dota-insights p{margin:5px 0;color:#b7c4c2;font-size:13px;line-height:1.5}.insight-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
    .insight-card{padding:12px;border-radius:12px;background:#111c20;border:1px solid rgba(255,255,255,.06)}.insight-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .insight-select,.insight-btn{background:#0c1316;color:#edf3f2;border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:7px 9px;font-size:12px}
    .insight-btn{cursor:pointer;font-weight:700}.insight-score{font-size:24px;font-weight:900;color:#fff}.insight-muted{opacity:.7}
    @media(max-width:1000px){.insight-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(s);
}

function ensurePanel() {
  if (document.getElementById("dota-insights")) return document.getElementById("dota-insights");
  style();
  const panel = document.createElement("section");
  panel.id = "dota-insights";
  const workspace = document.querySelector(".workspace");
  if (workspace?.parentElement) workspace.parentElement.insertBefore(panel, workspace);
  else document.getElementById("root")?.appendChild(panel);
  return panel;
}

function itemOptions(selected) {
  const items = latestData?.sampleItems || [];
  return items.map((i) => `<option value="${i.key}" ${i.key === selected ? "selected" : ""}>${i.name}</option>`).join("");
}

function render() {
  const panel = ensurePanel();
  if (!panel) return;
  const t = copy();
  const state = latestState || {};
  const rec = state.recommendation || {};
  const game = state.gameState || {};
  const threats = state.context?.threats || [];
  const first = rec.suggestions?.[0];
  const patch = latestData?.patch;
  const remain = first?.cost ? Math.max(0, first.cost - Number(game.gold || 0)) : null;
  const labels = threats.map((x) => THREAT[lang()]?.[x] || x);
  const items = latestData?.sampleItems || [];
  const defaultA = normalizeItem(first?.itemId || items[0]?.key || "black_king_bar");
  const defaultB = items.find((i) => i.key !== defaultA)?.key || "manta";

  panel.innerHTML = `
    <h2>${t.title}</h2>
    <div class="insight-grid">
      <div class="insight-card">
        <h3>${t.why}</h3>
        ${first ? `<p><strong>${t.current}: ${first.itemName}</strong></p>
          <p>${labels.length ? `${t.detected}: ${labels.join(", ")}` : t.none}</p>
          <p>${t.phase}: ${rec.phase || "-"} · ${t.level}: ${game.level || "-"} · ${t.gold}: ${game.gold || 0}</p>
          <p>${remain == null ? "" : remain === 0 ? t.afford : `${remain} ${t.more}`}</p>
          <p class="insight-muted">${t.privacy}</p>` : `<p>${t.waiting}</p>`}
      </div>
      <div class="insight-card">
        <h3>${t.whatIf}</h3>
        <div class="insight-row"><select id="whatif-a" class="insight-select">${itemOptions(defaultA)}</select><select id="whatif-b" class="insight-select">${itemOptions(defaultB)}</select><button id="whatif-go" class="insight-btn">${t.compare}</button></div>
        <div id="whatif-result"><p class="insight-muted">${t.heuristic}</p></div>
      </div>
      <div class="insight-card">
        <h3>${t.patch}</h3>
        <div class="insight-score">${patch || "—"}</div>
        <p>${patch ? t.synced : t.patchUnknown}</p><p class="insight-muted">${t.auto}</p>
      </div>
    </div>`;

  document.getElementById("whatif-go")?.addEventListener("click", () => {
    const aKey = document.getElementById("whatif-a")?.value;
    const bKey = document.getElementById("whatif-b")?.value;
    const a = items.find((i) => i.key === aKey);
    const b = items.find((i) => i.key === bKey);
    if (!a || !b) return;
    const aScore = fitScore(a.key, threats, Number(a.cost || 0), Number(game.gold || 0));
    const bScore = fitScore(b.key, threats, Number(b.cost || 0), Number(game.gold || 0));
    const winner = aScore === bScore ? null : aScore > bScore ? a.name : b.name;
    const verdict = lang() === "en" ? (winner ? `${winner} fits the detected situation better.` : "Both items have a similar fit.") : (winner ? `按当前局势，${winner} 更合适。` : "按当前局势，两件装备适配度接近。");
    document.getElementById("whatif-result").innerHTML = `<p><strong>${a.name}: ${aScore}</strong> · ${b.name}: ${bScore}</p><p>${verdict}</p><p class="insight-muted">${t.heuristic}</p>`;
  });
}

async function refresh() {
  try {
    [latestState, latestData] = await Promise.all([json("/api/state"), json("/api/data/status")]);
    if (!heroesLoaded && latestData?.hasCache) {
      try {
        const full = await json("/api/data/status");
        latestData = full;
      } catch {}
      heroesLoaded = true;
    }
    render();
  } catch {}
}

const observer = new MutationObserver(() => { if (!document.getElementById("dota-insights")) render(); });
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("storage", render);
setInterval(refresh, 4000);
setTimeout(refresh, 800);
