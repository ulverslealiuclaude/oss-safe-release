import type { Finding, Rule } from "../types";
import { findLine } from "../workflows";

export const releaseRule: Rule = {
  id: "release",
  run(context) {
    const findings: Finding[] = [];

    for (const workflow of context.workflows) {
      const hasPullRequestTrigger = /on:\s*pull_request\b/.test(workflow.content) || /-\s*pull_request\b/.test(workflow.content);
      const publishesPackage = /\b(npm publish|pnpm publish|yarn npm publish|twine upload|cargo publish)\b/.test(workflow.content);

      if (!hasPullRequestTrigger || !publishesPackage) continue;

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

    return findings;
  },
};
