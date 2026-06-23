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

export interface ScannerConfig {
  ignore?: IgnoreEntry[];
}

export interface IgnoreEntry {
  ruleId: string;
  path?: string;
}
