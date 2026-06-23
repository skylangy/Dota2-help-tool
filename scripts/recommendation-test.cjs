const assert = require("node:assert/strict");
const { genericBuilds, recommend, _internals } = require("../server/recommendation.cjs");

const { getPhase, normalizeInventory, pickSituational } = _internals;

function makeState(overrides = {}) {
  return {
    hero: { id: "npc_dota_hero_juggernaut", displayName: "Juggernaut" },
    gameTime: 18 * 60,
    level: 12,
    items: ["item_magic_wand", "item_phase_boots"],
    ...overrides
  };
}

function testThreatFallbacks() {
  const invisible = recommend(makeState(), { threats: ["invisible_enemy"] });
  assert.equal(invisible.status, "ready");
  assert.equal(invisible.suggestions[0].itemId, "item_dust");

  const healing = recommend(makeState(), { threats: ["high_healing"] });
  assert.ok(["item_spirit_vessel", "item_skadi", "item_shivas_guard"].includes(healing.suggestions[0].itemId));

  const manaBurn = recommend(makeState(), { threats: ["mana_burn"] });
  assert.ok(["item_manta", "item_black_king_bar", "item_lotus_orb"].includes(manaBurn.suggestions[0].itemId));
}

function testPhaseBoundaries() {
  assert.equal(getPhase(9 * 60 + 59, 10), "lane");
  assert.equal(getPhase(10 * 60, 6), "lane");
  assert.equal(getPhase(10 * 60, 7), "core");
  assert.equal(getPhase(27 * 60 + 59, 25), "core");
  assert.equal(getPhase(28 * 60, 17), "core");
  assert.equal(getPhase(28 * 60, 18), "late");
}

function testInventoryNormalizationAndSkipOwnedItems() {
  const inventory = normalizeInventory(["magic_wand", "item_dust", "item_dust", "", null]);
  assert.deepEqual(inventory, ["item_magic_wand", "item_dust", "item_dust"]);

  const picked = pickSituational(genericBuilds.carry_melee, inventory, ["invisible_enemy"]);
  assert.equal(picked.item, "item_ward_dispenser");

  const withAllDetection = pickSituational(
    genericBuilds.carry_melee,
    ["item_dust", "item_ward_dispenser", "item_gem"],
    ["invisible_enemy"]
  );
  assert.equal(withAllDetection.item, null);
}

function main() {
  testThreatFallbacks();
  testPhaseBoundaries();
  testInventoryNormalizationAndSkipOwnedItems();
  console.log("Recommendation unit-test passed");
}

main();
