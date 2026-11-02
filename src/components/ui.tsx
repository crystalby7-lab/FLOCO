import type { ReactNode } from 'react'
import { Coin } from './Icons'

export function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bar">
      <div className="bar-top">
        <span>{label}</span>
        <span className="num">{Math.round(value)}</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
      </div>
    </div>
  )
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="닫기">
            <svg viewBox="0 0 20 20" width="14" height="14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M5 5 L15 15 M15 5 L5 15" />
            </svg>
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}

export function Gold({ value, size = 18 }: { value: number; size?: number }) {
  return (
    <span className="gold">
      <Coin size={size} />
      {value.toLocaleString()}
    </span>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>
}
