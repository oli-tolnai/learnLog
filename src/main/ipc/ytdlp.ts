import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

function getYtDlpPath(): string {
  if (process.platform === 'darwin') {
    // Check common macOS locations
    return '/opt/homebrew/bin/yt-dlp'
  }
  return 'yt-dlp'
}

export interface YtDlpResult {
  id: string
  title: string
  channel: string | null
  entries: Array<{
    id: string
    title: string
    duration: number | null
    url: string
  }>
}

export async function fetchPlaylistInfo(url: string): Promise<YtDlpResult> {
  const ytdlpPath = getYtDlpPath()

  const { stdout } = await execFileAsync(ytdlpPath, ['--flat-playlist', '--dump-single-json', url], {
    timeout: 60000
  })

  const data = JSON.parse(stdout)

  // Single video case: no entries array, _type is 'video'
  if (!data.entries || data._type === 'video') {
    return {
      id: data.id,
      title: data.title,
      channel: data.channel || data.uploader || null,
      entries: [
        {
          id: data.id,
          title: data.title,
          duration: data.duration || null,
          url: data.webpage_url || `https://www.youtube.com/watch?v=${data.id}`
        }
      ]
    }
  }

  // Playlist case
  return {
    id: data.id,
    title: data.title,
    channel: data.channel || data.uploader || null,
    entries: (data.entries || []).map(
      (entry: { id: string; title: string; duration?: number; url?: string }) => ({
        id: entry.id,
        title: entry.title,
        duration: entry.duration || null,
        url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`
      })
    )
  }
}
