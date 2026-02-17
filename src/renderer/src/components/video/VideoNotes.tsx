import { useState, useEffect, useRef, useCallback } from 'react'
import { FileText, Eye, Edit3 } from 'lucide-react'
import Markdown from 'react-markdown'
import type { Video } from '../../types'

interface VideoNotesProps {
  video: Video | null
  onSaveNotes: (videoId: number, notes: string) => void
}

export function VideoNotes({ video, onSaveNotes }: VideoNotesProps): React.JSX.Element {
  const [notes, setNotes] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setNotes(video?.notes || '')
    setIsPreview(false)
  }, [video?.id])

  const handleChange = useCallback(
    (value: string) => {
      setNotes(value)
      if (!video) return

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onSaveNotes(video.id, value)
      }, 500)
    },
    [video, onSaveNotes]
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
        <FileText className="w-8 h-8 opacity-50" />
        <p className="text-sm">Select a video to see notes</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground truncate flex-1 mr-2">
          Notes: {video.title}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsPreview(false)}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              !isPreview ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsPreview(true)}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              isPreview ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Preview"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isPreview ? (
          <div className="p-3 prose prose-sm prose-invert max-w-none text-sm leading-relaxed [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_code]:text-primary [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_pre]:bg-muted [&_pre]:rounded-md [&_pre]:p-2 [&_a]:text-primary">
            {notes ? (
              <Markdown>{notes}</Markdown>
            ) : (
              <p className="text-muted-foreground italic">No notes yet...</p>
            )}
          </div>
        ) : (
          <textarea
            value={notes}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Write notes in Markdown..."
            className="w-full h-full bg-transparent resize-none p-3 text-sm focus:outline-none placeholder:text-muted-foreground/40 font-mono leading-relaxed"
          />
        )}
      </div>
    </div>
  )
}
