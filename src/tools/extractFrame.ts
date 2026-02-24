import { runFfmpeg, ensureDir, fileExists } from "../utils/ffmpeg.js";
import { isValidTimestamp, isVideoFile, isImageFile } from "../utils/validation.js";

export interface ExtractFrameParams {
    videoPath: string;
    outputPath: string;
    timestamp?: string;
    frameIndex?: number;
}

export async function extractFrame(params: ExtractFrameParams): Promise<string> {
    const { videoPath, outputPath, timestamp, frameIndex } = params;

    if (!fileExists(videoPath)) throw new Error(`Video file not found: ${videoPath}`);
    if (!isVideoFile(videoPath)) throw new Error(`Not a valid video file: ${videoPath}`);
    if (!isImageFile(outputPath)) throw new Error(`Output must be an image file (.jpg, .png, etc.): ${outputPath}`);
    if (timestamp && !isValidTimestamp(timestamp)) throw new Error(`Invalid timestamp format: ${timestamp}`);

    ensureDir(outputPath);

    const args: string[] = ["-hide_banner", "-loglevel", "error", "-y"];

    if (timestamp) {
        args.push("-ss", timestamp, "-i", videoPath, "-frames:v", "1");
    } else if (frameIndex !== undefined) {
        args.push("-i", videoPath, "-vf", `select=eq(n\\,${frameIndex})`, "-vframes", "1");
    } else {
        args.push("-i", videoPath, "-vf", "select=eq(n\\,0)", "-vframes", "1");
    }

    args.push(outputPath);

    await runFfmpeg(args);

    if (!fileExists(outputPath)) throw new Error("Failed to extract frame");

    return outputPath;
}
