import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const execFileAsync = promisify(execFile);

export async function checkFfmpeg(): Promise<boolean> {
    try {
        await execFileAsync("ffmpeg", ["-version"]);
        return true;
    } catch {
        return false;
    }
}

// Uses execFile (not exec) so args are never shell-interpreted
export async function runFfmpeg(args: string[]): Promise<string> {
    const { stdout, stderr } = await execFileAsync("ffmpeg", args);
    return stdout || stderr;
}

export async function runFfprobe(args: string[]): Promise<string> {
    const { stdout } = await execFileAsync("ffprobe", args);
    return stdout;
}

export function ensureDir(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

export function ensureDirExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

export function fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
}
