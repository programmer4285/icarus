import { z } from "zod";

export enum JobStatus {
  QUEUED = "queued",
  RUNNING = "running",
  DONE = "done",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export type Job = {
  id: string;
  url: string;
  status: JobStatus;
  createdAt: number;
  progress: number;
  files: string[];
  error?: string;
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

export function parseURL(url: URL): { url: string } | { error: string } {
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
    return { url: `https://www.youtube.com/watch?v=${videoID.data}` };
  }

  const playlistID = playlistIDSchema.safeParse(rawPlaylistID);
  if (playlistID.success) {
    return { url: `https://www.youtube.com/playlist?list=${playlistID.data}` };
  }

  return { error: "Provide a link with a valid video or playlist ID 🤓" };
}

export function addJob(jobs: Job[], url: string, maxJobs: number): Job {
  const job: Job = {
    id: crypto.randomUUID(),
    url,
    status: JobStatus.QUEUED,
    createdAt: Date.now(),
    progress: 0,
    files: [],
  };

  jobs.unshift(job);

  // enforce max jobs limit, remove oldest jobs first. only remove finished jobs
  const finished = [JobStatus.DONE, JobStatus.FAILED, JobStatus.CANCELLED];
  for (let index = jobs.length - 1; index >= 0 && jobs.length > maxJobs; index--) {
    if (finished.includes(jobs[index].status)) {
      jobs.splice(index, 1);
    }
  }

  return job;
}
