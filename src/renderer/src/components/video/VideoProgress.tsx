import { useState, useEffect } from 'react'
import { ExternalLink, Timer } from 'lucide-react'
import type { Video } from '../../types'
import { formatDuration, parseTimestamp } from '../../lib/utils'

interface VideoProgressProps {
  video: Video | null
  onProgressChange: (videoId: number, seconds: number) => void
  onOpenInBrowser?: () => void
}

export function VideoProgress({
  video,
  onProgressChange,
  onOpenInBrowser
}: VideoProgressProps): React.JSX.Element | null {
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (video) {
      setInputValue(video.progress_seconds > 0 ? formatDuration(video.progress_seconds) : '')
    } else {
      setInputValue('')
    }
  }, [video?.id, video?.progress_seconds])

  if (!video) return null

  const handleSave = (): void => {
    if (!inputValue.trim()) {
      onProgressChange(video.id, 0)
      return
    }
    const seconds = parseTimestamp(inputValue)
    if (seconds !== null) {
      onProgressChange(video.id, seconds)
      setInputValue(formatDuration(seconds))
    } else {
      // Reset to current value on invalid input
      setInputValue(video.progress_seconds > 0 ? formatDuration(video.progress_seconds) : '')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleSave()
      ;(e.target as HTMLInputElement).blur()
    }
  }

  const progressPct =
    video.duration_seconds && video.progress_seconds > 0
      ? Math.min(100, Math.round((video.progress_seconds / video.duration_seconds) * 100))
      : 0

  return (
    <div className="shrink-0 border-b border-border px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Timer className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground shrink-0">Progress:</span>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder="0:00"
          className="w-16 bg-muted border border-border rounded px-1.5 py-0.5 text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-warning/50 focus:border-warning"
        />
        <span className="text-xs text-muted-foreground font-mono">
          / {formatDuration(video.duration_seconds)}
        </span>
        {progressPct > 0 && (
          <span className="text-[10px] text-muted-foreground">({progressPct}%)</span>
        )}
        <div className="flex-1" />
        {onOpenInBrowser && video.progress_seconds > 0 && video.status !== 'completed' && (
          <button
            onClick={onOpenInBrowser}
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-warning hover:text-warning/80 bg-warning/10 rounded transition-colors"
            title={`Continue from ${formatDuration(video.progress_seconds)}`}
          >
            <ExternalLink className="w-3 h-3" />
            Continue
          </button>
        )}
      </div>

      {/* Progress bar */}
      {progressPct > 0 && (
        <div className="h-1 bg-muted rounded-full overflow-hidden mt-1.5">
          <div
            className="h-full bg-warning rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  )
}
