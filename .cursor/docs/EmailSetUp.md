# Email & verification setup (portable playbook)

Use this doc when **reusing this workflow** on a new Next.js + Payload project or a fresh MSC deploy. It mirrors what MSC-Projectz does today; adjust product names and routes as needed.

## Goals

1. **Self-signup:** User registers → receives **one email** with a **verification link** (no typed OTP required) → clicks link → `isVerified` → can use the app (trust middleware).
2. **Master-admin invite:** Admin enters email (+ optional username, role) → server creates user, sends **one email** with **verify link + temporary password** → invitee verifies, then signs in at `/auth` and changes password in Profile.
3. **Same stack for all outbound mail:** [Nodemailer](https://nodemailer.com/) + env-driven SMTP (no WordPress plugin coupling).

## Environment variables

| Variable                   | Purpose                                                                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`     | **Must** match the origin users open in the browser. Local: `http://127.0.0.1:3000`. Production: `https://jon-beatz.com`. Verification links are built from this. |
| `MSC_STUDIO_OUTGOING_HOST` | SMTP host (e.g. Spaceship `mail.spacemail.com`).                                                                                                                  |
| `MSC_STUDIO_OUTGOING_PORT` | Usually `465` (SSL).                                                                                                                                              |
| `MSC_STUDIO_OUTGOING_SSL`  | `true` for implicit TLS on 465.                                                                                                                                   |
| `MSC_STUDIO_OUTGOING_USER` | Mailbox login (often full email).                                                                                                                                 |
| `MSC_STUDIO_OUTGOING_PASS` | App password or mailbox password (never commit).                                                                                                                  |
| `MSC_STUDIO_OUTGOING_FROM` | Optional **From** header override (see `lib/msc_smtp_nodemailer.ts`).                                                                                             |

**Local:** `.env.local` (gitignored). **Production:** cPanel Node.js Application Manager → Environment Variables (not only a checked-in `.env`).

Canonical deploy notes: **`FlightPro.md`** §4 and §4.1.

## Code touchpoints (MSC-Projectz)

| Concern                         | Location                                                                                                                                                                                                                                                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registration                    | `lib/msc_auth_actions.ts` → `msc_registerUser`                                                                                                                                                                                                                                                                                   |
| Invite (master)                 | `lib/msc_vault_user_admin.ts` → `msc_invitePayloadUserAsMaster`                                                                                                                                                                                                                                                                  |
| Admin create w/ password        | `msc_createPayloadUserAsAdmin` (sets `isVerified: true`, no email)                                                                                                                                                                                                                                                               |
| Send verification / invite body | `lib/msc_auth_verification.ts` → `msc_sendVerificationEmail` (multipart **HTML + text** from `lib/msc_verification_email_template.ts` — dark studio card + **`msc-ui-accent` blue (`#599ede`)** CTA with forced link reset so clients do not inject default blue/underline; system sans stack; invite credentials in inset rows) |
| Dev Playground email tabs       | `app/(main)/(command-center)/admin/dev/email-previews/msc_EmailPreviewsClient.tsx` — same builder as production for **Verification email** / **Invite email** previews                                                                                                                                                           |
| SMTP merge + From               | `lib/msc_smtp_nodemailer.ts`, `lib/msc_smtp_resolve.ts`                                                                                                                                                                                                                                                                          |
| Trust gate (unverified)         | `middleware` / proxy (see repo) + `/auth/verify-reminder`                                                                                                                                                                                                                                                                        |
| Verify link handler             | `app/(main)/auth/verify/page.tsx` + `components/auth/msc_VerificationView.tsx`                                                                                                                                                                                                                                                   |
| UI: Settings invite             | `components/settings/MSC-Projectz-CreateUserForm.tsx`                                                                                                                                                                                                                                                                            |
| UI: Payload panel               | `components/MSC-Projectz-PayloadUsersPanel.tsx`                                                                                                                                                                                                                                                                                  |

## Invite email content (behavior)

- **Subject:** “Your MSC-Projectz invitation” when a temporary password is included; otherwise “Verify your MSC-Projectz account”.
- **Body:** Greeting → verify URL (`/auth/verify?token=…`) → expiry → optional block with **sign-in URL** (`/auth`), **email**, and **temporary password**.

**Tradeoff:** Putting a temporary password in email is simple for MVP; for higher security later, replace with a **password-set** link (one-time token + `/auth/set-password` flow) and drop password from email.

## Random password policy

`msc_generateCompliantRandomPassword` in `lib/msc_invite_password.ts` (server-only) — same rules as user-chosen passwords (length, upper, digit, special).

## Checklist for a **new** project

1. Copy SMTP env pattern + `msc_createSmtpTransporter` layering approach.
2. Set `NEXT_PUBLIC_SITE_URL` per environment **first** (wrong origin = broken verify links).
3. Implement or copy `msc_sendVerificationEmail` + token hash storage on `users`.
4. Wire trust middleware to `isVerified`.
5. Add invite server action + Settings UI tabs (invite vs advanced).
6. Run **`npm run verify:next`** before shipping.

## Related docs

- **`FlightPro.md`** — local vs production, cPanel, `pushitlive`.
- **`Agent-Runbook.md`** — verification IP limits, telemetry, Payload admin guardrails.
- **`.cursor/plans/2026-04-29-master-admin-gmail-stepwise.plan.md`** — original stepwise operator plan.
