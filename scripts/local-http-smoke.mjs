/**
 * Quick HTTP smoke for local Next dev (default port 3000).
 * Exits 0 if all checks pass, 1 otherwise.
 * Usage: node scripts/local-http-smoke.mjs [port]
 */
import http from 'node:http'

const port = String(process.argv[2] ?? '3000').trim()
const host = '127.0.0.1'
const paths = ['/', '/admin', '/settings', '/calendar', '/tasks', '/dashboard']

function get(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      res.resume()
      resolve({ status: res.statusCode, url })
    })
    req.on('error', reject)
    req.setTimeout(20_000, () => {
      req.destroy()
      reject(new Error(`timeout ${url}`))
    })
  })
}

let failed = false
for (const p of paths) {
  const url = `http://${host}:${port}${p}`
  try {
    const { status } = await get(url)
    const ok = status != null && status >= 200 && status < 400
    if (!ok) {
      console.error(`FAIL ${status} ${url}`)
      failed = true
    } else {
      console.log(`ok ${status} ${url}`)
    }
  } catch (e) {
    console.error(`FAIL ${url}`, e?.message || e)
    failed = true
  }
}

process.exit(failed ? 1 : 0)
