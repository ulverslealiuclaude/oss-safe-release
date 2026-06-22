# oss-safe-release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `oss-safe-release`, a TypeScript CLI and GitHub Action-ready scanner for common OSS release, GitHub Actions, and secret hygiene risks.

**Architecture:** The scanner is a deterministic local CLI. `src/scanner.ts` builds repository context, `src/rules/*` returns findings, and `src/reporters/*` writes console, Markdown, and JSON output. No external API calls are required for the first release.

**Tech Stack:** Node.js, TypeScript, Vitest, tsx, yaml, fast-glob, commander, npm package scripts.

---

## File Structure

- Create `package.json`: npm package metadata, scripts, CLI bin entry.
- Create `tsconfig.json`: TypeScript build configuration.
- Create `vitest.config.ts`: Vitest test config.
- Create `src/types.ts`: shared `Finding`, `Rule`, `RepoContext`, and severity types.
- Create `src/files.ts`: repository file discovery with safe exclusions.
- Create `src/workflows.ts`: GitHub Actions YAML loading and line helpers.
- Create `src/scanner.ts`: scanner orchestration and threshold exit model.
- Create `src/cli.ts`: CLI argument parsing and process exit.
- Create `src/rules/workflow-actions.ts`: mutable action reference and broad permissions rules.
- Create `src/rules/secrets.ts`: sensitive file and `.gitignore` coverage rules.
- Create `src/rules/release.ts`: risky release workflow rules.
- Create `src/reporters/markdown.ts`: Markdown report output.
- Create `src/reporters/json.ts`: JSON report output.
- Create `src/reporters/console.ts`: concise terminal summary.
- Create `tests/fixtures/*`: tiny fixture repositories.
- Create `tests/*.test.ts`: focused unit tests.
- Create `.github/workflows/ci.yml`: CI test workflow.
- Create `README.md`, `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `ROADMAP.md`.

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/types.ts`
- Create: `tests/types.test.ts`

- [ ] **Step 1: Write the first failing test**

Create `tests/types.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Finding } from "../src/types";

describe("Finding type", () => {
  it("supports stable rule metadata for reports", () => {
    const finding: Finding = {
      ruleId: "workflow.mutable-action-ref",
      severity: "high",
      title: "Action is not pinned",
      message: "actions/checkout uses a mutable ref.",
      filePath: ".github/workflows/ci.yml",
      line: 12,
      recommendation: "Pin the action to a full commit SHA.",
    };

    expect(finding.ruleId).toBe("workflow.mutable-action-ref");
    expect(finding.severity).toBe("high");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/types.test.ts`

Expected: fails because the npm project and `src/types.ts` do not exist yet.

- [ ] **Step 3: Create minimal scaffold**

Create `package.json`:

```json
{
  "name": "oss-safe-release",
  "version": "0.1.0",
  "description": "Local-first OSS maintainer safety checks for GitHub Actions, releases, and secrets.",
  "type": "module",
  "bin": {
    "oss-safe-release": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx src/cli.ts",
    "test": "vitest run",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "keywords": [
    "open-source",
    "github-actions",
    "security",
    "release",
    "cli"
  ],
  "license": "MIT",
  "dependencies": {
    "commander": "^12.1.0",
    "fast-glob": "^3.3.2",
    "yaml": "^2.5.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": ".",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*.ts", "tests/**/*.ts", "vitest.config.ts"]
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

Create `src/types.ts`:

```ts
export type Severity = "low" | "medium" | "high" | "critical";

export interface Finding {
  ruleId: string;
  severity: Severity;
  title: string;
  message: string;
  filePath?: string;
  line?: number;
  recommendation: string;
}

export interface RepoFile {
  path: string;
  content: string;
}

export interface WorkflowFile extends RepoFile {
  data: unknown;
}

export interface RepoContext {
  rootDir: string;
  files: RepoFile[];
  workflows: WorkflowFile[];
}

export interface Rule {
  id: string;
  run(context: RepoContext): Finding[];
}
```

- [ ] **Step 4: Install dependencies and verify green**

Run: `npm install`

Run: `npm test -- tests/types.test.ts`

Expected: test passes.

- [ ] **Step 5: Commit**

Run:

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts src/types.ts tests/types.test.ts
git commit -m "chore: scaffold TypeScript scanner project"
```

## Task 2: File Discovery

**Files:**
- Create: `src/files.ts`
- Create: `tests/files.test.ts`
- Create fixture files under `tests/fixtures/file-discovery`

- [ ] **Step 1: Write failing file discovery tests**

Create `tests/files.test.ts`:

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { discoverRepoFiles } from "../src/files";

describe("discoverRepoFiles", () => {
  it("loads relevant repository files and excludes generated directories", async () => {
    const root = join(process.cwd(), "tests/fixtures/file-discovery");
    await mkdir(join(root, ".github/workflows"), { recursive: true });
    await mkdir(join(root, "node_modules/pkg"), { recursive: true });
    await writeFile(join(root, ".github/workflows/ci.yml"), "name: ci\n");
    await writeFile(join(root, ".gitignore"), ".env\n");
    await writeFile(join(root, "node_modules/pkg/index.js"), "ignored");

    const files = await discoverRepoFiles(root);
    const paths = files.map((file) => file.path).sort();

    expect(paths).toContain(".github/workflows/ci.yml");
    expect(paths).toContain(".gitignore");
    expect(paths).not.toContain("node_modules/pkg/index.js");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/files.test.ts`

Expected: fails because `src/files.ts` does not exist.

- [ ] **Step 3: Implement file discovery**

Create `src/files.ts`:

```ts
import { readFile } from "node:fs/promises";
import { relative, sep } from "node:path";
import fg from "fast-glob";
import type { RepoFile } from "./types";

const EXCLUDED_DIRS = ["**/.git/**", "**/node_modules/**", "**/dist/**", "**/build/**", "**/coverage/**"];

export async function discoverRepoFiles(rootDir: string): Promise<RepoFile[]> {
  const entries = await fg(["**/*", ".github/workflows/*", ".gitignore", ".env*", ".npmrc", ".pypirc"], {
    cwd: rootDir,
    dot: true,
    onlyFiles: true,
    ignore: EXCLUDED_DIRS,
    followSymbolicLinks: false,
    unique: true,
  });

  const files = await Promise.all(
    entries.map(async (entry) => {
      const content = await readFile(`${rootDir}${sep}${entry}`, "utf8");
      return {
        path: normalizePath(relative(rootDir, `${rootDir}${sep}${entry}`)),
        content,
      };
    }),
  );

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function normalizePath(path: string): string {
  return path.split(sep).join("/");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/files.test.ts`

Expected: pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/files.ts tests/files.test.ts tests/fixtures/file-discovery
git commit -m "feat: discover repository files safely"
```

## Task 3: Workflow Parsing

**Files:**
- Create: `src/workflows.ts`
- Create: `tests/workflows.test.ts`

- [ ] **Step 1: Write failing workflow parsing tests**

Create `tests/workflows.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { RepoFile } from "../src/types";
import { parseWorkflowFiles } from "../src/workflows";

describe("parseWorkflowFiles", () => {
  it("parses GitHub workflow YAML files", () => {
    const files: RepoFile[] = [
      {
        path: ".github/workflows/ci.yml",
        content: "name: ci\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n",
      },
    ];

    const result = parseWorkflowFiles(files);

    expect(result).toHaveLength(1);
    expect(result[0].path).toBe(".github/workflows/ci.yml");
    expect(result[0].data).toMatchObject({ name: "ci" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/workflows.test.ts`

Expected: fails because `src/workflows.ts` does not exist.

- [ ] **Step 3: Implement workflow parsing**

Create `src/workflows.ts`:

```ts
import YAML from "yaml";
import type { RepoFile, WorkflowFile } from "./types";

export function parseWorkflowFiles(files: RepoFile[]): WorkflowFile[] {
  return files
    .filter((file) => /^\.github\/workflows\/.+\.ya?ml$/.test(file.path))
    .map((file) => ({
      ...file,
      data: YAML.parse(file.content),
    }));
}

export function findLine(content: string, needle: string): number | undefined {
  const index = content.split(/\r?\n/).findIndex((line) => line.includes(needle));
  return index === -1 ? undefined : index + 1;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/workflows.test.ts`

Expected: pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/workflows.ts tests/workflows.test.ts
git commit -m "feat: parse GitHub workflow files"
```

## Task 4: Workflow Safety Rules

**Files:**
- Create: `src/rules/workflow-actions.ts`
- Create: `tests/workflow-actions.test.ts`

- [ ] **Step 1: Write failing tests for mutable action refs and broad permissions**

Create `tests/workflow-actions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { RepoContext } from "../src/types";
import { workflowActionsRule } from "../src/rules/workflow-actions";

describe("workflowActionsRule", () => {
  it("flags actions pinned to mutable refs", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/ci.yml",
          content: "jobs:\n  test:\n    steps:\n      - uses: actions/checkout@main\n",
          data: {},
        },
      ],
    };

    const findings = workflowActionsRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "workflow.mutable-action-ref",
        severity: "high",
        filePath: ".github/workflows/ci.yml",
      }),
    );
  });

  it("flags write-all token permissions", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/release.yml",
          content: "permissions: write-all\njobs:\n  release:\n    steps: []\n",
          data: {},
        },
      ],
    };

    const findings = workflowActionsRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "workflow.write-all-permissions",
        severity: "critical",
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/workflow-actions.test.ts`

Expected: fails because rule file does not exist.

- [ ] **Step 3: Implement workflow safety rule**

Create `src/rules/workflow-actions.ts`:

```ts
import type { Finding, Rule } from "../types";
import { findLine } from "../workflows";

const MUTABLE_REFS = ["main", "master", "HEAD"];

export const workflowActionsRule: Rule = {
  id: "workflow-actions",
  run(context) {
    const findings: Finding[] = [];

    for (const workflow of context.workflows) {
      const usesMatches = workflow.content.matchAll(/uses:\s*([^\s#]+)@([^\s#]+)/g);
      for (const match of usesMatches) {
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
    }

    return findings;
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/workflow-actions.test.ts`

Expected: pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/rules/workflow-actions.ts tests/workflow-actions.test.ts
git commit -m "feat: detect risky GitHub Actions workflow patterns"
```

## Task 5: Secret Hygiene Rules

**Files:**
- Create: `src/rules/secrets.ts`
- Create: `tests/secrets.test.ts`

- [ ] **Step 1: Write failing tests for sensitive files and gitignore coverage**

Create `tests/secrets.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { RepoContext } from "../src/types";
import { secretsRule } from "../src/rules/secrets";

describe("secretsRule", () => {
  it("flags committed environment files", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [{ path: ".env", content: "TOKEN=abc" }],
      workflows: [],
    };

    const findings = secretsRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "secrets.sensitive-file-committed",
        severity: "critical",
        filePath: ".env",
      }),
    );
  });

  it("flags missing gitignore coverage for common secret files", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [{ path: ".gitignore", content: "node_modules\n" }],
      workflows: [],
    };

    const findings = secretsRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "secrets.gitignore-missing-env",
        severity: "medium",
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/secrets.test.ts`

Expected: fails because rule file does not exist.

- [ ] **Step 3: Implement secret hygiene rule**

Create `src/rules/secrets.ts`:

```ts
import type { Finding, Rule } from "../types";

const SENSITIVE_FILE_PATTERNS = [/^\.env(\..*)?$/, /^\.npmrc$/, /^\.pypirc$/, /(^|\/)id_rsa$/, /\.(pem|key)$/];

export const secretsRule: Rule = {
  id: "secrets",
  run(context) {
    const findings: Finding[] = [];

    for (const file of context.files) {
      const name = file.path.split("/").at(-1) ?? file.path;
      if (SENSITIVE_FILE_PATTERNS.some((pattern) => pattern.test(name))) {
        findings.push({
          ruleId: "secrets.sensitive-file-committed",
          severity: "critical",
          title: "Sensitive file appears to be committed",
          message: `${file.path} commonly contains credentials or private keys.`,
          filePath: file.path,
          recommendation: "Remove the file from git history if it contains secrets, rotate exposed credentials, and add it to .gitignore.",
        });
      }
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/secrets.test.ts`

Expected: pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/rules/secrets.ts tests/secrets.test.ts
git commit -m "feat: detect committed secret hygiene risks"
```

## Task 6: Scanner and Reporters

**Files:**
- Create: `src/scanner.ts`
- Create: `src/reporters/markdown.ts`
- Create: `src/reporters/json.ts`
- Create: `src/reporters/console.ts`
- Create: `tests/scanner.test.ts`
- Create: `tests/reporters.test.ts`

- [ ] **Step 1: Write failing scanner and reporter tests**

Create `tests/scanner.test.ts`:

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scanRepository } from "../src/scanner";

describe("scanRepository", () => {
  it("returns findings from all built-in rules", async () => {
    const root = join(process.cwd(), "tests/fixtures/scanner");
    await mkdir(join(root, ".github/workflows"), { recursive: true });
    await writeFile(join(root, ".github/workflows/ci.yml"), "permissions: write-all\njobs:\n  test:\n    steps:\n      - uses: actions/checkout@main\n");
    await writeFile(join(root, ".env"), "TOKEN=abc");

    const result = await scanRepository(root);

    expect(result.findings.map((finding) => finding.ruleId)).toEqual(
      expect.arrayContaining([
        "workflow.mutable-action-ref",
        "workflow.write-all-permissions",
        "secrets.sensitive-file-committed",
      ]),
    );
  });
});
```

Create `tests/reporters.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Finding } from "../src/types";
import { renderMarkdownReport } from "../src/reporters/markdown";
import { renderJsonReport } from "../src/reporters/json";

const findings: Finding[] = [
  {
    ruleId: "workflow.mutable-action-ref",
    severity: "high",
    title: "Action is not pinned",
    message: "actions/checkout uses a mutable ref.",
    filePath: ".github/workflows/ci.yml",
    line: 4,
    recommendation: "Pin to a full commit SHA.",
  },
];

describe("reporters", () => {
  it("renders Markdown reports with finding details", () => {
    const markdown = renderMarkdownReport(findings);

    expect(markdown).toContain("# oss-safe-release report");
    expect(markdown).toContain("workflow.mutable-action-ref");
    expect(markdown).toContain(".github/workflows/ci.yml:4");
  });

  it("renders JSON reports with findings", () => {
    const json = JSON.parse(renderJsonReport(findings));

    expect(json.findings[0].ruleId).toBe("workflow.mutable-action-ref");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/scanner.test.ts tests/reporters.test.ts`

Expected: fails because scanner and reporters do not exist.

- [ ] **Step 3: Implement scanner and reporters**

Create `src/scanner.ts`:

```ts
import { discoverRepoFiles } from "./files";
import { workflowActionsRule } from "./rules/workflow-actions";
import { secretsRule } from "./rules/secrets";
import type { Finding, RepoContext, Rule } from "./types";
import { parseWorkflowFiles } from "./workflows";

const BUILT_IN_RULES: Rule[] = [workflowActionsRule, secretsRule];
const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export interface ScanResult {
  findings: Finding[];
}

export async function scanRepository(rootDir: string): Promise<ScanResult> {
  const files = await discoverRepoFiles(rootDir);
  const context: RepoContext = {
    rootDir,
    files,
    workflows: parseWorkflowFiles(files),
  };
  const findings = BUILT_IN_RULES.flatMap((rule) => rule.run(context));

  return {
    findings: findings.sort((a, b) => {
      const severityDelta = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (severityDelta !== 0) return severityDelta;
      return `${a.filePath ?? ""}${a.ruleId}`.localeCompare(`${b.filePath ?? ""}${b.ruleId}`);
    }),
  };
}
```

Create `src/reporters/markdown.ts`:

```ts
import type { Finding } from "../types";

export function renderMarkdownReport(findings: Finding[]): string {
  const lines = ["# oss-safe-release report", "", `Findings: ${findings.length}`, ""];

  for (const finding of findings) {
    const location = finding.filePath ? `${finding.filePath}${finding.line ? `:${finding.line}` : ""}` : "repository";
    lines.push(`## ${finding.severity.toUpperCase()}: ${finding.title}`);
    lines.push("");
    lines.push(`- Rule: \`${finding.ruleId}\``);
    lines.push(`- Location: \`${location}\``);
    lines.push(`- Message: ${finding.message}`);
    lines.push(`- Recommendation: ${finding.recommendation}`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}
```

Create `src/reporters/json.ts`:

```ts
import type { Finding } from "../types";

export function renderJsonReport(findings: Finding[]): string {
  return `${JSON.stringify({ findings }, null, 2)}\n`;
}
```

Create `src/reporters/console.ts`:

```ts
import type { Finding } from "../types";

export function renderConsoleSummary(findings: Finding[]): string {
  if (findings.length === 0) return "oss-safe-release: no findings\n";

  const counts = findings.reduce<Record<string, number>>((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] ?? 0) + 1;
    return acc;
  }, {});

  return `oss-safe-release: ${findings.length} findings ` +
    `(critical=${counts.critical ?? 0}, high=${counts.high ?? 0}, medium=${counts.medium ?? 0}, low=${counts.low ?? 0})\n`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/scanner.test.ts tests/reporters.test.ts`

Expected: pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/scanner.ts src/reporters tests/scanner.test.ts tests/reporters.test.ts tests/fixtures/scanner
git commit -m "feat: scan repositories and render reports"
```

## Task 7: CLI

**Files:**
- Create: `src/cli.ts`
- Create: `tests/cli.test.ts`

- [ ] **Step 1: Write failing CLI behavior test**

Create `tests/cli.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createProgram } from "../src/cli";

describe("createProgram", () => {
  it("defines the scan command", () => {
    const program = createProgram();

    expect(program.commands.map((command) => command.name())).toContain("scan");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/cli.test.ts`

Expected: fails because `src/cli.ts` does not exist.

- [ ] **Step 3: Implement CLI**

Create `src/cli.ts`:

```ts
#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Command } from "commander";
import { renderConsoleSummary } from "./reporters/console";
import { renderJsonReport } from "./reporters/json";
import { renderMarkdownReport } from "./reporters/markdown";
import { scanRepository } from "./scanner";

export function createProgram(): Command {
  const program = new Command();
  program.name("oss-safe-release").description("OSS maintainer safety checks for releases, GitHub Actions, and secrets.");

  program
    .command("scan")
    .description("Scan a repository")
    .argument("[path]", "repository path", ".")
    .option("--markdown <path>", "write Markdown report", "safe-release-report.md")
    .option("--json <path>", "write JSON report", "safe-release-report.json")
    .action(async (targetPath: string, options: { markdown: string; json: string }) => {
      const rootDir = resolve(targetPath);
      const result = await scanRepository(rootDir);
      await writeFile(resolve(rootDir, options.markdown), renderMarkdownReport(result.findings));
      await writeFile(resolve(rootDir, options.json), renderJsonReport(result.findings));
      process.stdout.write(renderConsoleSummary(result.findings));
      process.exitCode = result.findings.some((finding) => finding.severity === "critical" || finding.severity === "high") ? 1 : 0;
    });

  return program;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await createProgram().parseAsync(process.argv);
}
```

- [ ] **Step 4: Run test, build, and smoke test**

Run: `npm test -- tests/cli.test.ts`

Run: `npm run build`

Run: `node dist/src/cli.js scan . --markdown work/self-report.md --json work/self-report.json`

Expected: test and build pass; smoke test writes reports and may exit non-zero if the repo has high findings.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/cli.ts tests/cli.test.ts
git commit -m "feat: add oss-safe-release CLI"
```

## Task 8: Release Risk Rule

**Files:**
- Create: `src/rules/release.ts`
- Modify: `src/scanner.ts`
- Create: `tests/release.test.ts`

- [ ] **Step 1: Write failing release risk test**

Create `tests/release.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { RepoContext } from "../src/types";
import { releaseRule } from "../src/rules/release";

describe("releaseRule", () => {
  it("flags package publishing in pull request workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/publish.yml",
          content: "on: pull_request\njobs:\n  publish:\n    steps:\n      - run: npm publish\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-on-pull-request",
        severity: "critical",
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/release.test.ts`

Expected: fails because release rule does not exist.

- [ ] **Step 3: Implement release rule and register it**

Create `src/rules/release.ts`:

```ts
import type { Finding, Rule } from "../types";
import { findLine } from "../workflows";

export const releaseRule: Rule = {
  id: "release",
  run(context) {
    const findings: Finding[] = [];

    for (const workflow of context.workflows) {
      const hasPullRequestTrigger = /on:\s*pull_request\b/.test(workflow.content) || /-\s*pull_request\b/.test(workflow.content);
      const publishesPackage = /\b(npm publish|pnpm publish|yarn npm publish|twine upload|cargo publish)\b/.test(workflow.content);

      if (hasPullRequestTrigger && publishesPackage) {
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
    }

    return findings;
  },
};
```

Modify `src/scanner.ts` to include `releaseRule`:

```ts
import { releaseRule } from "./rules/release";

const BUILT_IN_RULES: Rule[] = [workflowActionsRule, secretsRule, releaseRule];
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/release.test.ts tests/scanner.test.ts`

Expected: pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/rules/release.ts src/scanner.ts tests/release.test.ts
git commit -m "feat: detect risky release workflow triggers"
```

## Task 9: Open Source Packaging and Docs

**Files:**
- Create: `README.md`
- Create: `LICENSE`
- Create: `SECURITY.md`
- Create: `CONTRIBUTING.md`
- Create: `ROADMAP.md`
- Create: `.github/workflows/ci.yml`
- Create: `.github/actions/oss-safe-release/action.yml`

- [ ] **Step 1: Create docs and CI**

Create documentation that explains:

- what `oss-safe-release` does
- installation with `npx oss-safe-release scan`
- GitHub Action example
- report examples
- limitations
- contribution workflow
- security policy

Create `.github/workflows/ci.yml`:

```yaml
name: ci

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
```

- [ ] **Step 2: Run full verification**

Run: `npm test`

Run: `npm run build`

Run: `npm run lint`

Expected: all pass.

- [ ] **Step 3: Commit**

Run:

```bash
git add README.md LICENSE SECURITY.md CONTRIBUTING.md ROADMAP.md .github
git commit -m "docs: prepare project for open source release"
```

## Task 10: Application Materials

**Files:**
- Create: `outputs/codex-for-oss-application-draft.md`
- Create: `outputs/project-launch-checklist.md`

- [ ] **Step 1: Draft Codex for OSS application**

Create an application draft with:

- repository description
- maintainer role explanation
- why the project matters
- API credits usage plan
- Codex Security interest
- evidence checklist to fill after GitHub publication

- [ ] **Step 2: Create launch checklist**

Create checklist covering:

- GitHub username
- public repository URL
- ChatGPT account email
- OpenAI organization ID
- npm account decision
- first release tag
- first outreach targets

- [ ] **Step 3: Commit**

Run:

```bash
git add outputs/codex-for-oss-application-draft.md outputs/project-launch-checklist.md
git commit -m "docs: draft Codex for OSS application materials"
```

## Self-Review

- Spec coverage: The plan covers CLI, GitHub Action readiness, workflow checks, secret hygiene, release checks, reports, tests, docs, and application materials.
- Completion scan: No task relies on unresolved content. External user-specific fields are intentionally collected in the launch checklist.
- Type consistency: Shared types are introduced in Task 1 and reused consistently by scanner, rules, and reporters.
- Scope check: This is one focused CLI project. Hosted services, AI explanations, and full SAST scanning remain outside the first release.
