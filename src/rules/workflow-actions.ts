import type { Finding, Rule } from "../types";
import { findLine } from "../workflows";

const MUTABLE_REFS = ["main", "master", "HEAD"];
const UNTRUSTED_CONTEXT_IN_RUN = /\brun:\s*.*\$\{\{\s*(github\.event|github\.head_ref|github\.base_ref)\b/;
const REMOTE_SCRIPT_PIPE = /\b(?:curl|wget)\b[^\n|]*https?:\/\/[^\n|]+\|\s*(?:sudo\s+)?(?:bash|sh)\b/i;
const SECRETS_INHERIT = /\bsecrets:\s*inherit\b/;
const WORKFLOW_CALL = /(^|\n)\s*workflow_call:\s*(\n|$)|\bon:\s*workflow_call\b/;
const TOP_LEVEL_PERMISSIONS = /^permissions:\s*/m;
const PACKAGE_NAME = "(?:@[a-z0-9_.-]+\\/)?[a-z0-9_.-]+";
const UNPINNED_GLOBAL_INSTALL = new RegExp(
  `\\b(?:(?:npm|pnpm)\\s+(?:install|i|add)\\s+(?:--global|-g)\\s+${PACKAGE_NAME}|yarn\\s+global\\s+add\\s+${PACKAGE_NAME})(?:\\s|$)`,
  "i",
);

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

      const untrustedRunLine = workflow.content.split(/\r?\n/).find((line) => UNTRUSTED_CONTEXT_IN_RUN.test(line));
      if (untrustedRunLine) {
        findings.push({
          ruleId: "workflow.untrusted-context-in-run",
          severity: "high",
          title: "Run step interpolates untrusted GitHub context",
          message: "A shell command directly interpolates event-controlled GitHub context, which can allow script injection.",
          filePath: workflow.path,
          line: findLine(workflow.content, untrustedRunLine),
          recommendation: "Pass untrusted context through an environment variable and quote it safely inside the script.",
        });
      }

      const remoteScriptPipeLine = workflow.content.split(/\r?\n/).find((line) => REMOTE_SCRIPT_PIPE.test(line));
      if (remoteScriptPipeLine) {
        findings.push({
          ruleId: "workflow.remote-script-pipe",
          severity: "high",
          title: "Workflow pipes a remote script into a shell",
          message: "The workflow downloads a remote script and executes it directly, which can run changed code without review.",
          filePath: workflow.path,
          line: findLine(workflow.content, remoteScriptPipeLine),
          recommendation: "Pin and verify installer contents, or vendor reviewed scripts into the repository before executing them.",
        });
      }

      const unpinnedGlobalInstallLine = workflow.content.split(/\r?\n/).find((line) => UNPINNED_GLOBAL_INSTALL.test(line));
      if (unpinnedGlobalInstallLine) {
        findings.push({
          ruleId: "workflow.unpinned-global-install",
          severity: "medium",
          title: "Workflow installs a global tool without a fixed version",
          message: "The workflow installs a global package without pinning its version, which can change CI or release behavior unexpectedly.",
          filePath: workflow.path,
          line: findLine(workflow.content, unpinnedGlobalInstallLine),
          recommendation: "Pin global tools to an explicit version, or use a lockfile-backed project dependency.",
        });
      }

      const secretsInheritLine = workflow.content.split(/\r?\n/).find((line) => SECRETS_INHERIT.test(line));
      if (secretsInheritLine) {
        findings.push({
          ruleId: "workflow.reusable-workflow-secrets-inherit",
          severity: "high",
          title: "Reusable workflow inherits all caller secrets",
          message: "The workflow passes all available caller secrets to a reusable workflow.",
          filePath: workflow.path,
          line: findLine(workflow.content, secretsInheritLine),
          recommendation: "Pass only the specific secrets required by the reusable workflow instead of using secrets: inherit.",
        });
      }

      if (WORKFLOW_CALL.test(workflow.content) && /\bsecrets:\s*\n/.test(workflow.content) && !TOP_LEVEL_PERMISSIONS.test(workflow.content)) {
        findings.push({
          ruleId: "workflow.workflow-call-secrets-without-permissions",
          severity: "medium",
          title: "Reusable workflow accepts secrets without explicit permissions",
          message: "The workflow accepts caller secrets but does not declare top-level GitHub token permissions.",
          filePath: workflow.path,
          line: findLine(workflow.content, "workflow_call"),
          recommendation: "Add explicit least-privilege permissions, such as permissions: contents: read, to reusable workflows that accept secrets.",
        });
      }
    }

    return findings;
  },
};
