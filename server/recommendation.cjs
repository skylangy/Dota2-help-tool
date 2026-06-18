const fs = require("node:fs");
const path = require("node:path");

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
  high_healing: "敌方回复能力强"
};

function itemName(itemId) {
  return items[itemId]?.name ?? itemId.replace(/^item_/, "");
}

function normalizeInventory(rawItems = []) {
  return rawItems.filter(Boolean).map((item) => item.replace(/^item_/, "item_"));
}

function hasItem(inventory, itemId) {
  return inventory.includes(itemId);
}

function firstMissing(sequence, inventory) {
  return sequence.find((itemId) => !hasItem(inventory, itemId));
}

function getPhase(gameTime = 0, level = 1) {
  const minute = Math.max(0, Math.floor(gameTime / 60));
  if (minute < 10 || level < 7) return "lane";
  if (minute < 28 || level < 18) return "core";
  return "late";
}

function pickSituational(build, inventory, threats) {
  for (const threat of threats) {
    const options = build.situational?.[threat] ?? [];
    const missing = firstMissing(options, inventory);
    if (missing) {
      return {
        item: missing,
        reason: `${threatLabels[threat] ?? "当前局势"}，这件装备能更直接解决本局最危险的问题。`,
        matchedThreat: threat
      };
    }
  }

  return null;
}

function recommend(gameState, context = {}) {
  const heroId = gameState?.hero?.id;
  const build = heroBuilds[heroId];
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

  if (!build) {
    return {
      status: "unsupported_hero",
      title: "暂未收录该英雄",
      heroName: heroId,
      suggestions: [],
      notes: ["当前 MVP 只收录了少量示例英雄，可以继续在 data/hero-builds.json 中扩展。"]
    };
  }

  const phase = getPhase(gameState.gameTime, gameState.level);
  const situational = pickSituational(build, inventory, threats);
  const phasePlan = build[phase] ?? build.core;
  const defaultNext = firstMissing(phasePlan, inventory) ?? firstMissing(build.core, inventory) ?? firstMissing(build.late, inventory);

  const suggestions = [];

  if (situational) {
    suggestions.push({
      itemId: situational.item,
      itemName: itemName(situational.item),
      priority: "high",
      reason: situational.reason
    });
  }

  if (defaultNext && defaultNext !== situational?.item) {
    suggestions.push({
      itemId: defaultNext,
      itemName: itemName(defaultNext),
      priority: situational ? "medium" : "high",
      reason: phase === "lane"
        ? "对线期优先补齐基础战斗力和续航，降低新手期的容错压力。"
        : phase === "core"
          ? "这是当前英雄的核心节奏装，通常能明显提升参战或刷钱效率。"
          : "比赛进入后期，优先补强生存、输出或控制来提高团战稳定性。"
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      itemId: "item_black_king_bar",
      itemName: itemName("item_black_king_bar"),
      priority: "medium",
      reason: "当前推荐路线已基本成型。如果团战容易被控制打断，黑皇杖通常是可靠的兜底选择。"
    });
  }

  return {
    status: "ready",
    title: `${build.name}装备建议`,
    heroName: build.name,
    role: build.role,
    phase,
    suggestions: suggestions.slice(0, 3),
    notes: [
      `当前阶段：${phase === "lane" ? "对线期" : phase === "core" ? "核心成型期" : "后期"}`,
      threats.length > 0 ? `已考虑局势：${threats.map((key) => threatLabels[key] ?? key).join("、")}` : "未选择额外局势标签，使用英雄默认路线。"
    ]
  };
}

module.exports = {
  heroBuilds,
  items,
  recommend,
  threatLabels
};
