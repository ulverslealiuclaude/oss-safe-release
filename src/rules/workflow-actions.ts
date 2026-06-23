import type { Finding, Rule } from "../types";
import { findLine } from "../workflows";

const MUTABLE_REFS = ["main", "master", "HEAD"];

export const workflowActionsRule: Rule = {
  id: "workflow-actions",
  run(context) {
    const findings: Finding[] = [];

    for (const workflow of context.workflows) {
      for (const match of workflow.content.matchAll(/uses:\s*([^\s#]+)@([^\s#]+)/g)) {
        const action = match[1];
        const ref = match[2].replace(/["']/g, "");
        const isMutable = MUTABLE_REFS.includes(ref) || /^v\d+$/.test(ref);
        if (!isMutable) continue;

        findings.push({
          ruleId: "workflow.mutable-action-ref",
          severity: "high",
          title: "GitHub Action is pinned to a mutable ref",
          message: `${action} uses @${ref}, which can change without review.`,
          filePath: workflow.path,
          line: findLine(workflow.content, match[0]),
          recommendation: "Pin third-party actions to a full commit SHA and review updates intentionally.",
        });
      }

      if (/permissions:\s*write-all\b/.test(workflow.content)) {
        findings.push({
          ruleId: "workflow.write-all-permissions",
          severity: "critical",
          title: "Workflow grants write-all token permissions",
          message: "The workflow grants broad write access to the GitHub token.",
          filePath: workflow.path,
          line: findLine(workflow.content, "permissions: write-all"),
          recommendation: "Use least-privilege permissions such as contents: read unless write access is required.",
        });
      }

      const usesPullRequestTarget = /on:\s*pull_request_target\b/.test(workflow.content) || /-\s*pull_request_target\b/.test(workflow.content);
      const executesRepositoryCode = /uses:\s*actions\/checkout@/i.test(workflow.content) || /^\s*-\s*run:\s+/m.test(workflow.content);

      if (usesPullRequestTarget && executesRepositoryCode) {
        findings.push({
          ruleId: "workflow.pull-request-target-executes-code",
          severity: "high",
          title: "pull_request_target workflow appears to execute repository code",
          message: "pull_request_target runs with privileged context and should not execute untrusted pull request code.",
          filePath: workflow.path,
          line: findLine(workflow.content, "pull_request_target"),
          recommendation: "Use pull_request for untrusted code, or avoid checkout and shell execution in pull_request_target workflows.",
        });
      }
    }

    return findings;
  },
};
