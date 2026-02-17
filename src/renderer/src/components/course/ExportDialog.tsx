import { useState } from 'react'
import { Download, X } from 'lucide-react'
import type { CourseWithStats } from '../../types'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  courses: CourseWithStats[]
}

export function ExportDialog({ isOpen, onClose, courses }: ExportDialogProps): React.JSX.Element | null {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set(courses.map((c) => c.id)))

  if (!isOpen) return null

  const toggleCourse = (id: number): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = (): void => {
    if (selectedIds.size === courses.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(courses.map((c) => c.id)))
    }
  }

  const handleExport = async (): Promise<void> => {
    if (selectedIds.size === 0) return
    await window.api.exportData(Array.from(selectedIds))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Export Courses
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Course list */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              {selectedIds.size}/{courses.length} selected
            </p>
            <button
              onClick={toggleAll}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              {selectedIds.size === courses.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            {courses.map((course) => {
              const pct = course.total_videos > 0
                ? Math.round((course.completed_videos / course.total_videos) * 100)
                : 0
              return (
                <label
                  key={course.id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer border-b border-border last:border-b-0 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(course.id)}
                    onChange={() => toggleCourse(course.id)}
                    className="w-4 h-4 rounded border-border accent-primary shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{course.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {course.channel && `${course.channel} · `}
                      {course.total_videos} videos · {pct}%
                    </p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export {selectedIds.size} course{selectedIds.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
