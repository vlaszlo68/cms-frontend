import { spawn } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(scriptDir);

let host = '127.0.0.1';
let timeoutSeconds = 20;
const extraViteArgs = [];

const args = process.argv.slice(2);

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];

  if (arg === '--host') {
    host = args[index + 1] ?? host;
    index += 1;
    continue;
  }

  if (arg.startsWith('--host=')) {
    host = arg.slice('--host='.length) || host;
    continue;
  }

  if (arg === '--timeout') {
    timeoutSeconds = Number(args[index + 1] ?? timeoutSeconds);
    index += 1;
    continue;
  }

  if (arg.startsWith('--timeout=')) {
    timeoutSeconds = Number(arg.slice('--timeout='.length) || timeoutSeconds);
    continue;
  }

  extraViteArgs.push(arg);
}

if (!Number.isFinite(timeoutSeconds) || timeoutSeconds < 1) {
  timeoutSeconds = 20;
}

const viteBin = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');

if (!existsSync(viteBin)) {
  console.error(`Vite binary was not found at ${viteBin}. Run npm install first.`);
  process.exit(1);
}

const logDir = path.join(tmpdir(), 'opencode');
mkdirSync(logDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outLog = path.join(logDir, `cms-frontend-vite-${timestamp}.out.log`);
const errLog = path.join(logDir, `cms-frontend-vite-${timestamp}.err.log`);

const outFd = openSync(outLog, 'a');
const errFd = openSync(errLog, 'a');

const child = spawn(process.execPath, [viteBin, '--host', host, ...extraViteArgs], {
  cwd: projectRoot,
  detached: true,
  stdio: ['ignore', outFd, errFd],
  windowsHide: true,
});

closeSync(outFd);
closeSync(errFd);

child.unref();

const stripAnsi = (value) => value.replace(/\u001b\[[0-9;]*m/g, '');

const readLogs = () => {
  let content = '';

  for (const logPath of [outLog, errLog]) {
    try {
      content += readFileSync(logPath, 'utf8');
    } catch {
      // The log file can be empty for the first few polling iterations.
    }
  }

  return stripAnsi(content);
};

const isRunning = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const wait = (milliseconds) => new Promise((resolve) => {
  setTimeout(resolve, milliseconds);
});

const flushStream = (stream) => new Promise((resolve) => {
  if (stream.destroyed || stream.writableLength === 0) {
    resolve();
    return;
  }

  stream.write('', resolve);
});

const exitAfterOutput = async (code) => {
  await Promise.all([flushStream(process.stdout), flushStream(process.stderr)]);
  process.exit(code);
};

let localUrl = null;
const deadline = Date.now() + timeoutSeconds * 1000;

while (Date.now() < deadline) {
  const match = readLogs().match(/Local:\s+(http:\/\/\S+)/);

  if (match) {
    localUrl = match[1];
    break;
  }

  if (!isRunning(child.pid)) {
    console.error('CMS frontend dev server exited before startup completed.');
    console.error(`Output log: ${outLog}`);
    console.error(`Error log: ${errLog}`);
    process.exit(1);
  }

  await wait(250);
}

console.log('CMS frontend dev server started.');
console.log(`PID: ${child.pid}`);

if (localUrl) {
  console.log(`URL: ${localUrl}`);
} else {
  console.log(`Startup URL was not detected within ${timeoutSeconds} seconds, but the process is still running.`);
}

console.log(`Output log: ${outLog}`);
console.log(`Error log: ${errLog}`);
console.log(`Stop command: Stop-Process -Id ${child.pid}`);

await exitAfterOutput(0);
