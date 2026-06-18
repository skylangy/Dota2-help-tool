const http = require("node:http");
const { spawn } = require("node:child_process");
const electronPath = require("electron");

const CLIENT_URL = "http://127.0.0.1:5173";

function waitForUrl(url, timeoutMs = 20000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });

      req.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(check, 350);
      });
    };

    check();
  });
}

const vite = spawn("npm run dev:client", {
  stdio: "inherit",
  shell: true
});

waitForUrl(CLIENT_URL)
  .then(() => {
    const electron = spawn(electronPath, ["."], {
      stdio: "inherit",
      env: {
        ...process.env,
        VITE_DEV_SERVER_URL: CLIENT_URL
      }
    });

    electron.on("exit", (code) => {
      vite.kill();
      process.exit(code ?? 0);
    });
  })
  .catch((error) => {
    console.error(error);
    vite.kill();
    process.exit(1);
  });
