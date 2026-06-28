# Examples Guide

This guide explains the example outputs included in this repository and how maintainers can interpret the scanner in a real workflow.

## Clean Self-Scan

The repository self-scan is generated from the built CLI:

```bash
node dist/src/cli.js scan . --markdown examples/self-scan-report.md --json examples/self-scan-report.json --sarif examples/self-scan-report.sarif --fail-on high
```

Current expected console output:

```text
oss-safe-release: no findings; scanned 58 files, 1 workflow, 3 rules
```

The generated example reports are:

- `examples/self-scan-report.md`: human-readable summary for maintainers and release notes
- `examples/self-scan-report.json`: machine-readable output for custom automation
- `examples/self-scan-report.sarif`: code-scanning compatible output for GitHub workflows that upload SARIF

## Typical Finding Shape

Markdown findings are written for maintainers reviewing a release or pull request:

```md
## HIGH: GitHub Action is pinned to a mutable ref

- Rule: `workflow.mutable-action-ref`
- Location: `.github/workflows/ci.yml:12`
- Message: actions/checkout uses @main, which can change without review.
- Recommendation: Pin third-party actions to a full commit SHA and review updates intentionally.
```

JSON and SARIF outputs carry the same rule id, severity, location, message, and recommendation so downstream tools can route findings without parsing Markdown.

## CI Usage

Use the default threshold to fail CI only on `high` and `critical` findings. More complete CI and SARIF upload examples are documented in the [CI guide](ci.md).

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
      - run: npx oss-safe-release scan --fail-on high
```

Use `--fail-on medium` for stricter repositories, or `--fail-on none` when collecting reports without failing CI.

## SARIF Usage

SARIF output is intended for repositories that already use GitHub code scanning or another SARIF consumer. Generate it with:

```bash
npx oss-safe-release scan . --sarif reports/oss-safe-release.sarif
```

The SARIF reporter includes:

- `ruleId` for stable rule routing
- SARIF `level` mapped from scanner severity
- `artifactLocation.uri` for the affected file
- `region.startLine` when the scanner can identify a line

## Intentional Findings

If a finding is intentional, prefer a narrow ignore in `oss-safe-release.config.json`:

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

For monorepos or CI jobs that keep scanner policy elsewhere, pass an explicit config path:

```bash
npx oss-safe-release scan . --config config/oss-safe-release.json
```

Avoid broad ignores unless the repository has a documented policy explaining why the pattern is safe.
