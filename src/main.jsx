import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  BarChart3,
  Brain,
  Check,
  CircleAlert,
  Cloud,
  FolderCheck,
  Maximize2,
  MessageSquareText,
  Search,
  Minimize2,
  Play,
  RefreshCw,
  Settings,
  Shield,
  Wifi,
  WifiOff
} from "lucide-react";
import "./styles.css";

const API_BASE = "http://127.0.0.1:3008";
const WS_URL = "ws://127.0.0.1:3008";

const phaseLabels = {
  lane: "对线期",
  core: "核心成型期",
  late: "后期"
};

const priorityLabels = {
  high: "优先",
  medium: "备选",
  low: "观察"
};

const STEAM_CDN = "https://cdn.cloudflare.steamstatic.com";
const DOTA_LAUNCH_OPTION = "-gamestateintegration";

function assetUrl(pathname) {
  if (!pathname) return "";
  return pathname.startsWith("http") ? pathname : `${STEAM_CDN}${pathname}`;
}

function itemImageFromId(itemId = "") {
  const key = itemId.replace(/^item_/, "");
  return key ? `${STEAM_CDN}/apps/dota2/images/dota_react/items/${key}.png` : "";
}

function abbrev(label = "?") {
  return label
    .replace(/^npc_dota_hero_/, "")
    .replace(/^item_/, "")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

function formatTime(seconds = 0) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = Math.floor(safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message ?? `Request failed: ${response.status}`);
  }

  return payload;
}

async function postJson(path, body = {}) {
  return requestJson(path, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

function useLiveSnapshot() {
  const [snapshot, setSnapshot] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let socket;
    let retryTimer;

    const connect = () => {
      socket = new WebSocket(WS_URL);
      socket.addEventListener("open", () => setConnected(true));
      socket.addEventListener("close", () => {
        setConnected(false);
        retryTimer = window.setTimeout(connect, 1200);
      });
      socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "snapshot") {
          setSnapshot(message.payload);
        }
      });
    };

    requestJson("/api/state").then(setSnapshot).catch(() => undefined);
    connect();

    return () => {
      window.clearTimeout(retryTimer);
      socket?.close();
    };
  }, []);

  return { connected, setSnapshot, snapshot };
}

function useSetupStatus() {
  const [setup, setSetup] = useState(null);
  const [setupError, setSetupError] = useState("");
  const [setupBusy, setSetupBusy] = useState(false);

  async function refreshSetup() {
    setSetupError("");
    try {
      setSetup(await requestJson("/api/setup/status"));
    } catch (error) {
      setSetupError(error.message);
    }
  }

  async function installSetup() {
    setSetupBusy(true);
    setSetupError("");
    try {
      setSetup(await postJson("/api/setup/install"));
    } catch (error) {
      setSetupError(error.message);
    } finally {
      setSetupBusy(false);
    }
  }

  useEffect(() => {
    refreshSetup();
  }, []);

  return { installSetup, refreshSetup, setup, setupBusy, setupError };
}

function usePublicData() {
  const [dataStatus, setDataStatus] = useState(null);
  const [dataBusy, setDataBusy] = useState(false);
  const [dataError, setDataError] = useState("");

  async function refreshData() {
    setDataError("");
    try {
      setDataStatus(await requestJson("/api/data/status"));
    } catch (error) {
      setDataError(error.message);
    }
  }

  async function syncData() {
    setDataBusy(true);
    setDataError("");
    try {
      setDataStatus(await postJson("/api/data/sync"));
    } catch (error) {
      setDataError(error.message);
    } finally {
      setDataBusy(false);
    }
  }

  useEffect(() => {
    refreshData();
  }, []);

  return { dataBusy, dataError, dataStatus, refreshData, syncData };
}

function useDiagnostics() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [diagnosticsBusy, setDiagnosticsBusy] = useState(false);
  const [diagnosticsError, setDiagnosticsError] = useState("");

  async function refreshDiagnostics() {
    setDiagnosticsBusy(true);
    setDiagnosticsError("");
    try {
      setDiagnostics(await requestJson("/api/diagnostics"));
    } catch (error) {
      setDiagnosticsError(error.message);
    } finally {
      setDiagnosticsBusy(false);
    }
  }

  useEffect(() => {
    refreshDiagnostics();
  }, []);

  return { diagnostics, diagnosticsBusy, diagnosticsError, refreshDiagnostics };
}

function useHeroCatalog() {
  const [heroes, setHeroes] = useState([]);
  const [heroError, setHeroError] = useState("");

  async function refreshHeroes() {
    setHeroError("");
    try {
      const result = await requestJson("/api/heroes");
      setHeroes(result.heroes ?? []);
    } catch (error) {
      setHeroError(error.message);
    }
  }

  useEffect(() => {
    refreshHeroes();
  }, []);

  return { heroes, heroError, refreshHeroes };
}

function useAiConfig() {
  const [aiConfig, setAiConfig] = useState(() => {
    const saved = window.localStorage.getItem("dota2-help-tool-ai");
    if (saved) return JSON.parse(saved);
    return {
      enabled: false,
      provider: "ollama",
      endpoint: "http://127.0.0.1:11434/api/chat",
      model: "llama3.1",
      apiKey: "",
      language: "zh"
    };
  });

  function updateAiConfig(next) {
    const merged = { ...aiConfig, ...next };
    setAiConfig(merged);
    window.localStorage.setItem("dota2-help-tool-ai", JSON.stringify(merged));
  }

  return { aiConfig, updateAiConfig };
}

function useLaunchOptionReminder() {
  const [showLaunchReminder, setShowLaunchReminder] = useState(false);
  const [launchReminderDismissed, setLaunchReminderDismissed] = useState(() => (
    window.localStorage.getItem("dota2-help-tool-hide-launch-reminder") === "true"
  ));

  function openLaunchReminder() {
    if (!launchReminderDismissed) {
      setShowLaunchReminder(true);
    }
  }

  function closeLaunchReminder({ dontRemind = false } = {}) {
    if (dontRemind) {
      window.localStorage.setItem("dota2-help-tool-hide-launch-reminder", "true");
      setLaunchReminderDismissed(true);
    }
    setShowLaunchReminder(false);
  }

  function resetLaunchReminder() {
    window.localStorage.removeItem("dota2-help-tool-hide-launch-reminder");
    setLaunchReminderDismissed(false);
    setShowLaunchReminder(true);
  }

  return {
    closeLaunchReminder,
    launchReminderDismissed,
    openLaunchReminder,
    resetLaunchReminder,
    showLaunchReminder
  };
}

function StatusBadge({ connected }) {
  return (
    <div className={connected ? "status connected" : "status"}>
      {connected ? <Wifi size={16} /> : <WifiOff size={16} />}
      {connected ? "本地服务已连接" : "等待本地服务"}
    </div>
  );
}

function ChecklistItem({ done, label }) {
  return (
    <div className={done ? "check-item done" : "check-item"}>
      {done ? <Check size={16} /> : <CircleAlert size={16} />}
      <span>{label}</span>
    </div>
  );
}

function LaunchChecklist({
  connected,
  dataStatus,
  gameState,
  onCompact,
  onInstall,
  onMock,
  onPrepare,
  onSync,
  prepareBusy,
  prepareMessage,
  setup,
  setupBusy,
  dataBusy
}) {
  const hasLiveData = Boolean(gameState?.receivedAt);
  const readyCount = [
    connected,
    setup?.installed,
    dataStatus?.hasCache,
    hasLiveData
  ].filter(Boolean).length;

  return (
    <section className="launch-checklist">
      <div>
        <p className="eyebrow">Quick Start</p>
        <h2>上线测试清单 {readyCount}/4</h2>
        {prepareMessage ? <p className="quick-message">{prepareMessage}</p> : null}
      </div>
      <div className="check-grid">
        <ChecklistItem done={connected} label="本地服务连接" />
        <ChecklistItem done={Boolean(setup?.installed)} label="GSI 配置" />
        <ChecklistItem done={Boolean(dataStatus?.hasCache)} label="公开数据缓存" />
        <ChecklistItem done={hasLiveData} label="收到实时 GSI 数据" />
      </div>
      <div className="check-actions">
        <button className="primary-button" type="button" onClick={onPrepare} disabled={prepareBusy}>
          {prepareBusy ? <RefreshCw className="spin" size={17} /> : <FolderCheck size={17} />}
          一键准备
        </button>
        <button className="ghost-button compact-toggle" type="button" onClick={onInstall} disabled={setupBusy}>
          {setupBusy ? <RefreshCw className="spin" size={17} /> : <FolderCheck size={17} />}
          安装 GSI
        </button>
        <button className="ghost-button compact-toggle" type="button" onClick={onSync} disabled={dataBusy}>
          {dataBusy ? <RefreshCw className="spin" size={17} /> : <Cloud size={17} />}
          同步数据
        </button>
        <button className="ghost-button compact-toggle" type="button" onClick={onMock}>
          <Play size={17} />
          演示
        </button>
        <button className="ghost-button compact-toggle" type="button" onClick={onCompact}>
          <Minimize2 size={17} />
          小窗
        </button>
      </div>
    </section>
  );
}

function LaunchOptionDialog({ onClose, open }) {
  const [dontRemind, setDontRemind] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  async function copyLaunchOption() {
    try {
      if (window.dota2HelpTool?.copyText) {
        await window.dota2HelpTool.copyText(DOTA_LAUNCH_OPTION);
        setCopied(true);
        return;
      }
      await navigator.clipboard.writeText(DOTA_LAUNCH_OPTION);
      setCopied(true);
    } catch {
      const input = document.createElement("textarea");
      input.value = DOTA_LAUNCH_OPTION;
      input.setAttribute("readonly", "true");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      input.select();
      document.execCommand("copy");
      input.remove();
      setCopied(true);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="launch-option-title">
        <div className="panel-title">
          <Settings size={18} />
          <h2 id="launch-option-title">还需要设置 Dota 2 启动项</h2>
        </div>
        <p className="setup-copy">
          为了让 Dota 2 主动把只读 GSI 数据发送到本机，请把下面这段启动项复制到 Steam 的 Dota 2 属性里。
        </p>
        <code className="launch-command">{DOTA_LAUNCH_OPTION}</code>
        <div className="modal-actions">
          <button className="primary-button" type="button" onClick={copyLaunchOption}>
            <FolderCheck size={17} />
            {copied ? "已复制" : "复制启动项"}
          </button>
          <button className="ghost-button" type="button" onClick={() => onClose({ dontRemind })}>
            我知道了
          </button>
        </div>
        <label className="toggle-line launch-toggle">
          <input checked={dontRemind} type="checkbox" onChange={(event) => setDontRemind(event.target.checked)} />
          不再提醒
        </label>
        <p className="compact-safety">
          工具不会自动修改 Steam 配置；这样更透明，也更符合安全边界。
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function GameIcon({ alt, className = "", fallback, src }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span className={`game-icon fallback ${className}`}>{fallback ?? abbrev(alt)}</span>;
  }

  return <img className={`game-icon ${className}`} src={src} alt={alt} onError={() => setFailed(true)} />;
}

function heroById(heroes, heroId) {
  return heroes.find((hero) => hero.id === heroId);
}

function ThreatToggle({ id, label, active, onToggle }) {
  return (
    <button className={active ? "threat active" : "threat"} type="button" onClick={() => onToggle(id)}>
      {active ? <Check size={15} /> : <Shield size={15} />}
      <span>{label}</span>
    </button>
  );
}

function EnemyLineupPanel({ activeEnemyHeroes, enemyHeroesSource, gameLineups, heroes, heroError, inferredThreats, onChange, onRefresh }) {
  const [query, setQuery] = useState("");
  const selected = new Set(activeEnemyHeroes);
  const filteredHeroes = heroes
    .filter((hero) => (hero.name ?? "").toLowerCase().includes(query.toLowerCase()) || hero.id.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 40);
  const sourceLabel = {
    gsi_allplayers: "GSI 自动读取",
    demo: "演示数据",
    manual: "手动选择"
  }[enemyHeroesSource] ?? "等待 GSI 阵容";
  const lineupSource = gameLineups?.source === "gsi_allplayers"
    ? `Radiant ${gameLineups.radiant?.length ?? 0} / Dire ${gameLineups.dire?.length ?? 0}`
    : gameLineups?.source === "gsi_draft"
      ? `Draft ${gameLineups.draftHeroes?.length ?? 0}`
      : "GSI 暂未提供双方阵容";

  function toggleHero(heroId) {
    const next = selected.has(heroId)
      ? activeEnemyHeroes.filter((id) => id !== heroId)
      : activeEnemyHeroes.length >= 5
        ? [...activeEnemyHeroes.slice(1), heroId]
        : [...activeEnemyHeroes, heroId];
    onChange(next);
  }

  return (
    <aside className="panel lineup-panel">
      <div className="panel-title">
        <Search size={18} />
        <h2>敌方阵容</h2>
      </div>
      <p className="setup-copy">优先使用 Dota 2 GSI 主动发送的阵容数据；如果 GSI 未提供，再手动选择。不会读取隐藏信息。</p>
      <div className="auto-lineup-status">
        <span>{sourceLabel}</span>
        <p>{lineupSource}</p>
      </div>
      <div className="lineup-strip">
        {activeEnemyHeroes.length > 0 ? activeEnemyHeroes.map((heroId) => {
          const hero = heroById(heroes, heroId);
          const heroName = hero?.name ?? heroId.replace("npc_dota_hero_", "");
          return (
            <div className="lineup-token" key={heroId} title={heroName}>
              <GameIcon alt={heroName} fallback={abbrev(heroName)} src={assetUrl(hero?.icon ?? hero?.img)} />
              <span>{heroName}</span>
            </div>
          );
        }) : <p className="empty-gsi">等待 GSI 或手动选择敌方英雄</p>}
      </div>
      <input
        className="search-input"
        placeholder="搜索英雄，先同步公开数据"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {heroError ? <p className="setup-error">{heroError}</p> : null}
      <div className="selected-line">
        {activeEnemyHeroes.length > 0 ? `${activeEnemyHeroes.length}/5 已选择` : "未选择敌方英雄"}
        <button className="text-button" type="button" onClick={onRefresh}>刷新英雄</button>
      </div>
      <div className="hero-picker">
        {filteredHeroes.map((hero) => (
          <button
            className={selected.has(hero.id) ? "hero-chip active" : "hero-chip"}
            key={hero.id}
            type="button"
            onClick={() => toggleHero(hero.id)}
          >
            <GameIcon alt={hero.name} fallback={abbrev(hero.name)} src={assetUrl(hero.icon ?? hero.img)} />
            {hero.name}
          </button>
        ))}
      </div>
      <div className="inferred-tags">
        <span>自动推断</span>
        <p>{inferredThreats.length > 0 ? inferredThreats.join("、") : "暂无自动标签"}</p>
      </div>
    </aside>
  );
}

function SetupPanel({ setup, setupBusy, setupError, onInstall, onRefresh }) {
  const ready = setup?.installed;
  const pathHint = setup?.installedTargets?.[0] ?? setup?.dotaConfigDirs?.[0] ?? "未检测到 Dota 2 配置目录";

  return (
    <aside className="panel setup-panel">
      <div className="panel-title">
        <Settings size={18} />
        <h2>本机配置</h2>
      </div>
      <div className={ready ? "setup-status ready" : "setup-status"}>
        {ready ? <FolderCheck size={18} /> : <CircleAlert size={18} />}
        <strong>{ready ? "GSI 已配置" : "需要配置 GSI"}</strong>
      </div>
      <p className="setup-copy">
        {ready
          ? "Dota 2 已能把只读比赛状态发送到本机服务。"
          : "首次使用需要安装一个 Dota 2 GSI 配置文件。此操作只写入配置目录，不读取游戏内存，不注入进程。"}
      </p>
      <code className="path-line">{pathHint}</code>
      {setupError ? <p className="setup-error">{setupError}</p> : null}
      <div className="setup-actions">
        <button className="ghost-button" type="button" onClick={onInstall} disabled={setupBusy}>
          {setupBusy ? <RefreshCw className="spin" size={17} /> : <FolderCheck size={17} />}
          安装 GSI 配置
        </button>
        <button className="icon-button" type="button" onClick={onRefresh} aria-label="刷新配置状态" title="刷新配置状态">
          <RefreshCw size={17} />
        </button>
      </div>
    </aside>
  );
}

function DataPanel({ dataBusy, dataError, dataStatus, onRefresh, onSync }) {
  const ready = dataStatus?.hasCache;
  const generatedAt = dataStatus?.generatedAt ? new Date(dataStatus.generatedAt).toLocaleString() : "未同步";

  return (
    <aside className="panel setup-panel">
      <div className="panel-title">
        <Cloud size={18} />
        <h2>公开数据</h2>
      </div>
      <div className={ready ? "setup-status ready" : "setup-status"}>
        {ready ? <FolderCheck size={18} /> : <CircleAlert size={18} />}
        <strong>{ready ? "OpenDota 数据已缓存" : "可同步公开数据"}</strong>
      </div>
      <p className="setup-copy">
        只下载 OpenDota 的公开英雄和物品常量，用于识别最新英雄和通用规则，不读取游戏进程。
      </p>
      <div className="data-metrics">
        <Stat label="英雄" value={dataStatus?.heroCount ?? 0} />
        <Stat label="物品" value={dataStatus?.itemCount ?? 0} />
      </div>
      <code className="path-line">{generatedAt}</code>
      {dataError ? <p className="setup-error">{dataError}</p> : null}
      <div className="setup-actions">
        <button className="ghost-button" type="button" onClick={onSync} disabled={dataBusy}>
          {dataBusy ? <RefreshCw className="spin" size={17} /> : <Cloud size={17} />}
          同步公开数据
        </button>
        <button className="icon-button" type="button" onClick={onRefresh} aria-label="刷新数据状态" title="刷新数据状态">
          <RefreshCw size={17} />
        </button>
      </div>
    </aside>
  );
}

function DiagnosticsPanel({ diagnostics, diagnosticsBusy, diagnosticsError, onRefresh }) {
  const updatedAt = diagnostics?.generatedAt ? new Date(diagnostics.generatedAt).toLocaleString() : "等待诊断";
  const statusItems = [
    { done: Boolean(diagnostics?.setup?.installed), label: "GSI 配置" },
    { done: Boolean(diagnostics?.publicData?.hasCache), label: "公开数据" },
    { done: Boolean(diagnostics?.app?.liveGsiReceived), label: "实时 GSI" },
    { done: diagnostics?.app?.recommendationStatus !== "error", label: "推荐引擎" }
  ];

  return (
    <aside className="panel diagnostics-panel">
      <div className="panel-title">
        <Shield size={18} />
        <h2>安全诊断</h2>
      </div>
      <p className="setup-copy">
        一键查看本机接入状态和安全边界。此报告不读取进程、内存、网络封包或游戏画面。
      </p>
      <div className="diagnostic-grid">
        {statusItems.map((item) => (
          <ChecklistItem done={item.done} label={item.label} key={item.label} />
        ))}
      </div>
      <div className="diagnostic-section">
        <span>允许的数据来源</span>
        {(diagnostics?.safety?.dataSources ?? []).map((line) => <p key={line}>{line}</p>)}
      </div>
      <div className="diagnostic-section">
        <span>明确不包含</span>
        {(diagnostics?.safety?.forbiddenCapabilities ?? []).map((line) => <p key={line}>{line}</p>)}
      </div>
      <code className="path-line">{updatedAt}</code>
      {diagnosticsError ? <p className="setup-error">{diagnosticsError}</p> : null}
      <button className="ghost-button" type="button" onClick={onRefresh} disabled={diagnosticsBusy}>
        {diagnosticsBusy ? <RefreshCw className="spin" size={17} /> : <Shield size={17} />}
        刷新诊断
      </button>
    </aside>
  );
}

function GsiInspectorPanel({ gameState }) {
  const fields = gameState?.gsi?.fields ?? [];
  const buildingSummary = gameState?.gsi?.buildingSummary ?? { total: 0, alive: 0, destroyed: 0 };
  const hasPayload = Boolean(gameState?.receivedAt);

  return (
    <aside className="panel gsi-inspector-panel">
      <div className="panel-title">
        <Activity size={18} />
        <h2>GSI 数据检查</h2>
      </div>
      <p className="setup-copy">
        显示 Dota 2 本次主动发送到 localhost 的字段。未出现的字段不会被猜测或越权读取。
      </p>
      <div className="gsi-field-grid">
        {fields.length > 0 ? fields.map((field) => (
          <div className={field.received ? "gsi-field received" : "gsi-field"} key={field.key}>
            {field.received ? <Check size={14} /> : <CircleAlert size={14} />}
            <span>{field.key}</span>
            <strong>{field.entries}</strong>
          </div>
        )) : (
          <p className="empty-gsi">{hasPayload ? "等待字段统计" : "尚未收到 GSI payload"}</p>
        )}
      </div>
      <div className="gsi-summary">
        <Stat label="建筑字段" value={buildingSummary.total} />
        <Stat label="已毁建筑" value={buildingSummary.destroyed} />
      </div>
      <code className="path-line">{gameState?.receivedAt ? new Date(gameState.receivedAt).toLocaleString() : "等待 Dota 2 GSI"}</code>
    </aside>
  );
}

function AiPanel({ aiConfig, onConfigChange }) {
  const [coachText, setCoachText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");

  async function askCoach() {
    setAiBusy(true);
    setAiError("");
    try {
      const result = await postJson("/api/ai/coach", aiConfig);
      setCoachText(result.text);
    } catch (error) {
      setAiError(error.message);
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <aside className="panel ai-panel">
      <div className="panel-title">
        <MessageSquareText size={18} />
        <h2>AI 教练</h2>
      </div>
      <p className="setup-copy">
        默认使用本地规则解释。只有开启 AI 并填写接口后，才会把当前建议摘要发送到你配置的模型服务。
      </p>
      <label className="toggle-line">
        <input
          checked={aiConfig.enabled}
          type="checkbox"
          onChange={(event) => onConfigChange({ enabled: event.target.checked })}
        />
        启用外部或本地 AI 接口
      </label>
      <div className="ai-grid">
        <label>
          <span>Provider</span>
          <select value={aiConfig.provider} onChange={(event) => onConfigChange({ provider: event.target.value })}>
            <option value="ollama">Ollama local</option>
            <option value="openai-compatible">OpenAI compatible</option>
          </select>
        </label>
        <label>
          <span>Model</span>
          <input value={aiConfig.model} onChange={(event) => onConfigChange({ model: event.target.value })} />
        </label>
        <label className="wide">
          <span>Endpoint</span>
          <input value={aiConfig.endpoint} onChange={(event) => onConfigChange({ endpoint: event.target.value })} />
        </label>
        <label className="wide">
          <span>API Key</span>
          <input
            placeholder="仅 OpenAI-compatible 需要"
            type="password"
            value={aiConfig.apiKey}
            onChange={(event) => onConfigChange({ apiKey: event.target.value })}
          />
        </label>
      </div>
      <button className="ghost-button" type="button" onClick={askCoach} disabled={aiBusy}>
        {aiBusy ? <RefreshCw className="spin" size={17} /> : <Brain size={17} />}
        生成教练解释
      </button>
      {aiError ? <p className="setup-error">{aiError}</p> : null}
      {coachText ? <pre className="coach-output">{coachText}</pre> : null}
    </aside>
  );
}

function ReplayPanel() {
  const [matchId, setMatchId] = useState("");
  const [replay, setReplay] = useState(null);
  const [replayBusy, setReplayBusy] = useState(false);
  const [replayError, setReplayError] = useState("");

  async function loadReplay() {
    setReplayBusy(true);
    setReplayError("");
    try {
      setReplay(await requestJson(`/api/replay/${matchId.trim()}`));
    } catch (error) {
      setReplayError(error.message);
      setReplay(null);
    } finally {
      setReplayBusy(false);
    }
  }

  return (
    <aside className="panel replay-panel">
      <div className="panel-title">
        <BarChart3 size={18} />
        <h2>战后复盘</h2>
      </div>
      <p className="setup-copy">输入公开 Match ID，从 OpenDota 拉取战后数据。不会读取本机游戏或 Steam 进程。</p>
      <div className="replay-input">
        <input placeholder="Match ID" value={matchId} onChange={(event) => setMatchId(event.target.value)} />
        <button className="icon-button" type="button" onClick={loadReplay} disabled={replayBusy} aria-label="加载复盘" title="加载复盘">
          {replayBusy ? <RefreshCw className="spin" size={17} /> : <BarChart3 size={17} />}
        </button>
      </div>
      {replayError ? <p className="setup-error">{replayError}</p> : null}
      {replay ? (
        <div className="replay-result">
          <div className="replay-summary">
            <Stat label="时长" value={replay.duration} />
            <Stat label="胜方" value={replay.winner} />
          </div>
          <div className="inferred-tags">
            <span>亮点</span>
            {replay.highlights.map((line) => <p key={line}>{line}</p>)}
          </div>
          <div className="inferred-tags">
            <span>教练总结</span>
            {replay.coachSummary.map((line) => <p key={line}>{line}</p>)}
          </div>
          <div className="player-table">
            {replay.players.map((player) => (
              <div className={player.won ? "player-row won" : "player-row"} key={`${player.heroId}-${player.accountId ?? player.heroName}`}>
                <div>
                  <strong>{player.heroName}</strong>
                  <p>{player.issues.join(" ")}</p>
                  <ReplayItems items={player.itemSlots ?? player.items ?? []} />
                </div>
                <span>{player.kda}</span>
                <span>{player.gpm} GPM</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function ReplayItems({ items = [] }) {
  if (!items.length) {
    return <p className="replay-items-empty">暂无装备数据</p>;
  }

  return (
    <div className="replay-items" aria-label="复盘装备">
      {items.map((item, index) => {
        const name = typeof item === "string" ? item : item.name;
        const slot = typeof item === "string" ? "" : item.slotLabel;
        return (
          <span className="replay-item-chip" key={`${name}-${slot}-${index}`}>
            {slot ? <em>{slot}</em> : null}
            {name}
          </span>
        );
      })}
    </div>
  );
}

function CompactPanel({ connected, gameState, recommendation, onExitCompact, onLoadMock }) {
  const first = recommendation.suggestions?.[0];
  const alternatives = (recommendation.suggestions ?? []).slice(1, 3);

  return (
    <main className="app compact-app">
      <header className="compact-header">
        <div>
          <p className="eyebrow">Dota 2 Help Tool</p>
          <h1>{recommendation.heroName ?? "等待数据"}</h1>
        </div>
        <button className="icon-button" type="button" onClick={onExitCompact} aria-label="退出小窗模式" title="退出小窗模式">
          <Maximize2 size={17} />
        </button>
      </header>
      <StatusBadge connected={connected} />
      <div className="compact-stats">
        <Stat label="时间" value={formatTime(gameState.gameTime)} />
        <Stat label="金钱" value={gameState.gold ?? 0} />
      </div>
      <section className="compact-card">
        <GameIcon alt={first?.itemName ?? "item"} className="compact-item-art" fallback={abbrev(first?.itemName)} src={first?.imageUrl || itemImageFromId(first?.itemId)} />
        <span>{first ? priorityLabels[first.priority] : "等待"}</span>
        <h2>{first?.itemName ?? recommendation.title ?? "等待 Dota 2 GSI 数据"}</h2>
        <p>{first?.reason ?? recommendation.notes?.[0] ?? "进入比赛后显示建议。"}</p>
      </section>
      {alternatives.length > 0 ? (
        <div className="compact-alternatives">
          <span>备选</span>
          {alternatives.map((item) => (
            <p key={item.itemId}>{item.itemName}</p>
          ))}
        </div>
      ) : null}
      <button className="ghost-button" type="button" onClick={onLoadMock}>
        <Play size={17} />
        演示状态
      </button>
      <p className="compact-safety">普通置顶窗口，不注入、不读内存、不自动操作。</p>
    </main>
  );
}

export default function App() {
  const { connected, setSnapshot, snapshot } = useLiveSnapshot();
  const { installSetup, refreshSetup, setup, setupBusy, setupError } = useSetupStatus();
  const { dataBusy, dataError, dataStatus, refreshData, syncData } = usePublicData();
  const { diagnostics, diagnosticsBusy, diagnosticsError, refreshDiagnostics } = useDiagnostics();
  const { heroes, heroError, refreshHeroes } = useHeroCatalog();
  const { aiConfig, updateAiConfig } = useAiConfig();
  const { closeLaunchReminder, openLaunchReminder, resetLaunchReminder, showLaunchReminder } = useLaunchOptionReminder();
  const [busy, setBusy] = useState(false);
  const [compact, setCompact] = useState(false);
  const [prepareBusy, setPrepareBusy] = useState(false);
  const [prepareMessage, setPrepareMessage] = useState("");

  const gameState = snapshot?.gameState ?? {};
  const recommendation = snapshot?.recommendation ?? {};
  const context = snapshot?.context ?? { threats: [] };
  const threats = snapshot?.threats ?? {};
  const activeThreats = useMemo(() => new Set(context.manualThreats ?? context.threats ?? []), [context.manualThreats, context.threats]);
  const activeEnemyHeroes = context.enemyHeroes ?? [];
  const enemyHeroesSource = context.enemyHeroesSource ?? "manual";
  const inferredThreats = context.inferredThreats ?? [];

  async function setCompactMode(enabled) {
    setCompact(enabled);
    await window.dota2HelpTool?.setCompactMode?.(enabled);
  }

  async function toggleThreat(id) {
    const nextThreats = activeThreats.has(id)
      ? [...activeThreats].filter((key) => key !== id)
      : [...activeThreats, id];
    setSnapshot(await postJson("/api/context", { manualThreats: nextThreats, enemyHeroes: activeEnemyHeroes }));
  }

  async function updateEnemyHeroes(enemyHeroes) {
    setSnapshot(await postJson("/api/context", { manualThreats: [...activeThreats], enemyHeroes }));
  }

  async function loadMock() {
    setBusy(true);
    try {
      setSnapshot(await postJson("/api/mock"));
    } finally {
      setBusy(false);
    }
  }

  async function preparePlayerSetup() {
    setPrepareBusy(true);
    setPrepareMessage("正在准备本机环境...");
    const steps = [];
    try {
      try {
        await postJson("/api/setup/install");
        steps.push("GSI 已安装");
      } catch (error) {
        steps.push(`GSI 未安装：${error.message}`);
      }

      try {
        await syncData();
        await refreshHeroes();
        steps.push("公开数据已同步");
      } catch (error) {
        steps.push(`公开数据同步失败：${error.message}`);
      }

      await refreshSetup();
      await refreshData();
      await refreshDiagnostics();
      setPrepareMessage(steps.join("；"));
      openLaunchReminder();
    } finally {
      setPrepareBusy(false);
    }
  }

  if (compact) {
    return (
      <CompactPanel
        connected={connected}
        gameState={gameState}
        recommendation={recommendation}
        onExitCompact={() => setCompactMode(false)}
        onLoadMock={loadMock}
      />
    );
  }

  return (
    <main className="app">
      <LaunchOptionDialog open={showLaunchReminder} onClose={closeLaunchReminder} />
      <header className="topbar">
        <div>
          <p className="eyebrow">Dota 2 Help Tool</p>
          <h1>实时装备建议</h1>
        </div>
        <div className="top-actions">
          <button className="ghost-button compact-toggle" type="button" onClick={() => setCompactMode(true)}>
            <Minimize2 size={17} />
            边缘小窗
          </button>
          <StatusBadge connected={connected} />
        </div>
      </header>

      <LaunchChecklist
        connected={connected}
        dataBusy={dataBusy}
        dataStatus={dataStatus}
        gameState={gameState}
        onCompact={() => setCompactMode(true)}
        onInstall={installSetup}
        onMock={loadMock}
        onPrepare={preparePlayerSetup}
        onSync={async () => {
          await syncData();
          await refreshHeroes();
        }}
        prepareBusy={prepareBusy}
        prepareMessage={prepareMessage}
        setup={setup}
        setupBusy={setupBusy}
      />

      <section className="workspace">
        <aside className="panel state-panel">
          <div className="panel-title">
            <Activity size={18} />
            <h2>当前状态</h2>
          </div>
          <div className="hero-block">
            <span>英雄</span>
            <strong>{recommendation.heroName ?? gameState.hero?.displayName ?? "等待数据"}</strong>
          </div>
          <div className="stats-grid">
            <Stat label="时间" value={formatTime(gameState.gameTime)} />
            <Stat label="等级" value={gameState.level ?? "-"} />
            <Stat label="金钱" value={gameState.gold ?? 0} />
            <Stat label="阶段" value={phaseLabels[recommendation.phase] ?? "-"} />
          </div>
          <div className="items">
            <span>已检测物品</span>
            <div>
              {(gameState.items?.length ?? 0) > 0
                ? gameState.items.map((item) => (
                  <code className="inventory-item" key={item}>
                    <GameIcon alt={item} fallback={abbrev(item)} src={itemImageFromId(item)} />
                    {item.replace("item_", "")}
                  </code>
                ))
                : <em>暂无物品数据</em>}
            </div>
          </div>
          <button className="ghost-button" type="button" onClick={loadMock} disabled={busy}>
            {busy ? <RefreshCw className="spin" size={17} /> : <Play size={17} />}
            载入演示状态
          </button>
        </aside>

        <section className="panel advice-panel">
          <div className="panel-title">
            <Brain size={18} />
            <h2>{recommendation.title ?? "等待建议"}</h2>
          </div>
          <div className="suggestions">
            {(recommendation.suggestions ?? []).map((suggestion) => (
              <article className="suggestion" key={`${suggestion.itemId}-${suggestion.priority}`}>
                <GameIcon alt={suggestion.itemName} className="item-art" fallback={abbrev(suggestion.itemName)} src={suggestion.imageUrl || itemImageFromId(suggestion.itemId)} />
                <div className="suggestion-body">
                  <div className="suggestion-heading">
                    <span className={`priority ${suggestion.priority}`}>{priorityLabels[suggestion.priority]}</span>
                    <h3>{suggestion.itemName}</h3>
                  </div>
                  <p>{suggestion.reason}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="notes">
            {(recommendation.notes ?? []).map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        </section>

        <div className="right-stack">
          <EnemyLineupPanel
            activeEnemyHeroes={activeEnemyHeroes}
            enemyHeroesSource={enemyHeroesSource}
            gameLineups={gameState.lineups}
            heroes={heroes}
            heroError={heroError}
            inferredThreats={inferredThreats.map((key) => threats[key] ?? key)}
            onChange={updateEnemyHeroes}
            onRefresh={refreshHeroes}
          />
          <aside className="panel threat-panel">
            <div className="panel-title">
              <Shield size={18} />
              <h2>局势标签</h2>
            </div>
            <div className="threat-list">
              {Object.entries(threats).map(([id, label]) => (
                <ThreatToggle key={id} id={id} label={label} active={activeThreats.has(id)} onToggle={toggleThreat} />
              ))}
            </div>
          </aside>
          <details className="panel utility-drawer">
            <summary>
              <Settings size={17} />
              系统与安全
            </summary>
            <div className="drawer-stack">
              <SetupPanel setup={setup} setupBusy={setupBusy} setupError={setupError} onInstall={installSetup} onRefresh={refreshSetup} />
              <aside className="panel setup-panel">
                <div className="panel-title">
                  <Settings size={18} />
                  <h2>Steam 启动项</h2>
                </div>
                <p className="setup-copy">需要玩家手动把启动项加入 Dota 2 属性。工具不会自动修改 Steam 配置。</p>
                <code className="launch-command">{DOTA_LAUNCH_OPTION}</code>
                <button className="ghost-button" type="button" onClick={resetLaunchReminder}>
                  <Settings size={17} />
                  显示启动项提示
                </button>
              </aside>
              <DataPanel
                dataBusy={dataBusy}
                dataError={dataError}
                dataStatus={dataStatus}
                onRefresh={refreshData}
                onSync={async () => {
                  await syncData();
                  await refreshHeroes();
                }}
              />
              <DiagnosticsPanel
                diagnostics={diagnostics}
                diagnosticsBusy={diagnosticsBusy}
                diagnosticsError={diagnosticsError}
                onRefresh={refreshDiagnostics}
              />
              <GsiInspectorPanel gameState={gameState} />
            </div>
          </details>
          <details className="panel utility-drawer">
            <summary>
              <Brain size={17} />
              复盘与教练
            </summary>
            <div className="drawer-stack">
              <ReplayPanel />
              <AiPanel aiConfig={aiConfig} onConfigChange={updateAiConfig} />
            </div>
          </details>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
