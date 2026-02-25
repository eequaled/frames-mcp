#!/usr/bin/env node

import { readFile, mkdtemp, rm, unlink } from "fs/promises";
import { extname, join } from "path";
import { tmpdir } from "os";
import { createWorker } from "tesseract.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

function mimeFromExt(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    if (ext === ".png") return "image/png";
    if (ext === ".webp") return "image/webp";
    if (ext === ".bmp") return "image/bmp";
    return "image/jpeg";
}

import { extractFrame } from "./tools/extractFrame.js";
import { extractMultipleFrames } from "./tools/extractMultipleFrames.js";
import { getVideoInfo } from "./tools/getVideoInfo.js";
import { extractClip } from "./tools/extractClip.js";
import { checkFfmpeg } from "./utils/ffmpeg.js";

const server = new McpServer({
    name: "video-frames-mcp",
    version: "1.0.0",
});

// --- Tool: extract_frame ---
server.registerTool(
    "extract_frame",
    {
        description:
            "Extract a single frame from a video at a specific timestamp or frame index. Returns the path to the extracted image.",
        inputSchema: z.object({
            videoPath: z.string().describe("Absolute path to the video file"),
            outputPath: z
                .string()
                .optional()
                .describe("Absolute path for the output image (.jpg or .png). If omitted, a temporary file will be used and deleted after."),
            timestamp: z
                .string()
                .optional()
                .describe("Timestamp to extract (HH:MM:SS or seconds)"),
            frameIndex: z
                .number()
                .optional()
                .describe("Specific frame number to extract (0-indexed)"),
        }),
    },
    async (args) => {
        let actualOutputPath = args.outputPath;
        let isTemporary = false;

        if (!actualOutputPath) {
            const fileName = `frame_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
            actualOutputPath = join(tmpdir(), fileName);
            isTemporary = true;
        }

        const result = await extractFrame({
            videoPath: args.videoPath,
            outputPath: actualOutputPath,
            timestamp: args.timestamp,
            frameIndex: args.frameIndex,
        });

        const imageBuffer = await readFile(result);
        const base64Data = imageBuffer.toString("base64");
        const mime = mimeFromExt(result);

        let extractedText = "";
        try {
            const worker = await createWorker("eng");
            const ret = await worker.recognize(imageBuffer);
            extractedText = ret.data.text.trim();
            await worker.terminate();
        } catch (error) {
            console.error("OCR failed:", error);
        }

        if (isTemporary) {
            await unlink(result).catch(() => { });
        }

        const textResponse = isTemporary
            ? "Frame extracted successfully (temporary file cleaned up)"
            : `Frame extracted successfully: ${result}`;

        const finalResponseText = extractedText
            ? `${textResponse}\n\n[OCR Extracted Text]:\n${extractedText}`
            : textResponse;

        return {
            content: [
                {
                    type: "text" as const,
                    text: finalResponseText
                },
                { type: "image" as const, data: base64Data, mimeType: mime },
            ],
        };
    }
);

server.registerTool(
    "extract_multiple_frames",
    {
        description:
            "Extract multiple frames from a video at regular intervals. Useful for creating thumbnails or analyzing video content.",
        inputSchema: z.object({
            videoPath: z.string().describe("Absolute path to the video file"),
            outputDir: z
                .string()
                .optional()
                .describe("Directory where extracted frames will be saved. If omitted, a temporary directory will be used and deleted after."),
            intervalSeconds: z
                .number()
                .optional()
                .describe("Extract a frame every N seconds (default: 1)"),
            totalFrames: z
                .number()
                .optional()
                .describe(
                    "Extract exactly N frames evenly distributed. Overrides intervalSeconds."
                ),
            format: z
                .enum(["jpg", "png"])
                .optional()
                .describe("Output image format (default: jpg)"),
        }),
    },
    async (args) => {
        let actualOutputDir = args.outputDir;
        let isTemporary = false;

        if (!actualOutputDir) {
            actualOutputDir = await mkdtemp(join(tmpdir(), "mcp-frames-"));
            isTemporary = true;
        }

        const results = await extractMultipleFrames({
            videoPath: args.videoPath,
            outputDir: actualOutputDir,
            intervalSeconds: args.intervalSeconds,
            totalFrames: args.totalFrames,
            format: args.format,
        });

        const content: Array<
            | { type: "text"; text: string }
            | { type: "image"; data: string; mimeType: string }
        > = [
                {
                    type: "text" as const,
                    text: isTemporary
                        ? `Extracted ${results.length} frames (temporary files cleaned up)`
                        : `Extracted ${results.length} frames:\n${results.join("\n")}`,
                },
            ];

        for (const framePath of results) {
            try {
                const buf = await readFile(framePath);
                content.push({
                    type: "image" as const,
                    data: buf.toString("base64"),
                    mimeType: mimeFromExt(framePath),
                });
            } catch {
                // If a frame file can't be read, skip it silently
            }
        }

        if (isTemporary) {
            await rm(actualOutputDir, { recursive: true, force: true }).catch(() => { });
        }

        return { content };
    }
);

server.registerTool(
    "get_video_info",
    {
        description:
            "Get detailed information about a video file including duration, resolution, fps, codec, and frame count.",
        inputSchema: z.object({
            videoPath: z.string().describe("Absolute path to the video file"),
        }),
    },
    async (args) => {
        const info = await getVideoInfo(args.videoPath);
        return {
            content: [
                { type: "text" as const, text: JSON.stringify(info, null, 2) },
            ],
        };
    }
);

server.registerTool(
    "extract_clip",
    {
        description:
            "Extract a short clip/segment from a video between two timestamps.",
        inputSchema: z.object({
            videoPath: z.string().describe("Absolute path to the video file"),
            outputPath: z
                .string()
                .describe("Absolute path for the output video file"),
            startTime: z
                .string()
                .describe("Start timestamp (HH:MM:SS or seconds)"),
            endTime: z
                .string()
                .optional()
                .describe(
                    "End timestamp (HH:MM:SS or seconds). Optional if duration is provided."
                ),
            duration: z
                .number()
                .optional()
                .describe("Duration in seconds. Optional if endTime is provided."),
        }),
    },
    async (args) => {
        const result = await extractClip({
            videoPath: args.videoPath,
            outputPath: args.outputPath,
            startTime: args.startTime,
            endTime: args.endTime,
            duration: args.duration,
        });
        return {
            content: [
                {
                    type: "text" as const,
                    text: `Clip extracted successfully: ${result}`,
                },
            ],
        };
    }
);

async function main() {
    const hasFfmpeg = await checkFfmpeg();
    if (!hasFfmpeg) {
        console.error("ERROR: ffmpeg is not installed or not in PATH");
        console.error(
            "Install: winget install ffmpeg | choco install ffmpeg | brew install ffmpeg | apt install ffmpeg"
        );
        process.exit(1);
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Video Frames MCP server running...");
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
