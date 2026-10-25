import { z } from "zod";

export enum JobKind {
  VIDEO = "video",
  PLAYLIST = "playlist",
}

export type JobRequest = {
  kind: JobKind;
  id: string;
  url: string;
};

const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"];

const videoIDSchema = z
  .string()
  .length(11)
  .regex(/^[A-Za-z0-9_-]+$/);

const playlistIDSchema = z
  .string()
  .max(100)
  .regex(/^[A-Za-z0-9_-]+$/);

export function parseURL(url: URL): JobRequest | { error: string } {
  let rawVideoID: string | null = null;
  let rawPlaylistID: string | null = null;

  // youtu.be links have a unique shape so handle those as a special case
  if (url.hostname === "youtu.be") {
    rawVideoID = url.pathname.slice(1);
  } else if (!YOUTUBE_HOSTS.includes(url.hostname)) {
    return { error: "That is not a YouTube link! 😱" };
  }

  // try to extract a video or playlist id
  if (url.pathname === "/watch") {
    rawVideoID = url.searchParams.get("v");
  } else if (url.pathname.startsWith("/shorts/")) {
    rawVideoID = url.pathname.slice("/shorts/".length);
  } else if (url.pathname === "/playlist") {
    rawPlaylistID = url.searchParams.get("list");
  }

  const videoID = videoIDSchema.safeParse(rawVideoID);
  if (videoID.success) {
    return {
      kind: JobKind.VIDEO,
      id: videoID.data,
      url: `https://www.youtube.com/watch?v=${videoID.data}`,
    };
  }

  const playlistID = playlistIDSchema.safeParse(rawPlaylistID);
  if (playlistID.success) {
    return {
      kind: JobKind.PLAYLIST,
      id: playlistID.data,
      url: `https://www.youtube.com/playlist?list=${playlistID.data}`,
    };
  }

  return { error: "Provide a link with a valid video or playlist ID 🤓" };
}
