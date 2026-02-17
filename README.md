# LearnLog

Track your YouTube programming course progress — locally, offline, and distraction-free.

LearnLog is a desktop app that lets you import YouTube playlists, track which videos you've watched, take notes, and pick up exactly where you left off.

## Features

- **Add courses from YouTube playlist URLs** — auto-fetches video metadata via yt-dlp
- **Dashboard with stats** — total courses, videos, completed, in progress at a glance
- **Course detail view** — video list with per-video status tracking (not started / in progress / completed)
- **Video progress tracking with timestamp** — continue where you left off
- **Markdown notes per video** — with live preview
- **Open videos in browser** at your saved timestamp
- **Open project folder in VS Code** directly from the app
- **Tag system** for organizing courses
- **Search & filter** courses and videos
- **Selective JSON export & merge import** — backup and transfer between machines
- **Dark theme** with macOS-native frameless window

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Electron](https://www.electronjs.org/) |
| UI | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Database | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| Video data | [yt-dlp](https://github.com/yt-dlp/yt-dlp) |
| Build tool | [electron-vite](https://electron-vite.org/) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) installed and available in PATH

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```
