# Plan: Master admin = jonbeatz@gmail.com (stepwise, local first)

**Scope:** Work in **Cursor / local** only until you explicitly run a live cutover. **`NEXT_PUBLIC_SITE_URL`** stays **`http://127.0.0.1:3000`** in **`.env.local`** while developing.

## What already exists

- **Role:** `master-admin` controls user directory + roles (`lib/msc_vault_user_admin.ts`, `collections/MSC-Projectz-PayloadUsers.ts`).
- **Doc reference:** `.cursor/docs/MSC-Users.md` already lists **JonBeatz** → `jonbeatz@gmail.com` as master admin (passwords redacted).
- **Rescue script:** `scripts/msc_rescue_admin.ts` targets `jonbeatz@gmail.com` but currently embeds a **plaintext password** — we should **not** keep real passwords in Git; move to env or operator-only secret (Phase 3).
- **SMTP:** Verification/welcome use `MSC_STUDIO_OUTGOING_*` (see `FlightPro.md` §4.1). **Sending** mail is separate from **which account is master admin**.

## Phases (stop between phases for your OK)

### Phase 1 — Confirm master-admin identity (local SQLite)

1. Check current user rows (email, role, `isVerified`) — Payload admin or read-only script suggestion.
2. Ensure **exactly one** canonical master path: `jonbeatz@gmail.com` → `role: master-admin`.
3. Ensure you can sign in locally at **`http://127.0.0.1:3000`** with that email (password you choose); align **`isVerified`** so trust gate does not block unnecessarily.
4. **No live server changes.**

### Phase 2 — Mail you control (still local)

1. Fill **`MSC_STUDIO_OUTGOING_*`** in **`.env.local`** so the app can **send** mail (Spacemail or another SMTP you approve).
2. Confirm verification/resend links use **`NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000`** during dev.
3. **Later live:** flip `NEXT_PUBLIC_SITE_URL` to `https://jon-beatz.com` **only** on the host (not in committed files).

### Phase 3 — Ops / security hardening (recommended before any push)

1. Refactor **`db:rescue-admin`** to read email/password from **env** (never commit real passwords).
2. Optional: add **`MSC_OPS_NOTIFY_EMAIL`** (or similar) **only if** you want automated “notify master” emails for future events — **not** required for “I am the master admin” account setup.

### Phase 4 — Deploy (when you say go)

1. `verify:next` → `pushitlive` → your clean install on **Live (cPanel)** per `FlightPro.md`.

---

## Open questions (answer when ready; we implement after)

1. **“Admin messages” + “approvals”:** Do you mean **(A)** signing in as master admin and approving things **inside the app** (Settings, users, etc.), **(B)** receiving **email copies** at `jonbeatz@gmail.com` when something happens (new signup, etc.), or **(C)** both? _(Today there is no built-in “email master on every admin event” unless we add it.)_
2. **Password:** Will you set/change password only via normal login + profile / Payload admin, or do you still need **`npm run db:rescue-admin`** for emergencies?
3. **Sending mail FROM:** Use **Spaceship/Spacemail** (current docs) or **Gmail SMTP** for app-sent mail? (Inbox can stay `jonbeatz@gmail.com` either way; **From** domain affects deliverability.)

---

## Operator intent (2026 sync)

- **Master account:** `jonbeatz@gmail.com` (no manual “approve each signup” in admin).
- **New signup:** User enters info → **email proves address** → they get access (trust gate clears). Normal password change later if they want.
- **Master heads-up:** Simple **“new account created”** email to the master address when someone self-registers (not a gate you must click through).
- **Invite:** From **Settings**, send someone an **invite** with a **login URL**; they **verify email** and then have access — keep it simple.

## Current app behavior (code review)

| Step                               | What happens today                                                                                                                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Self signup                        | `/auth/register` → `msc_registerUser` creates Payload `users` row: `role: user`, **`isVerified: false`**, stores **hashed** token, sends **one email** with a **verification link** only (`/auth/verify?token=...`). **No numeric code** to type in the UI. |
| After signup                       | User sees “check your email”. Trust **middleware** keeps unverified sessions on **`/auth/verify-reminder`** until verified.                                                                                                                                 |
| Verify                             | User **clicks the link** → `/auth/verify` runs `msc_verifyEmailAction` → sets **`isVerified: true`**, clears token → redirect to sign in.                                                                                                                   |
| Welcome                            | Second optional email (`msc_sendWelcomeEmail`) if SMTP is configured.                                                                                                                                                                                       |
| **Admin “new account” email**      | **Not implemented** — nothing emails `jonbeatz@gmail.com` on registration.                                                                                                                                                                                  |
| **Settings → Create server user**  | **`msc_createPayloadUserAsAdmin`** creates a real user with password; **does not** send verification email or invite link. Default **`isVerified`** is false unless changed elsewhere → invitee may still hit verify-reminder with no email sent.           |
| **“Invite New User” in old modal** | **`user-management-modal`** / Zustand **`inviteUser`** only mutates **client fake state** — **not** Payload, **not** email. Do not rely on it.                                                                                                              |

## Gaps vs your desired flow

1. **Notify master on self-signup:** _Deferred / not requested._ Optional later: env **`MSC_MASTER_NOTIFY_EMAIL`** after `msc_registerUser`.
2. **Invite from Settings:** **Done (2026-04-29).** `msc_invitePayloadUserAsMaster` + **Invite by email** tab in `MSC-Projectz-CreateUserForm` and `MSC-Projectz-PayloadUsersPanel`. One email: verify link + temp password + sign-in URL. Playbook: **`.cursor/docs/EmailSetUp.md`**.
3. **Optional “enter code”:** _Not planned_ — link-only verify is enough.
4. **Register form copy:** Still says “admin can grant access” on `/auth/register` — optional copy tweak later (access is email verification for self-serve).

## Decisions log

| Date       | Decision                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| (pending)  | Phases 1–4 signed off step by step                                                                                                         |
| 2026-04-29 | Operator: self-serve verify for access; master wants signup notification email; Settings invite + verify URL; keep password change normal. |
