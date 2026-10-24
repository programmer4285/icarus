import { readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";

export type AudioFile = {
  path: string;
  size: number;
  modifiedAt: number;
};

export async function listAudioFiles(rootDir: string): Promise<AudioFile[]> {
  const entries = await readdir(rootDir, { recursive: true, withFileTypes: true });
  const files: AudioFile[] = [];

  for (const entry of entries) {
    const isHidden = entry.name.startsWith(".");
    const isAudio = path.extname(entry.name).toLowerCase() === ".m4a";
    if (!entry.isFile() || isHidden || !isAudio) {
      continue;
    }

    const relativePath = path.relative(rootDir, path.join(entry.parentPath, entry.name));
    const resolvedPath = await resolveInLibrary(rootDir, relativePath);
    if (!resolvedPath) {
      continue;
    }

    const stats = await stat(resolvedPath);
    files.push({
      path: relativePath,
      size: stats.size,
      modifiedAt: stats.mtimeMs,
    });
  }

  files.sort((a, b) => b.modifiedAt - a.modifiedAt);

  return files;
}

export async function resolveInLibrary(
  rootDir: string,
  relativePath: string,
): Promise<string | null> {
  const libraryRoot = await realpath(rootDir);

  let resolvedPath: string;
  try {
    resolvedPath = await realpath(path.resolve(libraryRoot, relativePath));
  } catch {
    return null;
  }

  const isInsideLibrary = resolvedPath.startsWith(libraryRoot + path.sep);

  return isInsideLibrary ? resolvedPath : null;
}
