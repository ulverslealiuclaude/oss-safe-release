# oss-safe-release

Local-first safety checks for open-source maintainers before a pull request or release ships.

`oss-safe-release` scans a repository for high-signal maintenance risks:

- GitHub Actions that use mutable action refs such as `@main`, `@master`, or short `@v1` tags.
- Workflows that grant `permissions: write-all`.
- `pull_request_target` workflows that appear to check out or execute repository code.
- Shell steps that interpolate untrusted GitHub event context directly into `run:` commands.
- Sensitive files such as `.env`, `.npmrc`, `.pypirc`, `*.pem`, and `*.key`.
- Missing `.gitignore` coverage for local environment files.
- Package publishing commands that can run from pull request workflows.

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
npx oss-safe-release scan . --markdown reports/safe-release.md --json reports/safe-release.json
```

The CLI exits with code `1` when it finds `high` or `critical` findings. This makes it useful in CI while still producing readable reports for maintainers.

## Example Finding

```md
## HIGH: GitHub Action is pinned to a mutable ref

- Rule: `workflow.mutable-action-ref`
- Location: `.github/workflows/ci.yml:12`
- Message: actions/checkout uses @main, which can change without review.
- Recommendation: Pin third-party actions to a full commit SHA and review updates intentionally.
```

## Example Reports

This repository includes a clean self-scan example:

- [`examples/self-scan-report.md`](examples/self-scan-report.md)
- [`examples/self-scan-report.json`](examples/self-scan-report.json)

## Release Process

Release preparation is documented in [`docs/release.md`](docs/release.md). The first release should remain GitHub-only until npm ownership and package publishing details are confirmed.

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
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npx oss-safe-release scan
```

## Current Rules

| Rule | Severity | Description |
| --- | --- | --- |
| `workflow.mutable-action-ref` | high | Flags actions pinned to mutable refs. |
| `workflow.write-all-permissions` | critical | Flags workflows with broad write token permissions. |
| `workflow.pull-request-target-executes-code` | high | Flags `pull_request_target` workflows that appear to execute repository code. |
| `workflow.untrusted-context-in-run` | high | Flags shell steps that directly interpolate untrusted GitHub event context. |
| `secrets.sensitive-file-committed` | critical | Flags sensitive files committed to the repository. |
| `secrets.gitignore-missing-env` | medium | Flags missing `.env` coverage in `.gitignore`. |
| `release.publish-on-pull-request` | critical | Flags package publishing in pull request workflows. |

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
