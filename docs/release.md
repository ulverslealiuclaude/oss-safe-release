# Release Process

This project uses small, explicit releases. A release should show that the scanner is tested, self-scanned, and documented before maintainers are asked to run it.

## Pre-Release Checks

Run these commands from the repository root:

```bash
pnpm test
pnpm run build
pnpm run lint
node dist/src/cli.js scan . --markdown examples/self-scan-report.md --json examples/self-scan-report.json --sarif examples/self-scan-report.sarif --fail-on high
```

The self-scan should report zero findings for this repository. If findings appear, fix the repository or document the reason before release.

## v0.1.0 Readiness Checklist

- Confirm `package.json` version is `0.1.0`.
- Confirm `CHANGELOG.md` has a `0.1.0` section with the current rule set and output formats.
- Confirm README usage examples mention Markdown, JSON, SARIF, config ignores, `--quiet`, `--config`, and `--fail-on`.
- Confirm `docs/ci.md` has current GitHub Actions, SARIF upload, and report artifact examples.
- Confirm `docs/release-notes/v0.1.0.md` mentions the current rule set, output formats, and console scan summary.
- Confirm `SECURITY.md`, `CONTRIBUTING.md`, and `LICENSE` are present.
- Regenerate `examples/self-scan-report.md`, `examples/self-scan-report.json`, and `examples/self-scan-report.sarif` from the verified build.
- Confirm no account identifiers, tokens, API keys, private emails, or OpenAI organization IDs are committed.
- Keep the first release GitHub-only unless npm ownership and package publishing credentials are explicitly approved.

## Version Update

1. Update `package.json` if the release changes the package version.
2. Update `CHANGELOG.md` with user-facing changes.
3. Regenerate the example reports if scanner output changed.
4. Commit the release preparation changes.

## GitHub Release

Create a GitHub release from the verified commit:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Use the matching `CHANGELOG.md` section, [`docs/release-notes/v0.1.0.md`](release-notes/v0.1.0.md), and the GitHub release draft at [`docs/release-drafts/v0.1.0.md`](release-drafts/v0.1.0.md) as the release notes source. Do not publish to npm until package ownership and npm account details are confirmed.

Attach or reference the generated self-scan reports in the release notes when useful:

- `examples/self-scan-report.md`
- `examples/self-scan-report.json`
- `examples/self-scan-report.sarif`

## Post-Release

- Confirm the repository README, changelog, and example report match the release.
- Confirm GitHub Actions, if enabled for the repository, passes on the release commit.
- Open follow-up issues for any deferred rule ideas instead of expanding the release scope.
