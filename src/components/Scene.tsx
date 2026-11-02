// 고양이가 앉아 있는 크림색 무대
import type { ReactNode } from 'react'

export function Scene({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <div className={`stage ${compact ? 'compact' : ''}`}>
      <div className="stage-floor" aria-hidden />
      <div className="stage-fg">{children}</div>
    </div>
  )
}
