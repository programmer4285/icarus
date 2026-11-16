import path from "node:path";
import { z } from "zod";
import { defineEnvVars } from "@sveltejs/kit/env";
import { building } from "$app/env";

// default to "" during svelte builds to prevent errors
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
      .transform((val) => path.resolve(val)),
  },
  LIBRARY_DIR: {
    description: "Library folder that tagged files are moved into as Album Artist/Album/file",
    schema: z
      .string()
      .default("/library")
      .transform((val) => path.resolve(val)),
  },
  MAX_JOBS: {
    description: "Maximum number of jobs kept in the job history",
    schema: z
      .string()
      .default("10")
      .transform(Number)
      .pipe(
        z
          .number("MAX_JOBS must be a number")
          .int("MAX_JOBS must be a whole number")
          .min(1, "MAX_JOBS must be >= 1")
          .max(1000, "MAX_JOBS must be <= 1000"),
      ),
  },
  MAX_CONCURRENT: {
    description: "Maximum number of downloads that run at the same time",
    schema: z
      .string()
      .default("1")
      .transform(Number)
      .pipe(
        z
          .number("MAX_CONCURRENT must be a number")
          .int("MAX_CONCURRENT must be a whole number")
          .min(1, "MAX_CONCURRENT must be >= 1")
          .max(10, "MAX_CONCURRENT must be <= 10"),
      ),
  },
});
