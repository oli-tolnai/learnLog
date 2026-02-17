import { useState, useMemo } from 'react'
import {
  Plus,
  BookOpen,
  Play,
  CheckCircle2,
  Clock,
  Search,
  GraduationCap,
  Download,
  Upload,
  FolderPlus
} from 'lucide-react'
import { useCourses } from '../hooks/useCourses'
import { useStats } from '../hooks/useStats'
import { useGroups } from '../hooks/useGroups'
import { CourseCard } from '../components/course/CourseCard'
import { AddCourseDialog } from '../components/course/AddCourseDialog'
import { ExportDialog } from '../components/course/ExportDialog'
import { GroupDialog } from '../components/course/GroupDialog'
import { GroupSection } from '../components/course/GroupSection'
import type { CourseWithStats } from '../types'

interface DashboardProps {
  onCourseClick: (courseId: number) => void
}

export function Dashboard({ onCourseClick }: DashboardProps): React.JSX.Element {
  const { courses, isLoading, refetch } = useCourses()
  const { stats, refetch: refetchStats } = useStats()
  const { groups, refetch: refetchGroups } = useGroups()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [search, setSearch] = useState('')

  // Group dialog state
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [groupDialogTitle, setGroupDialogTitle] = useState('Create Group')
  const [groupDialogInitialName, setGroupDialogInitialName] = useState('')
  const [groupDialogCallback, setGroupDialogCallback] = useState<((name: string) => void) | null>(null)

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.channel?.toLowerCase().includes(search.toLowerCase())
  )

  const { groupedCourses, ungroupedCourses } = useMemo(() => {
    const grouped = new Map<number, CourseWithStats[]>()
    const ungrouped: CourseWithStats[] = []

    for (const course of filteredCourses) {
      if (course.group_id != null) {
        const list = grouped.get(course.group_id) || []
        list.push(course)
        grouped.set(course.group_id, list)
      } else {
        ungrouped.push(course)
      }
    }
    return { groupedCourses: grouped, ungroupedCourses: ungrouped }
  }, [filteredCourses])

  const handleCourseAdded = (): void => {
    refetch()
    refetchStats()
  }

  const handleCreateGroup = (): void => {
    setGroupDialogTitle('Create Group')
    setGroupDialogInitialName('')
    setGroupDialogCallback(() => async (name: string) => {
      await window.api.createGroup(name)
      refetchGroups()
    })
    setGroupDialogOpen(true)
  }

  const handleRenameGroup = (groupId: number, currentName: string): void => {
    setGroupDialogTitle('Rename Group')
    setGroupDialogInitialName(currentName)
    setGroupDialogCallback(() => async (name: string) => {
      await window.api.renameGroup(groupId, name)
      refetchGroups()
    })
    setGroupDialogOpen(true)
  }

  const handleDeleteGroup = async (groupId: number): Promise<void> => {
    await window.api.deleteGroup(groupId)
    refetchGroups()
    refetch()
  }

  const handleToggleCollapsed = async (groupId: number, collapsed: boolean): Promise<void> => {
    await window.api.toggleGroupCollapsed(groupId, !collapsed)
    refetchGroups()
  }

  const handleMoveGroup = async (groupId: number, direction: 'up' | 'down'): Promise<void> => {
    const idx = groups.findIndex((g) => g.id === groupId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= groups.length) return
    const newOrder = groups.map((g) => g.id)
    ;[newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]]
    await window.api.reorderGroups(newOrder)
    refetchGroups()
  }

  const handleSetCourseGroup = async (courseId: number, groupId: number | null): Promise<void> => {
    await window.api.setCourseGroup(courseId, groupId)
    refetch()
  }

  const handleMoveCourse = async (
    courseId: number,
    direction: 'up' | 'down',
    coursesInSection: CourseWithStats[]
  ): Promise<void> => {
    const idx = coursesInSection.findIndex((c) => c.id === courseId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= coursesInSection.length) return
    const newOrder = coursesInSection.map((c) => c.id)
    ;[newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]]
    await window.api.reorderCoursesInGroup(newOrder)
    refetch()
  }

  const hasGroups = groups.length > 0

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total_courses}</p>
              <p className="text-xs text-muted-foreground">Courses</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-zinc-500/10">
              <Play className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total_videos}</p>
              <p className="text-xs text-muted-foreground">Videos</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completed_videos}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.in_progress_videos}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="w-full bg-muted border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/50"
            />
          </div>
          <button
            onClick={handleCreateGroup}
            className="p-2 text-muted-foreground hover:text-foreground bg-muted border border-border rounded-lg transition-colors shrink-0"
            title="Create group"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          <button
            onClick={async () => {
              const result = await window.api.importData() as { success: boolean }
              if (result.success) { refetch(); refetchStats(); refetchGroups() }
            }}
            className="p-2 text-muted-foreground hover:text-foreground bg-muted border border-border rounded-lg transition-colors shrink-0"
            title="Import data"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowExportDialog(true)}
            className="p-2 text-muted-foreground hover:text-foreground bg-muted border border-border rounded-lg transition-colors shrink-0"
            title="Export data"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </button>
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-2 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 && !hasGroups ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <GraduationCap className="w-12 h-12 opacity-30" />
            {courses.length === 0 ? (
              <>
                <p className="text-lg font-medium">No courses yet</p>
                <p className="text-sm">Add your first YouTube course to get started</p>
                <button
                  onClick={() => setShowAddDialog(true)}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Course
                </button>
              </>
            ) : (
              <p className="text-sm">No courses match your search</p>
            )}
          </div>
        ) : hasGroups ? (
          <>
            {/* Group sections */}
            {groups.map((group, idx) => (
              <GroupSection
                key={group.id}
                group={group}
                courses={groupedCourses.get(group.id) || []}
                allGroups={groups}
                isFirst={idx === 0}
                isLast={idx === groups.length - 1}
                onToggleCollapsed={() => handleToggleCollapsed(group.id, group.collapsed)}
                onRename={() => handleRenameGroup(group.id, group.name)}
                onMoveUp={() => handleMoveGroup(group.id, 'up')}
                onMoveDown={() => handleMoveGroup(group.id, 'down')}
                onDelete={() => handleDeleteGroup(group.id)}
                onCourseClick={onCourseClick}
                onSetCourseGroup={handleSetCourseGroup}
                onMoveCourse={(courseId, dir) =>
                  handleMoveCourse(courseId, dir, groupedCourses.get(group.id) || [])
                }
              />
            ))}

            {/* Ungrouped courses */}
            {ungroupedCourses.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">Ungrouped</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {ungroupedCourses.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ungroupedCourses.map((course, idx) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onClick={() => onCourseClick(course.id)}
                      groupActions={{
                        groups,
                        currentGroupId: course.group_id,
                        onSetGroup: (groupId) => handleSetCourseGroup(course.id, groupId),
                        onMoveUp: () => handleMoveCourse(course.id, 'up', ungroupedCourses),
                        onMoveDown: () => handleMoveCourse(course.id, 'down', ungroupedCourses),
                        isFirst: idx === 0,
                        isLast: idx === ungroupedCourses.length - 1
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((course, idx) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => onCourseClick(course.id)}
                groupActions={{
                  groups: [],
                  currentGroupId: null,
                  onSetGroup: () => {},
                  onMoveUp: () => handleMoveCourse(course.id, 'up', filteredCourses),
                  onMoveDown: () => handleMoveCourse(course.id, 'down', filteredCourses),
                  isFirst: idx === 0,
                  isLast: idx === filteredCourses.length - 1
                }}
              />
            ))}
          </div>
        )}
      </div>

      <AddCourseDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onCourseAdded={handleCourseAdded}
      />

      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        courses={courses}
      />

      <GroupDialog
        isOpen={groupDialogOpen}
        onClose={() => setGroupDialogOpen(false)}
        onSubmit={(name) => groupDialogCallback?.(name)}
        initialName={groupDialogInitialName}
        title={groupDialogTitle}
      />
    </div>
  )
}
