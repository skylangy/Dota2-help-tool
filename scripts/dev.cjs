const { spawn } = require("node:child_process");

const processes = [
  spawn("npm run dev:server", { stdio: "inherit", shell: true }),
  spawn("npm run dev:client", { stdio: "inherit", shell: true })
];

function shutdown() {
  for (const child of processes) {
    if (!child.killed) child.kill();
  }
}

for (const child of processes) {
  child.on("exit", (code) => {
    if (code && code !== 0) {
      shutdown();
      process.exit(code);
    }
  });
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});
