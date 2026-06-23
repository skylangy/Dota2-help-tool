const { getPublicDataCache } = require("./public-data.cjs");
const { userAgent } = require("./version.cjs");

function formatDuration(seconds = 0) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

function buildLookups() {
  const cache = getPublicDataCache();
  const heroesById = new Map((cache?.heroes ?? []).map((hero) => [hero.id, hero.localizedName]));
  const itemsById = new Map((cache?.items ?? []).map((item) => [item.id, item.name]));
  return { heroesById, itemsById };
}

function playerItemSlots(player, itemsById) {
  const mainSlots = [0, 1, 2, 3, 4, 5].map((slot) => ({
    id: player[`item_${slot}`],
    slot: `item_${slot}`,
    slotLabel: "主栏"
  }));
  const backpackFromItems = [6, 7, 8].map((slot) => ({
    id: player[`item_${slot}`],
    slot: `item_${slot}`,
    slotLabel: "后备"
  }));
  const backpackSlots = [0, 1, 2].map((slot) => ({
    id: player[`backpack_${slot}`],
    slot: `backpack_${slot}`,
    slotLabel: "后备"
  }));
  const neutral = {
    id: player.item_neutral ?? player.neutral_item ?? player.item_9,
    slot: "neutral",
    slotLabel: "中立"
  };

  return [...mainSlots, ...backpackFromItems, ...backpackSlots, neutral]
    .filter((item) => Number(item.id) > 0)
    .map((item) => ({
      ...item,
      name: itemsById.get(item.id) ?? `Item ${item.id}`
    }));
}

function diagnosePlayer(player, durationMinutes) {
  const issues = [];
  const deaths = player.deaths ?? 0;
  const gpm = player.gold_per_min ?? 0;
  const xpm = player.xp_per_min ?? 0;
  const lastHits = player.last_hits ?? 0;
  const heroDamage = player.hero_damage ?? 0;
  const towerDamage = player.tower_damage ?? 0;
  const itemCount = playerItemSlots(player, new Map()).length;

  if (deaths >= 10) {
    issues.push("死亡偏多，优先复盘站位、视野和保命装时机。");
  } else if (deaths >= 7) {
    issues.push("死亡略高，团战前需要更注意先手范围和撤退路线。");
  }

  if (durationMinutes >= 20 && gpm < 350 && player.lane_role !== 5) {
    issues.push("经济偏低，可能需要更早补刷钱装、减少无收益游走或提高补刀效率。");
  }

  if (durationMinutes >= 20 && xpm < 450) {
    issues.push("经验偏低，注意不要长时间离线或在低收益区域停留。");
  }

  if (durationMinutes >= 25 && lastHits < 120 && player.lane_role !== 5) {
    issues.push("补刀/刷钱量偏低，核心位需要规划安全线和野区循环。");
  }

  if (durationMinutes >= 25 && itemCount <= 3) {
    issues.push("装备成型较慢，建议复盘关键装备是否延迟。");
  }

  if (heroDamage < 10000 && durationMinutes >= 30 && player.lane_role !== 5) {
    issues.push("英雄伤害偏低，可能参团时机或输出环境不足。");
  }

  if (towerDamage < 1000 && player.win && durationMinutes >= 30 && player.lane_role !== 5) {
    issues.push("推塔参与偏少，赢团后可以更主动转化为防御塔和地图资源。");
  }

  if (issues.length === 0) {
    issues.push("主要指标没有明显异常，可以重点复盘关键团战和装备选择细节。");
  }

  return issues.slice(0, 3);
}

function summarizeMatch(match) {
  const { heroesById, itemsById } = buildLookups();
  const durationMinutes = Math.max(1, (match.duration ?? 0) / 60);
  const players = (match.players ?? []).map((player) => {
    const kills = player.kills ?? 0;
    const deaths = player.deaths ?? 0;
    const assists = player.assists ?? 0;
    const itemSlots = playerItemSlots(player, itemsById);
    return {
      accountId: player.account_id ?? null,
      heroId: player.hero_id,
      heroName: heroesById.get(player.hero_id) ?? `Hero ${player.hero_id}`,
      isRadiant: Boolean(player.isRadiant),
      won: Boolean(player.win),
      kda: `${kills}/${deaths}/${assists}`,
      kills,
      deaths,
      assists,
      gpm: player.gold_per_min ?? 0,
      xpm: player.xp_per_min ?? 0,
      lastHits: player.last_hits ?? 0,
      heroDamage: player.hero_damage ?? 0,
      towerDamage: player.tower_damage ?? 0,
      itemSlots,
      items: itemSlots.map((item) => item.name),
      issues: diagnosePlayer(player, durationMinutes)
    };
  });

  const sortedByGpm = [...players].sort((a, b) => b.gpm - a.gpm);
  const sortedByDamage = [...players].sort((a, b) => b.heroDamage - a.heroDamage);
  const mostDeaths = [...players].sort((a, b) => b.deaths - a.deaths)[0];

  return {
    matchId: match.match_id,
    duration: formatDuration(match.duration ?? 0),
    radiantWin: Boolean(match.radiant_win),
    winner: match.radiant_win ? "天辉" : "夜魇",
    averageRank: match.average_rank ?? null,
    players,
    highlights: [
      sortedByGpm[0] ? `最高 GPM：${sortedByGpm[0].heroName} ${sortedByGpm[0].gpm}` : "暂无经济数据。",
      sortedByDamage[0] ? `最高英雄伤害：${sortedByDamage[0].heroName} ${sortedByDamage[0].heroDamage}` : "暂无伤害数据。",
      mostDeaths ? `死亡最多：${mostDeaths.heroName} ${mostDeaths.deaths} 次，建议重点复盘站位和保命装。` : "暂无死亡数据。"
    ],
    coachSummary: [
      "复盘结论基于 OpenDota 公开赛后统计，只能指出经济、死亡、输出、推塔和装备节奏问题。",
      "它不能判断真实鼠标键盘操作，也不会读取录像内部或游戏进程。",
      "建议先选择你的英雄行，重点看该英雄的 1-3 条问题。"
    ]
  };
}

async function fetchMatch(matchId) {
  if (!/^\d+$/.test(String(matchId))) {
    const error = new Error("Match ID 必须是数字。");
    error.code = "INVALID_MATCH_ID";
    throw error;
  }

  const response = await fetch(`https://api.opendota.com/api/matches/${matchId}`, {
    headers: {
      "User-Agent": userAgent
    }
  });

  if (!response.ok) {
    throw new Error(`OpenDota match request failed: ${response.status}`);
  }

  return summarizeMatch(await response.json());
}

module.exports = {
  fetchMatch,
  summarizeMatch
};
