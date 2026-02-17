import { useState, useEffect, useCallback } from 'react'
import type { DashboardStats } from '../types'

export function useStats() {
  const [stats, setStats] = useState<DashboardStats>({
    total_courses: 0,
    total_videos: 0,
    completed_videos: 0,
    in_progress_videos: 0,
    not_started_videos: 0
  })

  const fetch = useCallback(async () => {
    try {
      const data = await window.api.getDashboardStats()
      setStats(data as DashboardStats)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { stats, refetch: fetch }
}
