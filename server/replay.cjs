const { getPublicDataCache } = require("./public-data.cjs");

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

function playerItems(player, itemsById) {
  return [0, 1, 2, 3, 4, 5]
    .map((slot) => player[`item_${slot}`])
    .filter((id) => Number(id) > 0)
    .map((id) => itemsById.get(id) ?? `Item ${id}`);
}

function summarizeMatch(match) {
  const { heroesById, itemsById } = buildLookups();
  const players = (match.players ?? []).map((player) => {
    const kills = player.kills ?? 0;
    const deaths = player.deaths ?? 0;
    const assists = player.assists ?? 0;
    return {
      accountId: player.account_id ?? null,
      heroId: player.hero_id,
      heroName: heroesById.get(player.hero_id) ?? `Hero ${player.hero_id}`,
      isRadiant: Boolean(player.isRadiant),
      won: Boolean(player.win),
      kda: `${kills}/${deaths}/${assists}`,
      gpm: player.gold_per_min ?? 0,
      xpm: player.xp_per_min ?? 0,
      lastHits: player.last_hits ?? 0,
      heroDamage: player.hero_damage ?? 0,
      towerDamage: player.tower_damage ?? 0,
      items: playerItems(player, itemsById)
    };
  });

  const sortedByGpm = [...players].sort((a, b) => b.gpm - a.gpm);
  const sortedByDamage = [...players].sort((a, b) => b.heroDamage - a.heroDamage);

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
      "复盘数据来自 OpenDota 公开 API，仅用于战后学习。"
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
      "User-Agent": "Dota2HelpTool/0.4.0"
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
