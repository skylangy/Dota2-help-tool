const LANGUAGE_KEY = "dota2-help-tool-language";

const exact = new Map(Object.entries({
  "实时装备建议": "Real-time Item Advisor",
  "本地服务已连接": "Local service connected",
  "等待本地服务": "Waiting for local service",
  "上线测试清单": "Launch checklist",
  "本地服务连接": "Local service connection",
  "GSI 配置": "GSI configuration",
  "公开数据缓存": "Public data cache",
  "收到实时 GSI 数据": "Live GSI data received",
  "一键准备（装 GSI + 同步数据）": "Prepare (install GSI + sync data)",
  "还需要设置 Dota 2 启动项": "One more Dota 2 launch option",
  "为了让 Dota 2 主动把只读 GSI 数据发送到本机，请把下面这段启动项复制到 Steam 的 Dota 2 属性里。": "To let Dota 2 send read-only GSI data to this computer, copy the launch option below into Dota 2 Properties in Steam.",
  "已复制": "Copied",
  "复制启动项": "Copy launch option",
  "我知道了": "Got it",
  "不再提醒": "Don't remind me again",
  "工具不会自动修改 Steam 配置；这样更透明，也更符合安全边界。": "The tool does not modify Steam settings automatically. This keeps the setup transparent and within the project's safety boundary.",
  "手机查看": "Phone View",
  "在手机上打开下面的链接（手机要和电脑连同一个 Wi-Fi），就能实时看到推荐。链接里已经带好一次性 PIN，无需手动输入。": "Open the link below on a phone connected to the same Wi-Fi to see recommendations live. The one-time PIN is already included in the link.",
  "正在自动寻找空闲端口并开启…": "Finding a free port and starting…",
  "用手机相机直接扫码打开（手机与电脑同一 Wi-Fi）": "Scan with your phone camera (same Wi-Fi as this computer)",
  "扫不了？复制链接": "Can't scan? Copy link",
  "关闭手机查看": "Disable Phone View",
  "开启手机查看": "Enable Phone View",
  "没找到局域网地址，请确认电脑已连上 Wi-Fi 或网线。": "No LAN address found. Make sure the computer is connected by Wi-Fi or Ethernet.",
  "首次开启时 Windows 防火墙可能会弹窗，请点「允许」。这是只读视图，不读内存、不注入、不自动操作。": "Windows Firewall may ask for permission the first time. This is a read-only view: no memory reading, injection, or automated input.",
  "关闭窗口": "Close",
  "敌方阵容": "Enemy Lineup",
  "优先使用 Dota 2 GSI 主动发送的阵容数据；如果 GSI 未提供，再手动选择。不会读取隐藏信息。": "Use lineup data sent by Dota 2 GSI when available; otherwise select enemies manually. Hidden information is never read.",
  "GSI 自动读取": "Detected by GSI",
  "演示数据": "Demo data",
  "手动选择": "Manual selection",
  "等待 GSI 阵容": "Waiting for GSI lineup",
  "GSI 暂未提供双方阵容": "GSI has not provided both lineups yet",
  "等待 GSI 或手动选择敌方英雄": "Waiting for GSI or manual enemy selection",
  "搜索英雄，先同步公开数据": "Search heroes (sync public data first)",
  "未选择敌方英雄": "No enemy heroes selected",
  "刷新英雄": "Refresh heroes",
  "自动推断": "Auto-inferred",
  "暂无自动标签": "No inferred tags",
  "本机配置": "Local Setup",
  "GSI 已配置": "GSI configured",
  "需要配置 GSI": "GSI setup required",
  "Dota 2 已能把只读比赛状态发送到本机服务。": "Dota 2 can now send read-only match state to the local service.",
  "首次使用需要安装一个 Dota 2 GSI 配置文件。此操作只写入配置目录，不读取游戏内存，不注入进程。": "First-time setup installs a Dota 2 GSI config file. It only writes to the config directory; it does not read game memory or inject into the process.",
  "未检测到 Dota 2 配置目录": "Dota 2 config directory not detected",
  "安装 GSI 配置": "Install GSI config",
  "公开数据": "Public Data",
  "OpenDota 数据已缓存": "OpenDota data cached",
  "可同步公开数据": "Public data can be synced",
  "只下载 OpenDota 的公开英雄和物品常量，用于识别最新英雄和通用规则，不读取游戏进程。": "Downloads only public OpenDota hero and item constants to track current heroes and rules. It never reads the game process.",
  "英雄": "Heroes",
  "物品": "Items",
  "未同步": "Not synced",
  "战后复盘": "Post-match Review",
  "输入公开 Match ID，从 OpenDota 拉取战后数据。不会读取本机游戏或 Steam 进程。": "Enter a public Match ID to load post-match data from OpenDota. The local Dota 2 and Steam processes are never read.",
  "时长": "Duration",
  "胜方": "Winner",
  "亮点": "Highlights",
  "教练总结": "Coach Summary",
  "出装节奏": "Item Timing",
  "暂无装备数据": "No item data",
  "下一件": "Next Item",
  "推荐": "Alternatives",
  "进入比赛后显示建议": "Recommendations appear after entering a match",
  "独占全屏不显示，请用「无边框窗口」模式": "Use Borderless Window mode; exclusive fullscreen cannot show the mini-window",
  "持平": "No change",
  "个人成长": "Personal Growth",
  "当前状态": "Current State",
  "等待数据": "Waiting for data",
  "时间": "Time",
  "等级": "Level",
  "金钱": "Gold",
  "阶段": "Phase",
  "已检测物品": "Detected Items",
  "暂无物品数据": "No item data",
  "载入演示状态": "Load demo state",
  "等待建议": "Waiting for recommendation",
  "本周重点": "Weekly Focus",
  "局势标签": "Situation Tags",
  "系统与安全": "System & Safety",
  "Steam 启动项": "Steam Launch Option",
  "需要玩家手动把启动项加入 Dota 2 属性。工具不会自动修改 Steam 配置。": "Add the launch option manually in Dota 2 Properties. The tool will never change Steam settings automatically.",
  "显示启动项提示": "Show launch option reminder",
  "复盘与教练": "Review & Coach",
  "语音": "Voice",
  "边缘小窗": "Edge Mini-window",
  "对线期": "Laning",
  "核心成型期": "Core Timing",
  "后期": "Late Game",
  "优先": "High",
  "备选": "Medium",
  "观察": "Low",
  "敌方控制密度高": "Heavy enemy control",
  "敌方法术爆发高": "High enemy magic burst",
  "敌方物理爆发高": "High enemy physical burst",
  "敌方单点先手强": "Strong enemy single-target catch",
  "敌方闪避或致盲明显": "Enemy evasion or blind",
  "敌方前排很肉": "Durable enemy frontline",
  "敌方切入能力强": "Strong enemy gap close",
  "你容易被拉扯": "You are vulnerable to kiting",
  "敌方回复能力强": "High enemy sustain/healing",
  "敌方幻象或召唤物多": "Many enemy illusions or summons",
  "敌方隐身英雄多": "Multiple invisible enemies",
  "敌方沉默多": "Heavy enemy silence",
  "敌方削蓝压力高": "High mana-burn pressure",
  "团队缺少护甲和减攻速": "Team needs armor / attack-speed reduction",
  "需要驱散负面状态": "Dispel needed"
}));

const patterns = [
  [/^(\d+)\/5 已选择$/, "$1/5 selected"],
  [/^正在准备本机环境\.\.\.$/, "Preparing local environment…"],
  [/^GSI 已安装$/, "GSI installed"],
  [/^公开数据已同步$/, "Public data synced"],
  [/^公开数据同步失败：(.+)$/, "Public data sync failed: $1"],
  [/^GSI 未安装：(.+)$/, "GSI not installed: $1"],
  [/^记得练：(.+)$/, "Practice focus: $1"],
  [/^本周重点：(.+)$/, "Weekly focus: $1"],
  [/^端口 (\d+) · PIN (\d+)$/, "Port $1 · PIN $2"],
  [/^约 (\d+) 金，现在买得起$/, "about $1 gold, affordable now"],
  [/^约 (\d+) 金，还差 (\d+)$/, "about $1 gold, $2 more needed"],
  [/^（约 (\d+) 金，现在买得起）$/, "(about $1 gold, affordable now)"],
  [/^（约 (\d+) 金，还差 (\d+)）$/, "(about $1 gold, $2 more needed)"],
  [/^等待 Dota 2 GSI 数据$/, "Waiting for Dota 2 GSI data"],
  [/^未知英雄$/, "Unknown hero"],
  [/^启动 Dota 2 并进入比赛后，这里会显示实时装备建议。$/, "Start Dota 2 and enter a match to see live item recommendations."],
  [/^未选择额外局势标签，使用默认路线。$/, "No extra situation tags selected; using the default build path."],
  [/^对线期优先补齐基础战斗力、续航和移动能力，降低新手期的容错压力。/, "During the laning stage, prioritize basic fighting power, sustain, and mobility to improve your margin for error."],
  [/^这是当前定位的核心节奏装，通常能明显提升参战、刷钱或生存效率。/, "This is a core timing item for your current role and usually improves fighting, farming, or survivability."],
  [/^比赛进入后期，优先补强生存、输出或控制来提高团战稳定性。/, "In the late game, prioritize survivability, damage, or control to improve teamfight consistency."],
  [/^(.+)，这件装备能更直接解决本局最危险的问题。/, "$1; this item directly addresses one of the most dangerous problems in this match."],
  [/^本次针对：(.+)（已给出对应装备）$/, "Addressed now: $1 (counter items provided)"],
  [/^其余已识别局势（本次未单独出装，可后续按金钱补）：(.+)$/, "Other detected situations (not itemized separately yet): $1"],
  [/^暂无对应出装建议：(.+)$/, "No matching item recommendation yet: $1"]
];

function getLanguage() {
  return localStorage.getItem(LANGUAGE_KEY) || (navigator.language?.toLowerCase().startsWith("zh") ? "zh" : "en");
}

function translateText(value) {
  if (getLanguage() !== "en") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  let translated = exact.get(trimmed);
  if (!translated) {
    for (const [pattern, replacement] of patterns) {
      if (pattern.test(trimmed)) {
        translated = trimmed.replace(pattern, replacement);
        break;
      }
    }
  }
  if (!translated) return value;
  return value.replace(trimmed, translated);
}

function translateElement(root) {
  if (getLanguage() !== "en") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.parentElement?.closest("script, style, code")) continue;
    const next = translateText(node.nodeValue || "");
    if (next !== node.nodeValue) node.nodeValue = next;
  }
  const elements = root.querySelectorAll?.("[placeholder], [title], [aria-label]") || [];
  for (const element of elements) {
    for (const attr of ["placeholder", "title", "aria-label"]) {
      const value = element.getAttribute(attr);
      if (value) element.setAttribute(attr, translateText(value));
    }
  }
}

function configureAiLanguage(language) {
  try {
    const key = "dota2-help-tool-ai";
    const current = JSON.parse(localStorage.getItem(key) || "{}");
    localStorage.setItem(key, JSON.stringify({ ...current, language }));
  } catch {
    // Keep UI language independent if old local storage is malformed.
  }
}

function addLanguageButton() {
  if (document.getElementById("dota-language-switch")) return;
  const button = document.createElement("button");
  button.id = "dota-language-switch";
  button.type = "button";
  button.textContent = getLanguage() === "en" ? "中文" : "English";
  button.title = getLanguage() === "en" ? "切换到中文" : "Switch to English";
  button.style.cssText = "position:fixed;top:16px;right:18px;z-index:9999;padding:8px 12px;border-radius:9px;border:1px solid rgba(255,255,255,.18);background:#11191d;color:#edf3f2;font:700 13px system-ui;cursor:pointer;box-shadow:0 6px 22px rgba(0,0,0,.25)";
  button.addEventListener("click", () => {
    const next = getLanguage() === "en" ? "zh" : "en";
    localStorage.setItem(LANGUAGE_KEY, next);
    configureAiLanguage(next);
    location.reload();
  });
  document.body.appendChild(button);
}

function patchSpeech() {
  if (!window.speechSynthesis || window.__dotaSpeechPatched) return;
  window.__dotaSpeechPatched = true;
  const original = window.speechSynthesis.speak.bind(window.speechSynthesis);
  window.speechSynthesis.speak = (utterance) => {
    if (getLanguage() === "en" && utterance) {
      utterance.text = String(utterance.text || "").replace(/^建议出/, "Buy ");
      utterance.lang = "en-US";
    }
    original(utterance);
  };
}

function start() {
  document.documentElement.lang = getLanguage() === "en" ? "en" : "zh-CN";
  configureAiLanguage(getLanguage());
  addLanguageButton();
  patchSpeech();
  translateElement(document.body);
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) translateElement(node);
        if (node.nodeType === Node.TEXT_NODE && node.parentElement) translateElement(node.parentElement);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
