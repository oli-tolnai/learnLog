import { Circle, CheckCircle2, Clock, ExternalLink } from 'lucide-react'
import type { Video, VideoStatus } from '../../types'
import { cn, formatDuration } from '../../lib/utils'

interface VideoItemProps {
  video: Video
  isSelected: boolean
  onSelect: () => void
  onStatusChange: (status: VideoStatus) => void
  onOpenInBrowser: () => void
}

const nextStatus: Record<VideoStatus, VideoStatus> = {
  not_started: 'in_progress',
  in_progress: 'completed',
  completed: 'not_started'
}

export function VideoItem({
  video,
  isSelected,
  onSelect,
  onStatusChange,
  onOpenInBrowser
}: VideoItemProps): React.JSX.Element {
  const handleStatusClick = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onStatusChange(nextStatus[video.status])
  }

  const handleOpenBrowser = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onOpenInBrowser()
  }

  const progressPct =
    video.status === 'in_progress' && video.duration_seconds && video.progress_seconds > 0
      ? Math.min(100, Math.round((video.progress_seconds / video.duration_seconds) * 100))
      : 0

  const showProgress = video.status === 'in_progress' && video.progress_seconds > 0

  return (
    <div
      onClick={onSelect}
      className={cn(
        'cursor-pointer transition-colors border-l-2',
        isSelected
          ? 'bg-primary/10 border-l-primary'
          : 'border-l-transparent hover:bg-muted/50'
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Status toggle */}
        <button
          onClick={handleStatusClick}
          className="shrink-0 transition-colors"
          title={`Status: ${video.status.replace('_', ' ')}`}
        >
          {video.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-success" />}
          {video.status === 'in_progress' && <Clock className="w-5 h-5 text-warning" />}
          {video.status === 'not_started' && <Circle className="w-5 h-5 text-zinc-600" />}
        </button>

        {/* Video info */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm truncate leading-tight',
              video.status === 'completed' && 'text-muted-foreground line-through'
            )}
          >
            <span className="text-muted-foreground mr-1.5">{video.position}.</span>
            {video.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            {showProgress ? (
              <>
                <span className="text-warning">{formatDuration(video.progress_seconds)}</span>
                {' / '}
                {formatDuration(video.duration_seconds)}
              </>
            ) : (
              formatDuration(video.duration_seconds)
            )}
          </p>
        </div>

        {/* Open in browser */}
        <button
          onClick={handleOpenBrowser}
          className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={video.progress_seconds > 0 ? `Open at ${formatDuration(video.progress_seconds)}` : 'Open in browser'}
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Mini progress bar for in_progress videos */}
      {showProgress && (
        <div className="h-0.5 bg-zinc-800 mx-3 mb-1 rounded-full overflow-hidden">
          <div
            className="h-full bg-warning rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  )
}
