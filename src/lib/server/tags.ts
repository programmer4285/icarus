import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";

const TAGS_SCRIPT = "scripts/tags.py";

// convert execFile from a callback to a promise
const execFileAsync = promisify(execFile);

// some of these tags may not exist so default
// to an empty string
const tagsSchema = z.object({
  title: z.string().default(""),
  artist: z.string().default(""),
  albumartist: z.string().default(""),
  album: z.string().default(""),
  date: z.string().default(""),
  tracknumber: z.string().default(""),
  discnumber: z.string().default(""),
});

export type Tags = z.infer<typeof tagsSchema>;

export async function readTags(filePath: string): Promise<Tags> {
  try {
    const { stdout } = await execFileAsync("uv", ["run", "--quiet", TAGS_SCRIPT, "read", filePath]);

    return tagsSchema.parse(JSON.parse(stdout));
  } catch (cause) {
    throw new Error(`failed to read tags`, { cause });
  }
}

export async function writeTags(filePath: string, tags: Tags): Promise<void> {
  try {
    const running = execFileAsync("uv", ["run", "--quiet", TAGS_SCRIPT, "write", filePath]);

    // send the tags to the python script and end the input stream
    running.child.stdin?.end(JSON.stringify(tags));

    await running;
  } catch (cause) {
    throw new Error(`failed to write tags`, { cause });
  }
}
