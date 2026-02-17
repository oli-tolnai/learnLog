import { useState, useEffect, useCallback } from 'react'
import type { Video, VideoStatus } from '../types'

export function useVideos(courseId: number) {
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      const data = await window.api.getVideosByCourse(courseId)
      setVideos(data as Video[])
    } catch (err) {
      console.error('Failed to fetch videos:', err)
    } finally {
      setIsLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetch()
  }, [fetch])

  const updateStatus = useCallback(
    async (videoId: number, status: VideoStatus) => {
      // Optimistic update
      setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, status } : v)))
      try {
        await window.api.updateVideoStatus(videoId, status)
      } catch (err) {
        console.error('Failed to update video status:', err)
        fetch()
      }
    },
    [fetch]
  )

  const updateNotes = useCallback(async (videoId: number, notes: string) => {
    try {
      await window.api.updateVideoNotes(videoId, notes)
      setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, notes } : v)))
    } catch (err) {
      console.error('Failed to update notes:', err)
    }
  }, [])

  const updateProgress = useCallback(
    async (videoId: number, progressSeconds: number) => {
      setVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, progress_seconds: progressSeconds } : v))
      )
      try {
        await window.api.updateVideoProgress(videoId, progressSeconds)
      } catch (err) {
        console.error('Failed to update progress:', err)
        fetch()
      }
    },
    [fetch]
  )

  return { videos, isLoading, updateStatus, updateNotes, updateProgress, refetch: fetch }
}
