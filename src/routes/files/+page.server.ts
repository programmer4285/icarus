import { error } from "@sveltejs/kit";
import { MUSIC_DIR } from "$app/env/private";
import { listAudioFiles } from "#lib/server/files.ts";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  try {
    const files = await listAudioFiles(MUSIC_DIR);
    return { files };
  } catch (err) {
    console.error(err);
    error(500, `Could not read the music folder at ${MUSIC_DIR}`);
  }
};
