// 고양이가 사는 언덕 장면 (배경)
import type { ReactNode } from 'react'

export function Scene({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <div className={`scene ${compact ? 'compact' : ''}`}>
      <svg className="scene-bg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden>
        <rect width="400" height="300" fill="#DDEBD3" />
        <circle cx="330" cy="58" r="26" fill="#FFF2C9" />
        <g fill="#FFFDF5" opacity="0.9">
          <ellipse cx="80" cy="56" rx="30" ry="11" />
          <ellipse cx="102" cy="48" rx="18" ry="11" />
          <ellipse cx="250" cy="34" rx="22" ry="8" />
        </g>
        {/* 둥근 나무들 */}
        <g stroke="#5B4636" strokeWidth="2" strokeLinejoin="round">
          <rect x="44" y="130" width="8" height="40" rx="3" fill="#B98B66" />
          <circle cx="48" cy="118" r="26" fill="#9BCB7E" />
          <rect x="338" y="138" width="7" height="34" rx="3" fill="#B98B66" />
          <circle cx="342" cy="126" r="22" fill="#AED690" />
          <circle cx="372" cy="146" r="16" fill="#9BCB7E" />
        </g>
        {/* 언덕 */}
        <path d="M-10 190 C80 150 160 160 220 170 C290 182 340 160 410 168 V310 H-10 Z" fill="#B7D99B" stroke="#5B4636" strokeWidth="2" />
        <path d="M-10 230 C100 205 200 215 260 222 C320 228 360 214 410 220 V310 H-10 Z" fill="#A4CE86" />
        {/* 꽃 */}
        <g>
          <circle cx="70" cy="214" r="3.5" fill="#F7B8C4" />
          <circle cx="86" cy="226" r="3" fill="#FFF2C9" />
          <circle cx="320" cy="210" r="3.5" fill="#FFF2C9" />
          <circle cx="336" cy="224" r="3" fill="#F7B8C4" />
          <circle cx="300" cy="240" r="2.5" fill="#FFFDF5" />
          <circle cx="110" cy="246" r="2.5" fill="#FFFDF5" />
        </g>
      </svg>
      <div className="scene-fg">{children}</div>
    </div>
  )
}
