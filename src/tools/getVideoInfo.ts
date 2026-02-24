import { runFfprobe, fileExists } from "../utils/ffmpeg.js";
import { isVideoFile } from "../utils/validation.js";

interface FfprobeStream {
    codec_type: string;
    codec_name: string;
    width?: number;
    height?: number;
    r_frame_rate: string;
    nb_frames?: string;
}

interface FfprobeOutput {
    format: {
        duration: string;
        bit_rate?: string;
    };
    streams: FfprobeStream[];
}

export interface VideoInfo {
    duration: number; // in seconds
    width: number;
    height: number;
    fps: number;
    codec: string;
    bitrate: number;
    frameCount: number;
}

export async function getVideoInfo(videoPath: string): Promise<VideoInfo> {
    if (!fileExists(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
    }
    if (!isVideoFile(videoPath)) {
        throw new Error(`Not a valid video file: ${videoPath}`);
    }

    const args = [
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        videoPath,
    ];

    const output = await runFfprobe(args);

    let data: FfprobeOutput;
    try {
        data = JSON.parse(output);
    } catch {
        throw new Error("Failed to parse ffprobe output");
    }

    // Find video stream
    const videoStream = data.streams.find(
        (s) => s.codec_type === "video"
    );

    if (!videoStream) {
        throw new Error("No video stream found");
    }

    // Parse fps (usually in format "30/1" or "30000/1001")
    const fpsRatio = videoStream.r_frame_rate.split("/");
    const fps = parseInt(fpsRatio[0], 10) / parseInt(fpsRatio[1], 10);

    // Fallback calculation for frameCount if nb_frames is missing
    return {
        duration: parseFloat(data.format.duration),
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        fps: Math.round(fps * 100) / 100,
        codec: videoStream.codec_name,
        bitrate: parseInt(data.format.bit_rate || "0", 10),
        frameCount: videoStream.nb_frames
            ? parseInt(videoStream.nb_frames, 10)
            : Math.floor(parseFloat(data.format.duration) * fps),
    };
}
