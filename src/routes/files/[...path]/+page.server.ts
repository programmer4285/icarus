import path from "node:path";
import { error, fail, redirect } from "@sveltejs/kit";
import { z } from "zod";
import { MUSIC_DIR } from "$app/env/private";
import { renameFileByTitle, resolveInLibrary } from "#lib/server/files.ts";
import { readTags, writeTags } from "#lib/server/tags.ts";
import type { Actions, PageServerLoad } from "./$types";

const requiredString = (label: string) =>
  z.string(`${label} is required`).trim().min(1, `${label} is required`);

const requiredNumber = (label: string) =>
  z.coerce
    .number(`${label} is required`)
    .int(`${label} must be an integer`)
    .min(1, `${label} must be >= 1`)
    .max(100, `${label} must be <= 100`)
    .transform((i) => String(i));

const tagFormSchema = z.object({
  title: requiredString("Title"),
  artist: requiredString("Artist"),
  albumArtist: requiredString("Album Artist"),
  album: requiredString("Album"),
  date: requiredString("Date"),
  trackNumber: requiredNumber("Track Number"),
  totalTracks: requiredNumber("Total Tracks"),
  discNumber: requiredNumber("Disc Number"),
  totalDiscs: requiredNumber("Total Discs"),
});

export const load: PageServerLoad = async ({ params }) => {
  const filePath = await resolveInLibrary(MUSIC_DIR, params.path);
  if (!filePath || !filePath.toLowerCase().endsWith(".m4a")) {
    error(404, "File not found");
  }

  try {
    const rawTags = await readTags(filePath);

    const [trackNumber = "", totalTracks = ""] = rawTags.tracknumber.split("/");
    const [discNumber = "", totalDiscs = ""] = rawTags.discnumber.split("/");

    const tags = {
      title: rawTags.title,
      artist: rawTags.artist,
      albumArtist: rawTags.albumartist,
      album: rawTags.album,
      date: rawTags.date,
      trackNumber,
      totalTracks,
      discNumber,
      totalDiscs,
    };

    return { path: params.path, tags };
  } catch (err) {
    console.error(err);
    error(500, `Could not read the tags of ${params.path}`);
  }
};

export const actions = {
  default: async ({ params, request }) => {
    const filePath = await resolveInLibrary(MUSIC_DIR, params.path);
    if (!filePath || !filePath.toLowerCase().endsWith(".m4a")) {
      error(404, "File not found");
    }

    const formData = await request.formData();
    const tagForm = Object.fromEntries(formData.entries());
    const parsed = tagFormSchema.safeParse(tagForm);
    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0].message });
    }

    const { data } = parsed;

    try {
      await writeTags(filePath, {
        title: data.title,
        artist: data.artist,
        albumartist: data.albumArtist,
        album: data.album,
        date: data.date,
        tracknumber: `${data.trackNumber}/${data.totalTracks}`,
        discnumber: `${data.discNumber}/${data.totalDiscs}`,
      });
    } catch (err) {
      console.error(err);
      return fail(500, { error: `Could not save the tags of ${params.path}` });
    }

    let newFilePath: string;
    try {
      newFilePath = await renameFileByTitle(filePath, data.trackNumber, data.title);
    } catch (err) {
      console.error(err);
      return fail(500, { error: `Tags saved, but the file could not be renamed: ${err}` });
    }

    // strip the root directory from the new path for the redirect URL
    // ex:
    //    params.path     = "path/to/song.m4a"
    //    newFilePath     = "/music/path/to/newSong.m4a"
    //    newRelativePath = "path/to/newSong.m4a"
    const newRelativePath = path.join(path.dirname(params.path), path.basename(newFilePath));

    const newURL = `/files/${encodeURIComponent(newRelativePath)}`;

    // remember redirect throws :) don't put this in a try/catch
    redirect(303, `${newURL}?saved=true`);
  },
} satisfies Actions;
