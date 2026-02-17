import { useState } from 'react'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { CourseDetail } from './pages/CourseDetail'

type Route = { page: 'dashboard' } | { page: 'course'; courseId: number }

function App(): React.JSX.Element {
  const [route, setRoute] = useState<Route>({ page: 'dashboard' })

  return (
    <Layout onHomeClick={() => setRoute({ page: 'dashboard' })}>
      {route.page === 'dashboard' && (
        <Dashboard onCourseClick={(courseId) => setRoute({ page: 'course', courseId })} />
      )}
      {route.page === 'course' && (
        <CourseDetail
          courseId={route.courseId}
          onBack={() => setRoute({ page: 'dashboard' })}
        />
      )}
    </Layout>
  )
}

export default App
