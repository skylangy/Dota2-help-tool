// Data-driven item builds from OpenDota's public per-hero item popularity.
//
// This adds NO new capability beyond the public OpenDota data the app already uses (constants,
// match review). It is lazy (fetched only for the hero you are actually playing), cached to disk,
// and falls back silently to the built-in generic rules when offline or unavailable.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { getPublicDataCache } = require("./public-data.cjs");
const { userAgent } = require("./version.cjs");

const SOURCE = (heroId) => `https://api.opendota.com/api/heroes/${heroId}/itemPopularity`;
const TTL_MS = 14 * 24 * 60 * 60 * 1000; // refetch a hero at most ~biweekly
const TOP_PER_PHASE = 5;
// Bump when the parse logic changes so stale cache entries are re-fetched/re-parsed.
const PARSE_VERSION = 2;

// Consumables, wards, couriers, TPs — not part of a "what core item to build next" plan.
const SKIP_KEYS = new Set([
  "tango", "flask", "clarity", "faerie_fire", "enchanted_mango", "tpscroll", "ward_observer",
  "ward_sentry", "ward_dispenser", "dust", "smoke_of_deceit", "bottle", "cheese",
  "tome_of_knowledge", "courier", "boots", "magic_stick"
]);

function cacheDir() {
  const appData = process.env.APPDATA || path.join(os.homedir(), ".config");
  return path.join(appData, "Dota2HelpTool");
}
function cacheFile() {
  return path.join(cacheDir(), "item-popularity-cache.json");
}

let memo = { mtimeMs: null, data: null };
function readCache() {
  const file = cacheFile();
  let stat = null;
  try {
    stat = fs.statSync(file);
  } catch {
    return {};
  }
  if (memo.data && memo.mtimeMs === stat.mtimeMs) {
    return memo.data;
  }
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    memo = { mtimeMs: stat.mtimeMs, data };
    return data;
  } catch {
    return {};
  }
}
function writeCache(data) {
  fs.mkdirSync(cacheDir(), { recursive: true });
  fs.writeFileSync(cacheFile(), JSON.stringify(data, null, 2), "utf8");
  memo = { mtimeMs: null, data: null };
}

function lookups() {
  const cache = getPublicDataCache();
  const heroIdByName = new Map((cache?.heroes ?? []).map((h) => [h.name, h.id]));
  const keyByItemId = new Map((cache?.items ?? []).map((it) => [it.id, it.key]));
  // Only "assembled" items (those built from components) are meaningful build targets; this
  // drops raw components like blade_of_alacrity / ogre_axe / relic that dominate raw purchase
  // counts but aren't what a beginner should be told to "build next".
  const buildTargets = new Set(
    (cache?.items ?? [])
      .filter((it) => Array.isArray(it.components) && it.components.length > 0)
      .map((it) => it.key)
  );
  return { heroIdByName, keyByItemId, buildTargets };
}

function topItems(group, lk, limit) {
  const seen = new Set();
  return Object.entries(group ?? {})
    .map(([id, count]) => [Number(id), Number(count)])
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => lk.keyByItemId.get(id))
    .filter((key) => key && lk.buildTargets.has(key) && !SKIP_KEYS.has(key) && !key.startsWith("recipe"))
    .map((key) => `item_${key}`)
    .filter((id) => (seen.has(id) ? false : seen.add(id)))
    .slice(0, limit);
}

function parseBuild(raw, lk) {
  return {
    name: "主线出装（数据驱动）",
    lane: topItems(raw.early_game_items, lk, TOP_PER_PHASE),
    core: topItems(raw.mid_game_items, lk, TOP_PER_PHASE),
    late: topItems(raw.late_game_items, lk, TOP_PER_PHASE),
    situational: {},
    source: "opendota_item_popularity"
  };
}

// Synchronous read for the recommender (cached on disk, memoized in memory).
function getHeroBuild(heroName) {
  if (!heroName) return null;
  const entry = readCache()[heroName];
  return entry?.build ?? null;
}

// Async fetch+cache, triggered when a hero is first seen. Safe to call repeatedly.
async function ensureHeroBuild(heroName) {
  if (!heroName) return null;
  const lk = lookups();
  const heroId = lk.heroIdByName.get(heroName);
  if (!heroId) return null;

  const cache = readCache();
  const existing = cache[heroName];
  if (existing?.fetchedAt && existing.version === PARSE_VERSION && Date.now() - existing.fetchedAt < TTL_MS) {
    return existing.build;
  }

  let raw;
  try {
    const res = await fetch(SOURCE(heroId), { headers: { "User-Agent": userAgent } });
    if (!res.ok) return existing?.build ?? null;
    raw = await res.json();
  } catch {
    return existing?.build ?? null;
  }

  const build = parseBuild(raw, lk);
  if ((build.core?.length ?? 0) === 0 && (build.late?.length ?? 0) === 0) {
    return existing?.build ?? null; // nothing usable; keep falling back to generic rules
  }
  writeCache({ ...readCache(), [heroName]: { fetchedAt: Date.now(), version: PARSE_VERSION, build } });
  return build;
}

module.exports = { getHeroBuild, ensureHeroBuild };
