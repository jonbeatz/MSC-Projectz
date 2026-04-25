# Agent-Runbook: Standard Operating Procedures

## Error Recovery
If the local environment fails to boot:
1. Run `npm run dev:recover`.
2. Wait for the "Ready" signal in the terminal.
3. Smoke test `http://localhost:3000`.

## Coding Style
- Always use `msc_` prefix for new logic.
- Prefer modular components in the `/components/msc-projectz/` directory.
- Use Lucide-React for all icons.

## Theme Logic
- Never hardcode hex values. Use `--background`, `--surface`, and `--card` variables.