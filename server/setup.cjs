const fs = require("node:fs");
const path = require("node:path");

const CONFIG_FILE = "gamestate_integration_dota2_help_tool.cfg";
const TEMPLATE_PATH = path.resolve(__dirname, "..", "config", CONFIG_FILE);

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function existingDirectory(value) {
  return value && fs.existsSync(value) && fs.statSync(value).isDirectory();
}

function parseSteamLibraries(steamPath) {
  const vdfPath = path.join(steamPath, "steamapps", "libraryfolders.vdf");
  if (!fs.existsSync(vdfPath)) return [];

  const text = fs.readFileSync(vdfPath, "utf8");
  const matches = [...text.matchAll(/"path"\s+"([^"]+)"/g)];
  return matches.map((match) => match[1].replaceAll("\\\\", "\\"));
}

function commonSteamRoots() {
  const candidates = [
    process.env.STEAM_PATH,
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, "Steam"),
    process.env["ProgramFiles(x86)"] && path.join(process.env["ProgramFiles(x86)"], "Steam"),
    "C:\\Program Files\\Steam",
    "C:\\Program Files (x86)\\Steam"
  ];

  return unique(candidates).filter(existingDirectory);
}

function findLibraryRoots() {
  const steamRoots = commonSteamRoots();
  const libraries = steamRoots.flatMap((steamRoot) => [steamRoot, ...parseSteamLibraries(steamRoot)]);
  return unique(libraries).filter(existingDirectory);
}

function getDotaConfigDir(libraryRoot) {
  return path.join(
    libraryRoot,
    "steamapps",
    "common",
    "dota 2 beta",
    "game",
    "dota",
    "cfg",
    "gamestate_integration"
  );
}

function scanSetup() {
  const libraries = findLibraryRoots();
  const dotaConfigDirs = libraries
    .map(getDotaConfigDir)
    .filter((dir) => fs.existsSync(path.dirname(dir)));

  const installedTargets = dotaConfigDirs
    .map((dir) => path.join(dir, CONFIG_FILE))
    .filter((file) => fs.existsSync(file));

  return {
    configFile: CONFIG_FILE,
    endpoint: "http://127.0.0.1:3008/gsi",
    templatePath: TEMPLATE_PATH,
    steamLibraries: libraries,
    dotaConfigDirs,
    installed: installedTargets.length > 0,
    installedTargets
  };
}

function installConfig() {
  const status = scanSetup();
  if (status.dotaConfigDirs.length === 0) {
    const error = new Error("没有找到 Dota 2 配置目录，请确认已经安装 Dota 2。");
    error.code = "DOTA_CONFIG_NOT_FOUND";
    throw error;
  }

  const written = [];
  for (const dir of status.dotaConfigDirs) {
    fs.mkdirSync(dir, { recursive: true });
    const target = path.join(dir, CONFIG_FILE);
    fs.copyFileSync(TEMPLATE_PATH, target);
    written.push(target);
  }

  return {
    ...scanSetup(),
    written
  };
}

module.exports = {
  installConfig,
  scanSetup
};
