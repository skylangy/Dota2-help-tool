// Cross-match progression: pull the player's own recent matches from OpenDota (public data,
// at the user's request) and turn them into a personalized "what to practise" profile.
//
// Reuses the per-hero benchmarks so each match is scored hero-aware (a support's low GPM is
// normal; a core's low farm is not), then aggregates recurring weak spots across matches.
// No game-process interaction; only public OpenDota data for the user's own account.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { userAgent } = require("./version.cjs");
const { getPublicDataCache, currentPatch } = require("./public-data.cjs");
const { ensureHeroBenchmarks, getPercentile } = require("./benchmarks.cjs");

const BASE = "https://api.opendota.com/api";
const RECENT_LIMIT = 20;
const TTL_MS = 30 * 60 * 1000;

const METRICS = [
  { key: "gold_per_min", label: "经济（GPM）", advice: "更早补刷钱装、减少无收益游走、提升补刀效率。" },
  { key: "xp_per_min", label: "经验（XPM）", advice: "保持在线吃线吃野，别长时间离开收益区域。" },
  { key: "last_hits_per_min", label: "补刀", advice: "规划安全线和野区循环，练正反补节奏。" },
  { key: "hero_damage_per_min", label: "团战输出", advice: "找准进场时机和输出环境，别在边缘空放。" }
];

function cacheFile() {
  const appData = process.env.APPDATA || path.join(os.homedir(), ".config");
  return path.join(appData, "Dota2HelpTool", "player-profile-cache.json");
}
function readCache() {
  try {
    return JSON.parse(fs.readFileSync(cacheFile(), "utf8"));
  } catch {
    return {};
  }
}
function writeCache(data) {
  fs.mkdirSync(path.dirname(cacheFile()), { recursive: true });
  fs.writeFileSync(cacheFile(), JSON.stringify(data, null, 2), "utf8");
}

// Progression history: a small list of past snapshots per account so we can show whether the
// player is improving, not just where they stand today (the "coach loop").
function historyFile() {
  return path.join(path.dirname(cacheFile()), "player-history-cache.json");
}
function readHistory() {
  try {
    return JSON.parse(fs.readFileSync(historyFile(), "utf8"));
  } catch {
    return {};
  }
}
function writeHistory(data) {
  fs.mkdirSync(path.dirname(historyFile()), { recursive: true });
  fs.writeFileSync(historyFile(), JSON.stringify(data, null, 2), "utf8");
}

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": userAgent }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`OpenDota request failed: ${res.status}`);
  return res.json();
}

function heroNameById(id) {
  const cache = getPublicDataCache();
  const hero = (cache?.heroes ?? []).find((h) => h.id === id);
  return hero?.localizedName ?? `Hero ${id}`;
}

function perMin(total, durationSeconds) {
  const minutes = (durationSeconds ?? 0) / 60;
  return minutes > 0 ? total / minutes : 0;
}

function average(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

// Bounded concurrency so warming many hero benchmarks at once doesn't trip OpenDota rate limits.
async function mapLimit(items, limit, fn) {
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      await fn(items[current]);
    }
  });
  await Promise.all(workers);
}

async function fetchPlayerProfile(accountId) {
  if (!/^\d+$/.test(String(accountId))) {
    const error = new Error("账号 ID（Dota 好友编号）必须是数字。");
    error.code = "INVALID_ACCOUNT_ID";
    throw error;
  }

  // /matches with project returns ONLY the projected fields (+ a few defaults), so hero_id
  // must be projected explicitly or every match comes back without its hero.
  const projected = "project=hero_id&project=gold_per_min&project=xp_per_min&project=last_hits&project=hero_damage";
  const [profile, wl, matches, heroes] = await Promise.all([
    getJson(`${BASE}/players/${accountId}`).catch(() => ({})),
    getJson(`${BASE}/players/${accountId}/wl`).catch(() => ({ win: 0, lose: 0 })),
    getJson(`${BASE}/players/${accountId}/matches?limit=${RECENT_LIMIT}&${projected}`).catch(() => []),
    getJson(`${BASE}/players/${accountId}/heroes`).catch(() => [])
  ]);

  if (!Array.isArray(matches) || matches.length === 0) {
    const error = new Error("拿不到该账号的比赛数据。请确认账号 ID 正确，且已在 Dota 设置里开启「公开比赛数据」。");
    error.code = "NO_PUBLIC_MATCHES";
    throw error;
  }

  // Warm benchmarks for every hero seen, then score each match hero-aware.
  const heroIds = [...new Set(matches.map((m) => m.hero_id).filter((id) => id != null))];
  await mapLimit(heroIds, 4, (id) => ensureHeroBenchmarks(id).catch(() => null));

  const samples = { gold_per_min: [], xp_per_min: [], last_hits_per_min: [], hero_damage_per_min: [] };
  let wins = 0;
  for (const m of matches) {
    const isRadiant = (m.player_slot ?? 0) < 128;
    if (isRadiant === Boolean(m.radiant_win)) wins += 1;
    const values = {
      gold_per_min: m.gold_per_min ?? 0,
      xp_per_min: m.xp_per_min ?? 0,
      last_hits_per_min: perMin(m.last_hits ?? 0, m.duration),
      hero_damage_per_min: perMin(m.hero_damage ?? 0, m.duration)
    };
    for (const key of Object.keys(samples)) {
      const pct = getPercentile(m.hero_id, key, values[key]);
      if (pct !== null) samples[key].push(pct);
    }
  }

  const metrics = METRICS.map((meta) => {
    const avg = average(samples[meta.key]);
    return {
      key: meta.key,
      label: meta.label,
      advice: meta.advice,
      avgPercentile: avg === null ? null : Math.round(avg * 100),
      lowGames: samples[meta.key].filter((p) => p <= 0.25).length,
      sampled: samples[meta.key].length
    };
  });

  // Personalized focus: the weakest benchmarked metric(s) that are clearly below average.
  const focus = metrics
    .filter((m) => m.avgPercentile !== null && m.avgPercentile <= 40)
    .sort((a, b) => a.avgPercentile - b.avgPercentile)
    .slice(0, 2)
    .map((m) => ({ label: m.label, avgPercentile: m.avgPercentile, advice: m.advice }));

  const topHeroes = (Array.isArray(heroes) ? heroes : [])
    .slice(0, 5)
    .map((h) => ({
      heroId: h.hero_id,
      heroName: heroNameById(Number(h.hero_id)),
      games: h.games ?? 0,
      win: h.win ?? 0,
      winRate: h.games ? Math.round((h.win / h.games) * 100) : 0
    }));

  const generatedAt = new Date().toISOString();
  const winRate = Math.round((wins / matches.length) * 100);
  const latestMatchId = matches[0]?.match_id ?? null;
  const metricSnapshot = Object.fromEntries(metrics.map((m) => [m.key, m.avgPercentile]));

  // Compare against the most recent earlier snapshot (a genuinely different set of games).
  const allHistory = readHistory();
  const entries = allHistory[String(accountId)] ?? [];
  const prev = [...entries].reverse().find((e) => e.latestMatchId !== latestMatchId) ?? null;
  const trend = prev
    ? {
      previousAt: prev.generatedAt,
      previousFocus: prev.focus ?? [],
      winRateDelta: winRate - (prev.winRate ?? winRate),
      deltas: Object.fromEntries(metrics.map((m) => {
        const before = prev.metrics?.[m.key];
        const after = m.avgPercentile;
        return [m.key, before == null || after == null ? null : after - before];
      }))
    }
    : null;

  // Record a new snapshot only when the most recent game changed, so re-analysing isn't noise.
  const last = entries[entries.length - 1];
  if (!last || last.latestMatchId !== latestMatchId) {
    const updated = [...entries, { generatedAt, latestMatchId, winRate, metrics: metricSnapshot, focus: focus.map((f) => f.label) }].slice(-12);
    writeHistory({ ...readHistory(), [String(accountId)]: updated });
  }

  return {
    accountId: String(accountId),
    personaName: profile?.profile?.personaname ?? null,
    rankTier: profile?.rank_tier ?? null,
    lifetime: { win: wl.win ?? 0, lose: wl.lose ?? 0 },
    recent: { count: matches.length, wins, losses: matches.length - wins, winRate },
    metrics,
    focus,
    topHeroes,
    trend,
    patch: currentPatch(),
    generatedAt
  };
}

// On-demand with a short cache so reopening the panel doesn't re-hit the API every time.
async function getPlayerProfile(accountId, { force = false } = {}) {
  const key = String(accountId);
  const cache = readCache();
  const existing = cache[key];
  if (!force && existing?.generatedAt && Date.now() - new Date(existing.generatedAt).getTime() < TTL_MS) {
    return existing;
  }
  const profile = await fetchPlayerProfile(accountId);
  writeCache({ ...readCache(), [key]: profile });
  return profile;
}

function getCachedProfile(accountId) {
  return readCache()[String(accountId)] ?? null;
}

module.exports = { fetchPlayerProfile, getPlayerProfile, getCachedProfile };
