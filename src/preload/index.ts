import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // yt-dlp
  fetchPlaylist: (url: string) => ipcRenderer.invoke('ytdlp:fetch-playlist', url),

  // Courses
  getCourses: () => ipcRenderer.invoke('courses:get-all'),
  getCourseById: (id: number) => ipcRenderer.invoke('courses:get-by-id', id),
  createCourse: (data: unknown) => ipcRenderer.invoke('courses:create', data),
  deleteCourse: (id: number) => ipcRenderer.invoke('courses:delete', id),
  updateCourseFolder: (id: number, folderPath: string) =>
    ipcRenderer.invoke('courses:update-folder', id, folderPath),
  updateCourseTitle: (id: number, title: string) =>
    ipcRenderer.invoke('courses:update-title', id, title),

  // Videos
  getVideosByCourse: (courseId: number) => ipcRenderer.invoke('videos:get-by-course', courseId),
  updateVideoStatus: (videoId: number, status: string) =>
    ipcRenderer.invoke('videos:update-status', videoId, status),
  updateVideoNotes: (videoId: number, notes: string) =>
    ipcRenderer.invoke('videos:update-notes', videoId, notes),
  updateVideoProgress: (videoId: number, seconds: number) =>
    ipcRenderer.invoke('videos:update-progress', videoId, seconds),

  // Tags
  getAllTags: () => ipcRenderer.invoke('tags:get-all'),
  getTagsForCourse: (courseId: number) => ipcRenderer.invoke('tags:get-for-course', courseId),
  setCourseTags: (courseId: number, tags: string[]) =>
    ipcRenderer.invoke('tags:set-for-course', courseId, tags),

  // Stats
  getDashboardStats: () => ipcRenderer.invoke('stats:get-dashboard'),

  // Shell
  openInVSCode: (folderPath: string) => ipcRenderer.invoke('shell:open-in-vscode', folderPath),
  openUrl: (url: string) => ipcRenderer.invoke('shell:open-url', url),
  pickFolder: () => ipcRenderer.invoke('shell:pick-folder'),
  getDefaultCoursesDir: () => ipcRenderer.invoke('shell:get-default-courses-dir')
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
