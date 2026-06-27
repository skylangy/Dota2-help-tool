// Per-hero performance benchmarks from OpenDota (public data).
//
// Replaces crude static thresholds in post-match review with hero-aware percentiles, so a
// support's normally-low GPM is no longer flagged while a core with genuinely low farm is.
// Lazy per-hero fetch, disk-cached, silent fallback when offline.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { userAgent } = require("./version.cjs");
const { currentPatch } = require("./public-data.cjs");

const SOURCE = (heroId) => `https://api.opendota.com/api/benchmarks?hero_id=${heroId}`;
const TTL_MS = 14 * 24 * 60 * 60 * 1000;
const PARSE_VERSION = 1;

function cacheDir() {
  const appData = process.env.APPDATA || path.join(os.homedir(), ".config");
  return path.join(appData, "Dota2HelpTool");
}
function cacheFile() {
  return path.join(cacheDir(), "benchmarks-cache.json");
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

// Returns the approximate percentile (0-1) where `value` falls for a hero metric, or null
// if no benchmark is cached. Below the lowest bucket is treated as bottom (0).
function getPercentile(heroId, metric, value) {
  if (heroId == null || !Number.isFinite(value)) return null;
  const entry = readCache()[String(heroId)];
  const buckets = entry?.result?.[metric];
  if (!Array.isArray(buckets) || buckets.length === 0) return null;
  let pct = null;
  for (const b of buckets) {
    if (value >= Number(b.value)) pct = Number(b.percentile);
  }
  return pct === null ? 0 : pct;
}

async function ensureHeroBenchmarks(heroId) {
  if (heroId == null) return null;
  const key = String(heroId);
  const existing = readCache()[key];
  const patch = currentPatch();
  if (existing?.fetchedAt && existing.version === PARSE_VERSION && existing.patch === patch && Date.now() - existing.fetchedAt < TTL_MS) {
    return existing.result;
  }
  let raw;
  try {
    const res = await fetch(SOURCE(heroId), { headers: { "User-Agent": userAgent }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return existing?.result ?? null;
    raw = await res.json();
  } catch {
    return existing?.result ?? null;
  }
  const result = raw?.result;
  if (!result || typeof result !== "object") return existing?.result ?? null;
  writeCache({ ...readCache(), [key]: { fetchedAt: Date.now(), version: PARSE_VERSION, patch, result } });
  return result;
}

module.exports = { ensureHeroBenchmarks, getPercentile };
