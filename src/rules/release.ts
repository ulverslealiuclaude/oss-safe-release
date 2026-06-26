import type { Finding, Rule } from "../types";
import { findLine } from "../workflows";

const TOP_LEVEL_PERMISSIONS = /^permissions:\s*/m;
const PUBLISH_COMMAND =
  /\b(npm publish|pnpm publish|yarn npm publish|twine upload|cargo publish|docker push|gh release create|npx semantic-release|semantic-release|npx release-it|release-it|changeset publish|changesets publish|pnpm changeset publish|pnpm changesets publish|npx changeset publish|npx changesets publish|yarn changeset publish|yarn changesets publish)\b/;
const RELEASE_DRY_RUN = /\b(?:npx\s+)?(?:semantic-release|release-it)\b[^\n]*(?:^|\s)--dry-run(?:\s|$)/;
const CHANGESETS_ACTION_WITH_PUBLISH = /uses:\s*changesets\/action@[^\n]+[\s\S]*?\n\s*publish:\s*[^\n#]+/i;
const GHCR_DOCKER_PUSH = /\bdocker\s+push\s+ghcr\.io\//;
const PACKAGES_WRITE_PERMISSION = /^\s*packages:\s*write\b/m;
const GITHUB_RELEASE_CREATE = /\bgh\s+release\s+create\b/;
const CONTENTS_WRITE_PERMISSION = /^\s*contents:\s*write\b/m;
const NPM_PACKAGE_PUBLISH = /\b(?:npm|pnpm)\s+publish\b|\byarn\s+npm\s+publish\b/;
const NPM_PROVENANCE_PUBLISH = /\b(?:npm|pnpm)\s+publish\b[^\n]*\s--provenance\b|\byarn\s+npm\s+publish\b[^\n]*\s--provenance\b/;
const ID_TOKEN_WRITE_PERMISSION = /^\s*id-token:\s*write\b/m;
const NPM_AUTH_TOKEN_REFERENCE = /\b(?:NODE_AUTH_TOKEN|NPM_TOKEN)\b|secrets\.(?:NODE_AUTH_TOKEN|NPM_TOKEN)\b/;
const WRITE_ALL_PERMISSION = /permissions:\s*write-all\b/;

function findPublishCommandLine(content: string): string | undefined {
  const commandLine = content.split(/\r?\n/).find((line) => PUBLISH_COMMAND.test(line) && !RELEASE_DRY_RUN.test(line));
  if (commandLine) return commandLine;

  return CHANGESETS_ACTION_WITH_PUBLISH.test(content)
    ? content.split(/\r?\n/).find((line) => /uses:\s*changesets\/action@/i.test(line))
    : undefined;
}

export const releaseRule: Rule = {
  id: "release",
  run(context) {
    const findings: Finding[] = [];

    for (const workflow of context.workflows) {
      const hasPullRequestTrigger = /on:\s*pull_request\b/.test(workflow.content) || /-\s*pull_request\b/.test(workflow.content);
      const hasPushTrigger = /on:\s*push\b/.test(workflow.content) || /-\s*push\b/.test(workflow.content);
      const hasWorkflowDispatchTrigger = /on:\s*workflow_dispatch\b/.test(workflow.content) || /-\s*workflow_dispatch\b/.test(workflow.content);
      const hasEnvironmentGate = /\benvironment:\s*[^\s#]+/.test(workflow.content);
      const publishCommandLine = findPublishCommandLine(workflow.content);

      if (!publishCommandLine) continue;

      if (!TOP_LEVEL_PERMISSIONS.test(workflow.content)) {
        findings.push({
          ruleId: "release.publish-without-explicit-permissions",
          severity: "medium",
          title: "Artifact publishing lacks explicit token permissions",
          message: "A publishing workflow does not declare top-level GitHub token permissions.",
          filePath: workflow.path,
          line: findLine(workflow.content, publishCommandLine),
          recommendation: "Declare least-privilege top-level permissions for release workflows, such as contents: read plus only the write scopes required to publish.",
        });
      }

      if (GHCR_DOCKER_PUSH.test(publishCommandLine) && !PACKAGES_WRITE_PERMISSION.test(workflow.content)) {
        findings.push({
          ruleId: "release.ghcr-publish-without-packages-write",
          severity: "medium",
          title: "GHCR publishing lacks packages write permission",
          message: "A workflow publishes a container image to ghcr.io without declaring packages: write.",
          filePath: workflow.path,
          line: findLine(workflow.content, publishCommandLine),
          recommendation: "Declare packages: write for GHCR publishing jobs and keep other GitHub token permissions least-privilege.",
        });
      }

      if (
        GITHUB_RELEASE_CREATE.test(publishCommandLine) &&
        !CONTENTS_WRITE_PERMISSION.test(workflow.content) &&
        !WRITE_ALL_PERMISSION.test(workflow.content)
      ) {
        findings.push({
          ruleId: "release.github-release-without-contents-write",
          severity: "medium",
          title: "GitHub release publishing lacks contents write permission",
          message: "A workflow creates a GitHub release without declaring contents: write.",
          filePath: workflow.path,
          line: findLine(workflow.content, publishCommandLine),
          recommendation: "Declare contents: write for GitHub release publishing jobs and keep other GitHub token permissions least-privilege.",
        });
      }

      if (
        NPM_PROVENANCE_PUBLISH.test(publishCommandLine) &&
        !ID_TOKEN_WRITE_PERMISSION.test(workflow.content) &&
        !WRITE_ALL_PERMISSION.test(workflow.content)
      ) {
        findings.push({
          ruleId: "release.npm-provenance-without-id-token-write",
          severity: "medium",
          title: "npm provenance publishing lacks id-token write permission",
          message: "A workflow publishes an npm package with provenance without declaring id-token: write.",
          filePath: workflow.path,
          line: findLine(workflow.content, publishCommandLine),
          recommendation: "Declare id-token: write for npm provenance publishing jobs and keep other GitHub token permissions least-privilege.",
        });
      }

      if (NPM_PACKAGE_PUBLISH.test(publishCommandLine) && NPM_AUTH_TOKEN_REFERENCE.test(workflow.content) && !hasEnvironmentGate) {
        findings.push({
          ruleId: "release.npm-token-without-environment",
          severity: "medium",
          title: "npm token publishing lacks a protected environment",
          message: "A workflow publishes an npm package with an npm auth token without declaring a GitHub environment.",
          filePath: workflow.path,
          line: findLine(workflow.content, publishCommandLine),
          recommendation: "Use a protected GitHub environment for npm token publishing so release secrets require the repository's intended approval and protection rules.",
        });
      }

      if (hasPullRequestTrigger) {
        findings.push({
          ruleId: "release.publish-on-pull-request",
          severity: "critical",
          title: "Artifact publishing can run from pull requests",
          message: "A workflow triggered by pull_request appears to publish a package, container image, GitHub release, or release automation.",
          filePath: workflow.path,
          line: findLine(workflow.content, publishCommandLine),
          recommendation: "Restrict publishing to trusted tag or release events and require least-privilege permissions.",
        });
      }

      const hasTrustedGate = /\b(on:\s*release|tags:|branches:|github\.ref\s*==|startsWith\(\s*github\.ref)/.test(workflow.content);
      if (hasPushTrigger && !hasTrustedGate) {
        findings.push({
          ruleId: "release.publish-without-trusted-gate",
          severity: "high",
          title: "Artifact publishing lacks a trusted release gate",
          message:
            "A push-triggered workflow appears to publish a package, container image, GitHub release, or release automation without a tag, release, branch, or github.ref gate.",
          filePath: workflow.path,
          line: findLine(workflow.content, publishCommandLine),
          recommendation: "Restrict publishing to trusted release events, version tags, protected branches, or explicit github.ref conditions.",
        });
      }

      const hasConfirmationInput = /\b(confirm|confirmation|approve|approval):\s*\n|\b(confirm|confirmation|approve|approval):\s*[^\n]+/.test(
        workflow.content,
      );
      if (hasWorkflowDispatchTrigger && !hasEnvironmentGate && !hasConfirmationInput) {
        findings.push({
          ruleId: "release.manual-publish-without-approval",
          severity: "medium",
          title: "Manual artifact publishing lacks an approval gate",
          message:
            "A workflow_dispatch release workflow publishes a package, container image, GitHub release, or release automation without an environment gate or confirmation input.",
          filePath: workflow.path,
          line: findLine(workflow.content, "workflow_dispatch"),
          recommendation: "Use a protected GitHub environment or require an explicit confirmation input before publishing.",
        });
      }
    }

    return findings;
  },
};
