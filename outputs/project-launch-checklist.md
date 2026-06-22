# oss-safe-release Launch Checklist

## Required From User

- GitHub username
- Decision: personal repository or organization repository
- Public repository URL after creation
- ChatGPT account email for the application form
- OpenAI organization ID from the OpenAI Platform
- Decision: publish npm package now or keep GitHub-only for first release
- npm username, if publishing to npm

## Local Project Status

- Design spec: complete
- Implementation plan: complete
- TypeScript CLI: complete
- Scanner rules: complete
- Markdown and JSON reports: complete
- Tests: passing
- Build: passing
- Open-source docs: complete
- Application draft: complete

## Before GitHub Publication

- Rename branch from `master` to `main`.
- Confirm package name is available on npm.
- Update repository links in `package.json` after GitHub repo exists.
- Replace placeholder maintainer details in application draft.
- Run final verification:

```bash
pnpm test
pnpm run build
pnpm run lint
node dist/src/cli.js scan . --markdown work/self-report.md --json work/self-report.json
```

## First GitHub Release

- Create public repository.
- Push local git history.
- Confirm CI passes.
- Add repository topics:
  - `github-actions`
  - `security`
  - `open-source`
  - `release`
  - `cli`
  - `supply-chain-security`
- Create release `v0.1.0`.
- Add README badges after CI URL exists.

## First Outreach Targets

- Small TypeScript libraries using GitHub Actions.
- Repositories with package publishing workflows.
- Maintainer communities that discuss CI/CD and supply-chain safety.
- Friendly issue or discussion posts that offer example findings without alarmist language.

## Codex for OSS Submission Timing

Best timing is after the repository is public, CI is passing, and at least one real example report or user feedback item exists. If the activity window feels uncertain, submit once the public repository and first release are ready, then continue improving the project while waiting for review.
