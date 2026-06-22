import type { Finding, Rule } from "../types";

const SENSITIVE_FILE_PATTERNS = [/^\.env(\..*)?$/, /^\.npmrc$/, /^\.pypirc$/, /(^|\/)id_rsa$/, /\.(pem|key)$/];

export const secretsRule: Rule = {
  id: "secrets",
  run(context) {
    const findings: Finding[] = [];

    for (const file of context.files) {
      const name = file.path.split("/").at(-1) ?? file.path;
      if (!SENSITIVE_FILE_PATTERNS.some((pattern) => pattern.test(name))) continue;

      findings.push({
        ruleId: "secrets.sensitive-file-committed",
        severity: "critical",
        title: "Sensitive file appears to be committed",
        message: `${file.path} commonly contains credentials or private keys.`,
        filePath: file.path,
        recommendation: "Remove the file from git history if it contains secrets, rotate exposed credentials, and add it to .gitignore.",
      });
    }

    const gitignore = context.files.find((file) => file.path === ".gitignore");
    if (!gitignore || !/^\.env(\r?\n|$)/m.test(gitignore.content)) {
      findings.push({
        ruleId: "secrets.gitignore-missing-env",
        severity: "medium",
        title: ".gitignore does not cover .env",
        message: "Repositories should ignore local environment files by default.",
        filePath: gitignore?.path,
        recommendation: "Add .env and .env.* to .gitignore unless the repository intentionally tracks template files.",
      });
    }

    return findings;
  },
};
