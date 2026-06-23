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
  npc_dota_hero_faceless_void: ["control_heavy", "physical_burst"],
  npc_dota_hero_sand_king: ["control_heavy", "magic_burst"],
  npc_dota_hero_disruptor: ["control_heavy", "silence_heavy"],
  npc_dota_hero_magnataur: ["control_heavy", "gap_close"],
  npc_dota_hero_puck: ["silence_heavy", "gap_close"],
  npc_dota_hero_void_spirit: ["gap_close", "silence_heavy"],
  npc_dota_hero_ember_spirit: ["gap_close", "kite"],
  npc_dota_hero_tinker: ["magic_burst", "kite"],
  npc_dota_hero_obsidian_destroyer: ["mana_burn", "magic_burst"],
  npc_dota_hero_nyx_assassin: ["invisible_enemy", "mana_burn"],
  npc_dota_hero_weaver: ["invisible_enemy", "kite"],
  npc_dota_hero_mirana: ["gap_close", "control_heavy"],
  npc_dota_hero_morphling: ["physical_burst", "kite"],
  npc_dota_hero_medusa: ["physical_burst", "mana_burn"],
  npc_dota_hero_troll_warlord: ["physical_burst", "evasion"],
  npc_dota_hero_ursa: ["physical_burst", "single_target_catch"],
  npc_dota_hero_sven: ["physical_burst", "control_heavy"],
  npc_dota_hero_dragon_knight: ["tank_frontline", "physical_burst"],
  npc_dota_hero_abaddon: ["high_healing", "tank_frontline"],
  npc_dota_hero_omniknight: ["high_healing"],
  npc_dota_hero_dazzle: ["high_healing"],
  npc_dota_hero_wisp: ["high_healing"],
  npc_dota_hero_chen: ["high_healing"],
  npc_dota_hero_undying: ["tank_frontline"],
  npc_dota_hero_meepo: ["gap_close"],
  npc_dota_hero_arc_warden: ["illusion_enemy", "kite"],
  npc_dota_hero_life_stealer: ["tank_frontline", "gap_close"],
  npc_dota_hero_night_stalker: ["gap_close"],
  npc_dota_hero_slardar: ["gap_close", "single_target_catch"],
  npc_dota_hero_kunkka: ["control_heavy", "physical_burst"],
  npc_dota_hero_beastmaster: ["control_heavy", "physical_burst"],
  npc_dota_hero_winter_wyvern: ["control_heavy", "high_healing"],
  npc_dota_hero_oracle: ["high_healing", "dispel_needed"],
  npc_dota_hero_pugna: ["magic_burst"],
  npc_dota_hero_grimstroke: ["silence_heavy", "control_heavy"],
  npc_dota_hero_jakiro: ["magic_burst", "control_heavy"],
  npc_dota_hero_venomancer: ["magic_burst"],
  npc_dota_hero_viper: ["magic_burst", "physical_burst"],
  npc_dota_hero_razor: ["physical_burst"],
  npc_dota_hero_tiny: ["physical_burst", "gap_close"],
  npc_dota_hero_mars: ["control_heavy", "gap_close"],
  npc_dota_hero_dark_seer: ["control_heavy", "gap_close"],
  npc_dota_hero_phoenix: ["high_healing", "magic_burst"],
  npc_dota_hero_techies: ["magic_burst"],
  npc_dota_hero_bloodseeker: ["physical_burst", "silence_heavy"],
  npc_dota_hero_templar_assassin: ["physical_burst"],
  npc_dota_hero_ancient_apparition: ["magic_burst"],
  npc_dota_hero_pudge: ["single_target_catch", "control_heavy"],
  npc_dota_hero_keeper_of_the_light: ["magic_burst"],
  npc_dota_hero_dark_willow: ["control_heavy", "magic_burst"],
  npc_dota_hero_snapfire: ["control_heavy", "magic_burst"],
  npc_dota_hero_primal_beast: ["gap_close", "control_heavy"],
  npc_dota_hero_muerta: ["magic_burst", "physical_burst"]
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
