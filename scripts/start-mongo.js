import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = path.join(root, 'data', 'mongo-data');
const candidates = [
  'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe',
  'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
  'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
];

const mongod = candidates.find((p) => existsSync(p));
if (!mongod) {
  console.error('mongod.exe not found. Install MongoDB or start the MongoDB service.');
  process.exit(1);
}

mkdirSync(dbPath, { recursive: true });
console.log(`Starting MongoDB → ${dbPath}`);

const child = spawn(mongod, ['--dbpath', dbPath, '--port', '27017'], {
  stdio: 'inherit',
  shell: false,
});

child.on('error', (err) => {
  console.error(err.message);
  process.exit(1);
});
