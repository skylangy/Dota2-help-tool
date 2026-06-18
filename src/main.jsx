import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  Brain,
  Check,
  CircleAlert,
  FolderCheck,
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

  return { snapshot, setSnapshot, connected };
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

function StatusBadge({ connected }) {
  return (
    <div className={connected ? "status connected" : "status"}>
      {connected ? <Wifi size={16} /> : <WifiOff size={16} />}
      {connected ? "本地服务已连接" : "等待本地服务"}
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

function ThreatToggle({ id, label, active, onToggle }) {
  return (
    <button className={active ? "threat active" : "threat"} type="button" onClick={() => onToggle(id)}>
      {active ? <Check size={15} /> : <Shield size={15} />}
      <span>{label}</span>
    </button>
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

export default function App() {
  const { snapshot, setSnapshot, connected } = useLiveSnapshot();
  const { installSetup, refreshSetup, setup, setupBusy, setupError } = useSetupStatus();
  const [busy, setBusy] = useState(false);

  const gameState = snapshot?.gameState ?? {};
  const recommendation = snapshot?.recommendation ?? {};
  const context = snapshot?.context ?? { threats: [] };
  const threats = snapshot?.threats ?? {};
  const activeThreats = useMemo(() => new Set(context.threats ?? []), [context.threats]);

  async function toggleThreat(id) {
    const nextThreats = activeThreats.has(id)
      ? [...activeThreats].filter((key) => key !== id)
      : [...activeThreats, id];

    setSnapshot(await postJson("/api/context", { threats: nextThreats }));
  }

  async function loadMock() {
    setBusy(true);
    try {
      setSnapshot(await postJson("/api/mock"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Dota 2 Help Tool</p>
          <h1>实时装备建议</h1>
        </div>
        <StatusBadge connected={connected} />
      </header>

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
                ? gameState.items.map((item) => <code key={item}>{item.replace("item_", "")}</code>)
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
                <div>
                  <span className={`priority ${suggestion.priority}`}>{priorityLabels[suggestion.priority]}</span>
                  <h3>{suggestion.itemName}</h3>
                </div>
                <p>{suggestion.reason}</p>
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
          <SetupPanel
            setup={setup}
            setupBusy={setupBusy}
            setupError={setupError}
            onInstall={installSetup}
            onRefresh={refreshSetup}
          />

          <aside className="panel threat-panel">
            <div className="panel-title">
              <Shield size={18} />
              <h2>局势标签</h2>
            </div>
            <div className="threat-list">
              {Object.entries(threats).map(([id, label]) => (
                <ThreatToggle
                  key={id}
                  id={id}
                  label={label}
                  active={activeThreats.has(id)}
                  onToggle={toggleThreat}
                />
              ))}
            </div>
          </aside>
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
