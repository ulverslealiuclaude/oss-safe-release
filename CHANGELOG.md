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
- Added detection for workflows that globally install package-manager tools without fixed versions.
- Added detection for reusable workflow calls that inherit all caller secrets.
- Added detection for reusable workflows that accept secrets without explicit permissions.
- Added committed secret file and `.gitignore` coverage checks.
- Added release workflow checks for package publishing from pull request workflows.
- Added release workflow checks for push-triggered package publishing without trusted gates.
- Added release workflow checks for manual package publishing without approval gates.
- Added release workflow checks for Docker image publishing commands.
- Added release workflow checks for GitHub Release creation commands.
- Added release workflow checks for `semantic-release` publishing commands.
- Added release workflow checks for `release-it` and Changesets publishing commands.
- Added release workflow checks for `changesets/action` publish inputs.
- Added release workflow checks for publishing without explicit token permissions.
- Added release workflow checks for GHCR publishing without `packages: write`.
- Added release workflow checks for GitHub Release creation without `contents: write`.
- Added Markdown and JSON report output.
- Added optional SARIF report output for GitHub code scanning workflows.
- Added `--fail-on` to customize CI failure severity thresholds.
- Added `oss-safe-release.config.json` support for rule and path ignores.
- Added tests, documentation, CI configuration, and an example self-scan report.
