const express = require("express");
const cors = require("cors");
const http = require("node:http");
const { WebSocketServer } = require("ws");
const { parseGameState } = require("./gsi.cjs");
const { recommend, threatLabels } = require("./recommendation.cjs");
const { installConfig, scanSetup } = require("./setup.cjs");
const { aiCoach } = require("./ai.cjs");
const { cacheStatus, publicDataSummary, syncPublicData } = require("./public-data.cjs");

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3008;
const ALLOWED_ORIGINS = new Set([
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "file://",
  "null"
]);

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
      threats: []
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
      if (!origin || ALLOWED_ORIGINS.has(origin)) {
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

  app.post("/api/context", (req, res) => {
    const threats = Array.isArray(req.body?.threats) ? req.body.threats : [];
    state.context = {
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
  startServer
};
