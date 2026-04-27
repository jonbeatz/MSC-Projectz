# MSC-Users (personal dev reference)

Working notes for local/test logins and roles while building MSC-Projectz. **Treat as sensitive** — do not use production secrets here, and keep this out of public repos if it holds real credentials.

---

## JonBeatz (Master Admin)

| Field    | Value              |
| -------- | ------------------ |
| Username | `JonBeatz`         |
| Email    | `jonbeatz@gmail.com` |
| Password | `Dracula22!`       |

_In Payload the role is a single value; use **master-admin** (includes all admin-level access in this app)._

---

## JonBeatz822 (User)

| Field    | Value                 |
| -------- | --------------------- |
| Username | `JonBeatz822`         |
| Email    | `jonbeatz822@gmail.com` |
| Password | `Penguin22!`          |

---

## MSC-Admin (Admin)

| Field    | Value                        |
| -------- | ---------------------------- |
| Username | `MSC-Admin`                  |
| Email    | `createmystudiochannel@gmail.com` |
| Password | `mscProjectz22!`             |

---

## TNyse (Admin)

| Field    | Value           |
| -------- | --------------- |
| Username | `TNyse`         |
| Email    | `bigtee@gmail.com` |
| Password | `tNizzle2026!`  |

---

## Quick role map

| Account     | App role(s)   |
| ----------- | ------------- |
| JonBeatz    | Master admin  |
| JonBeatz822 | User          |
| MSC-Admin   | Admin         |
| TNyse       | Admin         |

## Local audit / test users (`@msc.local`)

Users like `gate-user-a@msc.local` are **not** the dev trust-bypass; they are optional SQLite fixtures for verification or access tests. If they show up under **Settings → Users** and you want them gone, run from repo root: **`npm run db:prune-gate-users`** (see `Agent-Runbook.md` and `FlightPro.md`). **Removed from DB:** 2026-04-27 (ids were local-only).
