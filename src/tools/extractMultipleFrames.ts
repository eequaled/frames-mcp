import { runFfmpeg, ensureDirExists, fileExists, runFfprobe } from "../utils/ffmpeg.js";
import { isVideoFile } from "../utils/validation.js";
import * as path from "path";
import * as fs from "fs";

export interface ExtractMultipleFramesParams {
    videoPath: string;
    outputDir: string;
    intervalSeconds?: number; // extract every N seconds
    totalFrames?: number; // extract N frames evenly distributed
    format?: "jpg" | "png";
}

export async function extractMultipleFrames(
    params: ExtractMultipleFramesParams
): Promise<string[]> {
    const {
        videoPath,
        outputDir,
        intervalSeconds = 1,
        totalFrames,
        format = "jpg",
    } = params;

    if (!fileExists(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
    }
    if (!isVideoFile(videoPath)) {
        throw new Error(`Not a valid video file: ${videoPath}`);
    }

    ensureDirExists(outputDir);

    const outputPattern = path.join(outputDir, `frame_%04d.${format}`);
    const args: string[] = ["-hide_banner", "-loglevel", "error", "-y"];

    args.push("-i", videoPath);

    if (totalFrames) {
        // Option A: Use fps-based approach with video duration obtained via ffprobe
        const probeArgs = ["-v", "quiet", "-print_format", "json", "-show_format", videoPath];
        const probeOutput = await runFfprobe(probeArgs);
        const probeData = JSON.parse(probeOutput);
        const duration = parseFloat(probeData.format.duration);
        const fps = totalFrames / duration;
        args.push("-vf", `fps=${fps}`);
    } else {
        // Extract every N seconds
        args.push("-vf", `fps=1/${intervalSeconds}`);
    }

    args.push(outputPattern);

    await runFfmpeg(args);

    // Return list of created files
    const files = fs.readdirSync(outputDir)
        .filter((f) => f.startsWith("frame_") && f.endsWith(`.${format}`))
        .map((f) => path.join(outputDir, f))
        .sort();

    return files;
}
