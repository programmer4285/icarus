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

export async function renameFileByTitle(
  filePath: string,
  trackNumber: string,
  title: string,
): Promise<string> {
  // strip characters that are not allowed in filenames and,
  // replace sequences of whitespace with a single space
  const safeTitle = title
    .replace(/["*:<>?|/\\\p{Cc}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

  assert(safeTitle, `the title "${title}" has no characters that can be used in a filename`);

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
  musicDir: string,
  libraryDir: string,
  filePath: string,
  albumArtist: string,
  album: string,
): Promise<string> {
  // replace chars that can't be in folder names with "_"
  const toFolderName = (name: string) => {
    const folderName = name
      .replace(/["*:<>?|/\\\p{Cc}]/gu, "_")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^\./, "_");

    assert(folderName, `"${name}" has no characters that can be used in a folder name`);

    return folderName;
  };

  const artistFolder = toFolderName(albumArtist);
  const albumFolder = toFolderName(album);
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

  await deleteFile(musicDir, filePath);

  return destinationPath;
}

export async function deleteFile(musicDir: string, filePath: string): Promise<void> {
  // delete the original file
  await unlink(filePath);

  // delete directories that are now empty after deleting the file
  const musicRoot = await realpath(musicDir);
  let dir = path.dirname(filePath);
  while (dir.startsWith(musicRoot + path.sep)) {
    try {
      await rmdir(dir);
    } catch {
      break;
    }
    dir = path.dirname(dir);
  }
}
