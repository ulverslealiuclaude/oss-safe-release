## Summary

- 

## Type

- [ ] Scanner rule
- [ ] CLI/reporting behavior
- [ ] Documentation
- [ ] CI/release readiness
- [ ] Maintenance

## Verification

- [ ] `pnpm test`
- [ ] `pnpm run build`
- [ ] `pnpm run lint`
- [ ] `node dist/src/cli.js scan . --markdown examples/self-scan-report.md --json examples/self-scan-report.json --sarif examples/self-scan-report.sarif --fail-on high`
- [ ] `git diff --exit-code examples/self-scan-report.md examples/self-scan-report.json examples/self-scan-report.sarif`

## Maintainer Safety

- [ ] No secrets, tokens, private emails, OpenAI organization IDs, or account identifiers are committed.
- [ ] New or changed findings include a stable rule id, severity, message, and recommendation.
- [ ] Rule behavior changes include tests that fail before the implementation and pass after it.
- [ ] User-facing behavior changes update README, `docs/rules.md`, `docs/examples.md`, or `CHANGELOG.md` as appropriate.

## Release Impact

- [ ] No npm publish, GitHub release, tag creation, account setting, or external form submission is included.
- [ ] Release notes or checklists are updated if this changes v0.1.0 readiness.
