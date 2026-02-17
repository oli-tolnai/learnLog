import { getDatabase } from '../database'

export interface CourseRow {
  id: number
  title: string
  channel: string | null
  youtube_playlist_id: string | null
  youtube_url: string
  thumbnail_url: string | null
  project_folder_path: string
  created_at: string
  updated_at: string
  total_videos: number
  completed_videos: number
  in_progress_videos: number
}

export function getAllCourses(): CourseRow[] {
  const db = getDatabase()
  return db
    .prepare(
      `
    SELECT
      c.*,
      COUNT(v.id) AS total_videos,
      COALESCE(SUM(CASE WHEN v.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_videos,
      COALESCE(SUM(CASE WHEN v.status = 'in_progress' THEN 1 ELSE 0 END), 0) AS in_progress_videos
    FROM courses c
    LEFT JOIN videos v ON v.course_id = c.id
    GROUP BY c.id
    ORDER BY c.updated_at DESC
  `
    )
    .all() as CourseRow[]
}

export function getCourseById(id: number): CourseRow | undefined {
  const db = getDatabase()
  return db
    .prepare(
      `
    SELECT
      c.*,
      COUNT(v.id) AS total_videos,
      COALESCE(SUM(CASE WHEN v.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_videos,
      COALESCE(SUM(CASE WHEN v.status = 'in_progress' THEN 1 ELSE 0 END), 0) AS in_progress_videos
    FROM courses c
    LEFT JOIN videos v ON v.course_id = c.id
    WHERE c.id = ?
    GROUP BY c.id
  `
    )
    .get(id) as CourseRow | undefined
}

export function createCourse(course: {
  title: string
  channel: string | null
  youtube_playlist_id: string | null
  youtube_url: string
  thumbnail_url: string | null
  project_folder_path: string
}): number {
  const db = getDatabase()
  const result = db
    .prepare(
      `
    INSERT INTO courses (title, channel, youtube_playlist_id, youtube_url, thumbnail_url, project_folder_path)
    VALUES (?, ?, ?, ?, ?, ?)
  `
    )
    .run(
      course.title,
      course.channel,
      course.youtube_playlist_id,
      course.youtube_url,
      course.thumbnail_url,
      course.project_folder_path
    )
  return result.lastInsertRowid as number
}

export function deleteCourse(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM courses WHERE id = ?').run(id)
}

export function updateCourseFolder(id: number, folderPath: string): void {
  const db = getDatabase()
  db.prepare(`UPDATE courses SET project_folder_path = ?, updated_at = datetime('now') WHERE id = ?`).run(
    folderPath,
    id
  )
}

export function updateCourseTitle(id: number, title: string): void {
  const db = getDatabase()
  db.prepare(`UPDATE courses SET title = ?, updated_at = datetime('now') WHERE id = ?`).run(title, id)
}
