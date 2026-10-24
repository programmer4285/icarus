import path from "node:path";
import { z } from "zod";
import { defineEnvVars } from "@sveltejs/kit/env";
import { building } from "$app/env";

const requiredString = building ? z.string().default("") : z.string().min(1);

export const variables = defineEnvVars({
  ADMIN_USERNAME: {
    description: "Username for the admin login",
    schema: requiredString,
  },
  ADMIN_PASSWORD: {
    description: "Password for the admin login",
    schema: requiredString,
  },
  COOKIE_SECURE: {
    description: "Set to true when the app is served over HTTPS",
    schema: z.stringbool().default(false),
  },
  MUSIC_DIR: {
    description: "Folder where audio files are downloaded and browsed",
    schema: z
      .string()
      .default("/music")
      .transform((value) => path.resolve(value)),
  },
});
