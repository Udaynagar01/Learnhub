/**
 * Ensures local persistent MongoDB is running before the API starts.
 * Data is stored in data/mongo-data so user accounts survive restarts.
 */
import { spawn } from 'child_process';
import net from 'net';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = path.join(root, 'data', 'mongo-data');
const port = Number(process.env.MONGO_PORT || 27017);

const mongodCandidates = [
  'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe',
  'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
  'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
  '/usr/bin/mongod',
  '/usr/local/bin/mongod',
  '/opt/homebrew/bin/mongod',
];

function findMongod() {
  if (process.env.MONGOD_PATH && existsSync(process.env.MONGOD_PATH)) {
    return process.env.MONGOD_PATH;
  }
  return mongodCandidates.find((candidate) => existsSync(candidate)) || null;
}

function isPortOpen(targetPort) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port: targetPort });
    socket.setTimeout(800);
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(false));
  });
}

function waitForMongo(targetPort, attempts = 30) {
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < attempts; i += 1) {
      if (await isPortOpen(targetPort)) {
        resolve();
        return;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    reject(new Error(`MongoDB did not start on port ${targetPort}`));
  });
}

async function main() {
  if (await isPortOpen(port)) {
    console.log(`[LearnHub] MongoDB already running on port ${port}`);
    return;
  }

  const mongod = findMongod();
  if (!mongod) {
    console.error('[LearnHub] mongod not found. Install MongoDB or set MONGOD_PATH in your environment.');
    console.error('[LearnHub] Accounts need persistent MongoDB — in-memory mode is disabled by default.');
    process.exit(1);
  }

  mkdirSync(dbPath, { recursive: true });
  console.log(`[LearnHub] Starting persistent MongoDB → ${dbPath}`);

  const child = spawn(mongod, ['--dbpath', dbPath, '--port', String(port)], {
    detached: true,
    stdio: 'ignore',
    shell: false,
  });
  child.unref();

  await waitForMongo(port);
  console.log(`[LearnHub] MongoDB ready on port ${port} (accounts will be saved permanently)`);
}

main().catch((err) => {
  console.error(`[LearnHub] ${err.message}`);
  process.exit(1);
});
