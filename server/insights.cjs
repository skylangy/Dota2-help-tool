const { getItemProfile, currentPatch, publicDataSummary } = require("./public-data.cjs");

const THREAT_EN = {
  control_heavy: "heavy enemy control",
  magic_burst: "high enemy magic burst",
  physical_burst: "high enemy physical burst",
  single_target_catch: "strong single-target catch",
  evasion: "enemy evasion or blind",
  tank_frontline: "a durable enemy frontline",
  gap_close: "strong enemy gap-close",
  kite: "high kiting pressure",
  high_healing: "high enemy healing",
  illusion_enemy: "many illusions or summons",
  invisible_enemy: "multiple invisible enemies",
  silence_heavy: "heavy silence",
  mana_burn: "high mana-burn pressure",
  armor_needed: "a need for armor and attack-speed reduction",
  dispel_needed: "a strong need for dispel"
};

const THREAT_ZH = {
  control_heavy: "敌方控制密度高",
  magic_burst: "敌方法术爆发高",
  physical_burst: "敌方物理爆发高",
  single_target_catch: "敌方单点先手强",
  evasion: "敌方闪避或致盲明显",
  tank_frontline: "敌方前排很肉",
  gap_close: "敌方切入能力强",
  kite: "拉扯压力高",
  high_healing: "敌方回复能力强",
  illusion_enemy: "敌方幻象或召唤物多",
  invisible_enemy: "敌方隐身英雄多",
  silence_heavy: "敌方沉默多",
  mana_burn: "敌方削蓝压力高",
  armor_needed: "团队需要护甲和减攻速",
  dispel_needed: "需要驱散负面状态"
};

function labelThreats(threats, lang) {
  const map = lang === "en" ? THREAT_EN : THREAT_ZH;
  return (threats || []).map((key) => map[key] || key);
}

function explainRecommendation(snapshot, lang = "zh") {
  const rec = snapshot?.recommendation || {};
  const game = snapshot?.gameState || {};
  const threats = snapshot?.context?.threats || [];
  const top = rec.suggestions?.[0];

  if (!top) {
    return lang === "en"
      ? { title: "Why this recommendation?", summary: "Enter a match to receive a contextual explanation.", bullets: [] }
      : { title: "为什么这样推荐？", summary: "进入比赛后，这里会给出基于局势的解释。", bullets: [] };
  }

  const remaining = top.cost > 0 ? Math.max(0, top.cost - Number(game.gold || 0)) : null;
  const threatText = labelThreats(threats, lang);

  if (lang === "en") {
    return {
      title: "Why this recommendation?",
      summary: `${top.itemName} is currently the highest-priority item for this game state.`,
      bullets: [
        threatText.length ? `Detected pressure: ${threatText.join(", ")}.` : "No extra threat tags are active, so the default role build is weighted more heavily.",
        `Current phase: ${rec.phase || "unknown"}; level ${game.level || 1}; gold ${game.gold || 0}.`,
        remaining == null ? "Item price is unavailable from the current public cache." : remaining === 0 ? "You can afford it now." : `You need about ${remaining} more gold.`,
        "The recommendation uses only read-only GSI, public data, and manually selected context."
      ]
    };
  }

  return {
    title: "为什么这样推荐？",
    summary: `${top.itemName} 是当前局势下优先级最高的装备。`,
    bullets: [
      threatText.length ? `识别到的主要压力：${threatText.join("、")}。` : "当前没有额外局势标签，因此更偏向英雄默认路线。",
      `当前阶段：${rec.phase || "未知"}；等级 ${game.level || 1}；金钱 ${game.gold || 0}。`,
      remaining == null ? "当前公开数据缓存里没有该装备价格。" : remaining === 0 ? "你现在已经买得起。" : `距离购买大约还差 ${remaining} 金。`,
      "推荐仅使用只读 GSI、公开数据和你手动选择的局势信息。"
    ]
  };
}

function itemSnapshot(itemId) {
  const normalized = String(itemId || "").replace(/^item_/, "");
  const profile = getItemProfile(normalized) || getItemProfile(`item_${normalized}`);
  return profile ? {
    itemId: `item_${profile.key}`,
    name: profile.name,
    cost: Number(profile.cost || 0),
    tier: profile.tier ?? null,
    components: profile.components || []
  } : null;
}

function scoreItem(item, threats = [], gold = 0) {
  if (!item) return 0;
  let score = 50;
  if (item.cost > 0 && gold >= item.cost) score += 10;
  if (item.cost > 5000) score -= 5;
  const key = item.itemId;
  const boost = (threat, ids, value) => { if (threats.includes(threat) && ids.includes(key)) score += value; };
  boost("control_heavy", ["item_black_king_bar", "item_manta", "item_lotus_orb"], 22);
  boost("magic_burst", ["item_black_king_bar", "item_pipe", "item_glimmer_cape"], 20);
  boost("single_target_catch", ["item_sphere", "item_lotus_orb"], 22);
  boost("evasion", ["item_monkey_king_bar", "item_bloodthorn"], 24);
  boost("high_healing", ["item_spirit_vessel", "item_skadi", "item_shivas_guard"], 20);
  boost("illusion_enemy", ["item_bfury", "item_maelstrom", "item_shivas_guard"], 18);
  boost("silence_heavy", ["item_black_king_bar", "item_manta", "item_lotus_orb"], 20);
  boost("dispel_needed", ["item_manta", "item_lotus_orb", "item_cyclone", "item_guardian_greaves"], 20);
  return Math.max(0, Math.min(100, score));
}

function compareItems(snapshot, itemAId, itemBId, lang = "zh") {
  const threats = snapshot?.context?.threats || [];
  const gold = Number(snapshot?.gameState?.gold || 0);
  const a = itemSnapshot(itemAId);
  const b = itemSnapshot(itemBId);
  if (!a || !b) {
    const error = new Error(lang === "en" ? "One or both items were not found in the public data cache." : "公开数据缓存中找不到其中一个装备。" );
    error.code = "ITEM_NOT_FOUND";
    throw error;
  }
  const scoreA = scoreItem(a, threats, gold);
  const scoreB = scoreItem(b, threats, gold);
  const winner = scoreA === scoreB ? null : scoreA > scoreB ? a : b;
  return {
    patch: currentPatch(),
    items: [{ ...a, fitScore: scoreA }, { ...b, fitScore: scoreB }],
    verdict: lang === "en"
      ? winner ? `${winner.name} fits the currently detected situation better.` : "Both items have a similar fit for the currently detected situation."
      : winner ? `按当前识别到的局势，${winner.name} 更合适。` : "按当前识别到的局势，两件装备的适配度接近。",
    note: lang === "en"
      ? "This score is an explainable heuristic, not a win-probability prediction."
      : "这个分数是可解释的启发式评分，不是胜率预测。"
  };
}

function patchIntelligence(lang = "zh") {
  const data = publicDataSummary();
  const patch = data.patch || currentPatch();
  return lang === "en" ? {
    title: `Patch Intelligence${patch ? ` · ${patch}` : ""}`,
    patch,
    generatedAt: data.generatedAt || null,
    summary: patch ? `Public hero and item data is synced for patch ${patch}. Recommendations are recalculated from the latest cache.` : "Patch data has not been synced yet.",
    autoUpdate: data.autoUpdate || null
  } : {
    title: `版本情报${patch ? ` · ${patch}` : ""}`,
    patch,
    generatedAt: data.generatedAt || null,
    summary: patch ? `英雄和装备公开数据已同步到 ${patch}，推荐会基于最新缓存重新计算。` : "当前还没有同步版本数据。",
    autoUpdate: data.autoUpdate || null
  };
}

module.exports = {
  compareItems,
  explainRecommendation,
  patchIntelligence
};
