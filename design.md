# Icarus — Design

A self-hosted, Dockerized web app that takes YouTube links (single videos or playlists), extracts the audio with `yt-dlp`, saves it to a mounted music folder, and lets you browse those files and edit their tags by hand.

## Goals

1. Submit a YouTube video or playlist URL and get audio files written to a mounted folder.
2. See the jobs that are running (and recently finished or failed), with per-track progress.
3. Browse the audio files in the mounted folder.
4. Select a file and edit its tags with a form, keeping every tag the form doesn't cover.
5. Protect everything behind a single admin login configured with env vars.
6. Build it in very small, reviewable chunks (see [Implementation plan](#implementation-plan)).

## Non-goals (for now)

- MusicBrainz lookups. Tags are entered by hand for now (see [Later](#later--nice-to-have)).
- Automated tests.
- Multiple users or roles. There is one admin account, set with env vars.
- Sources other than YouTube. `yt-dlp` supports them, but we only accept YouTube URLs.
- Moving or renaming files after download. The yt-dlp output template decides the layout.
- Batch tagging a whole album in one action. Editing one file at a time comes first.
- Job history that survives a restart.

## Code style

These rules come from `CLAUDE.md` and apply to every chunk, including the scripts:

1. No code comments.
2. Colocate related code in the same file.
3. Avoid folder and file sprawl.
4. Use enums instead of string unions in server code. Frontend code can use string unions.
5. Prefer `type` over `interface`.
6. No tiny single-use helper functions. Prefer longer function bodies that contain the whole implementation.
7. Simplicity.
8. Readability over conciseness.
9. Use upper case for acronyms in names. `toJson` -> `toJSON`
10. Use `assert` from es-toolkit for checking assumptions & preconditions, such as a variable being defined/non-null.
11. Use dependency injection. Functions take dependencies as parameters instead of referencing global variables. This keeps code testable.

What this means for the design:

- All server code is flat in `src/lib/server/`, one file per concern (see [Code layout](#code-layout)). Each file holds everything for its concern: its enums, types, state and functions.
- The tools that aren't TypeScript, yt-dlp and mutagen, are wrapped in two scripts in `scripts/`. The TypeScript side just spawns them.
- A function is pulled out only when more than one place calls it.
- Env vars are declared and validated in `src/env.ts`, the SvelteKit 3 convention. Only routes and hooks import them from `$app/env/private`, and they pass the values into `src/lib/server/` functions as parameters (rule 11). For example, the files page calls `listAudioFiles(MUSIC_DIR)`.

## Decisions

| Topic              | Decision                                                                                                                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audio format       | `--audio-format m4a --audio-quality 0`: always M4A. The only format the app downloads, lists, and tags (see [Why M4A only](#why-m4a-only))                                                                             |
| Folder layout      | Everything under one `MUSIC_DIR`, laid out by the output template (`Artist/Album/NN. Title.ext`). No per-playlist folders                                                                                              |
| Job history        | In memory only, capped at `MAX_JOBS` (see [Job history limit](#job-history-limit))                                                                                                                                     |
| Auth               | One admin user; `ADMIN_USERNAME` and `ADMIN_PASSWORD` env vars; session cookie                                                                                                                                         |
| `watch?v=X&list=Y` | Download just the video (`--no-playlist`)                                                                                                                                                                              |
| Downloading        | A shell script, `scripts/download.sh`, holds the yt-dlp command. The app spawns it                                                                                                                                     |
| Tagging            | A Python script, `scripts/tags.py`, uses mutagen. The app spawns it. A manual form for seven tags (track and disc each shown as number + total inputs); every other tag on the file is kept. No MusicBrainz lookup yet |
| Tests              | None for now. Each chunk must pass `bun run check`                                                                                                                                                                     |
| Styling            | Plain CSS: Svelte component-scoped styles plus a few global CSS variables. No UI kit                                                                                                                                   |

**Why plain CSS:** there are only five pages (login, home, jobs, files, editor), and they're mostly forms and tables. A UI kit would add a dependency and make every diff larger to review. Svelte already scopes styles per component, and a small `app.css` with color and spacing variables keeps things consistent.

**Why scripts:** you can run the exact same command by hand to debug it, outside the app. They also keep all the yt-dlp flags and mutagen details out of the TypeScript, so each side stays small.

### Why M4A only

- **One format to tag.** `tags.py` only handles MP4 atoms through mutagen's `EasyMP4`, with no per-format branches.
- **Matches what you already get.** Your `--audio-format best` runs already produce M4A, probably because the `player-client=android` extractor arg mostly offers AAC audio (not verified). Setting `m4a` explicitly guards against that changing.
- **Probably no re-encode.** When the source audio is already AAC, yt-dlp should copy it into the `.m4a` container rather than re-encode. The docs don't state this outright, so chunk 16 checks it. If YouTube ever sends only Opus, yt-dlp re-encodes to AAC: a small quality loss, but it still works.
- **Trade-off:** files of other formats that you add to the folder by hand (MP3, FLAC, Opus) don't show up in the app. Supporting another format later means adding it to `files.ts` and a branch in `tags.py`.

## Tech stack

| Concern       | Choice                                          | Notes                                                         |
| ------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| Web framework | SvelteKit 3 + Svelte 5 (runes)                  | Already scaffolded                                            |
| Runtime       | Bun (`@sveltejs/adapter-bun`)                   | Already configured                                            |
| Language      | TypeScript (strict)                             | Imports use the `#lib` alias from `package.json`              |
| Lint/format   | oxlint, oxfmt via lefthook                      | Already configured                                            |
| Styling       | Plain CSS                                       |                                                               |
| Downloader    | `yt-dlp` + `ffmpeg`, via `scripts/download.sh`  | Bash                                                          |
| Tag editing   | `mutagen`, via `scripts/tags.py`, run with `uv` | Dependencies declared in the script, locked in `tags.py.lock` |
| Job state     | In-memory array                                 |                                                               |
| Validation    | `zod`                                           | Env var schemas in `src/env.ts`                               |
| Utilities     | `es-toolkit`                                    | `assert` for preconditions                                    |

**Local development (macOS):** `brew install uv yt-dlp ffmpeg`. `tags.py` declares its own dependencies in an inline metadata block (PEP 723) and is run with `uv run scripts/tags.py …`, so uv installs mutagen into a cached environment automatically. `scripts/tags.py.lock` pins the exact version (`uv lock --script scripts/tags.py`).

## Code layout

```
scripts/
├─ download.sh                     yt-dlp command: "video <url>" and "playlist <url>"
└─ tags.py                         mutagen: "read <path>" and "write <path>"
src/
├─ app.css                         CSS variables
├─ hooks.server.ts                 auth guard on every request
├─ lib/server/
│  ├─ auth.ts                      credential check, session store
│  ├─ jobs.ts                      JobStatus/JobKind enums, Job/Track types, job store, MAX_JOBS, queue, submitURL
│  ├─ ytdlp.ts                     spawns download.sh, parses progress, playlist expansion
│  ├─ files.ts                     listAudioFiles, resolveInLibrary
│  └─ tags.ts                      Tags type, readTags/writeTags (spawn `uv run tags.py`)
└─ routes/
   ├─ +layout.svelte               nav, imports app.css
   ├─ login/+page.svelte
   ├─ login/+page.server.ts        login action
   ├─ logout/+server.ts            logout endpoint (POST)
   ├─ +page.svelte                 submit form
   ├─ +page.server.ts              submit action
   ├─ jobs/+page.svelte
   ├─ jobs/+page.server.ts         load jobs, cancel/retry/clear actions
   ├─ files/+page.svelte
   ├─ files/+page.server.ts        load file list
   ├─ files/[...path]/+page.svelte
   └─ files/[...path]/+page.server.ts   load tags, save action
```

The placeholder `downloads/` and `tagging/` folders get removed in chunk 2.

```
┌──────────────────────── Docker container ────────────────────────┐
│  SvelteKit (Bun)                                                 │
│   ├─ hooks.server.ts ──► auth.ts                                 │
│   ├─ routes ──► jobs.ts ──► ytdlp.ts ──► download.sh ──► yt-dlp  │
│   │         ├─► files.ts                                         │
│   │         └─► tags.ts ──► tags.py ──► mutagen                  │
│  uv, yt-dlp, ffmpeg (in image)                                   │
└───────────────┬──────────────────────────────────────────────────┘
                │ bind mount
          host: ~/music        →  container: /music  (MUSIC_DIR)
```

Everything under `src/lib/server/` is server-only, so none of it can be imported into client code. Scripts are always spawned with an argument array, never through a shell string, so a URL or file path can't inject commands.

### Configuration (environment variables)

| Variable          | Default                                     | Used by                                  | Purpose                                                               |
| ----------------- | ------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| `ADMIN_USERNAME`  | required                                    | login route → `auth.ts`                  | Login username                                                        |
| `ADMIN_PASSWORD`  | required                                    | login route → `auth.ts`                  | Login password                                                        |
| `COOKIE_SECURE`   | `false`                                     | login/logout routes                      | Set to `true` when served over HTTPS (see [Login](#feature-0--login)) |
| `MUSIC_DIR`       | `/music`                                    | files routes → `files.ts`, `download.sh` | Where audio files are written and browsed                             |
| `OUTPUT_TEMPLATE` | see [Running downloads](#running-downloads) | `download.sh`                            | yt-dlp `-o` template, relative to `MUSIC_DIR`                         |
| `MAX_CONCURRENT`  | `1`                                         | routes → `jobs.ts`                       | Number of tracks downloaded at once                                   |
| `MAX_JOBS`        | `50`                                        | routes → `jobs.ts`                       | Maximum number of jobs kept in history                                |
| `PORT`            | `3000`                                      | adapter                                  | HTTP port                                                             |

Every variable is declared in `src/env.ts` with SvelteKit 3's `defineEnvVars`, each with a `description` and a zod `schema` that applies the default, converts the value (e.g. `z.stringbool()` turns `"true"` into a boolean) and rejects invalid values. Server files import the typed values from `$app/env/private`. SvelteKit runs the schemas when the app starts, so a missing or invalid variable stops the app with a clear `env_invalid` error. Required variables are allowed to be empty while `building` (from `$app/env`), because SvelteKit runs the app during `bun run build` and they aren't set in the Docker build stage. Each variable is added to `src/env.ts` in the chunk that first uses it. Spawned scripts inherit the app's environment, so `download.sh` sees `MUSIC_DIR` and `OUTPUT_TEMPLATE` directly.

## Feature 0 — Login

**Page:** `/login`

**`auth.ts` exports** `login(sessions, submitted, admin)`, `isValidSession(sessions, token)`, `logout(sessions, token)` and `sessionCookieOpts(secure)`. Following rule 11, it reads no env vars and holds no state: `hooks.server.ts` creates the session `Map` and shares it with routes through `event.locals.sessions`, and the login and logout routes pass in `ADMIN_USERNAME`, `ADMIN_PASSWORD` and `COOKIE_SECURE`.

- A username + password form, handled by a SvelteKit form action.
- The credentials are compared against `ADMIN_USERNAME` and `ADMIN_PASSWORD` in constant time. Hash both sides, then use `crypto.timingSafeEqual`, so length differences don't leak.
- On success:
  - Create a random session token (32 bytes from `crypto.randomBytes`, hex-encoded).
  - Store it in an in-memory `Map` with an expiry of 30 days.
  - Set it as a cookie: `httpOnly`, `sameSite: "lax"`, `path: "/"`, and `secure` set from `COOKIE_SECURE`.
- On failure, show a generic "invalid username or password" message and wait ~500 ms before responding, to slow guessing.
- **Logout:** a POST endpoint, `/logout/+server.ts`, that deletes the session, clears the cookie and redirects to `/login`. It's an endpoint rather than a form action because it has no page of its own. The nav shows a "Log out" button (a small form posting to `/logout`) on every page except `/login`.
- **Guard:** `hooks.server.ts` redirects any request without a valid session to `/login?next=<path>`, except `/login` and `/logout`. `/logout` is let through so that a stale tab (e.g. after a server restart cleared the sessions) logs out cleanly, instead of being sent to `/login?next=/logout` and then hitting a GET on a POST-only endpoint.
- Sessions are in memory, so a container restart logs you out.

**Cookie gotcha:** SvelteKit sets cookies as `Secure` by default, except on `localhost`. Browsers drop `Secure` cookies sent over plain HTTP, so on a LAN address like `http://192.168.1.10:3000` login would silently fail. That's why `secure` is set explicitly from `COOKIE_SECURE`.

**CSRF:** SvelteKit's built-in origin check covers every form POST, including form actions and endpoints like `/logout`. It's turned off in the dev server, so it can only be tested against a production build (add this to the Docker phase checks). Behind a reverse proxy, the adapter needs to know the public origin (check `adapter-bun`'s `ORIGIN` / header settings in the Docker phase).

## Feature 1 — Submitting a link

**Page:** `/` (home)

**`jobs.ts` exports** `submitURL(url)`. It validates the URL, creates the job, and queues it, and it returns either the new job or an error message.

- A single text input plus a Submit button, handled by a SvelteKit form action.
- Validation:
  - The URL host must be `youtube.com`, `www.youtube.com`, `m.youtube.com`, `music.youtube.com`, or `youtu.be`.
  - Classify the link as a **video** (`watch?v=`, `youtu.be/…`, `shorts/…`) or a **playlist** (`playlist?list=`).
  - A `watch?v=X&list=Y` link counts as a **video**. Only `v` is used.
- On success, redirect to `/jobs`.
- On failure, show the error inline next to the input.

### Playlist expansion

For playlists, `ytdlp.ts` runs `download.sh playlist <url>`, which prints the playlist as JSON (id + title per entry) without downloading anything. Each entry becomes one **track** inside the job. Each track is then downloaded as its own `download.sh video <url>` run, which gives per-track progress and per-track failures.

## Feature 2 — Jobs page

**Page:** `/jobs`

### Data model

```ts
enum JobStatus {
  Queued = "queued",
  Running = "running",
  Done = "done",
  Failed = "failed",
  Cancelled = "cancelled",
}

enum JobKind {
  Video = "video",
  Playlist = "playlist",
}

type Track = {
  videoID: string;
  title: string;
  status: JobStatus;
  progress: number;
  outputPath?: string;
  error?: string;
};

type Job = {
  id: string;
  url: string;
  kind: JobKind;
  title: string;
  status: JobStatus;
  createdAt: number;
  tracks: Track[];
};
```

- `progress` is 0–100. `outputPath` is relative to `MUSIC_DIR` and is set once the track is done.
- A job's status is derived from its tracks: running if any track is running, failed if all tracks failed, and so on.

### Job history limit

Jobs are kept in an in-memory array, newest first. Whenever a new job is added and there are more than `MAX_JOBS` jobs, the oldest **finished** jobs (`Done`, `Failed`, `Cancelled`) are removed until the count is back at the limit. Queued and running jobs are never removed, so the list can briefly go over the limit if you queue more than `MAX_JOBS` at once.

### Running downloads

Your current command:

```
yt-dlp --embed-metadata --embed-thumbnail \
       --extractor-args "youtube:player-client=android" \
       -x --audio-format best --audio-quality 0 \
       -o "%(artist)s/%(album)s/%(track_number)02d. %(title)s.%(ext)s" <url>
```

**`scripts/download.sh`** has two modes:

| Mode             | Command                            | Output                                   |
| ---------------- | ---------------------------------- | ---------------------------------------- |
| `video <url>`    | Your command, plus the flags below | Progress lines, then the final file path |
| `playlist <url>` | `yt-dlp --flat-playlist -J <url>`  | The playlist as one JSON object          |

In `video` mode, the script runs your command with a few flags added so the app can drive it:

```
yt-dlp --embed-metadata --embed-thumbnail \
       --extractor-args "youtube:player-client=android" \
       -x --audio-format m4a --audio-quality 0 \
       -P "$MUSIC_DIR" -o "$OUTPUT_TEMPLATE" \
       --no-playlist --no-overwrites \
       --newline --progress-template "download:[progress]%(progress._percent_str)s" \
       --print after_move:filepath \
       "$2"
```

| Added flag                             | Why                                                                                                                                                               |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--audio-format m4a` (replaces `best`) | Always M4A (see [Why M4A only](#why-m4a-only))                                                                                                                    |
| `-P "$MUSIC_DIR"`                      | Base folder for the output template                                                                                                                               |
| `--no-playlist`                        | Guarantees one video per run, even for `&list=` links                                                                                                             |
| `--no-overwrites`                      | Re-submitting a link never clobbers a file you've already re-tagged                                                                                               |
| `--newline --progress-template …`      | One progress line per update, with a fixed prefix that's easy to parse                                                                                            |
| `--print after_move:filepath`          | The final path after extraction and thumbnail embedding. The yt-dlp docs say this is the reliable way to get it, because post-processing can change the extension |

The script uses `set -euo pipefail` and `exec`s yt-dlp, so yt-dlp's exit code and output pass straight through, and killing the script process kills the download (used by cancel). You can run it by hand, e.g. `MUSIC_DIR=~/Music/test scripts/download.sh video <url>`.

**`ytdlp.ts`** spawns the script with `Bun.spawn(["scripts/download.sh", "video", url])` and:

- reads stdout line by line. Lines with the `[progress]` prefix update `track.progress`. The last non-progress line is the file path.
- marks the track `Failed` on a non-zero exit, and keeps the last few stderr lines as `error`.

A small queue in `jobs.ts` runs up to `MAX_CONCURRENT` tracks at a time.

**Output template and missing fields.** Your template relies on `artist`, `album`, and `track_number`. Those exist for official "auto-generated by YouTube" music uploads, but not for ordinary videos. When a field is missing, yt-dlp puts in `NA`, so a random video becomes `NA/NA/NA. Title.m4a`. The script's default (`${OUTPUT_TEMPLATE:-…}`) uses yt-dlp's documented `|default` and `&replacement` syntax:

```
%(artist,uploader|Unknown Artist)s/%(album|Singles)s/%(track_number&{:02d}. |)s%(title)s.%(ext)s
```

- Falls back to the uploader name if there's no artist.
- Uses `Singles` if there's no album.
- Leaves out the `NN.` prefix entirely when there's no track number.

`OUTPUT_TEMPLATE` lets you override it, including with your original template.

### UI

- A list of jobs, newest first, each showing title, status, and overall progress.
- Each job expands to its tracks, showing a progress bar per track and the error text for failures.
- The page's `load` function returns the job list. While any job is queued or running, the page calls `invalidateAll()` every ~2 seconds to reload it. This needs no separate JSON endpoint.
- Later chunks: cancel a job, retry failed tracks, clear finished jobs. These are form actions on the same page.

## Feature 3 — Files page

**Page:** `/files`

**`files.ts` exports** `listAudioFiles(rootDir)` and `resolveInLibrary(rootDir, relativePath)`. The routes pass `MUSIC_DIR` as `rootDir`.

- Recursively list audio files under `MUSIC_DIR` (the `Artist/Album/` folders), keeping only `.m4a` files.
- Show path (relative), size, and modified time.
- Sort by modified time (newest first) by default. Add a simple client-side text filter.
- Clicking a file opens the editor at `/files/<relative path>`.

### Path safety

Every path coming from the client is resolved against `MUSIC_DIR`. The request is rejected if the resolved real path (symlinks followed) falls outside `MUSIC_DIR`. `resolveInLibrary(relPath)` owns this check. It's used by both the editor's load function and its save action. `tags.py` is only ever given a path that has passed this check.

## Feature 4 — Tag editor

**Page:** `/files/[...path]`

**`tags.ts` exports** `readTags(path)` and `writeTags(path, tags)`. They spawn `uv run scripts/tags.py` and pass data as JSON.

### Fields

```ts
type Tags = {
  title: string;
  artist: string;
  albumartist: string;
  album: string;
  date: string;
  tracknumber: string;
  discnumber: string;
};
```

`tracknumber` and `discnumber` hold a number and an optional total in one string, e.g. `"3/12"` or `"3"`. That's how M4A stores them: one atom holds both numbers. The form shows them as two inputs each (number and total), and the save action joins them back into `"n/total"` (or `"n"` with no total) before calling `writeTags`. Everything else in the stack treats them as plain text.

All values are strings. Number inputs use `<input type="number">`. An empty field leaves that tag as it is on the file: the app never deletes tags, so a tag can't be removed from the editor.

### `scripts/tags.py`

| Mode           | Input                                                                                                               | Output                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `read <path>`  | —                                                                                                                   | JSON object on stdout with only the fields the file has (`{}` if untagged). `readTags`'s zod schema defaults missing fields to `""` |
| `write <path>` | JSON object with the seven fields on stdin. Fields with a value are set; empty or missing fields are left unchanged | Nothing. Exits 0 on success. Invalid input (e.g. a track number of `3/abc`) fails before saving, so the file is left untouched      |

On any error, it prints a message to stderr and exits non-zero. `tags.ts` turns that into an error shown on the page.

The script opens the file with mutagen's `EasyMP4`, which maps readable key names to MP4 atoms. Every field is passed through as a string, with no per-field special cases:

| Field         | MP4 atom                     |
| ------------- | ---------------------------- |
| `title`       | `©nam`                       |
| `artist`      | `©ART`                       |
| `albumartist` | `aART`                       |
| `album`       | `©alb`                       |
| `date`        | `©day`                       |
| `tracknumber` | `trkn` (number + total pair) |
| `discnumber`  | `disk` (number + total pair) |

`EasyMP4` converts `trkn`/`disk` to and from `"n/total"` strings itself. These are the standard iTunes atoms, which is also what [Picard](https://picard-docs.musicbrainz.org/en/appendices/tag_mapping.html) writes. So Navidrome, Jellyfin, beets, Plex and Apple Music all read them.

### Keeping other tags

A save changes **only** the seven fields above. Everything else on the file stays exactly as it was. That includes:

- the cover art from `--embed-thumbnail`
- `comment` / `purl` (the YouTube URL), `description`, and `genre` from `--embed-metadata`
- any tags added by other tools

`write` loads the file's existing tags, sets just the keys that have a value, and calls `save()`. mutagen updates tags in place this way, and never touches keys it wasn't asked to change. When writing tags is implemented, compare `ffprobe` output from before and after a save to check this by hand.

### Flow

1. Load the file's current tags into the form. They're usually prefilled by `--embed-metadata`.
2. Edit the fields, then **Save**, which is a form action that calls `writeTags`.
3. Show success or the error.

Saving tags does **not** rename or move the file, even if the artist or album changes.

## Docker

- Multi-stage `Dockerfile`:
  1. `oven/bun` build stage: `bun install`, `bun run --bun build`. `adapter-bun` refuses to build unless Vite runs under Bun. **Known issue:** with Bun 1.3.4, Vite 8 and SvelteKit 3, the `--bun` build stops after "Analysing routes" and still exits 0, so no `build/` folder is written. Check this again before the Docker phase, and make the Dockerfile fail if `build/index.js` is missing.
  2. Runtime stage: Bun, `ffmpeg` and `uv` (copied from the official `ghcr.io/astral-sh/uv` image).
     - yt-dlp: `uv tool install 'yt-dlp[default]==<version>'`, with `UV_TOOL_BIN_DIR` on `PATH`. The `default` extra includes mutagen, which `--embed-thumbnail` uses.
     - `tags.py`: copy `scripts/` in, then run `uv sync --script scripts/tags.py` at build time so mutagen is already installed and the first tag edit doesn't download anything. uv also installs Python if the image doesn't have it.
- yt-dlp is pinned to a version, with a documented way to update it, since YouTube changes often break old releases. The `player-client=android` extractor arg is a workaround that may stop working as YouTube changes.
- Runs as a non-root user. The UID and GID can be configured so files written to the mount have the right ownership on the host.
- `docker-compose.yml` example:

  ```yaml
  services:
    icarus:
      build: .
      ports: ["3000:3000"]
      environment:
        ADMIN_USERNAME: admin
        ADMIN_PASSWORD: change-me
      volumes:
        - ~/music:/music
  ```

## Error handling and edge cases

- Private, deleted, or age-restricted videos in a playlist: the track fails and the rest of the playlist continues.
- Duplicate submissions: allowed. `--no-overwrites` means an existing file is kept, and the track is marked done.
- Two different videos that resolve to the same `Artist/Album/NN. Title` path: the second one is skipped by `--no-overwrites`. Accepted for now. If it becomes a problem, add `[%(id)s]` to the template.
- A file mutagen can't open (unknown format or corrupt): `tags.py` exits non-zero and the editor shows the error.
- Container restart: all jobs and sessions are lost. Files that already finished are safe on disk.

## Implementation plan

Each chunk is a small, self-contained commit (ideally under ~100 lines) that passes `bun run check` and can be reviewed on its own. Chunks are checked by hand in the browser or terminal, not with automated tests.

### Phase 0 — Foundations

1. Add `design.md` (this file).
2. Remove the placeholder `downloads/` and `tagging/` folders. Add `app.css` with CSS variables, and a minimal layout with nav links: Home / Jobs / Files (placeholder pages).

### Phase 1 — Login

1. `auth.ts`: read the env vars, check credentials, and keep the in-memory session store.
2. `/login` page and form action that sets the session cookie.
3. `hooks.server.ts` guard that redirects to `/login`.
4. Logout action plus a button in the nav.

### Phase 2 — Files page (read-only, no yt-dlp needed yet)

1. `files.ts`: add `resolveInLibrary` and `listAudioFiles`.
2. `/files` page: a load function plus a plain table of files.
3. Sort and client-side filter on the files page.

### Phase 3 — Tag editor

1. `scripts/tags.py`: add `read` mode. Try it by hand on an M4A file.
2. `tags.ts`: add `readTags`. Add the `/files/[...path]` page showing current tags (read-only).
3. `scripts/tags.py`: add `write` mode. Check by hand with `ffprobe` that other tags and the cover art survive.
4. `tags.ts`: add `writeTags`. Make the form editable, and add the save action.

### Phase 4 — Submitting and downloading

1. Home page form and `submitURL` validation in `jobs.ts`, which shows errors (no download yet).
2. `jobs.ts`: add the enums, types, and job store, including the `MAX_JOBS` limit.
3. `scripts/download.sh`: add `video` mode. Try it by hand, and confirm with `ffprobe` that the AAC audio was copied, not re-encoded.
4. `ytdlp.ts`: spawn the script, parse progress, and get the final path.
5. `jobs.ts`: add the queue that respects `MAX_CONCURRENT`, and connect `submitURL` to it (single video only).
6. `scripts/download.sh` `playlist` mode, plus playlist expansion in `ytdlp.ts`.

### Phase 5 — Jobs page

1. `/jobs` page: a load function plus a static list of jobs.
2. Reload with `invalidateAll()` while jobs are active, and show progress bars per track.
3. Cancel action (kill the process, mark tracks cancelled).
4. Retry failed tracks, and clear finished jobs.

### Phase 6 — Docker

1. Add a `Dockerfile` (build + runtime stages with uv, yt-dlp, ffmpeg, and the scripts).
2. Add `docker-compose.yml` example plus README run instructions.
3. Add non-root user with configurable UID/GID.

### Later / nice-to-have

- MusicBrainz lookup to fill the form, using the [`musicbrainz-api`](https://github.com/borewit/musicbrainz-api) package. It's typed and rate-limits itself, and MusicBrainz requires a contact email in the User-Agent. This would add the MusicBrainz ID fields to `Tags` and to `tags.py`.
- AcoustID fingerprinting to identify a track from its audio.
- Title and artist columns on the files page.
- Login attempt rate limiting beyond the fixed delay.
- Rename/move the file from its tags.
- Automated tests.
