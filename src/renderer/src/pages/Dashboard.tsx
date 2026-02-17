import { useState } from 'react'
import {
  Plus,
  BookOpen,
  Play,
  CheckCircle2,
  Clock,
  Search,
  GraduationCap,
  Download,
  Upload
} from 'lucide-react'
import { useCourses } from '../hooks/useCourses'
import { useStats } from '../hooks/useStats'
import { CourseCard } from '../components/course/CourseCard'
import { AddCourseDialog } from '../components/course/AddCourseDialog'
import { ExportDialog } from '../components/course/ExportDialog'

interface DashboardProps {
  onCourseClick: (courseId: number) => void
}

export function Dashboard({ onCourseClick }: DashboardProps): React.JSX.Element {
  const { courses, isLoading, refetch } = useCourses()
  const { stats, refetch: refetchStats } = useStats()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [search, setSearch] = useState('')

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.channel?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCourseAdded = (): void => {
    refetch()
    refetchStats()
  }

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
            onClick={async () => {
              const result = await window.api.importData() as { success: boolean }
              if (result.success) { refetch(); refetchStats() }
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
        ) : filteredCourses.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => onCourseClick(course.id)}
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
    </div>
  )
}
