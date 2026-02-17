import { getDatabase } from '../database'

export interface GroupRow {
  id: number
  name: string
  position: number
  collapsed: number
  created_at: string
  updated_at: string
}

export function getAllGroups(): GroupRow[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM course_groups ORDER BY position ASC').all() as GroupRow[]
}

export function createGroup(name: string): number {
  const db = getDatabase()
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as max_pos FROM course_groups').get() as { max_pos: number }
  const result = db
    .prepare('INSERT INTO course_groups (name, position) VALUES (?, ?)')
    .run(name, maxPos.max_pos + 1)
  return result.lastInsertRowid as number
}

export function renameGroup(id: number, name: string): void {
  const db = getDatabase()
  db.prepare(`UPDATE course_groups SET name = ?, updated_at = datetime('now') WHERE id = ?`).run(name, id)
}

export function deleteGroup(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM course_groups WHERE id = ?').run(id)
}

export function reorderGroups(orderedIds: number[]): void {
  const db = getDatabase()
  const update = db.prepare(`UPDATE course_groups SET position = ?, updated_at = datetime('now') WHERE id = ?`)
  const transaction = db.transaction(() => {
    for (let i = 0; i < orderedIds.length; i++) {
      update.run(i, orderedIds[i])
    }
  })
  transaction()
}

export function toggleGroupCollapsed(id: number, collapsed: boolean): void {
  const db = getDatabase()
  db.prepare(`UPDATE course_groups SET collapsed = ?, updated_at = datetime('now') WHERE id = ?`).run(
    collapsed ? 1 : 0,
    id
  )
}
