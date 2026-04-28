---
name: member-avatar-resolution-and-fallback
status: shipped
overview: Add a single avatar URL resolution layer for Payload-shaped data, normalize project members at the mapper, extend MemberClusterTrigger with a unified fallback strategy (initials vs Lucide User icon), and align all member-avatar call sites so we never mix resolutions or fallback styles on the same surface.
todos:
  - id: msc-resolve-avatar
    content: Add lib/msc_avatar_url.ts with msc_resolveAvatarUrl (string | media object | avatarUrl); refactor msc_avatarUrlFromDoc in msc_profile_server_actions.ts to delegate to it (or inline shared logic) to avoid duplicate Payload parsing
  - id: map-members
    content: In msc_mapProjectMember (msc_map_vault.ts), set avatarUrl from msc_resolveAvatarUrl and stop passing through raw avatar objects to the client Project type
  - id: types
    content: Tighten MscProjectMember in types/user-admin.ts (document avatar as optional id-only or omit from client shape; avatarUrl is the only image field for UI)
  - id: member-cluster
    content: "MemberClusterTrigger: use msc_resolveAvatarUrl; fallbackType 'initials' | 'icon' (default icon); Lucide User same shell as initials; match dashboard icon stroke (e.g. strokeWidth 1.5–2); inner p-1 so icon is not squeezed; optional size/avatarClassName"
  - id: project-card
    content: "MSC-Projectz-ProjectCard passes explicit fallbackType (default icon) and className as needed"
  - id: other-call-sites
    content: Replace assignee.avatarUrl || assignee.avatar in CalendarTaskChip.tsx, MSC-Projectz-TaskAssignee.tsx with msc_resolveAvatarUrl; keep one fallback style per component (align with icon vs initials product choice)
  - id: verify
    content: npm run verify:next or verify:next:safe; optional HTTP smoke
---

# Optimal plan: avatar resolution + unified fallback (Soft Studio)

## Problem statement

- **Payload** returns `users.avatar` as a **string id**, a **populated media object** (`{ url }`), or similar; `avatarUrl` may exist separately. Using `member.avatarUrl || member.avatar` in the UI **bets on clean data** and breaks or mis-renders when `avatar` is an object.
- **Design:** For cards, mixing **photos + initials** in one stack can read as inconsistent; a **uniform** no-photo treatment (e.g. Lucide `User`) matches a calmer, “Soft Studio” rhythm. **Do not mix** icon and initials as fallbacks in the same cluster—pick one policy per surface (or globally for the vault UI).

## Architecture

```mermaid
flowchart LR
  payload[Payload doc members/assignee]
  map[msc_mapProjectMember]
  resolve[msc_resolveAvatarUrl]
  ui[MemberClusterTrigger / chips]
  payload --> map
  map --> resolve
  resolve --> ui
```

- **Resolution layer** (single source of truth): one exported function, not raw collection fields in components.
- **Mapper** [`msc_mapProjectMember`](D:\Cursor_Projectz\MSC-Projectz\lib\msc_map_vault.ts): resolve once and pass **only** `avatarUrl: string | null` (and optional `avatar` as id if ever needed for writes—not for `<img>`).
- **Dumb UI** [`MemberClusterTrigger`](D:\Cursor_Projectz\MSC-Projectz\components\MemberClusterTrigger.tsx): no fetch state; receives members; uses resolver if any caller still passes API-shaped data, or trusts pre-resolved `avatarUrl` only; **`fallbackType`** controls no-photo UI.

## 1. `msc_resolveAvatarUrl` (new module)

- **File:** [`lib/msc_avatar_url.ts`](D:\Cursor_Projectz\MSC-Projectz\lib\msc_avatar_url.ts) (preferred over a new monolithic `msc_utils.ts`—this repo uses focused `msc_*` modules; re-export from a barrel only if the team standardizes later).
- **Contract (typed, not `any`):**

  - If `avatar` is a **non-empty string**, treat as URL **or** legacy string id—**match existing app behavior** (if the app sometimes stores a full URL string, keep that branch; if only ids appear as strings, resolve id → URL only if you already have a server helper; **do not** invent new media lookup in v1 without a product decision).
  - If `avatar` is a **number** (id only), return **`null`** for display URL unless the codebase already resolves media by id in this path (if not, mapper depth-1 should supply object).
  - If `avatar` is an **object** with `url`, return `url` (same idea as current [`msc_avatarUrlFromDoc`](D:\Cursor_Projectz\MSC-Projectz\lib\msc_profile_server_actions.ts) lines 29–35).
  - Else use **`avatarUrl`**.
  - Return **`string | null`**.

- **Consolidation:** Refactor **`msc_avatarUrlFromDoc`** in [`lib/msc_profile_server_actions.ts`](D:\Cursor_Projectz\MSC-Projectz\lib\msc_profile_server_actions.ts) to use **`msc_resolveAvatarUrl({ avatar: doc.avatar, avatarUrl: undefined })`**-style input so profile and project members do not duplicate Payload parsing.

## 2. Mapper: clean `MscProjectMember` for the client

- In [`msc_mapProjectMember`](D:\Cursor_Projectz\MSC-Projectz\lib\msc_map_vault.ts), set:

  `avatarUrl: msc_resolveAvatarUrl({ avatar: member.avatar, avatarUrl: member.avatarUrl })`

- Omit or null out **raw** `avatar` on the object sent to the client if it is not a display string, so UI never sees ambiguous shapes.

- Update [`types/user-admin.ts`](D:\Cursor_Projectz\MSC-Projectz\types\user-admin.ts) `MscProjectMember` to reflect **one** display field: `avatarUrl?: string | null` (and document that `avatar` is not set on mapped client objects, or is id-only for edge admin flows—keep consistent with `edit-project-modal` / server actions).

## 3. `MemberClusterTrigger` behavior

- **`fallbackType: 'initials' | 'icon'`** (required or default **`'icon'`** for the Soft Studio / project-card use case).
- **When `avatarUrl` is set:** show `<img>` (same as today).
- **When null:**
  - **`'initials'`:** keep [`msc_projectMemberInitials`](D:\Cursor_Projectz\MSC-Projectz\lib\msc_project_member_display.ts) + `bg-secondary` token (current look).
  - **`'icon'`:** **Lucide `User`** (or your approved PNG) centered, **same** circle, border, and ring as the initials token—**no** second visual language.
- **Soft Studio (icon fallback):**
  - **Weight:** Set Lucide `strokeWidth` to match the rest of the Command Center (typically **1.5** or **2**, consistent with other dashboard icons). If the stroke is too thin next to labels, the cluster reads as visually **detached** from the UI.
  - **Padding:** Give the icon **breathing room** inside the circle (e.g. wrap with **`p-1`** or equivalent) so the glyph is not **squeezed** against the circular border.
- **No mixing** within a single instance: the prop applies to **every** slot in the stack (photos remain photos).
- **Sizing / theme:** keep existing `className` on the root; add optional props such as **`avatarClassName`** or **`size: 'sm' | 'md'`** mapping to the existing `h-7` stack vs `h-8` list row so project settings can scale later without forking the component. When implementing, **spot-check** icon weight next to a representative sidebar/header icon in the same viewport.

## 4. Parent (Project card)

- [`MSC-Projectz-ProjectCard`](D:\Cursor_Projectz\MSC-Projectz\components\MSC-Projectz-ProjectCard.tsx): pass **`fallbackType="icon"`** (explicit is fine) for the Soft Studio default; no extra state.
- If product later wants **“high-context collaboration”** on a different route, that parent passes **`fallbackType="initials"`** there only—still one style per component instance.

## 5. Other call sites (same resolver, one fallback style each)

- [`MSC-Projectz-TaskAssignee.tsx`](D:\Cursor_Projectz\MSC-Projectz\components\MSC-Projectz-TaskAssignee.tsx) (line ~68: `assignee.avatarUrl || assignee.avatar`) → use **`msc_resolveAvatarUrl`**, and align fallback with the same **icon vs initials** rule used for task rows (recommend **icon** if you want consistency with project cards in the same dashboard).
- [`CalendarTaskChip.tsx`](D:\Cursor_Projectz\MSC-Projectz\components\CalendarTaskChip.tsx) (line ~59) → same.

## 6. Validation

- Run **`npm run verify:next`** (or **`verify:next:safe`** if port 3000 is in use) after edits.
- Smoke **`/`** and **`/admin`** if dev is started per local rules.

## Summary

- **Raw Payload in UI:** no — resolve in `msc_mapProjectMember` and shared `msc_resolveAvatarUrl`.
- **No-photo on project cards:** Lucide `User` (or approved PNG) with `fallbackType: 'icon'`.
- **Initials:** opt in via `fallbackType: 'initials'`; do not mix with icon in the same render.
- **Density / calm:** one fallback style per `MemberClusterTrigger` instance; photo stacks stay readable.
- **Icon polish:** Lucide `User` uses the same **stroke width** as other dashboard icons; **inner padding** (e.g. `p-1`) so the icon is not cramped in the circle.

## Out of scope (unless you expand the plan)

- Resolving **numeric** avatar id to a URL on the **client** without a server/media endpoint.
- Different fallback types **per user** in one stack (would violate the “no mixing” rule).
