/**
 * Free LearnHub dev ports before starting (fixes "Port 5173 is already in use").
 * Used automatically via npm "predev" hook.
 */
import { execSync } from 'child_process';

const PORTS = [5000, 5173, 5174];

function getListeningPids(port) {
  if (process.platform === 'win32') {
    const out = execSync('netstat -ano', { encoding: 'utf8', windowsHide: true });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.trim().split(/\s+/);
      if (parts.length < 5) continue;
      const localAddress = parts[1];
      const pid = parts[parts.length - 1];
      const portMatch = localAddress?.match(/:(\d+)$/);
      if (!portMatch || Number(portMatch[1]) !== port) continue;
      if (/^\d+$/.test(pid) && pid !== '0') pids.add(pid);
    }
    return pids;
  }

  try {
    const out = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    return new Set(out.trim().split('\n').filter(Boolean));
  } catch {
    return new Set();
  }
}

function killPid(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore', windowsHide: true });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
    }
    return true;
  } catch {
    return false;
  }
}

const killed = [];

for (const port of PORTS) {
  for (const pid of getListeningPids(port)) {
    if (killPid(pid)) killed.push({ port, pid });
  }
}

if (killed.length) {
  console.log('[LearnHub] Cleared dev ports:');
  for (const { port, pid } of killed) {
    console.log(`  port ${port} (PID ${pid})`);
  }
}
