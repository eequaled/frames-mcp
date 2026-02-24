import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const execFileAsync = promisify(execFile);

/**
 * Check if ffmpeg is available on the system PATH.
 */
export async function checkFfmpeg(): Promise<boolean> {
    try {
        await execFileAsync("ffmpeg", ["-version"]);
        return true;
    } catch {
        return false;
    }
}

/**
 * Run an ffmpeg command with the given arguments.
 * Uses execFile (not exec) to prevent command injection — args are never shell-interpreted.
 */
export async function runFfmpeg(args: string[]): Promise<string> {
    const { stdout, stderr } = await execFileAsync("ffmpeg", args);
    return stdout || stderr;
}

/**
 * Run an ffprobe command with the given arguments.
 * Uses execFile (not exec) to prevent command injection.
 */
export async function runFfprobe(args: string[]): Promise<string> {
    const { stdout } = await execFileAsync("ffprobe", args);
    return stdout;
}

/**
 * Ensure the parent directory of a file path exists.
 */
export function ensureDir(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * Ensure a directory exists, creating it recursively if needed.
 */
export function ensureDirExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Check if a file exists at the given path.
 */
export function fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
}
