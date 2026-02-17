import { useState, useEffect, useCallback } from 'react'
import type { CourseGroup } from '../types'

export function useGroups() {
  const [groups, setGroups] = useState<CourseGroup[]>([])

  const fetch = useCallback(async () => {
    try {
      const data = await window.api.getGroups()
      setGroups(
        (data as Array<{ id: number; name: string; position: number; collapsed: number; created_at: string; updated_at: string }>).map((g) => ({
          ...g,
          collapsed: g.collapsed === 1
        }))
      )
    } catch (err) {
      console.error('Failed to fetch groups:', err)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { groups, refetch: fetch }
}
