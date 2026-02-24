import * as path from "path";

/**
 * Validate timestamp format: HH:MM:SS, MM:SS, SS, or with decimals.
 */
export function isValidTimestamp(time: string): boolean {
    const patterns = [
        /^\d+$/,              // seconds only: 30
        /^\d+\.\d+$/,         // seconds with decimals: 30.5
        /^\d{1,2}:\d{2}$/,    // MM:SS
        /^\d{1,2}:\d{2}:\d{2}$/,       // HH:MM:SS
        /^\d{1,2}:\d{2}:\d{2}\.\d+$/,  // HH:MM:SS.ms
    ];
    return patterns.some((p) => p.test(time));
}

/**
 * Check if a file path has a recognized video extension.
 */
export function isVideoFile(filePath: string): boolean {
    const videoExtensions = [
        ".mp4", ".mkv", ".avi", ".mov",
        ".webm", ".flv", ".wmv", ".m4v",
    ];
    const ext = path.extname(filePath).toLowerCase();
    return videoExtensions.includes(ext);
}

/**
 * Check if a file path has a recognized image extension.
 */
export function isImageFile(filePath: string): boolean {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".bmp", ".webp"];
    const ext = path.extname(filePath).toLowerCase();
    return imageExtensions.includes(ext);
}
