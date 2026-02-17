import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Code,
  Trash2,
  CheckCircle2,
  Clock,
  Circle,
  Search,
  ExternalLink,
  Play
} from 'lucide-react'
import type { CourseWithStats, Video, VideoStatus } from '../types'
import { useVideos } from '../hooks/useVideos'
import { VideoItem } from '../components/video/VideoItem'
import { VideoNotes } from '../components/video/VideoNotes'
import { VideoProgress } from '../components/video/VideoProgress'
import { cn, formatTotalDuration } from '../lib/utils'

interface CourseDetailProps {
  courseId: number
  onBack: () => void
}

export function CourseDetail({ courseId, onBack }: CourseDetailProps): React.JSX.Element {
  const [course, setCourse] = useState<CourseWithStats | null>(null)
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<VideoStatus | 'all'>('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { videos, updateStatus, updateNotes, updateProgress } = useVideos(courseId)

  const fetchCourse = useCallback(async () => {
    const data = await window.api.getCourseById(courseId)
    setCourse(data as CourseWithStats)
  }, [courseId])

  useEffect(() => {
    fetchCourse()
  }, [fetchCourse])

  const selectedVideo = videos.find((v) => v.id === selectedVideoId) || null

  const filteredVideos = videos.filter((v) => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false
    if (search && !v.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleStatusChange = async (videoId: number, status: VideoStatus): Promise<void> => {
    await updateStatus(videoId, status)
    fetchCourse()
  }

  const handleOpenInBrowser = (video: Video): void => {
    let url = `https://www.youtube.com/watch?v=${video.youtube_video_id}`
    if (video.progress_seconds > 0 && video.status !== 'completed') {
      url += `&t=${video.progress_seconds}s`
    }
    window.api.openUrl(url)
  }

  const handleOpenVSCode = (): void => {
    if (course?.project_folder_path) {
      window.api.openInVSCode(course.project_folder_path)
    }
  }

  const handleOpenPlaylist = (): void => {
    if (course?.youtube_url) {
      window.api.openUrl(course.youtube_url)
    }
  }

  const handleDelete = async (): Promise<void> => {
    await window.api.deleteCourse(courseId)
    onBack()
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading...
      </div>
    )
  }

  const percentage =
    course.total_videos > 0
      ? Math.round((course.completed_videos / course.total_videos) * 100)
      : 0

  // More accurate remaining time: for in_progress videos, only count the unwatched portion
  const remainingDuration = videos
    .filter((v) => v.status !== 'completed')
    .reduce((sum, v) => {
      const duration = v.duration_seconds || 0
      const watched = v.progress_seconds || 0
      return sum + Math.max(0, duration - watched)
    }, 0)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{course.title}</h1>
            {course.channel && (
              <p className="text-xs text-muted-foreground">{course.channel}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenPlaylist}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted rounded-md transition-colors"
              title="Open playlist in browser"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              YouTube
            </button>
            {course.project_folder_path && (
              <button
                onClick={handleOpenVSCode}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                title="Open in VS Code"
              >
                <Code className="w-3.5 h-3.5" />
                VS Code
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete course"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  percentage === 100 ? 'bg-success' : 'bg-primary'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            <span className="font-mono font-medium text-foreground">{percentage}%</span>
            <span>
              {course.completed_videos}/{course.total_videos} videos
            </span>
            {remainingDuration > 0 && (
              <span>
                {formatTotalDuration(remainingDuration)} remaining
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video list */}
        <div className="w-[55%] flex flex-col border-r border-border">
          {/* Video toolbar */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-border">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search videos..."
                className="w-full bg-muted border border-border rounded-md pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="flex items-center gap-1">
              {(['all', 'not_started', 'in_progress', 'completed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={cn(
                    'px-2 py-1 rounded-md text-[11px] transition-colors',
                    statusFilter === filter
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {filter === 'all' && 'All'}
                  {filter === 'not_started' && <Circle className="w-3 h-3" />}
                  {filter === 'in_progress' && <Clock className="w-3 h-3 text-warning" />}
                  {filter === 'completed' && <CheckCircle2 className="w-3 h-3 text-success" />}
                </button>
              ))}
            </div>
          </div>

          {/* Video list */}
          <div className="flex-1 overflow-y-auto">
            {filteredVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Play className="w-6 h-6 opacity-30" />
                <p className="text-sm">No videos match your filter</p>
              </div>
            ) : (
              filteredVideos.map((video) => (
                <VideoItem
                  key={video.id}
                  video={video}
                  isSelected={video.id === selectedVideoId}
                  onSelect={() => setSelectedVideoId(video.id)}
                  onStatusChange={(status) => handleStatusChange(video.id, status)}
                  onOpenInBrowser={() => handleOpenInBrowser(video)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right panel: progress + notes */}
        <div className="w-[45%] flex flex-col">
          {/* Video progress input */}
          <VideoProgress
            video={selectedVideo}
            onProgressChange={updateProgress}
            onOpenInBrowser={selectedVideo ? () => handleOpenInBrowser(selectedVideo) : undefined}
          />

          {/* Notes */}
          <div className="flex-1 overflow-hidden">
            <VideoNotes video={selectedVideo} onSaveNotes={updateNotes} />
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-card border border-border rounded-xl shadow-2xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Course</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete &quot;{course.title}&quot;? This will remove all
              videos and notes. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
