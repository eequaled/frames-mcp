import { runFfmpeg, ensureDirExists, fileExists, runFfprobe } from "../utils/ffmpeg.js";
import { isVideoFile } from "../utils/validation.js";
import * as path from "path";
import * as fs from "fs";

export interface ExtractMultipleFramesParams {
    videoPath: string;
    outputDir: string;
    intervalSeconds?: number;
    totalFrames?: number;
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

    if (!fileExists(videoPath)) throw new Error(`Video file not found: ${videoPath}`);
    if (!isVideoFile(videoPath)) throw new Error(`Not a valid video file: ${videoPath}`);

    ensureDirExists(outputDir);

    const outputPattern = path.join(outputDir, `frame_%04d.${format}`);
    const args: string[] = ["-hide_banner", "-loglevel", "error", "-y", "-i", videoPath];

    if (totalFrames) {
        const probeData = JSON.parse(
            await runFfprobe(["-v", "quiet", "-print_format", "json", "-show_format", videoPath])
        );
        const fps = totalFrames / parseFloat(probeData.format.duration);
        args.push("-vf", `fps=${fps}`);
    } else {
        args.push("-vf", `fps=1/${intervalSeconds}`);
    }

    args.push(outputPattern);
    await runFfmpeg(args);

    return fs.readdirSync(outputDir)
        .filter((f) => f.startsWith("frame_") && f.endsWith(`.${format}`))
        .map((f) => path.join(outputDir, f))
        .sort();
}
