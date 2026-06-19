const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const SOURCES = {
  heroes: "https://api.opendota.com/api/constants/heroes",
  items: "https://api.opendota.com/api/constants/items"
};

function getCacheDir() {
  const appData = process.env.APPDATA || path.join(os.homedir(), ".config");
  return path.join(appData, "Dota2HelpTool");
}

function getCacheFile() {
  return path.join(getCacheDir(), "public-data-cache.json");
}

function readCache() {
  const file = getCacheFile();
  if (!fs.existsSync(file)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeCache(payload) {
  fs.mkdirSync(getCacheDir(), { recursive: true });
  fs.writeFileSync(getCacheFile(), JSON.stringify(payload, null, 2), "utf8");
}

function summarizePayload(heroes, items) {
  const heroList = Object.values(heroes).map((hero) => ({
    id: hero.id,
    name: hero.name,
    localizedName: hero.localized_name,
    roles: hero.roles ?? [],
    attackType: hero.attack_type,
    primaryAttr: hero.primary_attr
  }));

  const itemList = Object.entries(items)
    .filter(([, item]) => item?.dname && Number(item.cost ?? 0) >= 0)
    .map(([key, item]) => ({
      key,
      id: item.id,
      name: item.dname,
      cost: item.cost ?? 0,
      behavior: item.behavior ?? null,
      created: Boolean(item.created),
      tier: item.tier ?? null
    }));

  return {
    generatedAt: new Date().toISOString(),
    sources: SOURCES,
    heroCount: heroList.length,
    itemCount: itemList.length,
    heroes: heroList,
    items: itemList
  };
}

function cacheStatus() {
  const cache = readCache();
  return {
    cacheFile: getCacheFile(),
    hasCache: Boolean(cache),
    generatedAt: cache?.generatedAt ?? null,
    heroCount: cache?.heroCount ?? 0,
    itemCount: cache?.itemCount ?? 0,
    sources: SOURCES
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Dota2HelpTool/0.2.0"
    }
  });

  if (!response.ok) {
    throw new Error(`OpenDota request failed: ${response.status}`);
  }

  return response.json();
}

async function syncPublicData() {
  const [heroes, items] = await Promise.all([
    fetchJson(SOURCES.heroes),
    fetchJson(SOURCES.items)
  ]);
  const payload = summarizePayload(heroes, items);
  writeCache(payload);
  return cacheStatus();
}

function publicDataSummary() {
  const cache = readCache();
  if (!cache) return cacheStatus();

  return {
    ...cacheStatus(),
    sampleHeroes: cache.heroes.slice(0, 8),
    sampleItems: cache.items.slice(0, 8)
  };
}

function getHeroProfile(heroId) {
  const cache = readCache();
  if (!cache || !heroId) return null;
  return cache.heroes.find((hero) => hero.name === heroId) ?? null;
}

module.exports = {
  cacheStatus,
  getHeroProfile,
  publicDataSummary,
  syncPublicData
};
