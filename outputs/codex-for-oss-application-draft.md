# Codex for Open Source Application Draft

Use this draft after the repository is public and has its real GitHub URL.

## Project

Project name: `oss-safe-release`

Repository URL: `https://github.com/ulverslealiuclaude/oss-safe-release`

Maintainer GitHub username: `ulverslealiuclaude`

Maintainer role: Primary maintainer and project owner.

ChatGPT account email: submitted with real ChatGPT account email; not stored in repo.

OpenAI Organization ID: submitted; full organization ID not stored in repo.

## Short Description

`oss-safe-release` is a local-first open-source maintainer safety tool. It scans GitHub repositories before pull requests and releases to detect common workflow, release, and secret-hygiene risks.

The first version checks GitHub Actions for mutable action refs, broad token permissions, sensitive files committed to the repository, missing `.gitignore` coverage for environment files, and package publishing commands that can run from pull request workflows.

## Why This Project Matters

Open-source maintainers often operate with limited time and limited security support. Many projects rely on GitHub Actions for tests, releases, package publishing, and automation. Small workflow mistakes can expose credentials, grant overly broad token permissions, or allow unsafe release behavior.

`oss-safe-release` gives maintainers a lightweight pre-flight check that runs locally or in CI without sending repository contents to an external service. The project is intentionally explainable: each finding has a stable rule id, severity, file location when available, reason, and concrete recommendation.

The project is useful for small and medium OSS repositories that want practical release and CI/CD safety checks without adopting a hosted platform.

## Current Capabilities

- CLI scanner: `npx oss-safe-release scan`
- Markdown report output
- JSON report output
- GitHub Actions workflow checks
- Secret hygiene checks
- Release workflow risk checks
- Test suite and CI
- MIT license, contribution guide, security policy, and roadmap
- Local verification on 2026-06-23: `pnpm test`, `pnpm run build`, `pnpm run lint`, and `node dist/src/cli.js scan .` all passed

## Evidence To Add Before Submission

- Public GitHub repository URL: complete
- ChatGPT account email: submitted, not stored in repo
- OpenAI Organization ID: submitted, not stored in repo
- npm package URL, if published
- GitHub stars
- npm download count
- Example report from a real public repository
- Any issues, pull requests, or user feedback
- Short changelog showing active maintenance

## API Credits Usage Plan

We would use API credits to improve the project in maintainer-facing ways:

- Generate clearer explanations for scanner findings while keeping deterministic rule ids.
- Draft safe remediation examples for different ecosystems such as npm, Python, Docker, and Rust.
- Summarize pull requests that modify GitHub Actions or release workflows.
- Triage rule requests and false-positive reports from maintainers.
- Produce documentation examples for common workflow patterns.

The scanner will remain local-first. API-powered features would be optional and opt-in.

## ChatGPT Pro With Codex Usage Plan

ChatGPT Pro with Codex would support day-to-day open-source maintenance:

- Implement and test new scanner rules.
- Review pull requests.
- Improve docs and examples.
- Triage issues.
- Maintain CI and release workflows.
- Prepare safer rule recommendations with tests.

## Codex Security Interest

Codex Security access would be useful for reviewing `oss-safe-release` itself and for learning how to design higher-signal checks for open-source release workflows. The project focuses on maintainer safety, so security-oriented feedback would directly improve the project.

## Suggested Form Answers

### What is your project and why is it important?

`oss-safe-release` is a local-first CLI that helps open-source maintainers detect common GitHub Actions, release, and secret-hygiene risks before a pull request or release ships. It checks for mutable action refs, broad GitHub token permissions, sensitive files, missing `.gitignore` coverage for environment files, and package publishing commands that can run from pull request workflows.

The project matters because many small and medium OSS projects rely on GitHub Actions for their release process but do not have dedicated security teams. A lightweight, explainable scanner can help maintainers catch risky workflow patterns early without sending repository contents to a hosted service.

### How would you use API credits?

We would use API credits for optional maintainer-assistance features: clearer explanations of findings, remediation examples across ecosystems, pull request summaries for workflow changes, false-positive triage, and documentation generation. The deterministic scanner will remain local-first; API features would be opt-in and focused on helping maintainers understand and fix findings.

### How would Codex help your maintenance work?

Codex would help maintain the rule engine, write tests for new checks, review pull requests, improve documentation, triage issues, and evolve the project responsibly. The project has a narrow maintainer-safety mission, so Codex would be used directly for open-source maintenance rather than unrelated personal work.
