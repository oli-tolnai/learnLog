import { Play, CheckCircle2, Clock } from 'lucide-react'
import type { CourseWithStats } from '../../types'
import { cn } from '../../lib/utils'

interface CourseCardProps {
  course: CourseWithStats
  onClick: () => void
}

export function CourseCard({ course, onClick }: CourseCardProps): React.JSX.Element {
  const percentage =
    course.total_videos > 0 ? Math.round((course.completed_videos / course.total_videos) * 100) : 0
  const isComplete = percentage === 100

  const thumbnailUrl = course.thumbnail_url || `https://i.ytimg.com/vi/${course.youtube_playlist_id || 'default'}/hqdefault.jpg`

  return (
    <button
      onClick={onClick}
      className="text-left w-full bg-card border border-border rounded-lg overflow-hidden hover:border-zinc-600 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 group"
    >
      {/* Thumbnail */}
      <div className="aspect-video relative overflow-hidden bg-muted">
        <img
          src={thumbnailUrl}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src =
              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect fill="%2318181b" width="320" height="180"/><text x="160" y="90" text-anchor="middle" fill="%2352525b" font-size="14">No Thumbnail</text></svg>'
          }}
          loading="lazy"
        />
        {/* Progress overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
          <div
            className={cn(
              'h-full transition-all duration-300',
              isComplete ? 'bg-success' : 'bg-primary'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* Channel badge */}
        {course.channel && (
          <span className="absolute top-2 right-2 text-[10px] font-medium bg-black/70 text-zinc-300 px-2 py-0.5 rounded-full backdrop-blur-sm">
            {course.channel}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
          {course.title}
        </h3>

        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Play className="w-3 h-3" />
            {course.total_videos} videos
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-success" />
            {course.completed_videos}
          </span>
          {course.in_progress_videos > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-warning" />
              {course.in_progress_videos}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                isComplete ? 'bg-success' : 'bg-primary'
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">{percentage}%</span>
        </div>
      </div>
    </button>
  )
}
