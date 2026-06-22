import { readFile } from "node:fs/promises";
import { join } from "node:path";
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
    entries.map(async (entry) => ({
      path: normalizePath(entry),
      content: await readFile(join(rootDir, entry), "utf8"),
    })),
  );

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}
