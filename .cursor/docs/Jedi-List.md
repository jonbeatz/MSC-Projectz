# Jedi-List: Development Roadmap

## [ ] Phase 1: Initialization (CURRENT)
- [x] Initialize Tauri 2.0 in the Next.js directory.
- [x] Setup Payload 3.0 with SQLite database.
- [x] Map v0 frontend components to the new SQLite schema.

## [ ] Phase 2: Native Bridge
- [x] Implement Rust shell commands for File Explorer access.
- [x] Implement Rust shell commands for Cursor Editor launch.
- [x] Route project-card Explorer actions through Tauri `open_folder` with copy-path fallback.
- [ ] Move local image uploads to the Tauri File System API.

## [ ] Phase 3: Polish & Deployment
- [x] Refactor Command Center into route-based pages with shared dashboard shell.
- [x] Guard `/settings` as admin-only while keeping `/profile` available to authenticated users.
- [x] Expose `/vault` as Code Manager inside the shared Command Center shell.
- [x] Add localStorage-backed Code Manager snippets with edit, delete, save, and copy workflows.
- [x] Add project-card credential manager popovers with dynamic credential rows and password masking.
- [x] Implement Soft Studio light theme variables scoped to `.light` and `[data-theme='light']`.
- [x] Enforce current-user project/task ownership checks in runtime vault server actions.
- [x] Scope Code Manager snippets and project-card credential popover storage by Payload user ID.
- [x] Persist profile avatars through tenant-owned Payload media and user `avatar` relationship.
- [ ] Finalize broader Light/Dark component audit beyond the current surgical pass.
- [ ] Build Tier 1 & Tier 2 deployment scripts.