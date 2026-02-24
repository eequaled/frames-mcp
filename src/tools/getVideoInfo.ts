import { runFfprobe, fileExists } from "../utils/ffmpeg.js";
import { isVideoFile } from "../utils/validation.js";

interface FfprobeStream {
    codec_type: string;
    codec_name: string;
    width?: number;
    height?: number;
    r_frame_rate: string; // format: "30/1" or "30000/1001"
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
    duration: number;
    width: number;
    height: number;
    fps: number;
    codec: string;
    bitrate: number;
    frameCount: number;
}

export async function getVideoInfo(videoPath: string): Promise<VideoInfo> {
    if (!fileExists(videoPath)) throw new Error(`Video file not found: ${videoPath}`);
    if (!isVideoFile(videoPath)) throw new Error(`Not a valid video file: ${videoPath}`);

    const output = await runFfprobe([
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        videoPath,
    ]);

    let data: FfprobeOutput;
    try {
        data = JSON.parse(output);
    } catch {
        throw new Error("Failed to parse ffprobe output");
    }

    const videoStream = data.streams.find((s) => s.codec_type === "video");
    if (!videoStream) throw new Error("No video stream found");

    const [num, den] = videoStream.r_frame_rate.split("/");
    const fps = parseInt(num, 10) / parseInt(den, 10);

    return {
        duration: parseFloat(data.format.duration),
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        fps: Math.round(fps * 100) / 100,
        codec: videoStream.codec_name,
        bitrate: parseInt(data.format.bit_rate || "0", 10),
        // nb_frames not always present; fall back to duration * fps
        frameCount: videoStream.nb_frames
            ? parseInt(videoStream.nb_frames, 10)
            : Math.floor(parseFloat(data.format.duration) * fps),
    };
}
