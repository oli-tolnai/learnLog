import { getDatabase } from './database'

export function runMigrations(): void {
  const db = getDatabase()

  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      channel TEXT,
      youtube_playlist_id TEXT,
      youtube_url TEXT NOT NULL,
      thumbnail_url TEXT,
      project_folder_path TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      youtube_video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      duration_seconds INTEGER,
      position INTEGER NOT NULL DEFAULT 0,
      thumbnail_url TEXT,
      status TEXT NOT NULL DEFAULT 'not_started'
        CHECK (status IN ('not_started', 'in_progress', 'completed')),
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS course_tags (
      course_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (course_id, tag_id),
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_videos_course_id ON videos(course_id);
    CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
    CREATE INDEX IF NOT EXISTS idx_course_tags_course_id ON course_tags(course_id);
    CREATE INDEX IF NOT EXISTS idx_course_tags_tag_id ON course_tags(tag_id);
  `)

  // Migration: add progress_seconds column for existing databases
  try {
    db.exec(`ALTER TABLE videos ADD COLUMN progress_seconds INTEGER NOT NULL DEFAULT 0`)
  } catch {
    // Column already exists, ignore
  }

  // Migration: course_groups table
  db.exec(`
    CREATE TABLE IF NOT EXISTS course_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      collapsed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Migration: add group_id to courses
  try {
    db.exec(`ALTER TABLE courses ADD COLUMN group_id INTEGER REFERENCES course_groups(id) ON DELETE SET NULL`)
  } catch {
    // Column already exists, ignore
  }

  // Migration: add position_in_group to courses
  try {
    db.exec(`ALTER TABLE courses ADD COLUMN position_in_group INTEGER NOT NULL DEFAULT 0`)
  } catch {
    // Column already exists, ignore
  }
}
