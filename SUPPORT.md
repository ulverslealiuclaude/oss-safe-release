# Support

`oss-safe-release` is maintained on a best-effort basis. The fastest way to get a useful response is to choose the right public issue template and keep examples sanitized.

## Where To Ask

- Bug reports: use the Bug report issue template for scanner crashes, incorrect CLI behavior, or broken report output.
- False positives: use the False positive issue template when a rule is noisy, incorrect, or not actionable.
- Rule requests: use the Rule request issue template for new maintainer safety checks.
- Documentation issues: use the Documentation improvement issue template for unclear, outdated, or missing docs.
- Security issues: follow `SECURITY.md` and do not open a public issue with exploit details, real secrets, private repository contents, or credentials.

## Response Scope

The project can provide:

- rule behavior clarification
- reproduction guidance for scanner bugs
- triage of sanitized false-positive reports
- review of proposed rule ideas
- documentation corrections

The project cannot provide:

- emergency incident response
- private repository audits
- legal, compliance, or account eligibility advice
- support for real secrets, private tokens, or confidential repository contents posted publicly

## Useful Details

For most reports, include:

- `oss-safe-release` version or commit
- command used
- sanitized workflow/config snippet when relevant
- expected behavior
- actual behavior
- rule id, if a finding is involved

Keep reproductions minimal. Replace private names, tokens, package scopes, and repository-specific identifiers with placeholders before posting.
