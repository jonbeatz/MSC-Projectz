# MSC-Users (redacted local reference)

Local/test account labels for role mapping only. Passwords are intentionally not stored in docs. Keep real credentials in local secret storage only.

---

## JonBeatz (Master Admin)

| Field    | Value                |
| -------- | -------------------- |
| Username | `JonBeatz`           |
| Email    | `jonbeatz@gmail.com` |
| Password | `[REDACTED]`         |

_In Payload the role is a single value; use **master-admin** (includes all admin-level access in this app)._

---

## JonBeatz822 (User)

| Field    | Value                   |
| -------- | ----------------------- |
| Username | `JonBeatz822`           |
| Email    | `jonbeatz822@gmail.com` |
| Password | `[REDACTED]`            |

---

## MSC-Admin (Admin)

| Field    | Value                             |
| -------- | --------------------------------- |
| Username | `MSC-Admin`                       |
| Email    | `createmystudiochannel@gmail.com` |
| Password | `[REDACTED]`                      |

---

## TNyse (Admin)

| Field    | Value              |
| -------- | ------------------ |
| Username | `TNyse`            |
| Email    | `bigtee@gmail.com` |
| Password | `[REDACTED]`       |

---

## Quick role map

| Account     | App role(s)  |
| ----------- | ------------ |
| JonBeatz    | Master admin |
| JonBeatz822 | User         |
| MSC-Admin   | Admin        |
| TNyse       | Admin        |

## Local audit / test users (`@msc.local`)

Users like `gate-user-a@msc.local` are **not** the dev trust-bypass; they are optional SQLite fixtures for verification or access tests. If they show up under **Settings → Users** and you want them gone, run from repo root: **`npm run db:prune-gate-users`** (see `Agent-Runbook.md` and `FlightPro.md`). **Removed from DB:** 2026-04-27 (ids were local-only).
