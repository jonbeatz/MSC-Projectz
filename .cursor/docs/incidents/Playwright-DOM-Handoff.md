# Playwright DOM handoff (MCP-style, repo-local)

Date: 2026-04-29  
Purpose: Give Cursor a **structured snapshot** of the Brave page (links, images, accessibility tree) **without** relying on a separate `Playwrightfix/` snapshot folder.

## What replaced the old `Playwrightfix/.playwright-mcp/` dumps

| Old (`Playwrightfix`)                          | New (this repo)                                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Ad-hoc `page-*.yml` from Cursor Playwright MCP | `npm run playwright:dump-dom` → **`Playwright-Tests/dom-handoff-latest.json`**                         |
| Huge `console-*.log`                           | Not replicated here — use **DevTools** or **Cursor Playwright MCP** when you need full console streams |

## Recommended flow

1. **Start CDP Brave** (dedicated profile, port 9223): `npm run playwright:open`
2. Log in / navigate in that window as needed.
3. **Dump DOM** into the repo (agent can `@` the JSON):
   ```bash
   npm run playwright:dump-dom
   ```
   Optional path (relative to `MSC_BASE_URL`):
   ```bash
   npm run playwright:dump-dom -- /clients
   ```
4. In chat: attach or reference **`Playwright-Tests/dom-handoff-latest.json`**.

## Outputs

- **`Playwright-Tests/dom-handoff-latest.json`** — overwritten each run (primary handoff file).
- **`Playwright-Tests/dom-handoff-<timestamp>.json`** — history copy.

Fields include `url`, `title`, `links[]`, `images[]`, and Playwright **`accessibility`** snapshot (similar role to MCP YAML trees for structure).

## With `playwright:test` only (no `playwright:open`)

If **`session.json`** does not exist, `dump-dom` tries a **fresh** `launchPersistentContext`. That **fails** if **`playwright:test`** already holds the profile lock. Prefer **`playwright:open`** + dump, or stop the assist harness first.

## Optional: real MCP YAML / console

Cursor **Playwright MCP** can still export richer artifacts; save them under **`Playwright-Tests/`** if you want them versioned locally — there is no separate `Playwrightfix/` requirement.
