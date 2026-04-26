const { execSync } = require("child_process");

const portArg = process.argv[2] || process.env.PORT || "3000";
const port = String(portArg).trim();

const run = (cmd) => execSync(cmd, { stdio: "pipe" }).toString();

const killPortWindows = () => {
  const output = run(`netstat -ano | findstr :${port}`);
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.includes("LISTENING"));

  const pids = [...new Set(lines.map((line) => line.split(/\s+/).pop()).filter(Boolean))];

  pids.forEach((pid) => {
    if (pid !== String(process.pid)) {
      run(`taskkill /F /PID ${pid}`);
      console.log(`Killed process ${pid} on port ${port}`);
    }
  });

  if (pids.length === 0) {
    console.log(`No listening process found on port ${port}`);
  }
};

const killPortUnix = () => {
  const output = run(`lsof -ti tcp:${port}`);
  const pids = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((pid) => pid !== String(process.pid));

  if (pids.length > 0) {
    run(`kill -9 ${pids.join(" ")}`);
    console.log(`Killed process(es) ${pids.join(", ")} on port ${port}`);
  } else {
    console.log(`No listening process found on port ${port}`);
  }
};

try {
  if (process.platform === "win32") {
    killPortWindows();
  } else {
    killPortUnix();
  }
} catch (_) {
  console.log(`No listening process found on port ${port}`);
}
