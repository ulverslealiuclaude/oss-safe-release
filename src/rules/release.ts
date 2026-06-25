import type { Finding, Rule } from "../types";
import { findLine } from "../workflows";

const TOP_LEVEL_PERMISSIONS = /^permissions:\s*/m;

export const releaseRule: Rule = {
  id: "release",
  run(context) {
    const findings: Finding[] = [];

    for (const workflow of context.workflows) {
      const hasPullRequestTrigger = /on:\s*pull_request\b/.test(workflow.content) || /-\s*pull_request\b/.test(workflow.content);
      const hasPushTrigger = /on:\s*push\b/.test(workflow.content) || /-\s*push\b/.test(workflow.content);
      const hasWorkflowDispatchTrigger = /on:\s*workflow_dispatch\b/.test(workflow.content) || /-\s*workflow_dispatch\b/.test(workflow.content);
      const publishesArtifact = /\b(npm publish|pnpm publish|yarn npm publish|twine upload|cargo publish|docker push|gh release create)\b/.test(
        workflow.content,
      );
      const publishLineNeedle = /\bgh release create\b/.test(workflow.content)
        ? "gh release create"
        : /\bdocker push\b/.test(workflow.content)
          ? "docker push"
          : "publish";

      if (!publishesArtifact) continue;

      if (!TOP_LEVEL_PERMISSIONS.test(workflow.content)) {
        findings.push({
          ruleId: "release.publish-without-explicit-permissions",
          severity: "medium",
          title: "Artifact publishing lacks explicit token permissions",
          message: "A publishing workflow does not declare top-level GitHub token permissions.",
          filePath: workflow.path,
          line: findLine(workflow.content, publishLineNeedle),
          recommendation: "Declare least-privilege top-level permissions for release workflows, such as contents: read plus only the write scopes required to publish.",
        });
      }

      if (hasPullRequestTrigger) {
        findings.push({
          ruleId: "release.publish-on-pull-request",
          severity: "critical",
          title: "Artifact publishing can run from pull requests",
          message: "A workflow triggered by pull_request appears to publish a package, container image, or GitHub release.",
          filePath: workflow.path,
          line: findLine(workflow.content, publishLineNeedle),
          recommendation: "Restrict publishing to trusted tag or release events and require least-privilege permissions.",
        });
      }

      const hasTrustedGate = /\b(on:\s*release|tags:|branches:|github\.ref\s*==|startsWith\(\s*github\.ref)/.test(workflow.content);
      if (hasPushTrigger && !hasTrustedGate) {
        findings.push({
          ruleId: "release.publish-without-trusted-gate",
          severity: "high",
          title: "Artifact publishing lacks a trusted release gate",
          message: "A push-triggered workflow appears to publish a package, container image, or GitHub release without a tag, release, branch, or github.ref gate.",
          filePath: workflow.path,
          line: findLine(workflow.content, publishLineNeedle),
          recommendation: "Restrict publishing to trusted release events, version tags, protected branches, or explicit github.ref conditions.",
        });
      }

      const hasEnvironmentGate = /\benvironment:\s*[^\s#]+/.test(workflow.content);
      const hasConfirmationInput = /\b(confirm|confirmation|approve|approval):\s*\n|\b(confirm|confirmation|approve|approval):\s*[^\n]+/.test(
        workflow.content,
      );
      if (hasWorkflowDispatchTrigger && !hasEnvironmentGate && !hasConfirmationInput) {
        findings.push({
          ruleId: "release.manual-publish-without-approval",
          severity: "medium",
          title: "Manual artifact publishing lacks an approval gate",
          message: "A workflow_dispatch release workflow publishes a package, container image, or GitHub release without an environment gate or confirmation input.",
          filePath: workflow.path,
          line: findLine(workflow.content, "workflow_dispatch"),
          recommendation: "Use a protected GitHub environment or require an explicit confirmation input before publishing.",
        });
      }
    }

    return findings;
  },
};
