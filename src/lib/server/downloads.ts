import { spawn } from "node:child_process";
import path from "node:path";
import { createInterface } from "node:readline";
import { type Cancellers, type Job, JobStatus } from "./jobs.ts";

const DOWNLOAD_SCRIPT = "scripts/download.sh";
const PROGRESS_PREFIX = "[progress]";

export async function runDownload(
  job: Job,
  downloadDir: string,
  cancellers: Cancellers,
): Promise<void> {
  const proc = spawn(DOWNLOAD_SCRIPT, [downloadDir, job.url], { detached: true });

  cancellers.set(job.id, () => {
    const hasExited = proc.exitCode !== null || proc.signalCode !== null;
    if (proc.pid !== undefined && !hasExited) {
      process.kill(-proc.pid, "SIGTERM");
    }
  });

  createInterface({ input: proc.stdout }).on("line", (line) => {
    if (line.startsWith(PROGRESS_PREFIX)) {
      const progress = Number.parseFloat(line.slice(PROGRESS_PREFIX.length));
      if (!Number.isNaN(progress)) {
        job.progress = progress;
      }
    } else if (line.trim()) {
      job.files.push(path.relative(downloadDir, line));
    }
  });

  // TODO: parse stderr
  const stderr: string[] = [];
  createInterface({ input: proc.stderr }).on("line", (line) => {
    stderr.push(line);
  });

  const exitCode = await new Promise<number | null>((resolve) => {
    proc.on("error", (error) => {
      stderr.push(error.message);
      resolve(null);
    });
    proc.on("close", (code) => {
      resolve(code);
    });
  });

  cancellers.delete(job.id);

  if (job.status === JobStatus.CANCELLED) {
    return;
  }

  if (exitCode === 0) {
    job.status = JobStatus.DONE;
    job.progress = 100;

    return;
  }

  job.status = JobStatus.FAILED;
  job.error = `Download exited with code ${exitCode}`;
}
