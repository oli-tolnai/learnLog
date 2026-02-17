import { useState, useRef, useEffect } from 'react'
import { ChevronRight, ChevronDown, MoreHorizontal, Pencil, ArrowUp, ArrowDown, Trash2 } from 'lucide-react'
import type { CourseWithStats, CourseGroup } from '../../types'
import { CourseCard } from './CourseCard'

interface GroupSectionProps {
  group: CourseGroup
  courses: CourseWithStats[]
  allGroups: CourseGroup[]
  isFirst: boolean
  isLast: boolean
  onToggleCollapsed: () => void
  onRename: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  onCourseClick: (courseId: number) => void
  onSetCourseGroup: (courseId: number, groupId: number | null) => void
  onMoveCourse: (courseId: number, direction: 'up' | 'down') => void
}

export function GroupSection({
  group,
  courses,
  allGroups,
  isFirst,
  isLast,
  onToggleCollapsed,
  onRename,
  onMoveUp,
  onMoveDown,
  onDelete,
  onCourseClick,
  onSetCourseGroup,
  onMoveCourse
}: GroupSectionProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 group/header">
        <button
          onClick={onToggleCollapsed}
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
        >
          {group.collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          {group.name}
        </button>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {courses.length}
        </span>
        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover/header:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute left-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 z-20 w-40">
              <button
                onClick={() => { setMenuOpen(false); onRename() }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Rename
              </button>
              {!isFirst && (
                <button
                  onClick={() => { setMenuOpen(false); onMoveUp() }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  Move Up
                </button>
              )}
              {!isLast && (
                <button
                  onClick={() => { setMenuOpen(false); onMoveDown() }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  Move Down
                </button>
              )}
              <div className="border-t border-border my-1" />
              <button
                onClick={() => { setMenuOpen(false); onDelete() }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-400 hover:bg-muted transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Course Grid */}
      {!group.collapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course, idx) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => onCourseClick(course.id)}
              groupActions={{
                groups: allGroups,
                currentGroupId: course.group_id,
                onSetGroup: (groupId) => onSetCourseGroup(course.id, groupId),
                onMoveUp: () => onMoveCourse(course.id, 'up'),
                onMoveDown: () => onMoveCourse(course.id, 'down'),
                isFirst: idx === 0,
                isLast: idx === courses.length - 1
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
