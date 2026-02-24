# 🎞️ Video Frames MCP

> Give your AI the ability to **see inside any video** — extract frames, inspect metadata, and cut clips — all powered by `ffmpeg`.

This is an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that bridges AI coding assistants with `ffmpeg`, enabling them to work with video files directly from chat.

---

## ✨ Features

| Tool | Description |
|------|-------------|
| `extract_frame` | Extract a single image at any timestamp or frame index |
| `extract_multiple_frames` | Batch-extract frames at set intervals or evenly distributed |
| `get_video_info` | Get duration, resolution, FPS, codec, and frame count |
| `extract_clip` | Cut a video segment between two timestamps without re-encoding |

---

## ⚙️ How It Works

All processing happens **locally on your machine** using `ffmpeg` and `ffprobe`. The server communicates via **stdio** transport — the standard MCP protocol. Your AI sends a tool call, the server runs the ffmpeg command, and returns the result.

- `extract_frame` → `ffmpeg -ss <timestamp> -i video.mp4 -frames:v 1 output.jpg`
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
git clone https://github.com/eequaled/frames-mcp
cd frames-mcp
npm install
npm run build
```

Note the **absolute path** to your `dist/index.js` after building — you'll need it in the config below. Example:
- Windows: `C:\Users\you\frames-mcp\dist\index.js`
- macOS/Linux: `/home/you/frames-mcp/dist/index.js`

---

## 🔌 Client Setup

### Cursor

1. Open **Settings** → **Features** → **MCP**
2. Click **+ Add New MCP Server**
3. Fill in:
   - **Name**: `video-frames`
   - **Type**: `command`
   - **Command**: `node /absolute/path/to/frames-mcp/dist/index.js`
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
      "command": "node",
      "args": ["/absolute/path/to/frames-mcp/dist/index.js"]
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
      "command": "node",
      "args": ["/absolute/path/to/frames-mcp/dist/index.js"]
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
      "command": "node",
      "args": ["/absolute/path/to/frames-mcp/dist/index.js"]
    }
  }
}
```

---

### Windsurf

Open **Settings** → **MCP** → **Add Server** and fill in:

```json
{
  "command": "node",
  "args": ["/absolute/path/to/frames-mcp/dist/index.js"]
}
```

---

### CLI / Other Platforms

Any MCP-compatible tool (Open Interpreter, custom scripts, etc.) can connect using:

| Parameter | Value |
|-----------|-------|
| **Transport** | `stdio` |
| **Command** | `node` |
| **Args** | `["/absolute/path/to/frames-mcp/dist/index.js"]` |

You can also test it directly in your terminal:

```bash
# Smoke test — should print the running message
node dist/index.js

# Send a raw JSON-RPC list request
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
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
Get 10 frames evenly distributed from /path/to/video.mp4 and save them to /output/frames/
```
```
Cut a 30-second clip starting at 5:00 from /path/to/video.mp4 and save it to /output/clip.mp4
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


