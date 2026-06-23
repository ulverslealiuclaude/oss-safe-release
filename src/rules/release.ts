import type { Finding, Rule } from "../types";
import { findLine } from "../workflows";

export const releaseRule: Rule = {
  id: "release",
  run(context) {
    const findings: Finding[] = [];

    for (const workflow of context.workflows) {
      const hasPullRequestTrigger = /on:\s*pull_request\b/.test(workflow.content) || /-\s*pull_request\b/.test(workflow.content);
      const hasPushTrigger = /on:\s*push\b/.test(workflow.content) || /-\s*push\b/.test(workflow.content);
      const publishesPackage = /\b(npm publish|pnpm publish|yarn npm publish|twine upload|cargo publish)\b/.test(workflow.content);

      if (!publishesPackage) continue;

      if (hasPullRequestTrigger) {
        findings.push({
          ruleId: "release.publish-on-pull-request",
          severity: "critical",
          title: "Package publishing can run from pull requests",
          message: "A workflow triggered by pull_request appears to publish a package.",
          filePath: workflow.path,
          line: findLine(workflow.content, "publish"),
          recommendation: "Restrict publishing to trusted tag or release events and require least-privilege permissions.",
        });
      }

      const hasTrustedGate = /\b(on:\s*release|tags:|branches:|github\.ref\s*==|startsWith\(\s*github\.ref)/.test(workflow.content);
      if (hasPushTrigger && !hasTrustedGate) {
        findings.push({
          ruleId: "release.publish-without-trusted-gate",
          severity: "high",
          title: "Package publishing lacks a trusted release gate",
          message: "A push-triggered workflow appears to publish a package without a tag, release, branch, or github.ref gate.",
          filePath: workflow.path,
          line: findLine(workflow.content, "publish"),
          recommendation: "Restrict publishing to trusted release events, version tags, protected branches, or explicit github.ref conditions.",
        });
      }
    }

    return findings;
  },
};
