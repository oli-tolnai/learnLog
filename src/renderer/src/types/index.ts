export type VideoStatus = 'not_started' | 'in_progress' | 'completed'

export interface Course {
  id: number
  title: string
  channel: string | null
  youtube_playlist_id: string | null
  youtube_url: string
  thumbnail_url: string | null
  project_folder_path: string
  group_id: number | null
  position_in_group: number
  created_at: string
  updated_at: string
}

export interface CourseGroup {
  id: number
  name: string
  position: number
  collapsed: boolean
  created_at: string
  updated_at: string
}

export interface CourseWithStats extends Course {
  total_videos: number
  completed_videos: number
  in_progress_videos: number
}

export interface Video {
  id: number
  course_id: number
  youtube_video_id: string
  title: string
  duration_seconds: number | null
  position: number
  thumbnail_url: string | null
  status: VideoStatus
  progress_seconds: number
  notes: string
  created_at: string
  updated_at: string
}

export interface Tag {
  id: number
  name: string
}

export interface DashboardStats {
  total_courses: number
  total_videos: number
  completed_videos: number
  in_progress_videos: number
  not_started_videos: number
}

export interface CourseCreatePayload {
  title: string
  channel: string | null
  youtube_playlist_id: string | null
  youtube_url: string
  thumbnail_url: string | null
  project_folder_path: string
  videos: Array<{
    youtube_video_id: string
    title: string
    duration_seconds: number | null
    position: number
    thumbnail_url: string | null
  }>
}

export interface YtDlpResult {
  id: string
  title: string
  channel: string | null
  entries: Array<{
    id: string
    title: string
    duration: number | null
    url: string
  }>
}
