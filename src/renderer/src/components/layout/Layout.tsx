import { ReactNode } from 'react'
import { BookOpen } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
  onHomeClick: () => void
}

export function Layout({ children, onHomeClick }: LayoutProps): React.JSX.Element {
  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground">
      {/* Title bar / drag region */}
      <div
        className="h-12 flex items-center px-4 border-b border-border shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="w-[70px]" /> {/* Space for traffic lights on macOS */}
        <button
          onClick={onHomeClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">LearnLog</span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
