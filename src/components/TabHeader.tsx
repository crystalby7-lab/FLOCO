// 탭 맨 위 제목: 큰 제목 + 회색 한 줄 + 오른쪽 작은 정보 칩. 모든 탭이 같은 모양을 쓴다.
import type { ReactNode } from 'react'

export function TabHeader({ title, sub, right, children }: { title: string; sub?: string; right?: ReactNode; children?: ReactNode }) {
  return (
    <header className="tab-head">
      <div className="tab-head-row">
        <div className="tab-head-text">
          <h1>{title}</h1>
          {sub && <p>{sub}</p>}
        </div>
        {right && <div className="tab-head-right">{right}</div>}
      </div>
      {children}
    </header>
  )
}
