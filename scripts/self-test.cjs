const assert = require("node:assert/strict");
const { startServer } = require("../server/server.cjs");
const { readGsiToken } = require("../server/setup.cjs");
const { summarizeMatch } = require("../server/replay.cjs");

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

    const devOriginResponse = await fetch(`${BASE}/api/state`, {
      headers: { Origin: "http://127.0.0.1:5175" }
    });
    assert.equal(devOriginResponse.ok, true);
    assert.equal(devOriginResponse.headers.get("access-control-allow-origin"), "http://127.0.0.1:5175");

    const setup = await request("/api/setup/status");
    assert.equal(typeof setup.installed, "boolean");

    const diagnosticsBefore = await request("/api/diagnostics");
    assert.equal(diagnosticsBefore.app.host, "127.0.0.1");
    assert.match(diagnosticsBefore.app.version, /^\d+\.\d+\.\d+/);
    assert.equal(Array.isArray(diagnosticsBefore.safety.forbiddenCapabilities), true);
    assert.ok(diagnosticsBefore.safety.forbiddenCapabilities.some((line) => line.includes("No memory reading")));

    const mock = await request("/api/mock", { method: "POST" });
    assert.equal(mock.recommendation.status, "ready");
    assert.ok(mock.recommendation.suggestions.length > 0);

    const invisibleContext = await request("/api/context", {
      method: "POST",
      body: JSON.stringify({
        enemyHeroes: ["npc_dota_hero_riki", "npc_dota_hero_bounty_hunter", "npc_dota_hero_clinkz"],
        manualThreats: []
      })
    });
    assert.ok(invisibleContext.context.threats.includes("invisible_enemy"));
    assert.ok(["item_dust", "item_ward_dispenser", "item_gem"].includes(invisibleContext.recommendation.suggestions[0].itemId));

    const healingContext = await request("/api/context", {
      method: "POST",
      body: JSON.stringify({
        enemyHeroes: ["npc_dota_hero_huskar", "npc_dota_hero_necrolyte"],
        manualThreats: []
      })
    });
    assert.ok(healingContext.context.threats.includes("high_healing"));
    assert.ok(["item_spirit_vessel", "item_skadi", "item_shivas_guard"].includes(healingContext.recommendation.suggestions[0].itemId));

    const context = await request("/api/context", {
      method: "POST",
      body: JSON.stringify({
        enemyHeroes: ["npc_dota_hero_lion", "npc_dota_hero_zuus"],
        manualThreats: []
      })
    });
    assert.ok(context.context.threats.includes("control_heavy"));
    assert.ok(context.context.threats.includes("magic_burst"));

    await request("/gsi", {
      method: "POST",
      body: JSON.stringify({
        provider: { name: "Dota 2" },
        map: { clock_time: 1320, game_state: "DOTA_GAMERULES_STATE_GAME_IN_PROGRESS" },
        player: { team_name: "radiant", gold: 2400, player_slot: 1 },
        hero: { name: "npc_dota_hero_juggernaut", localized_name: "Juggernaut", level: 15 },
        items: {
          slot0: { name: "item_magic_wand" },
          slot1: { name: "item_phase_boots" },
          slot2: { name: "item_bfury" }
        },
        abilities: {
          ability0: { name: "juggernaut_blade_fury", level: 4 },
          ability1: { name: "juggernaut_healing_ward", level: 2 }
        },
        buildings: {
          dota_goodguys_tower1_mid: { health: 0 },
          dota_badguys_tower1_mid: { health: 1200 }
        },
        auth: readGsiToken() ? { token: readGsiToken() } : undefined,
        allplayers: {
          player0: { team_name: "radiant", hero_name: "npc_dota_hero_juggernaut", player_slot: 1 },
          player1: { team_name: "radiant", hero_name: "npc_dota_hero_crystal_maiden", player_slot: 2 },
          player2: { team_name: "dire", hero_name: "npc_dota_hero_lion", player_slot: 128 },
          player3: { team_name: "dire", hero_name: "npc_dota_hero_zuus", player_slot: 129 },
          player4: { team_name: "dire", hero_name: "npc_dota_hero_phantom_assassin", player_slot: 130 }
        }
      })
    });
    const autoGsi = await request("/api/state");
    assert.equal(autoGsi.context.enemyHeroesSource, "gsi_allplayers");
    assert.ok(autoGsi.context.enemyHeroes.includes("npc_dota_hero_phantom_assassin"));
    assert.ok(autoGsi.context.threats.includes("evasion"));
    assert.ok(autoGsi.context.threats.includes("magic_burst"));
    assert.equal(autoGsi.gameState.lineups.source, "gsi_allplayers");
    assert.ok(autoGsi.gameState.gsi.fields.find((field) => field.key === "allplayers").received);
    assert.ok(autoGsi.gameState.gsi.fields.find((field) => field.key === "buildings").received);
    assert.equal(autoGsi.gameState.gsi.buildingSummary.total, 2);
    assert.equal(autoGsi.gameState.gsi.buildingSummary.destroyed, 1);
    assert.ok(autoGsi.recommendation.suggestions.length > 0);

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

    const replay = summarizeMatch({
      match_id: 123,
      duration: 1800,
      radiant_win: true,
      players: [{
        account_id: 1,
        hero_id: 1,
        isRadiant: true,
        win: 1,
        kills: 1,
        deaths: 1,
        assists: 1,
        gold_per_min: 400,
        xp_per_min: 500,
        last_hits: 120,
        hero_damage: 12000,
        tower_damage: 1200,
        item_0: 1,
        item_6: 99991,
        backpack_0: 99992,
        item_neutral: 99993
      }]
    });
    assert.ok(replay.players[0].items.includes("Item 99991"));
    assert.ok(replay.players[0].items.includes("Item 99992"));
    assert.ok(replay.players[0].items.includes("Item 99993"));
    assert.ok(replay.players[0].itemSlots.some((item) => item.slotLabel === "后备" && item.name === "Item 99991"));
    assert.ok(replay.players[0].itemSlots.some((item) => item.slotLabel === "中立" && item.name === "Item 99993"));

    const diagnosticsAfter = await request("/api/diagnostics");
    assert.equal(diagnosticsAfter.app.liveGsiReceived, true);
    assert.equal(diagnosticsAfter.app.recommendationStatus, "ready");

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
