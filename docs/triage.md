# Maintainer Triage

This guide describes how maintainers should handle incoming issues for `oss-safe-release`. It is intended to keep rule quality high, avoid leaking sensitive data, and keep releases small.

## Triage Priorities

1. Security-impacting scanner bugs, especially issues that hide credential exposure or unsafe release automation.
2. False positives in common open-source workflows.
3. Broken CLI behavior, report output, or CI examples.
4. New rule requests with clear maintainer risk and a concrete fix.
5. Documentation improvements.

## Bug Reports

Use `.github/ISSUE_TEMPLATE/bug_report.yml`.

Before accepting a bug:

- Confirm the report includes the version or commit.
- Confirm the command is provided.
- Confirm expected and actual behavior are clear.
- Remove or ask the reporter to remove secrets, credentials, private repository content, and account identifiers.

For scanner behavior bugs:

- Add a regression test that reproduces the issue.
- Verify the test fails before implementation.
- Implement the smallest fix that makes the test pass.
- Run `pnpm test`, `pnpm run build`, `pnpm run lint`, and the repository self-scan before merging.

## False Positives

Use `.github/ISSUE_TEMPLATE/false_positive.yml`.

Before changing a rule:

- Confirm the rule id and sanitized finding output are included.
- Decide whether the flagged pattern is actually safe, merely uncommon, or still risky but intentional.
- Prefer improving the rule over adding broad ignores.
- Keep any new exception narrow and explainable.

A false-positive fix should include:

- a focused test for the safe pattern
- no reduction in coverage for the risky pattern
- updated `docs/rules.md` when the rule semantics change

If the finding is intentional but still risky, recommend a narrow `oss-safe-release.config.json` ignore instead of weakening the default rule.

## Rule Requests

Use `.github/ISSUE_TEMPLATE/rule_request.yml`.

Accept a rule request when it has:

- a maintainer or release-safety risk
- a sanitized example pattern
- a concrete recommendation maintainers can apply
- a severity that matches the severity model in `docs/rules.md`

Reject or defer rule requests when:

- the signal is too noisy
- the fix is unclear
- the rule would require private service access
- the rule is better handled by an ecosystem-specific linter

New rules should include tests, documentation, and stable rule ids.

## Documentation Reports

Use `.github/ISSUE_TEMPLATE/documentation.yml`.

Before accepting a documentation issue:

- Confirm the affected page or file is named.
- Confirm the unclear, outdated, or missing content is described.
- Prefer small documentation changes that keep examples consistent with current CLI behavior.
- Keep command examples aligned with `README.md`, `docs/ci.md`, and `docs/examples.md`.

## Release Impact

Before merging release-related changes:

- Confirm the change does not create a tag, publish to npm, create a GitHub release, submit an external form, or change account settings.
- Confirm `docs/release.md` and `docs/release-notes/v0.1.0.md` stay accurate if release scope changes.
- Confirm generated self-scan reports are current when scanner output changes.

## Sensitive Data Policy

Do not ask reporters to post:

- real secrets or tokens
- private repository contents
- private emails
- OpenAI organization IDs
- account identifiers
- reusable exploit payloads against third-party systems

Ask for sanitized snippets and minimal reproductions instead.
