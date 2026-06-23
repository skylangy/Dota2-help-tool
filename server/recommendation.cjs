const fs = require("node:fs");
const path = require("node:path");
const { getHeroProfile, getItemProfile } = require("./public-data.cjs");

const rootDir = path.resolve(__dirname, "..");
const items = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "items.json"), "utf8"));
const heroBuilds = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "hero-builds.json"), "utf8"));

const threatLabels = {
  control_heavy: "敌方控制密度高",
  magic_burst: "敌方法术爆发高",
  physical_burst: "敌方物理爆发高",
  single_target_catch: "敌方单点先手强",
  evasion: "敌方闪避或致盲明显",
  tank_frontline: "敌方前排很肉",
  gap_close: "敌方切入能力强",
  kite: "你容易被拉扯",
  high_healing: "敌方回复能力强",
  illusion_enemy: "敌方幻象或召唤物多",
  invisible_enemy: "敌方隐身英雄多",
  silence_heavy: "敌方沉默多",
  mana_burn: "敌方削蓝压力高",
  armor_needed: "团队缺少护甲和减攻速",
  dispel_needed: "需要驱散负面状态"
};

const phaseLabels = {
  lane: "对线期",
  core: "核心成型期",
  late: "后期"
};

const genericBuilds = {
  carry_melee: {
    name: "近战核心通用路线",
    role: "核心",
    lane: ["item_magic_wand", "item_phase_boots"],
    core: ["item_manta", "item_black_king_bar", "item_abyssal_blade"],
    late: ["item_butterfly", "item_satanic"],
    situational: {
      control_heavy: ["item_black_king_bar", "item_manta"],
      magic_burst: ["item_black_king_bar"],
      single_target_catch: ["item_sphere"],
      evasion: ["item_monkey_king_bar"],
      tank_frontline: ["item_silver_edge"],
      illusion_enemy: ["item_bfury", "item_shivas_guard"]
    }
  },
  carry_ranged: {
    name: "远程核心通用路线",
    role: "核心",
    lane: ["item_magic_wand", "item_power_treads"],
    core: ["item_dragon_lance", "item_hurricane_pike", "item_black_king_bar"],
    late: ["item_manta", "item_butterfly", "item_satanic"],
    situational: {
      control_heavy: ["item_black_king_bar"],
      magic_burst: ["item_black_king_bar"],
      gap_close: ["item_hurricane_pike", "item_force_staff"],
      single_target_catch: ["item_sphere"],
      evasion: ["item_monkey_king_bar"]
    }
  },
  support: {
    name: "辅助通用路线",
    role: "辅助",
    lane: ["item_magic_wand", "item_boots"],
    core: ["item_glimmer_cape", "item_force_staff"],
    late: ["item_lotus_orb", "item_ultimate_scepter", "item_black_king_bar"],
    situational: {
      control_heavy: ["item_force_staff", "item_lotus_orb"],
      magic_burst: ["item_glimmer_cape", "item_pipe"],
      physical_burst: ["item_force_staff", "item_glimmer_cape"],
      single_target_catch: ["item_lotus_orb", "item_sphere"],
      high_healing: ["item_spirit_vessel"],
      silence_heavy: ["item_lotus_orb"]
    }
  },
  initiator: {
    name: "先手/肉核通用路线",
    role: "三号位/先手",
    lane: ["item_magic_wand", "item_phase_boots"],
    core: ["item_blink", "item_black_king_bar", "item_shivas_guard"],
    late: ["item_lotus_orb", "item_ultimate_scepter"],
    situational: {
      control_heavy: ["item_black_king_bar"],
      magic_burst: ["item_pipe", "item_black_king_bar"],
      physical_burst: ["item_shivas_guard"],
      single_target_catch: ["item_lotus_orb", "item_sphere"],
      armor_needed: ["item_shivas_guard"],
      dispel_needed: ["item_lotus_orb"]
    }
  },
  caster: {
    name: "法系/中单通用路线",
    role: "法系核心",
    lane: ["item_magic_wand", "item_power_treads"],
    core: ["item_aether_lens", "item_blink", "item_black_king_bar"],
    late: ["item_ultimate_scepter", "item_sphere"],
    situational: {
      control_heavy: ["item_black_king_bar"],
      magic_burst: ["item_black_king_bar"],
      single_target_catch: ["item_sphere"],
      gap_close: ["item_force_staff", "item_blink"],
      silence_heavy: ["item_black_king_bar"]
    }
  }
};

const globalSituational = {
  control_heavy: ["item_black_king_bar", "item_lotus_orb", "item_manta"],
  magic_burst: ["item_black_king_bar", "item_pipe", "item_glimmer_cape"],
  physical_burst: ["item_shivas_guard", "item_ghost", "item_crimson_guard"],
  single_target_catch: ["item_sphere", "item_lotus_orb", "item_black_king_bar"],
  evasion: ["item_monkey_king_bar", "item_bloodthorn"],
  tank_frontline: ["item_silver_edge", "item_skadi", "item_assault"],
  gap_close: ["item_force_staff", "item_hurricane_pike", "item_blink"],
  kite: ["item_blink", "item_hurricane_pike", "item_force_staff", "item_harpoon"],
  high_healing: ["item_spirit_vessel", "item_skadi", "item_shivas_guard"],
  illusion_enemy: ["item_bfury", "item_maelstrom", "item_shivas_guard"],
  invisible_enemy: ["item_dust", "item_ward_dispenser", "item_gem"],
  silence_heavy: ["item_black_king_bar", "item_manta", "item_lotus_orb"],
  mana_burn: ["item_manta", "item_black_king_bar", "item_lotus_orb"],
  armor_needed: ["item_assault", "item_shivas_guard", "item_crimson_guard"],
  dispel_needed: ["item_manta", "item_lotus_orb", "item_cyclone", "item_guardian_greaves"]
};

function itemName(itemId) {
  return items[itemId]?.name ?? itemId.replace(/^item_/, "");
}

function cdnUrl(pathname) {
  if (!pathname) return null;
  return pathname.startsWith("http") ? pathname : `https://cdn.cloudflare.steamstatic.com${pathname}`;
}

function itemImage(itemId) {
  const publicItem = getItemProfile(itemId);
  return cdnUrl(publicItem?.img);
}

function normalizeInventory(rawItems = []) {
  return rawItems
    .filter(Boolean)
    .map((item) => {
      const value = String(item);
      return value.startsWith("item_") ? value : `item_${value}`;
    });
}

function hasItem(inventory, itemId) {
  return inventory.includes(itemId);
}

function firstMissing(sequence = [], inventory) {
  return sequence.find((itemId) => !hasItem(inventory, itemId));
}

function getPhase(gameTime = 0, level = 1) {
  const minute = Math.max(0, Math.floor(gameTime / 60));
  if (minute < 10 || level < 7) return "lane";
  if (minute < 28 || level < 18) return "core";
  return "late";
}

function inferGenericBuild(heroId) {
  const hero = getHeroProfile(heroId);
  if (!hero) {
    return {
      ...genericBuilds.carry_melee,
      name: "全英雄保守通用路线",
      role: "未知定位"
    };
  }

  const roles = new Set(hero.roles ?? []);
  if (roles.has("Support") && !roles.has("Carry")) return genericBuilds.support;
  if (roles.has("Initiator") || roles.has("Durable")) return genericBuilds.initiator;
  if (roles.has("Nuker") && !roles.has("Carry")) return genericBuilds.caster;
  if (roles.has("Carry") && hero.attackType === "Ranged") return genericBuilds.carry_ranged;
  if (roles.has("Carry")) return genericBuilds.carry_melee;
  if (roles.has("Support")) return genericBuilds.support;
  return genericBuilds.caster;
}

function uniqueItems(...groups) {
  return [...new Set(groups.flat().filter(Boolean))];
}

// Pick up to `limit` counter items, one per threat (highest-priority threats first),
// never repeating an item the player already owns or that another pick already used.
function pickSituational(build, inventory, threats, limit = 2) {
  const uncoveredThreats = [];
  const picks = [];
  const usedItems = new Set();

  for (const threat of threats) {
    const options = uniqueItems(build.situational?.[threat] ?? [], globalSituational[threat] ?? []);
    if (options.length === 0) {
      uncoveredThreats.push(threat);
      continue;
    }

    const missing = options.find((itemId) => !hasItem(inventory, itemId) && !usedItems.has(itemId));
    if (missing) {
      usedItems.add(missing);
      picks.push({
        item: missing,
        reason: `${threatLabels[threat] ?? "当前局势"}，这件装备能更直接解决本局最危险的问题。`,
        matchedThreat: threat
      });
      if (picks.length >= limit) break;
    }
  }

  return { picks, uncoveredThreats };
}

function itemCost(itemId) {
  return Number(getItemProfile(itemId)?.cost ?? 0);
}

// Append a gold-awareness hint using the public OpenDota item cost and the player's current gold.
function buildSuggestion(itemId, priority, reason, gold = 0) {
  const cost = itemCost(itemId);
  const affordable = cost > 0 ? gold >= cost : null;
  let goldNote = "";
  if (cost > 0) {
    goldNote = affordable
      ? `（约 ${cost} 金，现在买得起）`
      : `（约 ${cost} 金，还差 ${cost - Math.max(0, Math.floor(gold))}）`;
  }
  return {
    itemId,
    itemName: itemName(itemId),
    imageUrl: itemImage(itemId),
    priority,
    reason: goldNote ? `${reason}${goldNote}` : reason,
    cost,
    affordable
  };
}

function buildThreatNotes(threats, situational) {
  if (threats.length === 0) {
    return ["未选择额外局势标签，使用默认路线。"];
  }

  const matched = (situational?.picks ?? []).map((pick) => pick.matchedThreat);
  const matchedSet = new Set(matched);
  const uncovered = new Set(situational?.uncoveredThreats ?? []);
  const label = (key) => threatLabels[key] ?? key;
  // Only the matched threats actually produced a counter item this round; be explicit so the
  // tool never claims to have "handled" a threat it merely identified.
  const others = threats.filter((key) => !matchedSet.has(key) && !uncovered.has(key));
  const notes = [];

  if (matched.length > 0) {
    notes.push(`本次针对：${matched.map(label).join("、")}（已给出对应装备）`);
  }

  if (others.length > 0) {
    notes.push(`其余已识别局势（本次未单独出装，可后续按金钱补）：${others.map(label).join("、")}`);
  }

  if (uncovered.size > 0) {
    notes.push(`暂无对应出装建议：${[...uncovered].map(label).join("、")}`);
  }

  return notes;
}

function recommend(gameState, context = {}) {
  const heroId = gameState?.hero?.id;
  const explicitBuild = heroBuilds[heroId];
  const profile = getHeroProfile(heroId);
  const build = explicitBuild ?? inferGenericBuild(heroId);
  const inventory = normalizeInventory(gameState?.items);
  const threats = context.threats ?? [];

  if (!heroId) {
    return {
      status: "waiting",
      title: "等待 Dota 2 GSI 数据",
      heroName: "未知英雄",
      suggestions: [],
      notes: ["启动 Dota 2 并进入比赛后，这里会显示实时装备建议。"]
    };
  }

  const gold = Number(gameState.gold ?? 0);
  const phase = getPhase(gameState.gameTime, gameState.level);
  const situational = pickSituational(build, inventory, threats);
  const phasePlan = build[phase] ?? build.core;
  const defaultNext = firstMissing(phasePlan, inventory) ?? firstMissing(build.core, inventory) ?? firstMissing(build.late, inventory);
  const suggestions = [];
  const pickedItems = situational.picks.map((pick) => pick.item);

  situational.picks.forEach((pick, index) => {
    suggestions.push(buildSuggestion(pick.item, index === 0 ? "high" : "medium", pick.reason, gold));
  });

  if (defaultNext && !pickedItems.includes(defaultNext)) {
    const reason = phase === "lane"
      ? "对线期优先补齐基础战斗力、续航和移动能力，降低新手期的容错压力。"
      : phase === "core"
        ? "这是当前定位的核心节奏装，通常能明显提升参战、刷钱或生存效率。"
        : "比赛进入后期，优先补强生存、输出或控制来提高团战稳定性。";
    suggestions.push(buildSuggestion(defaultNext, pickedItems.length > 0 ? "medium" : "high", reason, gold));
  }

  if (suggestions.length === 0) {
    suggestions.push(buildSuggestion(
      "item_black_king_bar",
      "medium",
      "当前路线已基本成型。如果团战容易被控制打断，黑皇杖通常是可靠的兜底选择。",
      gold
    ));
  }

  const heroName = explicitBuild?.name ?? profile?.localizedName ?? gameState.hero?.displayName ?? heroId;
  const sourceNote = explicitBuild
    ? "使用英雄专属规则。"
    : profile
      ? "该英雄暂无专属构筑，已根据 OpenDota 公开角色数据使用通用规则。"
      : "该英雄暂无专属构筑且未同步公开数据，已使用全英雄保守通用规则。";

  return {
    status: "ready",
    title: `${heroName} 装备建议`,
    heroName,
    role: explicitBuild?.role ?? build.role,
    phase,
    suggestions: suggestions.slice(0, 3),
    notes: [
      `当前阶段：${phaseLabels[phase]}`,
      ...buildThreatNotes(threats, situational),
      sourceNote
    ]
  };
}

module.exports = {
  genericBuilds,
  globalSituational,
  heroBuilds,
  items,
  recommend,
  threatLabels,
  _internals: {
    getPhase,
    normalizeInventory,
    pickSituational
  }
};
