const packageJson = require("../package.json");

const appVersion = packageJson.version ?? "0.0.0";
const userAgent = `Dota2HelpTool/${appVersion}`;

module.exports = {
  appVersion,
  userAgent
};
