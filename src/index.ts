#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

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
                .describe("Absolute path for the output image (.jpg or .png)"),
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
        const result = await extractFrame({
            videoPath: args.videoPath,
            outputPath: args.outputPath,
            timestamp: args.timestamp,
            frameIndex: args.frameIndex,
        });
        return {
            content: [
                { type: "text" as const, text: `Frame extracted successfully: ${result}` },
            ],
        };
    }
);

// --- Tool: extract_multiple_frames ---
server.registerTool(
    "extract_multiple_frames",
    {
        description:
            "Extract multiple frames from a video at regular intervals. Useful for creating thumbnails or analyzing video content.",
        inputSchema: z.object({
            videoPath: z.string().describe("Absolute path to the video file"),
            outputDir: z
                .string()
                .describe("Directory where extracted frames will be saved"),
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
        const results = await extractMultipleFrames({
            videoPath: args.videoPath,
            outputDir: args.outputDir,
            intervalSeconds: args.intervalSeconds,
            totalFrames: args.totalFrames,
            format: args.format,
        });
        return {
            content: [
                {
                    type: "text" as const,
                    text: `Extracted ${results.length} frames:\n${results.join("\n")}`,
                },
            ],
        };
    }
);

// --- Tool: get_video_info ---
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

// --- Tool: extract_clip ---
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

// --- Main startup ---
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
