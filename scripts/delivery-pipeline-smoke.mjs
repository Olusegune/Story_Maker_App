import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error(`${command} failed (${result.status}): ${result.stderr || result.stdout}`);
  return result.stdout;
}

run("ffmpeg", ["-version"]);
const persistedProject = JSON.parse(JSON.stringify({
  assets: [{ id: "frame-1", kind: "image" }, { id: "video-1", kind: "video" }, { id: "audio-1", kind: "audio" }],
  scenes: [{ id: "scene-1", motionAssetId: "video-1", motionMasterShotId: "shot-1", shots: [{ id: "shot-1", outputAssetId: "video-1", outputReview: "approved", modelSettings: { startFrameAssetId: "frame-1", outputHistory: [{ assetId: "video-1", sourceFrameAssetId: "frame-1", status: "completed" }] } }] }],
  audioTracks: [{ id: "cue-1", assetId: "audio-1", start: "1", duration: "2" }]
}));
if (persistedProject.scenes[0].motionAssetId !== "video-1" || persistedProject.scenes[0].motionMasterShotId !== "shot-1") throw new Error("Scene motion-master identity did not survive project serialization.");
if (persistedProject.scenes[0].shots[0].modelSettings.outputHistory[0].sourceFrameAssetId !== "frame-1") throw new Error("Video source-frame provenance did not survive project serialization.");
if (persistedProject.audioTracks[0].assetId !== "audio-1") throw new Error("Timeline audio cue did not survive project serialization.");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "storymaker-delivery-smoke-"));
const still = path.join(root, "still.png");
const providerVideo = path.join(root, "provider-video.mp4");
const cue = path.join(root, "cue.wav");
const filter = "scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2:color=0x090b13,fps=24,format=yuv420p";

try {
  run("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "color=c=0xd6a84b:s=640x480", "-frames:v", "1", still]);
  run("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=30:duration=1.5", "-c:v", "libx264", "-pix_fmt", "yuv420p", providerVideo]);
  run("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=0.5", cue]);

  const segments = [];
  for (const [index, source, duration] of [[1, still, "1"], [2, providerVideo, ""]]) {
    const output = path.join(root, `segment-${index}.mp4`);
    const input = duration ? ["-loop", "1", "-i", source, "-t", duration] : ["-i", source];
    run("ffmpeg", ["-v", "error", "-y", ...input, "-vf", filter, "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "24", output]);
    segments.push(output);
  }

  const concat = path.join(root, "segments.txt");
  fs.writeFileSync(concat, `${segments.map((file) => `file '${file.replace(/\\/g, "/").replace(/'/g, "'\\\\''")}'`).join("\n")}\n`, "utf8");
  const videoOnly = path.join(root, "video-only.mp4");
  run("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", concat, "-c", "copy", videoOnly]);

  const completed = path.join(root, "production-preview.mp4");
  run("ffmpeg", ["-v", "error", "-y", "-i", videoOnly, "-i", cue,
    "-filter_complex", "[1:a]atrim=0:0.5,asetpts=PTS-STARTPTS,adelay=250:all=1,volume=-6dB[a0];[a0]amix=inputs=1:duration=longest:normalize=0,apad[mix]",
    "-map", "0:v:0", "-map", "[mix]", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest", completed]);

  const probe = JSON.parse(run("ffprobe", ["-v", "error", "-show_entries", "format=duration,size:stream=codec_type,codec_name,width,height", "-of", "json", completed]));
  if (!probe.streams?.some((stream) => stream.codec_type === "video" && stream.width === 640 && stream.height === 360)) throw new Error("Delivery smoke did not produce the normalized video stream.");
  if (!probe.streams?.some((stream) => stream.codec_type === "audio" && stream.codec_name === "aac")) throw new Error("Delivery smoke did not produce the mixed AAC audio stream.");
  if (Number(probe.format?.duration || 0) < 2.4) throw new Error("A short audio cue truncated the picture edit.");
  console.log(`STORYMAKER_DELIVERY_PIPELINE_OK (${probe.format.duration}s, ${probe.format.size} bytes)`);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
