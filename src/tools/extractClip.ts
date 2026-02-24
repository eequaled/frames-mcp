import { runFfmpeg, ensureDir, fileExists } from "../utils/ffmpeg.js";
import { isValidTimestamp, isVideoFile } from "../utils/validation.js";

export interface ExtractClipParams {
    videoPath: string;
    outputPath: string;
    startTime: string;
    endTime?: string;
    duration?: number; // in seconds
}

export async function extractClip(params: ExtractClipParams): Promise<string> {
    const { videoPath, outputPath, startTime, endTime, duration } = params;

    if (!fileExists(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
    }
    if (!isVideoFile(videoPath)) {
        throw new Error(`Not a valid video file: ${videoPath}`);
    }
    if (!isValidTimestamp(startTime)) {
        throw new Error(`Invalid start timestamp: ${startTime}`);
    }
    if (endTime && !isValidTimestamp(endTime)) {
        throw new Error(`Invalid end timestamp: ${endTime}`);
    }
    if (!endTime && !duration) {
        throw new Error("Must provide either endTime or duration");
    }

    if (!isVideoFile(outputPath)) {
        throw new Error(`Output must be a video file: ${outputPath}`);
    }

    ensureDir(outputPath);

    const args: string[] = [
        "-hide_banner",
        "-loglevel", "error",
        "-y",
        "-ss", startTime,
        "-i", videoPath,
    ];

    if (endTime) {
        args.push("-to", endTime);
    } else if (duration) {
        args.push("-t", duration.toString());
    }

    // Stream copy for speed. Note: start/end may not be frame-accurate
    // since cuts happen at keyframes. For precise cuts, remove -c copy.
    args.push("-c", "copy");
    args.push(outputPath);

    await runFfmpeg(args);

    if (!fileExists(outputPath)) {
        throw new Error("Failed to extract clip");
    }

    return outputPath;
}
