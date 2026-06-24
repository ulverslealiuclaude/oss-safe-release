# Contributing

Thanks for helping improve `oss-safe-release`.

## Local Setup

```bash
pnpm install
pnpm test
pnpm run build
```

## Adding a Rule

1. Add a focused test under `tests`.
2. Watch the test fail.
3. Add the smallest rule implementation under `src/rules`.
4. Register the rule in `src/scanner.ts` when it is ready for default scans.
5. Run `pnpm test` and `pnpm run build`.

Each finding should include a stable rule id, severity, title, message, location when available, and a concrete recommendation.

## Rule Quality

Good rules are high signal, explainable, and easy for maintainers to act on. Avoid broad pattern matching that produces noisy findings without a clear fix.

## Reporting False Positives

False-positive reports should include the rule id, sanitized finding output, and why the flagged pattern is safe or intentional. Do not include secrets, private repository contents, or credentials.

## Requesting Rules

Rule requests should describe the maintainer risk, provide a sanitized example pattern, and include the recommended fix a maintainer should apply.

## Triage Process

Maintainer triage priorities and handling guidance are documented in [`docs/triage.md`](docs/triage.md).
