import { error } from "@sveltejs/kit";
import { MUSIC_DIR } from "$app/env/private";
import { resolveInLibrary } from "#lib/server/files.ts";
import { readTags } from "#lib/server/tags.ts";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const filePath = await resolveInLibrary(MUSIC_DIR, params.path);
  if (!filePath || !filePath.toLowerCase().endsWith(".m4a")) {
    error(404, "File not found");
  }

  try {
    const tags = await readTags(filePath);
    return { path: params.path, tags };
  } catch (err) {
    console.error(err);
    error(500, `Could not read the tags of ${params.path}`);
  }
};
