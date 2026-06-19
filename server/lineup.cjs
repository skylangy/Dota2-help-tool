const heroThreats = {
  npc_dota_hero_axe: ["control_heavy", "physical_burst"],
  npc_dota_hero_lion: ["control_heavy", "magic_burst"],
  npc_dota_hero_shadow_shaman: ["control_heavy"],
  npc_dota_hero_bane: ["single_target_catch", "control_heavy"],
  npc_dota_hero_batrider: ["single_target_catch", "magic_burst"],
  npc_dota_hero_legion_commander: ["single_target_catch", "physical_burst"],
  npc_dota_hero_doom_bringer: ["single_target_catch", "silence_heavy"],
  npc_dota_hero_silencer: ["silence_heavy", "magic_burst"],
  npc_dota_hero_death_prophet: ["silence_heavy", "magic_burst"],
  npc_dota_hero_skywrath_mage: ["silence_heavy", "magic_burst"],
  npc_dota_hero_zuus: ["magic_burst"],
  npc_dota_hero_lina: ["magic_burst"],
  npc_dota_hero_leshrac: ["magic_burst"],
  npc_dota_hero_necrolyte: ["magic_burst", "high_healing"],
  npc_dota_hero_huskar: ["high_healing", "magic_burst"],
  npc_dota_hero_alchemist: ["high_healing", "tank_frontline"],
  npc_dota_hero_phantom_lancer: ["illusion_enemy"],
  npc_dota_hero_chaos_knight: ["illusion_enemy", "physical_burst"],
  npc_dota_hero_naga_siren: ["illusion_enemy", "control_heavy"],
  npc_dota_hero_terrorblade: ["illusion_enemy", "physical_burst"],
  npc_dota_hero_broodmother: ["illusion_enemy"],
  npc_dota_hero_riki: ["invisible_enemy", "silence_heavy"],
  npc_dota_hero_bounty_hunter: ["invisible_enemy"],
  npc_dota_hero_clinkz: ["invisible_enemy", "physical_burst"],
  npc_dota_hero_slark: ["invisible_enemy", "single_target_catch"],
  npc_dota_hero_phantom_assassin: ["evasion", "physical_burst"],
  npc_dota_hero_windrunner: ["evasion", "physical_burst"],
  npc_dota_hero_brewmaster: ["evasion", "control_heavy"],
  npc_dota_hero_storm_spirit: ["gap_close", "single_target_catch"],
  npc_dota_hero_spirit_breaker: ["gap_close", "single_target_catch"],
  npc_dota_hero_earth_spirit: ["gap_close", "control_heavy"],
  npc_dota_hero_clockwerk: ["gap_close", "control_heavy"],
  npc_dota_hero_tidehunter: ["control_heavy", "armor_needed"],
  npc_dota_hero_enigma: ["control_heavy", "magic_burst"],
  npc_dota_hero_faceless_void: ["control_heavy", "physical_burst"]
};

function inferThreats(enemyHeroes = [], heroProfiles = []) {
  const tags = new Set();
  for (const heroId of enemyHeroes) {
    for (const tag of heroThreats[heroId] ?? []) {
      tags.add(tag);
    }
  }

  const selectedProfiles = heroProfiles.filter((hero) => enemyHeroes.includes(hero.id));
  const disablers = selectedProfiles.filter((hero) => hero.roles?.includes("Disabler")).length;
  const nukers = selectedProfiles.filter((hero) => hero.roles?.includes("Nuker")).length;
  const carries = selectedProfiles.filter((hero) => hero.roles?.includes("Carry")).length;
  const initiators = selectedProfiles.filter((hero) => hero.roles?.includes("Initiator")).length;
  const durable = selectedProfiles.filter((hero) => hero.roles?.includes("Durable")).length;

  if (disablers >= 3) tags.add("control_heavy");
  if (nukers >= 3) tags.add("magic_burst");
  if (carries >= 3) tags.add("physical_burst");
  if (initiators >= 2) tags.add("gap_close");
  if (durable >= 2) tags.add("tank_frontline");

  return [...tags];
}

module.exports = {
  inferThreats
};
