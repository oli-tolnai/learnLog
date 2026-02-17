import { useState } from 'react'
import { Loader2, Link, FolderOpen, X, Plus } from 'lucide-react'
import type { YtDlpResult } from '../../types'
import { sanitizeFolderName, formatDuration } from '../../lib/utils'

interface AddCourseDialogProps {
  isOpen: boolean
  onClose: () => void
  onCourseAdded: () => void
}

type Stage = 'input' | 'loading' | 'preview'

export function AddCourseDialog({
  isOpen,
  onClose,
  onCourseAdded
}: AddCourseDialogProps): React.JSX.Element | null {
  const [stage, setStage] = useState<Stage>('input')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [ytData, setYtData] = useState<YtDlpResult | null>(null)
  const [title, setTitle] = useState('')
  const [projectFolder, setProjectFolder] = useState('')
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleFetch = async (): Promise<void> => {
    if (!url.trim()) return
    setError('')
    setStage('loading')

    try {
      const data = (await window.api.fetchPlaylist(url.trim())) as YtDlpResult
      setYtData(data)
      setTitle(data.title)
      const defaultDir = (await window.api.getDefaultCoursesDir()) as string
      setProjectFolder(`${defaultDir}/${sanitizeFolderName(data.title)}`)
      setSelectedVideos(new Set(data.entries.map((e) => e.id)))
      setStage('preview')
    } catch (err) {
      setError('Failed to fetch playlist. Make sure the URL is valid and yt-dlp is installed.')
      setStage('input')
    }
  }

  const handlePickFolder = async (): Promise<void> => {
    const folder = (await window.api.pickFolder()) as string | null
    if (folder) setProjectFolder(folder)
  }

  const handleSave = async (): Promise<void> => {
    if (!ytData || !title.trim()) return
    setIsSaving(true)

    try {
      const videos = ytData.entries
        .filter((e) => selectedVideos.has(e.id))
        .map((e, idx) => ({
          youtube_video_id: e.id,
          title: e.title,
          duration_seconds: e.duration,
          position: idx + 1,
          thumbnail_url: `https://i.ytimg.com/vi/${e.id}/hqdefault.jpg`
        }))

      const firstVideoId = videos[0]?.youtube_video_id
      await window.api.createCourse({
        title: title.trim(),
        channel: ytData.channel,
        youtube_playlist_id: ytData.entries.length > 1 ? ytData.id : null,
        youtube_url: url.trim(),
        thumbnail_url: firstVideoId
          ? `https://i.ytimg.com/vi/${firstVideoId}/hqdefault.jpg`
          : null,
        project_folder_path: projectFolder,
        videos
      })

      onCourseAdded()
      handleClose()
    } catch (err) {
      setError('Failed to create course.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = (): void => {
    setStage('input')
    setUrl('')
    setError('')
    setYtData(null)
    setTitle('')
    setProjectFolder('')
    setSelectedVideos(new Set())
    onClose()
  }

  const toggleVideo = (id: string): void => {
    setSelectedVideos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = (): void => {
    if (!ytData) return
    if (selectedVideos.size === ytData.entries.length) {
      setSelectedVideos(new Set())
    } else {
      setSelectedVideos(new Set(ytData.entries.map((e) => e.id)))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Add Course
          </h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {stage === 'input' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  YouTube URL
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                      placeholder="Paste a playlist or video URL..."
                      className="w-full bg-muted border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/50"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleFetch}
                    disabled={!url.trim()}
                    className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Fetch
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Supports YouTube playlists and individual video URLs
                </p>
              </div>
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
            </div>
          )}

          {stage === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Fetching video information...</p>
              <p className="text-xs text-muted-foreground/60">This may take a moment for large playlists</p>
            </div>
          )}

          {stage === 'preview' && ytData && (
            <div className="space-y-4">
              {/* Course title */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Course Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              {/* Channel info */}
              {ytData.channel && (
                <p className="text-xs text-muted-foreground">
                  Channel: <span className="text-foreground">{ytData.channel}</span>
                </p>
              )}

              {/* Project folder */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Project Folder
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={projectFolder}
                    onChange={(e) => setProjectFolder(e.target.value)}
                    className="flex-1 bg-muted border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary font-mono text-xs"
                  />
                  <button
                    onClick={handlePickFolder}
                    className="px-3 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/80 transition-colors"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Video list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Videos ({selectedVideos.size}/{ytData.entries.length} selected)
                  </label>
                  <button
                    onClick={toggleAll}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    {selectedVideos.size === ytData.entries.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>

                <div className="border border-border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  {ytData.entries.map((entry, idx) => (
                    <label
                      key={entry.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border last:border-b-0 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedVideos.has(entry.id)}
                        onChange={() => toggleVideo(entry.id)}
                        className="w-4 h-4 rounded border-border accent-primary"
                      />
                      <span className="text-xs text-muted-foreground w-6 text-right shrink-0">
                        {idx + 1}.
                      </span>
                      <span className="text-sm flex-1 truncate">{entry.title}</span>
                      <span className="text-xs text-muted-foreground font-mono shrink-0">
                        {formatDuration(entry.duration)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {stage === 'preview' && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
            <button
              onClick={() => {
                setStage('input')
                setError('')
              }}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || selectedVideos.size === 0}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Course
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
