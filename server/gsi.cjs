function parseItems(items = {}) {
  return Object.values(items)
    .map((slot) => slot?.name)
    .filter((name) => name && name !== "empty");
}

function normalizeHeroId(value = "") {
  if (typeof value !== "string") return "";
  if (value.startsWith("npc_dota_hero_")) return value;
  if (value.startsWith("dota_npc_hero_")) return value.replace("dota_npc_hero_", "npc_dota_hero_");
  return "";
}

function normalizeTeam(value = "") {
  const raw = String(value).toLowerCase();
  if (raw.includes("radiant") || raw === "2" || raw === "0") return "radiant";
  if (raw.includes("dire") || raw === "3" || raw === "1") return "dire";
  return "";
}

function teamFromSlot(slot) {
  const numeric = Number(slot);
  if (!Number.isFinite(numeric)) return "";
  return numeric >= 128 ? "dire" : "radiant";
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function parseAllPlayers(allplayers = {}, localPlayer = {}) {
  const players = Object.values(allplayers)
    .map((entry) => {
      const heroId = normalizeHeroId(entry?.hero_name ?? entry?.hero?.name ?? entry?.hero);
      const team = normalizeTeam(entry?.team_name ?? entry?.team ?? entry?.team_number) || teamFromSlot(entry?.player_slot);
      const accountId = String(entry?.accountid ?? entry?.account_id ?? entry?.steamid ?? "");
      return {
        accountId,
        heroId,
        name: entry?.name ?? entry?.player_name ?? "",
        team
      };
    })
    .filter((entry) => entry.heroId);

  const localTeam = normalizeTeam(localPlayer.team_name ?? localPlayer.team)
    || teamFromSlot(localPlayer.player_slot)
    || players.find((entry) => entry.accountId && entry.accountId === String(localPlayer.accountid ?? localPlayer.account_id ?? localPlayer.steamid ?? ""))?.team
    || "";

  return {
    localTeam,
    radiant: unique(players.filter((entry) => entry.team === "radiant").map((entry) => entry.heroId)),
    dire: unique(players.filter((entry) => entry.team === "dire").map((entry) => entry.heroId)),
    observedCount: players.length
  };
}

function parseDraftHeroes(draft = {}) {
  const heroes = new Set();

  function visit(value) {
    if (!value) return;
    if (typeof value === "string") {
      const heroId = normalizeHeroId(value);
      if (heroId) heroes.add(heroId);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === "object") {
      for (const nested of Object.values(value)) {
        visit(nested);
      }
    }
  }

  visit(draft);
  return [...heroes];
}

function parseGameState(payload = {}) {
  const hero = payload.hero ?? {};
  const player = payload.player ?? {};
  const map = payload.map ?? {};
  const allplayers = parseAllPlayers(payload.allplayers, player);
  const localTeam = allplayers.localTeam;
  const enemies = localTeam === "radiant"
    ? allplayers.dire
    : localTeam === "dire"
      ? allplayers.radiant
      : [];
  const allies = localTeam === "radiant"
    ? allplayers.radiant
    : localTeam === "dire"
      ? allplayers.dire
      : [];
  const draftHeroes = parseDraftHeroes(payload.draft);

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
    lineups: {
      source: enemies.length > 0 ? "gsi_allplayers" : draftHeroes.length > 0 ? "gsi_draft" : "none",
      localTeam,
      radiant: allplayers.radiant,
      dire: allplayers.dire,
      allies,
      enemies,
      draftHeroes,
      observedCount: allplayers.observedCount
    },
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
