import { constants } from "node:fs";
import { copyFile, mkdir, readdir, realpath, rename, rmdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { assert } from "es-toolkit";

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
    const resolvedPath = await resolveInFolder(rootDir, relativePath);
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

export async function resolveInFolder(
  rootDir: string,
  relativePath: string,
): Promise<string | null> {
  const folderRoot = await realpath(rootDir);

  let resolvedPath: string;
  try {
    resolvedPath = await realpath(path.resolve(folderRoot, relativePath));
  } catch {
    return null;
  }

  const isInsideFolder = resolvedPath.startsWith(folderRoot + path.sep);

  return isInsideFolder ? resolvedPath : null;
}

function toSafeName(name: string): string {
  // replace characters that are not allowed in file and folder names with "_" and,
  // replace sequences of whitespace with a single space
  const safeName = name
    .replace(/["*:<>?|/\\\p{Cc}]/gu, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\./, "_");

  assert(safeName, `"${name}" has no characters that can be used in a file or folder name`);

  return safeName;
}

export async function renameFileByTitle(
  filePath: string,
  trackNumber: string,
  title: string,
): Promise<string> {
  const safeTitle = toSafeName(title);

  const filename = `${trackNumber}. ${safeTitle}.m4a`;
  const newFilePath = path.join(path.dirname(filePath), filename);

  // if the filepath is unchanged (case-senstive) return early
  if (newFilePath === filePath) {
    return filePath;
  }

  // check if a file with the new name already exists
  const existingFile = await stat(newFilePath).catch(() => null);
  if (existingFile) {
    const currentFile = await stat(filePath);

    // compare by file system IDs (ino) and volumes (dev)
    const isSameFile = existingFile.ino === currentFile.ino && existingFile.dev === currentFile.dev;
    if (!isSameFile) {
      throw new Error(`a file named "${filename}" already exists`);
    }
  }

  await rename(filePath, newFilePath);

  return newFilePath;
}

export async function moveToLibrary(
  downloadDir: string,
  libraryDir: string,
  filePath: string,
  albumArtist: string,
  album: string,
): Promise<string> {
  const artistFolder = toSafeName(albumArtist);
  const albumFolder = toSafeName(album);
  const filename = path.basename(filePath);

  const destinationDir = path.join(libraryDir, artistFolder, albumFolder);
  await mkdir(destinationDir, { recursive: true });

  const destinationPath = path.join(destinationDir, filename);
  try {
    await copyFile(filePath, destinationPath, constants.COPYFILE_EXCL);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error(
        `a file named "${filename}" already exists in ${artistFolder}/${albumFolder}`,
      );
    }
    throw err;
  }

  await deleteFile(downloadDir, filePath);

  return destinationPath;
}

export async function deleteFile(downloadDir: string, filePath: string): Promise<void> {
  // delete the original file
  await unlink(filePath);

  // delete directories that are now empty after deleting the file
  const downloadRoot = await realpath(downloadDir);
  let dir = path.dirname(filePath);
  while (dir.startsWith(downloadRoot + path.sep)) {
    try {
      await rmdir(dir);
    } catch {
      break;
    }
    dir = path.dirname(dir);
  }
}
