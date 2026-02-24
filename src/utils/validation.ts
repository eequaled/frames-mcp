import * as path from "path";

export function isValidTimestamp(time: string): boolean {
    const patterns = [
        /^\d+$/,
        /^\d+\.\d+$/,
        /^\d{1,2}:\d{2}$/,
        /^\d{1,2}:\d{2}:\d{2}$/,
        /^\d{1,2}:\d{2}:\d{2}\.\d+$/,
    ];
    return patterns.some((p) => p.test(time));
}

export function isVideoFile(filePath: string): boolean {
    const videoExtensions = [
        ".mp4", ".mkv", ".avi", ".mov",
        ".webm", ".flv", ".wmv", ".m4v",
    ];
    const ext = path.extname(filePath).toLowerCase();
    return videoExtensions.includes(ext);
}

export function isImageFile(filePath: string): boolean {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".bmp", ".webp"];
    const ext = path.extname(filePath).toLowerCase();
    return imageExtensions.includes(ext);
}
