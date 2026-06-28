# Repository Settings Guide

Use this guide when preparing the public GitHub repository for the first release. These settings are intentionally manual because they affect repository visibility, protection rules, and release presentation.

## Repository About

Recommended description:

```text
Local-first OSS maintainer safety checks for GitHub Actions, releases, and secrets.
```

Recommended website:

```text
https://github.com/ulverslealiuclaude/oss-safe-release#readme
```

Recommended topics:

- `github-actions`
- `security`
- `open-source`
- `release`
- `cli`
- `supply-chain-security`

## Branch Protection

For `main`, prefer these protections once CI is enabled:

- Require pull request reviews before merging.
- Require status checks to pass before merging.
- Require the primary CI workflow to pass.
- Require branches to be up to date before merging if the repository starts receiving outside contributions.
- Do not allow force pushes.
- Do not allow branch deletion.

Keep the rules simple for the first release. The goal is to prevent accidental release or history changes without making solo maintenance unnecessarily slow.

## GitHub Actions

Before enabling release automation, confirm:

- CI runs `pnpm test`, `pnpm run build`, and `pnpm run lint`.
- Any scanner workflow uses least-privilege permissions, usually `contents: read`.
- SARIF upload workflows add `security-events: write` only where needed.
- Third-party actions are pinned to reviewed commit SHAs.

## Releases

For `v0.1.0`:

- Create the release from the verified `main` commit.
- Use `docs/release-drafts/v0.1.0.md` as the release body source.
- Reference the example reports in `examples/`.
- Keep the first release GitHub-only unless npm ownership and publishing credentials are explicitly approved.

## README Badges

Add badges only after the corresponding workflow or release exists:

- CI status badge after GitHub Actions is enabled.
- License badge after confirming the repository license renders correctly.
- Release badge after creating `v0.1.0`.

Avoid placeholder badges because they make the repository look less reliable during review.
