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

function consentStatus() {
  const state = readState();
  return {
    decided: typeof state.telemetryConsent === "boolean",
    consented: state.telemetryConsent === true,
    updatedAt: state.telemetryConsentUpdatedAt ?? null
  };
}

function setConsent(consented) {
  const state = readState();
  const next = {
    ...state,
    telemetryConsent: Boolean(consented),
    telemetryConsentUpdatedAt: new Date().toISOString()
  };

  if (!consented) {
    delete next.installId;
    delete next.createdAt;
  }

  writeState(next);
  return consentStatus();
}

function publicConfig() {
  const config = readConfig();
  const consent = consentStatus();
  return {
    enabled: Boolean(config.enabled && config.endpoint),
    endpointConfigured: Boolean(config.endpoint),
    consent,
    sendsInstallId: config.sendInstallId !== false,
    collectedFields: ["event", "appVersion", "occurredAt", ...(config.sendInstallId !== false ? ["randomInstallId"] : [])],
    privacy: {
      sendsSteamId: false,
      sendsMatchData: false,
      sendsMachineName: false,
      sendsHardwareId: false,
      sendsIpFromClient: false,
      sendsGameplayState: false,
      sendsHeroOrItems: false,
      sendsAccountId: false
    }
  };
}

async function sendEvent(event, extra = {}) {
  const config = readConfig();
  const consent = consentStatus();
  if (!config.enabled || !config.endpoint) return { sent: false, reason: "disabled" };
  if (!consent.consented) return { sent: false, reason: "not_consented" };

  const payload = {
    event,
    appVersion,
    occurredAt: new Date().toISOString(),
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
  consentStatus,
  publicConfig,
  sendEvent,
  setConsent
};
