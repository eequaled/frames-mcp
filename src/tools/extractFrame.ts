import { runFfmpeg, ensureDir, fileExists } from "../utils/ffmpeg.js";
import { isValidTimestamp, isVideoFile, isImageFile } from "../utils/validation.js";

export interface ExtractFrameParams {
    videoPath: string;
    outputPath: string;
    timestamp?: string; // HH:MM:SS or seconds
    frameIndex?: number; // specific frame number
}

export async function extractFrame(params: ExtractFrameParams): Promise<string> {
    const { videoPath, outputPath, timestamp, frameIndex } = params;

    // Validation
    if (!fileExists(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
    }
    if (!isVideoFile(videoPath)) {
        throw new Error(`Not a valid video file: ${videoPath}`);
    }
    if (!isImageFile(outputPath)) {
        throw new Error(`Output must be an image file (.jpg, .png, etc.): ${outputPath}`);
    }
    if (timestamp && !isValidTimestamp(timestamp)) {
        throw new Error(`Invalid timestamp format: ${timestamp}`);
    }

    ensureDir(outputPath);

    // Build ffmpeg arguments
    const args: string[] = ["-hide_banner", "-loglevel", "error", "-y"];

    if (timestamp) {
        // Extract at specific timestamp
        args.push("-ss", timestamp);
        args.push("-i", videoPath);
        args.push("-frames:v", "1");
    } else if (frameIndex !== undefined) {
        // Extract specific frame by index
        args.push("-i", videoPath);
        args.push("-vf", `select=eq(n\\,${frameIndex})`);
        args.push("-vframes", "1");
    } else {
        // Default: first frame
        args.push("-i", videoPath);
        args.push("-vf", "select=eq(n\\,0)");
        args.push("-vframes", "1");
    }

    args.push(outputPath);

    await runFfmpeg(args);

    if (!fileExists(outputPath)) {
        throw new Error("Failed to extract frame");
    }

    return outputPath;
}
