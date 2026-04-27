/**
 * Free the local dev port (default 3000) on Windows by killing the listening PID(s).
 * Usage: node scripts/kill-dev-port.mjs [port]
 */
import { execSync } from 'node:child_process'

const port = String(process.argv[2] ?? process.env.DEV_PORT ?? '3000').trim()
if (!/^\d+$/.test(port)) {
  console.error('Usage: node scripts/kill-dev-port.mjs [port]')
  process.exit(1)
}

let out = ''
try {
  out = execSync('netstat -ano', { encoding: 'utf8' })
} catch {
  process.exit(0)
}

const pids = new Set()
for (const line of out.split('\n')) {
  if (!line.includes('LISTENING')) continue
  if (!line.includes(`:${port}`)) continue
  const parts = line.trim().split(/\s+/)
  const last = parts[parts.length - 1]
  if (/^\d+$/.test(last)) pids.add(last)
}

for (const pid of pids) {
  try {
    execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
  } catch {
    /* ignore */
  }
}
