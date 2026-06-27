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

### `workflow.pull-request-target-uses-cache`

- Severity: `medium`
- Flags: `pull_request_target` workflows that directly use `actions/cache`, `actions/cache/restore`, or `actions/cache/save`.
- Risk: dependency caches can be influenced by pull request inputs and reused in privileged workflow contexts.
- Fix: prefer cache use in unprivileged `pull_request` workflows, or use trusted cache keys that cannot be controlled by pull request authors.

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

### `workflow.docker-login-password-arg`

- Severity: `medium`
- Flags: `docker login` commands that use `--password` or `-p` instead of `--password-stdin`.
- Risk: registry credentials can be exposed through shell history, process arguments, or logs.
- Fix: pass credentials through standard input with `docker login --password-stdin`.

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
- Flags: package, container image, GitHub release, or release automation commands in workflows triggered by `pull_request`.
- Examples: `npm publish`, `docker push`, `gh release create`, `semantic-release`, `release-it`, `changeset publish`, and `changesets/action` with a `publish` input.
- Risk: untrusted pull request workflows may reach package release commands.
- Fix: restrict publishing to trusted tag, release, or protected-branch events and use least-privilege permissions.

### `release.publish-without-trusted-gate`

- Severity: `high`
- Flags: push-triggered package, container image, GitHub release, or release automation workflows without tag, release, branch, or `github.ref` gates.
- Risk: ordinary pushes can trigger publishing unintentionally.
- Fix: restrict publishing to trusted release events, version tags, protected branches, or explicit `github.ref` conditions.

### `release.manual-publish-without-approval`

- Severity: `medium`
- Flags: `workflow_dispatch` package, container image, GitHub release, or release automation without a protected environment or confirmation input.
- Risk: manual release workflows can be triggered without a second safety check.
- Fix: use a protected GitHub environment or require an explicit confirmation input before publishing.

### `release.publish-without-explicit-permissions`

- Severity: `medium`
- Flags: package, container image, GitHub release, or release automation workflows without top-level `permissions`.
- Risk: release jobs can inherit broader default token permissions than they need.
- Fix: declare least-privilege top-level permissions, such as `contents: read` plus only the write scopes required to publish.

### `release.ghcr-publish-without-packages-write`

- Severity: `medium`
- Flags: `docker push ghcr.io/...` workflows that do not declare `packages: write`.
- Risk: GHCR publishing may fail or encourage broader token permissions when the required package scope is missing.
- Fix: declare `packages: write` for GHCR publishing jobs and keep other GitHub token permissions least-privilege.

### `release.github-release-without-contents-write`

- Severity: `medium`
- Flags: `gh release create ...` workflows that do not declare `contents: write`.
- Risk: GitHub Release publishing may fail or lead maintainers to broaden token permissions instead of granting the specific required scope.
- Fix: declare `contents: write` for GitHub Release publishing jobs and keep other GitHub token permissions least-privilege.

### `release.npm-provenance-without-id-token-write`

- Severity: `medium`
- Flags: `npm publish --provenance`, `pnpm publish --provenance`, or `yarn npm publish --provenance` workflows that do not declare `id-token: write`.
- Risk: npm provenance publishing may fail because GitHub Actions cannot mint the OIDC token required for package provenance.
- Fix: declare `id-token: write` for npm provenance publishing jobs and keep other GitHub token permissions least-privilege.

### `release.npm-token-without-environment`

- Severity: `medium`
- Flags: npm, pnpm, or Yarn npm publishing workflows that reference `NODE_AUTH_TOKEN` or `NPM_TOKEN` without declaring a GitHub `environment`.
- Risk: release secrets can be used without the repository's intended environment protection rules or reviewer approvals.
- Fix: attach token-backed npm publishing jobs to a protected GitHub environment, such as `npm-release`.

### `release.npm-token-in-run-command`

- Severity: `medium`
- Flags: npm publishing workflows that interpolate `secrets.NPM_TOKEN` or `secrets.NODE_AUTH_TOKEN` directly into a `run:` command.
- Risk: direct secret interpolation is easier to expose through command construction, logs, or future shell edits.
- Fix: pass npm publishing tokens through step `env`, such as `NODE_AUTH_TOKEN`, instead of embedding secrets in shell commands.

### `release.pypi-token-in-run-command`

- Severity: `medium`
- Flags: PyPI publishing workflows that interpolate `secrets.PYPI_API_TOKEN` or `secrets.TWINE_PASSWORD` directly into a `run:` command.
- Risk: direct secret interpolation is easier to expose through command construction, logs, or future shell edits.
- Fix: pass PyPI publishing tokens through step `env`, such as `TWINE_PASSWORD`, instead of embedding secrets in shell commands.

## Severity Model

- `critical`: likely credential exposure, artifact publishing from untrusted code, or broad write authority.
- `high`: unsafe release or workflow behavior that can materially affect users or maintainers.
- `medium`: risky defaults that increase the chance of accidental release, credential, or CI drift.
- `low`: informational issues reserved for future advisory rules.

Rules are deterministic and intentionally conservative. When a finding is intentional, use `oss-safe-release.config.json` to add a narrow ignore for the specific `ruleId` and path.
