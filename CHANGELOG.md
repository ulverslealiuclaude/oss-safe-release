# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0 - 2026-06-23

- Added the initial `oss-safe-release` CLI.
- Added deterministic checks for GitHub Actions mutable refs and `write-all` permissions.
- Added detection for `pull_request_target` workflows that appear to execute repository code.
- Added detection for untrusted GitHub event context interpolation in shell steps.
- Added committed secret file and `.gitignore` coverage checks.
- Added release workflow checks for package publishing from pull request workflows.
- Added release workflow checks for push-triggered package publishing without trusted gates.
- Added Markdown and JSON report output.
- Added `oss-safe-release.config.json` support for rule and path ignores.
- Added tests, documentation, CI configuration, and an example self-scan report.
