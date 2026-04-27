const { createServer } = require("http")
const { parse } = require("url")
const fs = require("fs")
const path = require("path")
const next = require("next")

/**
 * Custom Node server (used on cPanel / Spaceship with Application Manager).
 *
 * - Local: prefer `npm run dev` (Next dev server). Do not use this file unless you mirror production.
 * - Production: set NODE_ENV=production in the host UI, run `npm run build` before start, then `node server.js`.
 *
 * `dev` must follow NODE_ENV: hardcoding `dev = false` breaks local runs of `node server.js` without a build
 * (every `/_next/static/chunks/*` request can return 500).
 */
const dev = process.env.NODE_ENV !== "production"
const hostname = process.env.HOST || "0.0.0.0"
const port = Number(process.env.PORT) || 3000

if (!dev) {
  const buildIdPath = path.join(__dirname, ".next", "BUILD_ID")
  if (!fs.existsSync(buildIdPath)) {
    console.error(
      "[server] No production build at .next/BUILD_ID. Run `npm run build`, set NODE_ENV=production, then start.",
    )
    process.exit(1)
  }
}

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error("Error occurred handling", req.url, err)
      res.statusCode = 500
      res.end("internal server error")
    }
  })
  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port} (dev=${dev})`)
  })
})
