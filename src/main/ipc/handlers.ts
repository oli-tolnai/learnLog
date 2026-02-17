import { ipcMain, dialog, shell, app } from 'electron'
import { execFile } from 'child_process'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import path from 'path'
import { getDatabase } from '../db/database'
import { fetchPlaylistInfo } from './ytdlp'
import * as courseRepo from '../db/repositories/courseRepository'
import * as videoRepo from '../db/repositories/videoRepository'
import * as tagRepo from '../db/repositories/tagRepository'

const DEFAULT_COURSES_DIR = path.join(
  path.dirname(path.dirname(__dirname)),
  '..',
  'learnLog_courses'
)

const DEFAULT_DATA_DIR = path.join(app.getAppPath(), 'data')
const DEFAULT_DATA_FILE = path.join(DEFAULT_DATA_DIR, 'learnlog-data.json')

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

  // === Data Export/Import ===
  ipcMain.handle('data:export', async (_event, courseIds: number[]) => {
    if (!existsSync(DEFAULT_DATA_DIR)) {
      mkdirSync(DEFAULT_DATA_DIR, { recursive: true })
    }

    const result = await dialog.showSaveDialog({
      defaultPath: path.join(DEFAULT_DATA_DIR, `learnlog-export-${new Date().toISOString().slice(0, 10)}.json`),
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return { success: false }

    const db = getDatabase()
    const placeholders = courseIds.map(() => '?').join(',')
    const courses = db.prepare(`SELECT * FROM courses WHERE id IN (${placeholders})`).all(...courseIds)
    const videos = db.prepare(`SELECT * FROM videos WHERE course_id IN (${placeholders})`).all(...courseIds)
    const courseTags = db.prepare(`SELECT * FROM course_tags WHERE course_id IN (${placeholders})`).all(...courseIds)
    const tagIds = courseTags.map((ct: { tag_id: number }) => ct.tag_id)
    const tags = tagIds.length > 0
      ? db.prepare(`SELECT * FROM tags WHERE id IN (${tagIds.map(() => '?').join(',')})`).all(...tagIds)
      : []

    const data = {
      version: 2,
      exported_at: new Date().toISOString(),
      courses,
      videos,
      tags,
      course_tags: courseTags
    }
    writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8')
    return { success: true, path: result.filePath }
  })

  ipcMain.handle('data:import', async () => {
    if (!existsSync(DEFAULT_DATA_DIR)) {
      mkdirSync(DEFAULT_DATA_DIR, { recursive: true })
    }

    const result = await dialog.showOpenDialog({
      defaultPath: DEFAULT_DATA_DIR,
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return { success: false }

    const content = readFileSync(result.filePaths[0], 'utf-8')
    const data = JSON.parse(content)
    if (!data.courses || !data.videos) {
      return { success: false, error: 'Invalid export file' }
    }

    const db = getDatabase()
    const importTransaction = db.transaction(() => {
      const findCourseByUrl = db.prepare('SELECT id FROM courses WHERE youtube_url = ?')
      const insertCourse = db.prepare(
        'INSERT INTO courses (title, channel, youtube_playlist_id, youtube_url, thumbnail_url, project_folder_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      const updateCourse = db.prepare(
        `UPDATE courses SET title = ?, channel = ?, thumbnail_url = ?, project_folder_path = ?, updated_at = ? WHERE id = ?`
      )
      const findVideo = db.prepare('SELECT id FROM videos WHERE course_id = ? AND youtube_video_id = ?')
      const insertVideo = db.prepare(
        'INSERT INTO videos (course_id, youtube_video_id, title, duration_seconds, position, thumbnail_url, status, progress_seconds, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      const updateVideo = db.prepare(
        'UPDATE videos SET status = ?, progress_seconds = ?, notes = ?, updated_at = ? WHERE id = ?'
      )
      const getOrCreateTag = db.prepare(
        'INSERT INTO tags (name) VALUES (?) ON CONFLICT(name) DO UPDATE SET name = name RETURNING id'
      )
      const insertCourseTag = db.prepare('INSERT OR IGNORE INTO course_tags (course_id, tag_id) VALUES (?, ?)')

      // Build old course id -> new course id mapping
      const courseIdMap = new Map<number, number>()

      for (const c of data.courses) {
        const existing = findCourseByUrl.get(c.youtube_url) as { id: number } | undefined
        if (existing) {
          updateCourse.run(c.title, c.channel, c.thumbnail_url, c.project_folder_path, c.updated_at, existing.id)
          courseIdMap.set(c.id, existing.id)
        } else {
          const res = insertCourse.run(c.title, c.channel, c.youtube_playlist_id, c.youtube_url, c.thumbnail_url, c.project_folder_path, c.created_at, c.updated_at)
          courseIdMap.set(c.id, res.lastInsertRowid as number)
        }
      }

      // Import videos
      for (const v of data.videos) {
        const newCourseId = courseIdMap.get(v.course_id)
        if (!newCourseId) continue
        const existingVideo = findVideo.get(newCourseId, v.youtube_video_id) as { id: number } | undefined
        if (existingVideo) {
          updateVideo.run(v.status, v.progress_seconds || 0, v.notes || '', v.updated_at, existingVideo.id)
        } else {
          insertVideo.run(newCourseId, v.youtube_video_id, v.title, v.duration_seconds, v.position, v.thumbnail_url, v.status, v.progress_seconds || 0, v.notes || '', v.created_at, v.updated_at)
        }
      }

      // Import tags
      if (data.tags && data.course_tags) {
        const tagIdMap = new Map<number, number>()
        for (const t of data.tags) {
          const tag = getOrCreateTag.get(t.name) as { id: number }
          tagIdMap.set(t.id, tag.id)
        }
        for (const ct of data.course_tags) {
          const newCourseId = courseIdMap.get(ct.course_id)
          const newTagId = tagIdMap.get(ct.tag_id)
          if (newCourseId && newTagId) {
            insertCourseTag.run(newCourseId, newTagId)
          }
        }
      }
    })
    importTransaction()
    return { success: true }
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
