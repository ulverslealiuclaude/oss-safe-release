# Rule Catalog

This catalog explains each built-in rule, why it matters to open-source maintainers, and what a maintainer should do when it fires.

## GitHub Actions Rules

### `workflow.mutable-action-ref`

- Severity: `high`
- Flags: `uses:` entries pinned to mutable refs such as `main`, `master`, `HEAD`, or short major tags such as `v4`.
- Risk: action code can change outside the maintainer's review process.
- Fix: pin third-party actions to a full commit SHA and review updates intentionally.

### `workflow.write-all-permissions`

- Severity: `critical`
- Flags: workflows that grant `permissions: write-all`.
- Risk: any compromised step or action receives broad write access through the GitHub token.
- Fix: use least-privilege permissions, usually `contents: read`, and grant write permissions only to jobs that need them.

### `workflow.pull-request-target-executes-code`

- Severity: `high`
- Flags: `pull_request_target` workflows that appear to check out code or run shell commands.
- Risk: `pull_request_target` runs in a privileged context and can expose secrets or write permissions to untrusted pull request code.
- Fix: use `pull_request` for untrusted code, or avoid checkout and shell execution in `pull_request_target` workflows.

### `workflow.pull-request-target-downloads-artifact`

- Severity: `high`
- Flags: `pull_request_target` workflows that directly use `actions/download-artifact`.
- Risk: artifacts produced from untrusted pull request code can be consumed in a privileged workflow context.
- Fix: keep artifact download and validation in an unprivileged `pull_request` workflow, or verify artifact provenance before privileged use.

### `workflow.untrusted-context-in-run`

- Severity: `high`
- Flags: shell steps that interpolate event-controlled GitHub context directly into `run:` commands.
- Risk: pull request titles, branch names, or event payload data can be shaped into shell injection input.
- Fix: pass untrusted context through environment variables and quote it safely inside the script.

### `workflow.remote-script-pipe`

- Severity: `high`
- Flags: commands such as `curl https://example.com/install.sh | bash`.
- Risk: remote installer contents can change without repository review and execute inside CI or release automation.
- Fix: pin and verify installer contents, or vendor reviewed scripts into the repository before executing them.

### `workflow.unpinned-global-install`

- Severity: `medium`
- Flags: global package-manager installs without an explicit version, such as `npm install -g semantic-release`.
- Risk: CI or release behavior can change when the latest package version changes.
- Fix: pin global tools to an explicit version, or use lockfile-backed project dependencies.

### `workflow.reusable-workflow-secrets-inherit`

- Severity: `high`
- Flags: reusable workflow calls that use `secrets: inherit`.
- Risk: all available caller secrets are passed to another workflow, increasing blast radius if that workflow is compromised or too broadly scoped.
- Fix: pass only the specific secrets required by the reusable workflow.

### `workflow.workflow-call-secrets-without-permissions`

- Severity: `medium`
- Flags: reusable workflows that accept caller secrets through `workflow_call` but do not declare top-level `permissions`.
- Risk: the reusable workflow may run with broader default token permissions than it needs while handling sensitive inputs.
- Fix: add explicit least-privilege permissions, such as `permissions: contents: read`, to reusable workflows that accept secrets.

## Secret Hygiene Rules

### `secrets.sensitive-file-committed`

- Severity: `critical`
- Flags: commonly sensitive files such as `.env`, `.npmrc`, `.pypirc`, `id_rsa`, `*.pem`, and `*.key`.
- Risk: credentials, registry tokens, or private keys may be committed.
- Fix: remove the file from git history if it contains secrets, rotate exposed credentials, and add the file pattern to `.gitignore`.

### `secrets.gitignore-missing-env`

- Severity: `medium`
- Flags: repositories without `.env` coverage in `.gitignore`.
- Risk: local credentials are easier to commit accidentally.
- Fix: add `.env` and `.env.*` to `.gitignore`, while keeping safe template files such as `.env.example` if needed.

## Release Rules

### `release.publish-on-pull-request`

- Severity: `critical`
- Flags: package or container image publishing commands in workflows triggered by `pull_request`.
- Risk: untrusted pull request workflows may reach package release commands.
- Fix: restrict publishing to trusted tag, release, or protected-branch events and use least-privilege permissions.

### `release.publish-without-trusted-gate`

- Severity: `high`
- Flags: push-triggered package or container image publishing workflows without tag, release, branch, or `github.ref` gates.
- Risk: ordinary pushes can trigger publishing unintentionally.
- Fix: restrict publishing to trusted release events, version tags, protected branches, or explicit `github.ref` conditions.

### `release.manual-publish-without-approval`

- Severity: `medium`
- Flags: `workflow_dispatch` package or container image publishing without a protected environment or confirmation input.
- Risk: manual release workflows can be triggered without a second safety check.
- Fix: use a protected GitHub environment or require an explicit confirmation input before publishing.

## Severity Model

- `critical`: likely credential exposure, artifact publishing from untrusted code, or broad write authority.
- `high`: unsafe release or workflow behavior that can materially affect users or maintainers.
- `medium`: risky defaults that increase the chance of accidental release, credential, or CI drift.
- `low`: informational issues reserved for future advisory rules.

Rules are deterministic and intentionally conservative. When a finding is intentional, use `oss-safe-release.config.json` to add a narrow ignore for the specific `ruleId` and path.
