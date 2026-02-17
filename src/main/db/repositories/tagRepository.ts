import { getDatabase } from '../database'

export function getAllTags(): Array<{ id: number; name: string }> {
  const db = getDatabase()
  return db.prepare('SELECT * FROM tags ORDER BY name ASC').all() as Array<{ id: number; name: string }>
}

export function getTagsForCourse(courseId: number): Array<{ id: number; name: string }> {
  const db = getDatabase()
  return db
    .prepare(
      `
    SELECT t.* FROM tags t
    JOIN course_tags ct ON ct.tag_id = t.id
    WHERE ct.course_id = ?
    ORDER BY t.name ASC
  `
    )
    .all(courseId) as Array<{ id: number; name: string }>
}

export function setCourseTags(courseId: number, tagNames: string[]): void {
  const db = getDatabase()

  const transaction = db.transaction((names: string[]) => {
    // Remove existing tags for this course
    db.prepare('DELETE FROM course_tags WHERE course_id = ?').run(courseId)

    if (names.length === 0) return

    const getOrCreateTag = db.prepare(
      'INSERT INTO tags (name) VALUES (?) ON CONFLICT(name) DO UPDATE SET name = name RETURNING id'
    )
    const insertCourseTag = db.prepare('INSERT OR IGNORE INTO course_tags (course_id, tag_id) VALUES (?, ?)')

    for (const name of names) {
      const trimmed = name.trim()
      if (!trimmed) continue
      const tag = getOrCreateTag.get(trimmed) as { id: number }
      insertCourseTag.run(courseId, tag.id)
    }
  })

  transaction(tagNames)
}
