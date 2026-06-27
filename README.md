# oss-safe-release

Local-first safety checks for open-source maintainers before a pull request or release ships.

`oss-safe-release` scans a repository for high-signal maintenance risks:

- GitHub Actions that use mutable action refs such as `@main`, `@master`, or short `@v1` tags.
- Workflows that grant `permissions: write-all`.
- `pull_request_target` workflows that appear to check out or execute repository code.
- `pull_request_target` workflows that directly download artifacts in a privileged context.
- `pull_request_target` workflows that use dependency cache actions in a privileged context.
- Shell steps that interpolate untrusted GitHub event context directly into `run:` commands.
- `docker login` commands that pass registry passwords as command arguments.
- Sensitive files such as `.env`, `.npmrc`, `.pypirc`, `*.pem`, and `*.key`.
- Missing `.gitignore` coverage for local environment files.
- Package, container image, GitHub release, or release automation commands that can run from pull request workflows.
- Package, container image, GitHub release, or release automation commands that run from unconstrained push workflows.
- Publishing workflows that do not declare explicit GitHub token permissions.
- GHCR container publishing without `packages: write`.
- GitHub Release creation without `contents: write`.
- npm provenance publishing without `id-token: write`.
- npm token publishing without a protected GitHub environment.
- npm token references interpolated directly into `run:` commands.
- PyPI token references interpolated directly into `run:` commands.

The tool runs locally and does not send repository contents to any external service.

## Install

```bash
npx oss-safe-release scan
```

For local development in this repository:

```bash
pnpm install
pnpm test
pnpm run build
node dist/src/cli.js scan .
```

## Usage

Scan the current repository:

```bash
npx oss-safe-release scan
```

Scan another path:

```bash
npx oss-safe-release scan ../some-repo
```

Write reports to custom paths:

```bash
npx oss-safe-release scan . --markdown reports/safe-release.md --json reports/safe-release.json --sarif reports/safe-release.sarif
```

The CLI exits with code `1` when it finds `high` or `critical` findings. This makes it useful in CI while still producing readable reports for maintainers. SARIF output can be uploaded to GitHub code scanning in repositories that use that workflow.

Console output includes the finding count, severity breakdown, and scan summary so maintainers can quickly confirm the number of files, workflows, and built-in rules evaluated.

Adjust the CI failure threshold:

```bash
npx oss-safe-release scan . --fail-on medium
```

Valid thresholds are `low`, `medium`, `high`, `critical`, and `none`. The default is `high`.

## Configuration

Use `oss-safe-release.config.json` to ignore intentional findings by rule id and, optionally, path:

```json
{
  "ignore": [
    {
      "ruleId": "secrets.sensitive-file-committed",
      "path": ".env.example"
    }
  ]
}
```

Omit `path` to ignore a rule across the repository. Keep ignores narrow and documented so real release risks are not hidden.

## Example Finding

```md
## HIGH: GitHub Action is pinned to a mutable ref

- Rule: `workflow.mutable-action-ref`
- Location: `.github/workflows/ci.yml:12`
- Message: actions/checkout uses @main, which can change without review.
- Recommendation: Pin third-party actions to a full commit SHA and review updates intentionally.
```

## Example Reports

Output formats and CI examples are documented in [`docs/examples.md`](docs/examples.md).

This repository includes a clean self-scan example:

- [`examples/self-scan-report.md`](examples/self-scan-report.md)
- [`examples/self-scan-report.json`](examples/self-scan-report.json)
- [`examples/self-scan-report.sarif`](examples/self-scan-report.sarif)

## Release Process

Release preparation is documented in [`docs/release.md`](docs/release.md). The first release should remain GitHub-only until npm ownership and package publishing details are confirmed.

## Security

Security reporting and scanner limitations are documented in [`SECURITY.md`](SECURITY.md).

## GitHub Actions

After publishing the package, use it in CI:

```yaml
name: safe release

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020
        with:
          node-version: 22
      - run: npx oss-safe-release scan
```

## Current Rules

Detailed rule rationale and remediation guidance is documented in [`docs/rules.md`](docs/rules.md).

| Rule | Severity | Description |
| --- | --- | --- |
| `workflow.mutable-action-ref` | high | Flags actions pinned to mutable refs. |
| `workflow.write-all-permissions` | critical | Flags workflows with broad write token permissions. |
| `workflow.pull-request-target-executes-code` | high | Flags `pull_request_target` workflows that appear to execute repository code. |
| `workflow.pull-request-target-downloads-artifact` | high | Flags `pull_request_target` workflows that directly download artifacts. |
| `workflow.pull-request-target-uses-cache` | medium | Flags `pull_request_target` workflows that use dependency cache actions. |
| `workflow.untrusted-context-in-run` | high | Flags shell steps that directly interpolate untrusted GitHub event context. |
| `workflow.remote-script-pipe` | high | Flags workflows that pipe remote installer scripts directly into a shell. |
| `workflow.docker-login-password-arg` | medium | Flags `docker login` commands that pass registry passwords as command arguments. |
| `workflow.unpinned-global-install` | medium | Flags workflows that globally install package-manager tools without fixed versions. |
| `workflow.reusable-workflow-secrets-inherit` | high | Flags reusable workflow calls that pass all caller secrets with `secrets: inherit`. |
| `workflow.workflow-call-secrets-without-permissions` | medium | Flags reusable workflows that accept secrets without explicit top-level permissions. |
| `secrets.sensitive-file-committed` | critical | Flags sensitive files committed to the repository. |
| `secrets.gitignore-missing-env` | medium | Flags missing `.env` coverage in `.gitignore`. |
| `release.publish-on-pull-request` | critical | Flags package, container image, GitHub release, or release automation publishing in pull request workflows. |
| `release.publish-without-trusted-gate` | high | Flags push-triggered package, container image, GitHub release, or release automation publishing without a trusted release gate. |
| `release.manual-publish-without-approval` | medium | Flags manual package, container image, GitHub release, or release automation publishing without a protected environment or confirmation input. |
| `release.publish-without-explicit-permissions` | medium | Flags publishing workflows without explicit top-level token permissions. |
| `release.ghcr-publish-without-packages-write` | medium | Flags GHCR publishing workflows without `packages: write`. |
| `release.github-release-without-contents-write` | medium | Flags GitHub Release publishing workflows without `contents: write`. |
| `release.npm-provenance-without-id-token-write` | medium | Flags npm provenance publishing workflows without `id-token: write`. |
| `release.npm-token-without-environment` | medium | Flags npm token publishing workflows without a GitHub environment gate. |
| `release.npm-token-in-run-command` | medium | Flags npm publishing tokens interpolated directly into shell commands. |
| `release.pypi-token-in-run-command` | medium | Flags PyPI publishing tokens interpolated directly into shell commands. |

## Limitations

`oss-safe-release` is a maintainer pre-flight scanner, not a complete security audit. It uses deterministic rules and may produce false positives. Review findings before making changes, especially in repositories with intentionally unusual release workflows.

## Development

```bash
pnpm install
pnpm test
pnpm run build
pnpm run lint
```

Rules live in `src/rules`. Each rule should have focused tests under `tests`.
