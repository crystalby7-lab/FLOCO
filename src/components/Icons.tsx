// 직접 그린 아이콘 모음 (이모지 대신)
import type { ReactElement } from 'react'

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export const TabIcon: Record<string, ReactElement> = {
  home: (
    <svg viewBox="0 0 28 28" {...S}>
      <path d="M5 13 L14 5 L23 13 V22 a2 2 0 0 1 -2 2 H7 a2 2 0 0 1 -2 -2 Z" />
      <path d="M11 24 V17 h6 v7" />
    </svg>
  ),
  map: (
    <svg viewBox="0 0 28 28" {...S}>
      <path d="M4 7 L10 5 L18 8 L24 6 V21 L18 23 L10 20 L4 22 Z" />
      <path d="M10 5 V20 M18 8 V23" />
    </svg>
  ),
  invest: (
    <svg viewBox="0 0 28 28" {...S}>
      <path d="M5 21 L11 14 L15 17 L23 8" />
      <path d="M18 8 h5 v5" />
      <path d="M5 24 H23" />
    </svg>
  ),
  shop: (
    <svg viewBox="0 0 28 28" {...S}>
      <path d="M6 10 h16 l-1.2 12.5 a2 2 0 0 1 -2 1.5 H9.2 a2 2 0 0 1 -2 -1.5 Z" />
      <path d="M10 10 V8 a4 4 0 0 1 8 0 V10" />
    </svg>
  ),
  guild: (
    <svg viewBox="0 0 28 28" {...S}>
      <circle cx="10.5" cy="10" r="3.5" />
      <circle cx="19" cy="11" r="3" />
      <path d="M4 22 c0 -4 3 -6 6.5 -6 s6.5 2 6.5 6" />
      <path d="M17 16.5 c3.5 -0.5 6.5 1.5 6.5 5" />
    </svg>
  ),
}

// 상점 아이템 그림
export const ItemIcon: Record<string, ReactElement> = {
  feed: (
    <svg viewBox="0 0 48 48">
      <path d="M8 24 h32 a16 13 0 0 1 -32 0 Z" fill="#9DC4E8" stroke="#3B2F29" strokeWidth="2.2" />
      <ellipse cx="24" cy="24" rx="16" ry="4" fill="#F2D18B" stroke="#3B2F29" strokeWidth="2.2" />
      <circle cx="18" cy="22" r="2" fill="#C98B5B" />
      <circle cx="25" cy="21" r="2" fill="#C98B5B" />
      <circle cx="30" cy="23" r="2" fill="#C98B5B" />
    </svg>
  ),
  snack: (
    <svg viewBox="0 0 48 48">
      <path d="M8 24 C16 13 30 13 37 24 C30 35 16 35 8 24 Z" fill="#B8D3EA" stroke="#3B2F29" strokeWidth="2.2" />
      <path d="M37 24 L44 17 V31 Z" fill="#B8D3EA" stroke="#3B2F29" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="16" cy="22" r="1.8" fill="#3B2F29" />
    </svg>
  ),
  toy: (
    <svg viewBox="0 0 48 48">
      <path d="M12 38 L30 14" stroke="#3B2F29" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M30 14 C26 6 38 4 40 10 C42 16 34 20 30 14 Z" fill="#F4A6B8" stroke="#3B2F29" strokeWidth="2.2" />
      <path d="M27 18 C20 14 24 8 29 12" fill="#FCD38D" stroke="#3B2F29" strokeWidth="2.2" />
    </svg>
  ),
  ribbon: (
    <svg viewBox="0 0 48 48">
      <path d="M24 24 L10 14 V34 Z M24 24 L38 14 V34 Z" fill="#F08A8A" stroke="#3B2F29" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="24" cy="24" r="5" fill="#F08A8A" stroke="#3B2F29" strokeWidth="2.2" />
    </svg>
  ),
  beanie: (
    <svg viewBox="0 0 48 48">
      <path d="M10 32 C10 14 38 14 38 32 Z" fill="#B9A7F0" stroke="#3B2F29" strokeWidth="2.2" strokeLinejoin="round" />
      <rect x="8" y="30" width="32" height="7" rx="3.5" fill="#D9CFF8" stroke="#3B2F29" strokeWidth="2.2" />
      <circle cx="24" cy="12" r="4" fill="#FFF7EA" stroke="#3B2F29" strokeWidth="2.2" />
    </svg>
  ),
  scarf: (
    <svg viewBox="0 0 48 48">
      <path d="M8 18 Q24 26 40 18 V25 Q24 33 8 25 Z" fill="#8FB3F5" stroke="#3B2F29" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M28 27 L31 41 L24 40 L23 28 Z" fill="#8FB3F5" stroke="#3B2F29" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  ),
  glasses: (
    <svg viewBox="0 0 48 48" fill="none" stroke="#3B2F29" strokeWidth="2.4">
      <circle cx="15" cy="25" r="8" fill="#EAF3FB" />
      <circle cx="33" cy="25" r="8" fill="#EAF3FB" />
      <path d="M23 25 h2" />
    </svg>
  ),
  cushion: (
    <svg viewBox="0 0 48 48">
      <ellipse cx="24" cy="30" rx="18" ry="8" fill="#F6D27A" stroke="#3B2F29" strokeWidth="2.2" />
      <ellipse cx="24" cy="27" rx="12" ry="4" fill="#FBE4A6" />
    </svg>
  ),
  plant: (
    <svg viewBox="0 0 48 48">
      <path d="M22 26 C14 22 12 12 18 10 C22 14 24 20 22 26 Z" fill="#9BCB7E" stroke="#3B2F29" strokeWidth="2.2" />
      <path d="M26 26 C32 18 40 18 38 24 C34 28 30 28 26 26 Z" fill="#B5DB98" stroke="#3B2F29" strokeWidth="2.2" />
      <path d="M15 26 h18 l-2 14 h-14 Z" fill="#E5A07E" stroke="#3B2F29" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  ),
}

export function Coin({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden>
      <circle cx="10" cy="10" r="8.5" fill="#F6CF6B" stroke="#3B2F29" strokeWidth="1.6" />
      <circle cx="10" cy="10" r="5.2" fill="none" stroke="#D9A93E" strokeWidth="1.4" />
      <path d="M7.5 6.5 L9 10 L7.5 13.5 M12.5 6.5 L11 10 L12.5 13.5" stroke="#B9862A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function Lock({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="4" y="9" width="12" height="8" rx="2.5" />
      <path d="M7 9 V6.5 a3 3 0 0 1 6 0 V9" />
    </svg>
  )
}
