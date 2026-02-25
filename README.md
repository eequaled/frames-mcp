# 🎞️ Video Frames MCP

> **1-Liner:** Give your AI agents eyes: Extract visual context from local videos for Claude, Cursor, and Windsurf.

[![GitHub stars](https://img.shields.io/github/stars/eequaled/frames-mcp.svg?style=social&label=Star)](https://github.com/eequaled/frames-mcp/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/eequaled/frames-mcp.svg?style=social&label=Fork)](https://github.com/eequaled/frames-mcp/network/members)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![npm version](https://badge.fury.io/js/%40eequaled%2Fframes-mcp.svg)](https://badge.fury.io/js/%40eequaled%2Fframes-mcp)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue.svg)](https://modelcontextprotocol.io)
[![100% Local](https://img.shields.io/badge/%F0%9F%94%92_100%25_Local-%26_Private-success)](#)

This is an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that bridges AI coding assistants with `ffmpeg`, enabling them to work with video files directly from chat.

---

## ✨ Features

| Tool | Description |
|------|-------------|
| `extract_frame` | Extract a single image (returns base64 & **OCR text**; path optional) |
| `extract_multiple_frames` | Batch-extract frames (returns base64; directory optional) |
| `get_video_info` | Get duration, resolution, FPS, codec, and frame count |
| `extract_clip` | Cut a video segment (path required) |

---

## 🧠 Smart Features

- **Built-in OCR (`extract_frame`)**: The server automatically runs Optical Character Recognition using `tesseract.js` on extracted frames and returns the text directly to your AI. Perfect for reading error messages or slide content in videos.
- **Smart Sampling (`extract_multiple_frames`)**: Don't dump a frame for every second and blow up your token context. Ask for `totalFrames: 10`, and the server will perfectly divide the video to return 10 evenly distributed frames capturing the whole timeline.
- **Transient Mode**: If you omit output paths for frames, the server saves them to a system temp folder, reads them to base64, and immediately deletes them. Zero clutter.

---

## 🔒 100% Local & Private

Your video files never leave your machine. Frame extraction, OCR, and clipping happen entirely locally. This makes it safe for corporate environments, NDAs, and private recordings.

---

## ⚙️ How It Works

All processing happens **locally on your machine** using `ffmpeg`, `ffprobe`, and `tesseract.js` for OCR. The server communicates via **stdio** transport — the standard MCP protocol. Your AI sends a tool call, the server runs the command, and returns the result (and text, if applicable).

- `extract_frame` → `ffmpeg -ss <timestamp> -i video.mp4 -frames:v 1 output.jpg` + **OCR Processing**
- `extract_multiple_frames` → `ffmpeg -vf fps=N/duration video.mp4 output_%04d.jpg`
- `get_video_info` → `ffprobe -print_format json -show_streams -show_format video.mp4`
- `extract_clip` → `ffmpeg -ss <start> -to <end> -c copy video.mp4 clip.mp4`

> **Why use `-c copy`?** It skips re-encoding entirely, making clip extraction near-instant. The tradeoff is that cuts align to the nearest keyframe, so they may be slightly off on the exact frame.

---

## 📋 Requirements

- **Node.js 18+** — [Download here](https://nodejs.org)
- **ffmpeg** — installed and accessible from your system PATH

### Install ffmpeg

| Platform | Command |
|----------|---------|
| **Windows** | `winget install ffmpeg` or `choco install ffmpeg` |
| **macOS** | `brew install ffmpeg` |
| **Ubuntu/Debian** | `sudo apt install ffmpeg` |
| **Fedora/RHEL** | `sudo dnf install ffmpeg` |

Verify it works: `ffmpeg -version`

---

## 🚀 Installation

```bash
npx -y @eequaled/frames-mcp
```
*(Alternatively, you can clone and build from source).*

The `npx` command automatically fetches the latest version from NPM.

---

## 🛠️ Configuration Snippet

For clients that use a `config.json` structure (Cursor, Claude, Roo Code, Cline, Windsurf), use this snippet in your `mcpServers` object:

```json
{
  "mcpServers": {
    "video-frames": {
      "command": "npx",
      "args": ["-y", "@eequaled/frames-mcp"]
    }
  }
}
```

> [!IMPORTANT]
> If you cloned from GitHub instead of using `npx`, change the command to `node` and the args to the **absolute path** of your local `dist/index.js`.

---

## 🔌 Client Setup

### Cursor

1. Open **Settings** → **Features** → **MCP**
2. Click **+ Add New MCP Server**
3. Fill in:
   - **Name**: `video-frames`
   - **Type**: `command`
   - **Command**: `npx -y @eequaled/frames-mcp`
4. Save and wait for the **green dot** (Connected)

---

### Claude Desktop

Edit your config file:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "video-frames": {
      "command": "npx",
      "args": ["-y", "@eequaled/frames-mcp"]
    }
  }
}
```

---

### Roo Code (VS Code extension)

Open the Roo Code MCP settings panel, or edit the file directly:

```
%APPDATA%\Code\User\globalStorage\roovscode.roo-cline\settings\cline_mcp_settings.json
```

```json
{
  "mcpServers": {
    "video-frames": {
      "command": "npx",
      "args": ["-y", "@eequaled/frames-mcp"]
    }
  }
}
```

---

### Cline (VS Code extension)

Edit the Cline MCP settings file:

```
%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
```

```json
{
  "mcpServers": {
    "video-frames": {
      "command": "npx",
      "args": ["-y", "@eequaled/frames-mcp"]
    }
  }
}
```

---

### Windsurf

Open **Settings** → **MCP** → **Add Server** and fill in:

```json
{
  "command": "npx",
  "args": ["-y", "@eequaled/frames-mcp"]
}
```

---

### CLI / Other Platforms

Any MCP-compatible tool (Open Interpreter, custom scripts, etc.) can connect using:

| Parameter | Value |
|-----------|-------|
| **Transport** | `stdio` |
| **Command** | `npx` |
| **Args** | `["-y", "@eequaled/frames-mcp"]` |

You can also test it directly in your terminal:

```bash
# Smoke test — should print the running message
npx -y @eequaled/frames-mcp

# Send a raw JSON-RPC list request
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npx -y @eequaled/frames-mcp
```

---

## 💬 Example Prompts

Once connected, try these in your AI chat:

```
What's the duration and resolution of /path/to/video.mp4?
```
```
Extract the frame at 1:30 from /path/to/video.mp4 and save it to /output/thumb.jpg
```
```
Check this video and tell me the moment the error message appears.
```
```
Summarize the UI changes in this screen recording.
```
```
Extract the text from the slide at 02:45.
```

> **Tip:** Always use **absolute paths** (e.g., `C:\Videos\movie.mp4` or `/home/user/movie.mp4`). Relative paths won't reliably resolve.

---

## 🧠 Why This Is Useful

Combined with your AI's vision capabilities, this MCP unlocks:

- **Video content analysis** — extract frames → AI describes or summarizes scene content
- **Thumbnail generation** — pull the best-looking frame from any moment
- **Quick video inspection** — get metadata without opening a video player
- **Clip extraction** — cut highlight reels or short segments on demand
- **GIF/video pipelines** — clip a segment and pipe it into further processing

---

## 🛠️ Supported Video Formats

`mp4`, `mkv`, `avi`, `mov`, `webm`, `flv`, `wmv`, `m4v` — and anything else ffmpeg can decode.

---

## 🤖 AI Agent Integration

This project includes an [`llms.txt`](./llms.txt) file — a machine-readable document written specifically for AI agents. If you want an AI assistant to set up, configure, or use this MCP server on your behalf, just point it at that file:

> "Read the `llms.txt` in this repo and add the video-frames MCP to my setup."

The file contains everything an agent needs: prerequisites, install steps, config snippets for every client, full tool specs with all parameters, and important caveats (like always using absolute paths).

