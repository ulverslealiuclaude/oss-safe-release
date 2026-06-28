# CI Integration

This guide shows how maintainers can run `oss-safe-release` in GitHub Actions and optionally upload SARIF to GitHub code scanning.

## Basic Gate

Use the default `high` threshold to fail CI only for high and critical findings:

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

Use `--quiet` when CI should keep only report files and suppress the console summary:

```yaml
- run: npx oss-safe-release scan --quiet --markdown reports/oss-safe-release.md --json reports/oss-safe-release.json --fail-on high
```

If the scanner policy file is not named `oss-safe-release.config.json` at the repository root, pass it explicitly:

```yaml
- run: npx oss-safe-release scan --config config/oss-safe-release.json --fail-on high
```

The scan fails when an explicit `--config` path cannot be read, which prevents CI from silently ignoring a moved or misspelled policy file.

## SARIF Upload

Upload SARIF when the repository uses GitHub code scanning:

```yaml
name: safe release

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  security-events: write

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020
        with:
          node-version: 22
      - run: npx oss-safe-release scan --sarif reports/oss-safe-release.sarif --fail-on high
      - uses: github/codeql-action/upload-sarif@<pinned-commit-sha>
        if: always()
        with:
          sarif_file: reports/oss-safe-release.sarif
```

Keep `security-events: write` scoped to workflows that upload SARIF. Scanner-only workflows can use `contents: read`.

## Report Artifacts

For pull request review, store Markdown and JSON reports as workflow artifacts:

```yaml
- run: npx oss-safe-release scan --markdown reports/oss-safe-release.md --json reports/oss-safe-release.json --fail-on high
- uses: actions/upload-artifact@<pinned-commit-sha>
  if: always()
  with:
    name: oss-safe-release-reports
    path: reports/
```

Replace `<pinned-commit-sha>` with a reviewed full commit SHA before copying these snippets into a production workflow.
