# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0 - 2026-06-23

- Added the initial `oss-safe-release` CLI.
- Added deterministic checks for GitHub Actions mutable refs and `write-all` permissions.
- Added detection for `pull_request_target` workflows that appear to execute repository code.
- Added detection for `pull_request_target` workflows that directly download artifacts.
- Added detection for `pull_request_target` workflows that use dependency cache actions.
- Added detection for untrusted GitHub event context interpolation in shell steps.
- Added detection for workflows that pipe remote installer scripts directly into shells.
- Added detection for `docker login` commands that pass passwords as command arguments.
- Added detection for GitHub Actions secrets interpolated directly inside `run:` commands.
- Added detection for workflows that globally install package-manager tools without fixed versions.
- Added detection for reusable workflow calls that inherit all caller secrets.
- Added detection for reusable workflows that accept secrets without explicit permissions.
- Added committed secret file and `.gitignore` coverage checks.
- Added release workflow checks for package publishing from pull request and `pull_request_target` workflows.
- Added release workflow checks for `pull_request_target` release-like reusable workflows that inherit all secrets.
- Added release workflow checks for push-triggered package publishing without trusted gates.
- Added release workflow checks for manual package publishing without protected environments or checked confirmation inputs.
- Added release workflow checks for Docker image publishing commands.
- Added release workflow checks for GitHub Release creation commands.
- Added release workflow checks for `semantic-release` publishing commands.
- Added release workflow checks for `release-it` and Changesets publishing commands.
- Added release workflow checks for `changesets/action` publish inputs.
- Added release workflow checks for publishing without explicit token permissions.
- Added release workflow checks for GHCR publishing without `packages: write`.
- Added release workflow checks for GitHub Release creation without `contents: write`.
- Added release workflow checks for npm provenance publishing without `id-token: write`.
- Added release workflow checks for npm token publishing without a protected environment.
- Added release workflow checks for npm token interpolation inside shell commands.
- Added release workflow checks for PyPI token interpolation inside shell commands.
- Added release workflow checks for PyPI trusted publishing without `id-token: write`.
- Added Markdown and JSON report output.
- Added optional SARIF report output for GitHub code scanning workflows.
- Added SARIF rule help links and default severity levels for code scanning.
- Added SARIF result `ruleIndex` links to stabilize code scanning rule references.
- Added console scan summaries with file, workflow, and rule counts.
- Added GitHub Actions CI, SARIF upload, and report artifact documentation.
- Added automatic directory creation for Markdown, JSON, and SARIF report outputs.
- Added `--quiet` to suppress console summaries while still writing reports and exit status.
- Added `--fail-on` to customize CI failure severity thresholds.
- Added `--config` to read scanner ignores from an explicit JSON config file.
- Added `oss-safe-release.config.json` support for rule and path ignores.
- Added tests, documentation, CI configuration, and an example self-scan report.
