# Vault session hydration race (“logged in” but server says auth required)

Date: 2026-04-29  
Status: **Mitigated in code** — keep this note so consolidation/docs churn does not drop the pattern again.

## Symptom

- Operator is on **`/dashboard`** (or Command Center routes) and **appears signed in** (sidebar, header).
- Next.js **dev overlay** shows a **server** error: **`Authentication required to fetch vault projects.`**
- Stack points to **`msc_requireVaultSessionUser`** / **`msc_loadVaultProjects`** in **`lib/msc_vault_server_actions.ts`**.

## Root cause (not a fake login)

Two layers of “logged in”:

1. **Client (Zustand `persist`)** — can show **`isAuthenticated`** and **`user.payloadUserId`** immediately after navigation or reload.
2. **Server (`payload.auth({ headers })`)** — depends on **httpOnly Payload cookies** on the **incoming** server-action request.

On a **cold or fast** first hydration, **`hydrateVaultFromPayload`** could call **`msc_loadVaultProjects()`** before the **server** saw a session, so **`ctx.user`** was **`null`** and the old code **threw**. Next.js surfaces that as a **Console Error** overlay even though the UI already drew “logged in.”

Contributing factors (operator + dev hygiene):

- Mixing **`localhost`** and **`127.0.0.1`** splits cookies → one host looks “logged in,” the other does not. **Pick one** for local dev (project default: **`http://127.0.0.1:3000`** in smoke checklists).
- **Strict Mode** / fast remounts can amplify “first request too early” races.

## Fix implemented (code — do not revert without updating this doc)

1. **`msc_peekVaultServerSession()`** (`lib/msc_vault_server_actions.ts`) — cheap **`payload.auth`** check for the current request.
2. **`hydrateVaultFromPayload`** (`lib/store.ts`) — if the first peek has **no** server user, **wait ~450ms** and peek **once more**; if still no user, **purge stale client session** and mark vault hydrated (avoid infinite “Syncing vault…”).
3. **`msc_loadVaultProjects()`** — if **`ctx.user`** is still missing, **return an empty `Project[]`** and **log a warning** instead of **throwing** (read-only path; **mutations** still assert auth).

## What agents / operators should not do

- **Do not** “fix” this by removing **`msc_requireVaultSessionUser`** from **write** paths (`msc_createVaultProject`, etc.).
- **Do not** reintroduce **throw on read** for **`msc_loadVaultProjects`** for “strictness” — it only brings back the **red dev overlay** without improving security (anonymous caller still gets **no rows**).

## Verification

- Log in on a **single host** (`localhost` **or** `127.0.0.1`, not both).
- Load **`/dashboard`** — no **`Authentication required to fetch vault projects`** overlay; projects load or list is empty for a genuinely empty vault.

## Related code

- `lib/msc_vault_auth_context.ts` — `msc_getVaultLocalApiContext`
- `lib/msc_vault_server_actions.ts` — `msc_peekVaultServerSession`, `msc_loadVaultProjects`
- `lib/store.ts` — `hydrateVaultFromPayload`
- `components/MSC-Projectz-VaultHydrator.tsx` — triggers hydrate when auth key stabilizes
