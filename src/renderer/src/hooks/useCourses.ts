import { useState, useEffect, useCallback } from 'react'
import type { CourseWithStats } from '../types'

export function useCourses() {
  const [courses, setCourses] = useState<CourseWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      const data = await window.api.getCourses()
      setCourses(data as CourseWithStats[])
    } catch (err) {
      console.error('Failed to fetch courses:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { courses, isLoading, refetch: fetch }
}
