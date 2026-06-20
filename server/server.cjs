const express = require("express");
const cors = require("cors");
const http = require("node:http");
const { WebSocketServer } = require("ws");
const { parseGameState } = require("./gsi.cjs");
const { recommend, threatLabels } = require("./recommendation.cjs");
const { installConfig, scanSetup } = require("./setup.cjs");
const { aiCoach } = require("./ai.cjs");
const { cacheStatus, heroCatalog, publicDataSummary, syncPublicData } = require("./public-data.cjs");
const { inferThreats } = require("./lineup.cjs");
const { fetchMatch } = require("./replay.cjs");

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3008;
const ALLOWED_ORIGINS = new Set([
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "file://",
  "null"
]);

function isAllowedOrigin(origin) {
  if (!origin || ALLOWED_ORIGINS.has(origin)) {
    return true;
  }

  try {
    const parsed = new URL(origin);
    return parsed.protocol === "http:" && ["127.0.0.1", "localhost"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function createState() {
  return {
    gameState: {
      receivedAt: null,
      hero: { id: "", displayName: "" },
      gameTime: 0,
      level: 1,
      gold: 0,
      items: []
    },
    context: {
      enemyHeroes: [],
      manualThreats: [],
      threats: []
    }
  };
}

function diagnosticsSnapshot(state) {
  const setup = scanSetup();
  const data = publicDataSummary();
  return {
    generatedAt: new Date().toISOString(),
    app: {
      host: DEFAULT_HOST,
      port: DEFAULT_PORT,
      gsiEndpoint: `http://${DEFAULT_HOST}:${DEFAULT_PORT}/gsi`,
      liveGsiReceived: Boolean(state.gameState.receivedAt),
      recommendationStatus: recommend(state.gameState, state.context).status
    },
    setup: {
      installed: setup.installed,
      installedTargets: setup.installedTargets ?? [],
      dotaConfigDirs: setup.dotaConfigDirs ?? []
    },
    publicData: {
      hasCache: data.hasCache,
      heroCount: data.heroCount,
      itemCount: data.itemCount,
      generatedAt: data.generatedAt
    },
    safety: {
      dataSources: [
        "Dota 2 Game State Integration JSON sent to localhost",
        "Manual user-selected enemy lineup and context tags",
        "Public OpenDota constants and public match data",
        "Optional user-configured AI endpoint for explanation only"
      ],
      forbiddenCapabilities: [
        "No memory reading",
        "No DLL injection",
        "No DirectX/Vulkan/Steam/Dota hooks",
        "No packet capture",
        "No input automation or macros",
        "No hidden enemy or fog-of-war information",
        "No Dota 2 process scanning",
        "No injected in-game overlay"
      ]
    }
  };
}

function createApp() {
  const state = createState();
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  function snapshot() {
    return {
      gameState: state.gameState,
      context: state.context,
      recommendation: recommend(state.gameState, state.context),
      threats: threatLabels
    };
  }

  function broadcast() {
    const message = JSON.stringify({ type: "snapshot", payload: snapshot() });
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    }
  }

  app.use(cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed: ${origin}`));
    }
  }));
  app.use(express.json({ limit: "1mb" }));

  wss.on("connection", (socket) => {
    socket.send(JSON.stringify({ type: "snapshot", payload: snapshot() }));
  });

  app.get("/api/state", (_req, res) => {
    res.json(snapshot());
  });

  app.get("/api/diagnostics", (_req, res) => {
    res.json(diagnosticsSnapshot(state));
  });

  app.post("/api/context", (req, res) => {
    const manualThreats = Array.isArray(req.body?.manualThreats)
      ? req.body.manualThreats
      : Array.isArray(req.body?.threats)
        ? req.body.threats
        : state.context.manualThreats ?? [];
    const enemyHeroes = Array.isArray(req.body?.enemyHeroes) ? req.body.enemyHeroes : state.context.enemyHeroes ?? [];
    const inferredThreats = inferThreats(enemyHeroes, heroCatalog());
    const threats = [...new Set([...manualThreats, ...inferredThreats])];
    state.context = {
      enemyHeroes,
      inferredThreats,
      manualThreats: manualThreats.filter((key) => Object.hasOwn(threatLabels, key)),
      threats: threats.filter((key) => Object.hasOwn(threatLabels, key))
    };
    broadcast();
    res.json(snapshot());
  });

  app.post("/gsi", (req, res) => {
    state.gameState = parseGameState(req.body);
    broadcast();
    res.sendStatus(200);
  });

  app.post("/api/mock", (_req, res) => {
    state.gameState = {
      receivedAt: new Date().toISOString(),
      hero: {
        id: "npc_dota_hero_juggernaut",
        displayName: "Juggernaut"
      },
      gameTime: 16 * 60 + 28,
      level: 11,
      gold: 1850,
      items: ["item_magic_wand", "item_phase_boots", "item_bfury"]
    };
    state.context = {
      enemyHeroes: ["npc_dota_hero_lion", "npc_dota_hero_zuus"],
      inferredThreats: ["control_heavy", "magic_burst"],
      manualThreats: ["control_heavy", "magic_burst"],
      threats: ["control_heavy", "magic_burst"]
    };
    broadcast();
    res.json(snapshot());
  });

  app.get("/api/setup/status", (_req, res) => {
    res.json(scanSetup());
  });

  app.post("/api/setup/install", (_req, res) => {
    try {
      res.json(installConfig());
    } catch (error) {
      res.status(404).json({
        code: error.code ?? "SETUP_FAILED",
        message: error.message
      });
    }
  });

  app.get("/api/data/status", (_req, res) => {
    res.json(publicDataSummary());
  });

  app.get("/api/heroes", (_req, res) => {
    res.json({ heroes: heroCatalog() });
  });

  app.post("/api/data/sync", async (_req, res) => {
    try {
      res.json(await syncPublicData());
    } catch (error) {
      res.status(502).json({
        code: "PUBLIC_DATA_SYNC_FAILED",
        message: error.message
      });
    }
  });

  app.post("/api/ai/coach", async (req, res) => {
    try {
      res.json(await aiCoach(req.body ?? {}, snapshot(), cacheStatus()));
    } catch (error) {
      res.status(502).json({
        code: "AI_COACH_FAILED",
        message: error.message
      });
    }
  });

  app.get("/api/replay/:matchId", async (req, res) => {
    try {
      res.json(await fetchMatch(req.params.matchId));
    } catch (error) {
      res.status(error.code === "INVALID_MATCH_ID" ? 400 : 502).json({
        code: error.code ?? "REPLAY_FETCH_FAILED",
        message: error.message
      });
    }
  });

  return { app, server, wss };
}

function startServer(options = {}) {
  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;
  const silent = options.silent ?? false;
  const created = createApp();

  return new Promise((resolve, reject) => {
    created.server.once("error", (error) => {
      if (error.code === "EADDRINUSE" && options.allowExisting) {
        if (!silent) {
          console.log(`Dota 2 Help Tool server already running at http://${host}:${port}`);
        }
        resolve({ ...created, existing: true, host, port });
        return;
      }
      reject(error);
    });

    created.server.listen(port, host, () => {
      if (!silent) {
        console.log(`Dota 2 Help Tool server listening at http://${host}:${port}`);
        console.log(`GSI endpoint: http://${host}:${port}/gsi`);
      }
      resolve({ ...created, existing: false, host, port });
    });
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  createApp,
  diagnosticsSnapshot,
  startServer
};
