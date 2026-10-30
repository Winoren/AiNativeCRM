# GitHub publication verification — 2026-10-30

Scope: import the existing local source snapshot, add an English README, retain a Chinese overview, preserve the MIT notice, document provenance, and exclude local working material.

## Checks performed

- All local links in the new English README resolve to existing files.
- `node --check scripts/serve-agent-demo.mjs` passed.
- The nine scripts in `examples/chat-first-demo/package.json` passed via `npm test` after installing that demo's development dependencies locally with lifecycle scripts disabled. The environment used Node v25.9.0; npm reported that jsdom's declared engine range excludes this version. Use a supported Node release for reproducible runs.
- Gitleaks scanned the complete staged import with redacted output. Its 26 findings were reviewed: synthetic test credentials, local Supabase demo JWT, event/storage identifiers, fixture UUIDs, and prose false positives. No live credentials were identified by that scan. This is a pattern-based check, not an assurance about every historical artifact.
- Local environment files, environment backups, Next.js output, dependency directories, working outputs, and the loose local UI screenshot are excluded from Git.

## Verification limits

The full application's typecheck, lint, build, database suite, browser E2E suite, and live integrations were not rerun for this documentation/import task. Demo tests exercise simulated execution, DOM behavior, and saved recordings; they do not prove a live backend or browser pixel layout. Historical acceptance reports remain dated evidence rather than fresh results.
