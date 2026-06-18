function parseItems(items = {}) {
  return Object.values(items)
    .map((slot) => slot?.name)
    .filter((name) => name && name !== "empty");
}

function parseGameState(payload = {}) {
  const hero = payload.hero ?? {};
  const player = payload.player ?? {};
  const map = payload.map ?? {};

  return {
    receivedAt: new Date().toISOString(),
    hero: {
      id: hero.name ?? "",
      displayName: hero.localized_name ?? hero.name ?? ""
    },
    gameTime: Number(map.clock_time ?? 0),
    level: Number(hero.level ?? 1),
    gold: Number(player.gold ?? player.gold_reliable ?? 0),
    items: parseItems(payload.items),
    raw: {
      provider: payload.provider,
      map: {
        name: map.name,
        matchId: map.matchid,
        gameState: map.game_state
      }
    }
  };
}

module.exports = {
  parseGameState
};
