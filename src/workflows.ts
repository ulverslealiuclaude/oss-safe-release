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
