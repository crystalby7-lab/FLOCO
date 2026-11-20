// 처음 들어올 때: 약관 동의 → 구글로 시작하기 (만 14세 이상만)
// 약관 본문은 아직 준비 중 (보영: 체크 화면만 먼저)
import { useState } from 'react'
import { actions, useGame } from '../store'
import { signInGoogle, useSyncStatus } from '../sync'
import { ART } from '../components/CatView'
import { Wordmark } from '../components/Wordmark'
import { Sheet } from '../components/ui'

const ITEMS = [
  { id: 'age14', label: '만 14세 이상이에요', need: true, doc: false },
  { id: 'terms', label: '서비스 이용약관 동의', need: true, doc: true },
  { id: 'privacy', label: '개인정보 수집·이용 동의', need: true, doc: true },
  { id: 'news', label: '새 소식·이벤트 알림 받기', need: false, doc: false },
] as const
type Id = (typeof ITEMS)[number]['id']

export function Welcome() {
  const s = useGame()
  const sync = useSyncStatus()
  const [on, setOn] = useState<Record<Id, boolean>>({ age14: false, terms: false, privacy: false, news: false })
  const [view, setView] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const all = ITEMS.every((i) => on[i.id])
  const ok = ITEMS.filter((i) => i.need).every((i) => on[i.id])
  const agreed = !!s.consent

  const google = async () => {
    setBusy(true)
    setErr('')
    if (!agreed) actions.agree(on.news)
    const e = await signInGoogle()
    setBusy(false)
    if (e) setErr(e)
  }

  return (
    <div className="welcome">
      <div className="wc-top">
        <Wordmark />
        <img className="wc-cat" src={ART.t_wave} alt="" />
        <p>친구들과 고양이를 키우며 배우는 금융</p>
      </div>

      {!agreed && (
        <section className="wc-terms">
          <button className={`wc-all ${all ? 'on' : ''}`} onClick={() => setOn(Object.fromEntries(ITEMS.map((i) => [i.id, !all])) as Record<Id, boolean>)}>
            <i>{all ? '✓' : ''}</i>
            <b>전체 동의</b>
          </button>
          <ul>
            {ITEMS.map((it) => (
              <li key={it.id}>
                <button className={`wc-check ${on[it.id] ? 'on' : ''}`} onClick={() => setOn({ ...on, [it.id]: !on[it.id] })}>
                  <i>{on[it.id] ? '✓' : ''}</i>
                  <span>
                    <em className={it.need ? 'need' : ''}>{it.need ? '필수' : '선택'}</em>
                    {it.label}
                  </span>
                </button>
                {it.doc && (
                  <button className="wc-view" onClick={() => setView(it.label)}>
                    보기
                  </button>
                )}
              </li>
            ))}
          </ul>
          <p className="wc-note">만 14세 미만은 아직 가입할 수 없어요.</p>
        </section>
      )}

      <div className="wc-actions">
        <button className="wc-google" disabled={(!agreed && !ok) || busy || sync === 'connecting'} onClick={google}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.8 3.2-8z" />
            <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8z" />
            <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
          </svg>
          {busy ? '로그인 중…' : sync === 'connecting' ? '서버에 연결하는 중…' : 'Google로 시작하기'}
        </button>
        {err && <p className="wc-err">{err}</p>}
        {sync === 'offline' && <p className="wc-err">서버에 닿지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.</p>}
      </div>

      {view && (
        <Sheet title={view} onClose={() => setView(null)}>
          <p className="fineprint">본문을 준비하고 있어요. 정식 문서가 나오면 여기에서 볼 수 있어요.</p>
          <button className="btn btn-primary btn-block" onClick={() => setView(null)}>
            닫기
          </button>
        </Sheet>
      )}
    </div>
  )
}
