# Release Process

This project uses small, explicit releases. A release should show that the scanner is tested, self-scanned, and documented before maintainers are asked to run it.

## Pre-Release Checks

Run these commands from the repository root:

```bash
pnpm test
pnpm run build
pnpm run lint
node dist/src/cli.js scan . --markdown examples/self-scan-report.md --json examples/self-scan-report.json
```

The self-scan should report zero findings for this repository. If findings appear, fix the repository or document the reason before release.

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

Use the matching `CHANGELOG.md` section as the release notes. Do not publish to npm until package ownership and npm account details are confirmed.

## Post-Release

- Confirm the repository README, changelog, and example report match the release.
- Confirm GitHub Actions, if enabled for the repository, passes on the release commit.
- Open follow-up issues for any deferred rule ideas instead of expanding the release scope.
