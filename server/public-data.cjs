const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { userAgent } = require("./version.cjs");

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

let memoizedCache = {
  file: null,
  mtimeMs: null,
  payload: null
};

function readCache() {
  const file = getCacheFile();
  let stat = null;
  try {
    stat = fs.statSync(file);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    memoizedCache = { file, mtimeMs: null, payload: null };
    return null;
  }

  if (memoizedCache.file === file && memoizedCache.mtimeMs === stat.mtimeMs) {
    return memoizedCache.payload;
  }

  const payload = JSON.parse(fs.readFileSync(file, "utf8"));
  memoizedCache = {
    file,
    mtimeMs: stat.mtimeMs,
    payload
  };
  return payload;
}

function writeCache(payload) {
  fs.mkdirSync(getCacheDir(), { recursive: true });
  const file = getCacheFile();
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), "utf8");
  const stat = fs.statSync(file);
  memoizedCache = {
    file,
    mtimeMs: stat.mtimeMs,
    payload
  };
}

function summarizePayload(heroes, items) {
  const heroList = Object.values(heroes).map((hero) => ({
    id: hero.id,
    name: hero.name,
    localizedName: hero.localized_name,
    roles: hero.roles ?? [],
    attackType: hero.attack_type,
    primaryAttr: hero.primary_attr,
    img: hero.img ?? null,
    icon: hero.icon ?? null
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
      tier: item.tier ?? null,
      img: item.img ?? null
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

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchJson(url) {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent
      }
    });

    if (response.ok) {
      return response.json();
    }

    lastStatus = response.status;
    if (![429, 500, 502, 503, 520, 521, 522, 524].includes(response.status)) {
      break;
    }
    await wait(600 * (attempt + 1));
  }

  throw new Error(`OpenDota request failed: ${lastStatus}`);
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

function getItemProfile(itemId) {
  const cache = readCache();
  if (!cache || !itemId) return null;
  const normalized = itemId.replace(/^item_/, "");
  return cache.items.find((item) => item.key === normalized || `item_${item.key}` === itemId) ?? null;
}

function heroCatalog() {
  const cache = readCache();
  if (!cache) {
    return [];
  }

  return cache.heroes
    .map((hero) => ({
      id: hero.name,
      name: hero.localizedName,
      roles: hero.roles,
      attackType: hero.attackType,
      primaryAttr: hero.primaryAttr,
      img: hero.img,
      icon: hero.icon
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getPublicDataCache() {
  return readCache();
}

module.exports = {
  cacheStatus,
  getHeroProfile,
  getItemProfile,
  getPublicDataCache,
  heroCatalog,
  publicDataSummary,
  syncPublicData
};
