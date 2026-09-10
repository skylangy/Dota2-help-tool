const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { appVersion } = require("./version.cjs");

const CONFIG_FILE = path.resolve(__dirname, "..", "config", "telemetry.json");
const STATE_FILE = path.join(process.env.APPDATA || path.join(os.homedir(), ".config"), "Dota2HelpTool", "telemetry-state.json");

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch {
    return { enabled: false };
  }
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

function getInstallId() {
  const state = readState();
  if (state.installId) return state.installId;
  const installId = crypto.randomUUID();
  writeState({ ...state, installId, createdAt: new Date().toISOString() });
  return installId;
}

function publicConfig() {
  const config = readConfig();
  return {
    enabled: Boolean(config.enabled && config.endpoint),
    endpointConfigured: Boolean(config.endpoint),
    sendsInstallId: config.sendInstallId !== false,
    privacy: {
      sendsSteamId: false,
      sendsMatchData: false,
      sendsMachineName: false,
      sendsIpFromClient: false,
      sendsGameplayState: false
    }
  };
}

async function sendEvent(event, extra = {}) {
  const config = readConfig();
  if (!config.enabled || !config.endpoint) return { sent: false, reason: "disabled" };

  const payload = {
    event,
    appVersion,
    occurredAt: new Date().toISOString(),
    platform: process.platform,
    ...extra
  };

  if (config.sendInstallId !== false) payload.installId = getInstallId();

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000)
    });
    return { sent: response.ok, status: response.status };
  } catch (error) {
    return { sent: false, reason: error.message };
  }
}

module.exports = {
  publicConfig,
  sendEvent
};
