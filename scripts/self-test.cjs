const assert = require("node:assert/strict");
const { startServer } = require("../server/server.cjs");

const PORT = 3108;
const BASE = `http://127.0.0.1:${PORT}`;

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  assert.equal(response.ok, true, `${path} failed: ${response.status} ${JSON.stringify(payload)}`);
  return payload;
}

async function main() {
  const running = await startServer({ port: PORT, silent: true });

  try {
    const state = await request("/api/state");
    assert.equal(state.recommendation.status, "waiting");

    const setup = await request("/api/setup/status");
    assert.equal(typeof setup.installed, "boolean");

    const mock = await request("/api/mock", { method: "POST" });
    assert.equal(mock.recommendation.status, "ready");
    assert.ok(mock.recommendation.suggestions.length > 0);

    const context = await request("/api/context", {
      method: "POST",
      body: JSON.stringify({
        enemyHeroes: ["npc_dota_hero_lion", "npc_dota_hero_zuus"],
        manualThreats: []
      })
    });
    assert.ok(context.context.threats.includes("control_heavy"));
    assert.ok(context.context.threats.includes("magic_burst"));

    const ai = await request("/api/ai/coach", {
      method: "POST",
      body: JSON.stringify({ enabled: false })
    });
    assert.equal(ai.mode, "local");
    assert.ok(ai.text.includes("建议") || ai.text.includes("考虑"));

    const dataBefore = await request("/api/data/status");
    assert.equal(typeof dataBefore.hasCache, "boolean");

    const synced = await request("/api/data/sync", { method: "POST" });
    assert.ok(synced.heroCount > 100);
    assert.ok(synced.itemCount > 100);

    const replayResponse = await fetch(`${BASE}/api/replay/not-a-match`);
    assert.equal(replayResponse.status, 400);

    console.log("Self-test passed");
  } finally {
    running.wss.close();
    running.server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
