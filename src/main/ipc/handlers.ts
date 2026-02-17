import { ipcMain, dialog, shell } from 'electron'
import { execFile } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import { fetchPlaylistInfo } from './ytdlp'
import * as courseRepo from '../db/repositories/courseRepository'
import * as videoRepo from '../db/repositories/videoRepository'
import * as tagRepo from '../db/repositories/tagRepository'

const DEFAULT_COURSES_DIR = path.join(
  path.dirname(path.dirname(__dirname)),
  '..',
  'learnLog_courses'
)

function getVSCodePath(): string {
  if (process.platform === 'darwin') {
    return '/usr/local/bin/code'
  }
  return 'code'
}

export function registerIpcHandlers(): void {
  // === yt-dlp ===
  ipcMain.handle('ytdlp:fetch-playlist', async (_event, url: string) => {
    return fetchPlaylistInfo(url)
  })

  // === Courses ===
  ipcMain.handle('courses:get-all', () => {
    return courseRepo.getAllCourses()
  })

  ipcMain.handle('courses:get-by-id', (_event, id: number) => {
    return courseRepo.getCourseById(id)
  })

  ipcMain.handle(
    'courses:create',
    (
      _event,
      data: {
        title: string
        channel: string | null
        youtube_playlist_id: string | null
        youtube_url: string
        thumbnail_url: string | null
        project_folder_path: string
        videos: Array<{
          youtube_video_id: string
          title: string
          duration_seconds: number | null
          position: number
          thumbnail_url: string | null
        }>
      }
    ) => {
      // Ensure project folder exists if path is set
      if (data.project_folder_path) {
        if (!existsSync(data.project_folder_path)) {
          mkdirSync(data.project_folder_path, { recursive: true })
        }
      }
      const courseId = courseRepo.createCourse(data)
      videoRepo.insertVideos(courseId, data.videos)
      return courseId
    }
  )

  ipcMain.handle('courses:delete', (_event, id: number) => {
    courseRepo.deleteCourse(id)
  })

  ipcMain.handle('courses:update-folder', (_event, id: number, folderPath: string) => {
    courseRepo.updateCourseFolder(id, folderPath)
  })

  ipcMain.handle('courses:update-title', (_event, id: number, title: string) => {
    courseRepo.updateCourseTitle(id, title)
  })

  // === Videos ===
  ipcMain.handle('videos:get-by-course', (_event, courseId: number) => {
    return videoRepo.getVideosByCourseId(courseId)
  })

  ipcMain.handle('videos:update-status', (_event, videoId: number, status: string) => {
    videoRepo.updateVideoStatus(videoId, status)
  })

  ipcMain.handle('videos:update-notes', (_event, videoId: number, notes: string) => {
    videoRepo.updateVideoNotes(videoId, notes)
  })

  ipcMain.handle('videos:update-progress', (_event, videoId: number, seconds: number) => {
    videoRepo.updateVideoProgress(videoId, seconds)
  })

  // === Tags ===
  ipcMain.handle('tags:get-all', () => {
    return tagRepo.getAllTags()
  })

  ipcMain.handle('tags:get-for-course', (_event, courseId: number) => {
    return tagRepo.getTagsForCourse(courseId)
  })

  ipcMain.handle('tags:set-for-course', (_event, courseId: number, tags: string[]) => {
    tagRepo.setCourseTags(courseId, tags)
  })

  // === Stats ===
  ipcMain.handle('stats:get-dashboard', () => {
    return videoRepo.getStats()
  })

  // === Shell / File System ===
  ipcMain.handle('shell:open-in-vscode', (_event, folderPath: string) => {
    const vscodePath = getVSCodePath()
    execFile(vscodePath, [folderPath], (err) => {
      if (err) console.error('Failed to open VS Code:', err)
    })
  })

  ipcMain.handle('shell:open-url', (_event, url: string) => {
    shell.openExternal(url)
  })

  ipcMain.handle('shell:pick-folder', async () => {
    const defaultPath = existsSync(DEFAULT_COURSES_DIR) ? DEFAULT_COURSES_DIR : undefined
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      defaultPath
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.handle('shell:get-default-courses-dir', () => {
    return '/Users/svatplayer2/repos/learnLog_courses'
  })
}
