import type { ReactNode } from 'react'

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
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}

export function Gold({ value }: { value: number }) {
  return (
    <span className="gold">
      <span className="coin" aria-hidden>
        G
      </span>
      {value.toLocaleString()}
    </span>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>
}
