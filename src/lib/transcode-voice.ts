import { spawn } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

function needsOpusOgg(mime: string) {
  const clean = mime.split(";")[0].trim().toLowerCase();
  return clean === "audio/webm" || clean === "video/webm" || clean.includes("webm");
}

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: "ignore" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg_exit_${code}`));
    });
  });
}

/** WhatsApp unofficial (Wazzup) rejects browser webm; opus in ogg is accepted as a voice note. */
export async function toWazzupVoice(buffer: Buffer, mime: string) {
  if (!needsOpusOgg(mime)) {
    return { buffer, mime: mime.split(";")[0] || "audio/ogg", fileName: "voice.ogg" };
  }
  const dir = await mkdtemp(join(tmpdir(), "crm-voice-"));
  const input = join(dir, "in.webm");
  const output = join(dir, "out.ogg");
  try {
    await writeFile(input, buffer);
    await runFfmpeg(["-y", "-i", input, "-c:a", "libopus", "-b:a", "48k", output]);
    return { buffer: await readFile(output), mime: "audio/ogg", fileName: "voice.ogg" };
  } catch (err) {
    console.error("voice_transcode_failed", (err as Error).message);
    return { buffer, mime: mime.split(";")[0] || "audio/webm", fileName: "voice.webm" };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
