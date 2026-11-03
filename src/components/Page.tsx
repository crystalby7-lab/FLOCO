// 새 화면으로 넘어가는 페이지 (퀴즈·퀘스트·제안 쓰기·돌아보기 등)
// 왼쪽 위 화살표로 나가고, 진행 중이면 종료 확인창을 먼저 띄운다.
import { useState, type ReactNode } from 'react'

export function Page({
  title,
  sub,
  onExit,
  confirm = false,
  children,
}: {
  title: string
  sub?: string
  onExit: () => void
  confirm?: boolean // true면 나가기 전에 확인
  children: ReactNode
}) {
  const [asking, setAsking] = useState(false)
  return (
    <div className="layer page" role="dialog" aria-modal="true" aria-label={title}>
      <header className="layer-head page-head">
        <button className="icon-btn" aria-label="나가기" onClick={() => (confirm ? setAsking(true) : onExit())}>
          <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 4 L6.5 10 L12.5 16" />
          </svg>
        </button>
        <div className="page-title">
          <h1>{title}</h1>
          {sub && <small>{sub}</small>}
        </div>
      </header>
      <div className="page-body">{children}</div>
      {asking && (
        <ConfirmDialog
          title="정말 종료하시겠습니까?"
          message="기록이 안 남습니다."
          ok="종료하기"
          cancel="계속하기"
          onOk={onExit}
          onCancel={() => setAsking(false)}
        />
      )}
    </div>
  )
}

export function ConfirmDialog({
  title,
  message,
  ok,
  cancel,
  onOk,
  onCancel,
}: {
  title: string
  message: string
  ok: string
  cancel: string
  onOk: () => void
  onCancel: () => void
}) {
  return (
    <div className="dialog-bg" onClick={onCancel}>
      <div className="dialog" role="alertdialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">{title}</div>
        <p className="dialog-msg">{message}</p>
        <div className="dialog-actions">
          <button className="btn" onClick={onCancel}>
            {cancel}
          </button>
          <button className="btn btn-danger" onClick={onOk}>
            {ok}
          </button>
        </div>
      </div>
    </div>
  )
}
