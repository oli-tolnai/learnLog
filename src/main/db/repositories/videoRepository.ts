import { getDatabase } from '../database'

export interface VideoRow {
  id: number
  course_id: number
  youtube_video_id: string
  title: string
  duration_seconds: number | null
  position: number
  thumbnail_url: string | null
  status: string
  progress_seconds: number
  notes: string
  created_at: string
  updated_at: string
}

export function getVideosByCourseId(courseId: number): VideoRow[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM videos WHERE course_id = ? ORDER BY position ASC')
    .all(courseId) as VideoRow[]
}

export function updateVideoStatus(videoId: number, status: string): void {
  const db = getDatabase()

  if (status === 'completed') {
    // Set progress to full duration when marking as completed
    db.prepare(
      `UPDATE videos SET status = ?, progress_seconds = COALESCE(duration_seconds, 0), updated_at = datetime('now') WHERE id = ?`
    ).run(status, videoId)
  } else if (status === 'not_started') {
    // Reset progress when marking as not started
    db.prepare(
      `UPDATE videos SET status = ?, progress_seconds = 0, updated_at = datetime('now') WHERE id = ?`
    ).run(status, videoId)
  } else {
    db.prepare(`UPDATE videos SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, videoId)
  }

  // Also update the course's updated_at
  db.prepare(
    `UPDATE courses SET updated_at = datetime('now') WHERE id = (SELECT course_id FROM videos WHERE id = ?)`
  ).run(videoId)
}

export function updateVideoProgress(videoId: number, progressSeconds: number): void {
  const db = getDatabase()
  db.prepare(
    `UPDATE videos SET progress_seconds = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(progressSeconds, videoId)
}

export function updateVideoNotes(videoId: number, notes: string): void {
  const db = getDatabase()
  db.prepare(`UPDATE videos SET notes = ?, updated_at = datetime('now') WHERE id = ?`).run(notes, videoId)
}

export function insertVideos(
  courseId: number,
  videos: Array<{
    youtube_video_id: string
    title: string
    duration_seconds: number | null
    position: number
    thumbnail_url: string | null
  }>
): void {
  const db = getDatabase()
  const insert = db.prepare(`
    INSERT INTO videos (course_id, youtube_video_id, title, duration_seconds, position, thumbnail_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertMany = db.transaction((vids: typeof videos) => {
    for (const v of vids) {
      insert.run(courseId, v.youtube_video_id, v.title, v.duration_seconds, v.position, v.thumbnail_url)
    }
  })

  insertMany(videos)
}

export function getStats(): {
  total_courses: number
  total_videos: number
  completed_videos: number
  in_progress_videos: number
  not_started_videos: number
} {
  const db = getDatabase()
  const stats = db
    .prepare(
      `
    SELECT
      (SELECT COUNT(*) FROM courses) AS total_courses,
      COUNT(*) AS total_videos,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_videos,
      COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) AS in_progress_videos,
      COALESCE(SUM(CASE WHEN status = 'not_started' THEN 1 ELSE 0 END), 0) AS not_started_videos
    FROM videos
  `
    )
    .get() as {
    total_courses: number
    total_videos: number
    completed_videos: number
    in_progress_videos: number
    not_started_videos: number
  }
  return stats
}
