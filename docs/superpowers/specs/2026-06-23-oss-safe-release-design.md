# oss-safe-release Design

## Purpose

`oss-safe-release` is an open-source maintainer safety tool. It helps maintainers find common release, GitHub Actions, and secret-handling risks before a pull request or release ships.

The project's strategic goal is to become a credible open-source project that serves maintainers directly, then use that real maintenance work as the basis for a Codex for Open Source application. The application should be honest: the project must be public, useful, actively maintained, and able to show evidence of usage or ecosystem value.

## Target Users

Primary users are maintainers of small and medium open-source repositories who use GitHub Actions and want lightweight security checks without adopting a heavy commercial platform.

Secondary users are contributors and AI coding agents that need a fast pre-flight check before opening a pull request.

## Success Criteria

The first public version is successful when it can:

- Run locally as a CLI against a GitHub repository.
- Run in GitHub Actions without requiring a hosted backend.
- Detect high-signal risks in workflow files, sensitive files, ignore rules, and release configuration.
- Produce human-readable Markdown and machine-readable JSON reports.
- Explain each finding with severity, location, reason, and a concrete fix.
- Ship with tests, documentation, examples, and a public roadmap.

The two-week application-readiness milestone is successful when it also has:

- A public GitHub repository owned by the user.
- A usable npm package or install command.
- At least one real-world example report from a public test repository.
- Clear maintainer-facing documentation.
- A prepared Codex for Open Source application draft.

## Non-Goals

The first version will not be a full SAST scanner, dependency vulnerability database, secrets vault, hosted SaaS product, or automated code modification bot. It will not scan private repositories unless the owner runs it locally with permission. It will not claim to guarantee security.

## Product Shape

The MVP has two user entry points:

- CLI: `npx oss-safe-release scan`
- GitHub Action: run the scanner in CI and optionally upload a report artifact.

The scanner reads repository files from disk and emits findings. It does not call external services by default. That keeps the tool fast, private, and easy for maintainers to trust.

## Core Checks

### GitHub Actions Workflow Safety

The scanner reads `.github/workflows/*.yml` and `.github/workflows/*.yaml`.

It detects:

- Actions referenced by mutable tags such as `@main` or `@master`.
- Actions referenced by short version tags such as `@v1` when SHA pinning is recommended.
- `pull_request_target` workflows that check out or execute contributor-controlled code.
- Workflow-level or job-level `permissions: write-all`.
- Missing explicit `permissions` blocks in workflows that use token-sensitive steps.
- Direct shell execution of secrets in risky contexts.

### Sensitive File Hygiene

The scanner detects committed sensitive files and risky local configuration patterns:

- `.env`, `.env.local`, `.env.production`, `.npmrc`, `.pypirc`
- private-key-looking filenames such as `id_rsa`, `*.pem`, and `*.key`
- package-manager auth token patterns in common config files

It also checks whether `.gitignore` covers common sensitive files.

### Release Risk Checks

The scanner detects risky release workflows:

- release jobs triggered from pull request events
- publishing commands that run with broad token permissions
- workflows that publish packages without a clear branch or tag gate

### Maintainer Report

The CLI produces:

- console summary
- `safe-release-report.md`
- `safe-release-report.json`

Each finding includes:

- stable rule id
- severity: `low`, `medium`, `high`, `critical`
- file path and line number when available
- short title
- explanation
- recommended fix

## Architecture

The project will be a TypeScript CLI package with small, focused modules:

- `src/cli.ts`: parse arguments and call the scanner.
- `src/scanner.ts`: orchestrate file discovery, rule execution, and report generation.
- `src/files.ts`: safe repository file discovery and path filtering.
- `src/workflows.ts`: parse GitHub Actions YAML files into a normalized structure.
- `src/rules/*`: individual rule modules with one responsibility each.
- `src/reporters/*`: console, Markdown, and JSON reporters.
- `src/types.ts`: shared finding, rule, and scanner types.

Rules will be deterministic functions. A rule receives repository context and returns findings. This keeps tests simple and makes future AI-assisted triage optional rather than required.

## Data Flow

1. User runs the CLI in a repository.
2. CLI resolves the target directory.
3. Scanner discovers relevant files.
4. YAML files are parsed with a structured parser.
5. Rules run against repository context.
6. Findings are sorted by severity and path.
7. Reporters write console, Markdown, and JSON output.
8. CLI exits with code `0` when no high-risk findings exist and non-zero when configured thresholds are met.

## Error Handling

Unreadable files produce warning findings instead of crashing the scan. Invalid YAML produces a medium-severity finding with the parser error location when available. Unknown CLI flags return a helpful usage message and exit code `2`.

The scanner must avoid following symlinks outside the target repository by default. It must ignore `node_modules`, `.git`, common build directories, and large binary files.

## Testing Strategy

The project will use Vitest. Unit tests will cover:

- workflow YAML parsing
- each rule's positive and negative cases
- file discovery exclusions
- Markdown and JSON report formatting
- CLI exit behavior

Fixture repositories will live under `tests/fixtures`. Each fixture should be tiny and purpose-built.

## Documentation

The repository will include:

- `README.md`: value proposition, install, usage, example output.
- `LICENSE`: MIT license.
- `SECURITY.md`: responsible disclosure and scanner limitations.
- `CONTRIBUTING.md`: local development, tests, adding rules.
- `ROADMAP.md`: two-week milestone and future rule ideas.
- `.github/workflows/ci.yml`: test and build workflow.
- `.github/workflows/safe-release.yml`: self-test example using the action mode.

## Codex for Open Source Application Strategy

The application should emphasize that the project supports maintainers by reducing release and CI/CD safety work. The requested API credits would be used for:

- explaining scanner findings in maintainer-friendly language
- drafting pull request review summaries for workflow changes
- triaging false positives and rule requests
- generating remediation examples for multiple package ecosystems

The ChatGPT Pro with Codex benefit would be used for day-to-day coding, review, issue triage, release workflow maintenance, and documentation.

## Two-Week Execution Plan

Days 1-2: Build CLI scanner, core types, file discovery, YAML parsing, first workflow rules, and reports.

Days 3-4: Add sensitive-file checks, `.gitignore` checks, release risk checks, tests, and CI.

Days 5-7: Polish docs, create GitHub Action usage, add examples, harden error handling, and prepare npm packaging.

Days 8-10: Run against selected public repositories with permission-safe local analysis, create anonymized example reports, and improve rules based on findings.

Days 11-12: Publish public repository, prepare release, and write launch materials.

Days 13-14: Finalize Codex for Open Source application draft and submit when the user has provided GitHub username, ChatGPT account email, and OpenAI organization ID.

## Review Notes

This spec intentionally chooses a narrow, useful maintainer tool rather than a broad AI agent. The first release avoids external APIs so the project can be trusted and tested. AI support can be added in a future release as an optional enhancement once the deterministic scanner is useful on its own.
