# Security Policy

## Supported Versions

`oss-safe-release` is currently pre-1.0. Security fixes are made on the default branch first and included in the next tagged release.

| Version | Supported |
| --- | --- |
| `main` | yes |
| `0.1.x` | best effort |

## Reporting Issues

Please report security issues privately to the repository maintainer before public disclosure. If GitHub private vulnerability reporting is enabled for the repository, use that channel. Otherwise, open a public issue with a minimal, non-exploitative summary and ask for a private coordination channel before sharing sensitive details.

Include:

- affected version or commit
- sanitized reproduction steps
- expected impact
- suggested fix, if known

Do not include real secrets, private repository contents, live credentials, access tokens, or exploit payloads that could be reused against a third party.

## Response Expectations

This project is maintained on a best-effort basis. The maintainer will prioritize issues that can cause credential exposure, unsafe release automation, or incorrect security guidance for open-source maintainers.

Security fixes should include:

- a regression test when the issue affects scanner behavior
- a changelog entry
- a clear recommendation for affected maintainers

## Scanner Limitations

`oss-safe-release` is a pre-flight maintainer tool. It does not guarantee that a repository, workflow, or release process is secure. Findings should be reviewed by a maintainer before action is taken.

The scanner does not upload repository contents to any external service.
