// 길드 (2026-11-27, 피크민 벤치마크 문서 10번 순서): ① 길드 이름 + 같이 키우는 고양이 한 마리 → ② 이번 주 같이 하기 → ③ 의견 부탁 → ④ 친구들의 발자국 → ⑤ 친구 카드·응원 → ⑥ 이야기 → ⑦ 지난 주 협동 기록
// 고양이는 길드당 한 마리. 길드 화면에서 친구는 고양이 그림이 아니라 이름 첫 글자 동그라미(Mate).
import { useEffect, useState } from 'react'
import { actions, memberName, today, useGame } from '../store'
import { tickerOf } from '../data/market'
import { ART } from '../components/CatView'
import { Mate } from '../components/Mate'
import { GuildYard } from '../components/GuildYard'
import { WeekQuest } from '../components/WeekQuest'
import { Footprints } from '../components/Footprints'
import { WeekAlbum } from '../components/WeekAlbum'
import type { Tab } from '../App'
import type { FeedItem, Post, Proposal, Retro } from '../types'

type Topic = 'chat' | 'invest' | 'ask'
const TOPICS: { id: Topic; label: string }[] = [
  { id: 'chat', label: '💬 잡담' },
  { id: 'invest', label: '📈 투자 얘기' },
  { id: 'ask', label: '❓ 질문' },
]
const topicLabel = (t?: Topic) => TOPICS.find((x) => x.id === (t ?? 'chat'))!.label

const ago = (at: number) => {
  const m = Math.floor((Date.now() - at) / 60000)
  return m < 1 ? '방금' : m < 60 ? `${m}분 전` : m < 1440 ? `${Math.floor(m / 60)}시간 전` : `${Math.floor(m / 1440)}일 전`
}

const iGa = (w: string) => ((w.charCodeAt(w.length - 1) - 0xac00) % 28 ? '이' : '가')

export function GuildScreen({ go }: { go?: (t: Tab) => void }) {
  const s = useGame()
  const g = s.guild!
  const [invite, setInvite] = useState(false)
  const filter = 'all' as 'all' | Topic
  const [draft, setDraft] = useState('')
  const [topic, setTopic] = useState<Topic>('chat')
  const [writing, setWriting] = useState(false)
  const [copied, setCopied] = useState(false)
  const myId = g.members.find((m) => m.isMe)!.id

  // 피드: 글 + 길드 활동을 시간순으로 섞는다
  const posts = g.board.filter((p) => filter === 'all' || (p.topic ?? 'chat') === filter)
  // 큰 일만 축하 카드로 (밥·목욕·응원 같은 작은 기록은 피드에서 뺀다)
  const BIG = ['🏘️', '🎉', '🔓', '🐣', '👋']
  const acts = filter === 'all' || filter === 'invest' ? g.feed.filter((f) => BIG.includes(f.icon)).slice(0, 12) : []
  const showActs = filter === 'all'
  // 체결된 거래 카드 (매수, 매도 각각)
  const trades =
    filter === 'all' || filter === 'invest'
      ? g.proposals.flatMap((p) => [
          ...(p.buyPrice && p.qty
            ? [
                {
                  kind: 'trade' as const,
                  at: p.boughtAt ?? g.createdAt,
                  p,
                  side: 'buy' as const,
                },
              ]
            : []),
          ...(p.status === 'sold' && p.sellPrice
            ? [
                {
                  kind: 'trade' as const,
                  at: p.soldAt ?? p.boughtAt ?? g.createdAt,
                  p,
                  side: 'sell' as const,
                },
              ]
            : []),
        ])
      : []
  const retroItems =
    filter === 'all' || filter === 'invest'
      ? g.retros.map((r) => ({
          kind: 'retro' as const,
          at: r.at ?? g.proposals.find((p) => p.id === r.proposalId)?.soldAt ?? g.createdAt,
          r,
        }))
      : []
  const firstBuyId = g.proposals.filter((p) => p.buyPrice).sort((a, b) => (a.boughtAt ?? 0) - (b.boughtAt ?? 0))[0]?.id
  const items: (
    { kind: 'post'; at: number; p: Post } | { kind: 'act'; at: number; f: FeedItem } | { kind: 'trade'; at: number; p: Proposal; side: 'buy' | 'sell' } | { kind: 'retro'; at: number; r: Retro }
  )[] = [...retroItems, ...posts.map((p) => ({ kind: 'post' as const, at: p.at, p })), ...(showActs ? acts.map((f) => ({ kind: 'act' as const, at: f.at, f })) : []), ...trades].sort(
    (a, b) => b.at - a.at,
  )
  // 나한테 온 의견 부탁: 남의 거래 · 취소·만료 안 됨 · 내가 아직 피드백 안 함
  const asks = g.proposals.filter((p) => p.ask && !p.ask.canceled && p.ask.until > Date.now() && p.proposerId !== myId && !(p.reviews ?? []).some((r) => r.memberId === myId))
  // 친구가 오늘 한 일 한 줄 (발자국 중 오늘 것, 공개를 끈 친구는 빼고)
  const dayStart = new Date().setHours(0, 0, 0, 0)
  const todayOf = (id: string) => {
    if (g.members.find((m) => m.id === id)?.hideActs) return ''
    return (g.acts ?? []).find((x) => x.memberId === id && x.at >= dayStart)?.text ?? ''
  }
  const [toast, setToast] = useState('')
  const flash = (t: string) => {
    setToast(t)
    setTimeout(() => setToast(''), 1800)
  }
  // 받은 응원 알림 (08): 오늘 나를 응원한 친구를 한 번만 토스트로
  useEffect(() => {
    const from = g.members.filter((m) => !m.isMe && g.cheers[`${m.id}>${myId}`] === today())
    if (!from.length) return
    const key = `floco-cheer-seen-${today()}`
    let seen: string[] = []
    try {
      seen = JSON.parse(localStorage.getItem(key) ?? '[]')
    } catch {
      /* 저장 못 해도 괜찮음 */
    }
    const fresh = from.filter((m) => !seen.includes(m.id))
    if (!fresh.length) return
    flash(`${fresh.map((m) => m.nickname).join(', ')}${iGa(fresh[fresh.length - 1].nickname)} 응원했어요`)
    try {
      localStorage.setItem(key, JSON.stringify([...seen, ...fresh.map((m) => m.id)]))
    } catch {
      /* */
    }
  }, [g.cheers, g.members, myId])

  const post = () => {
    if (!draft.trim()) return
    actions.postBoard(draft, topic)
    setDraft('')
    setWriting(false)
  }

  return (
    <div className="tab-panel">
      {/* ① 길드 이름 + 같이 키우는 고양이 (돌보러 가기) */}
      <GuildYard />

      {/* ② 이번 주 같이 하기 */}
      <WeekQuest />

      {/* ③ 나한테 온 의견 부탁 */}
      {asks.length > 0 && (
        <section className="asks">
          {asks.map((p) => (
            <button key={p.id} className="ask-card" onClick={() => go?.('invest')}>
              <Mate g={g} id={p.proposerId} size={40} />
              <span className="grow">
                <small>의견 부탁 · {Math.max(1, Math.ceil((p.ask!.until - Date.now()) / 86_400_000))}일 남음</small>
                <b>
                  {memberName(g, p.proposerId)}
                  {iGa(memberName(g, p.proposerId))} 내 판단을 봐 달래요
                </b>
                {p.reasons?.[0] && <q>{p.reasons[0]}</q>}
              </span>
              <em>의견 남기기 ›</em>
            </button>
          ))}
        </section>
      )}

      {/* ④ 친구들의 발자국 */}
      <Footprints />

      {/* ⑤ 친구 카드 · 응원 */}
      <section className="squad squad2">
        {g.members.map((m) => {
          const cheered = g.cheers[`${myId}>${m.id}`] === today()
          const t = todayOf(m.id)
          return (
            <div key={m.id} className={`squad-card ${m.isMe ? 'me' : ''}`}>
              <Mate g={g} id={m.id} size={52} />
              <b>{m.isMe ? '나' : m.nickname}</b>
              <small>{t || '·'}</small>
              {!m.isMe && (
                <button className={`squad-cheer ${cheered ? 'done' : ''}`} aria-label={`${m.nickname} 응원하기`} onClick={() => flash(actions.cheer(m.id) ?? `${m.nickname}에게 응원을 보냈어요`)}>
                  <img src={ART.i_heart} alt="" />
                </button>
              )}
            </div>
          )
        })}
        {g.members.length < 5 && (
          <button className="squad-card add" onClick={() => setInvite(true)}>
            <span>＋</span>
            <b>친구 부르기</b>
            <small>최대 5명</small>
          </button>
        )}
      </section>

      {/* ⑥ 글쓰기와 소식 */}
      <h3 className="g-sec">이야기</h3>
      {/* 글쓰기 */}
      {writing ? (
        <section className="cm-compose">
          <div className="cm-compose-row">
            <Mate g={g} id={myId} size={38} />
            <textarea autoFocus value={draft} maxLength={140} rows={3} onChange={(e) => setDraft(e.target.value)} placeholder="길드 친구들에게 이야기해요" />
          </div>
          <div className="cm-topics">
            {TOPICS.map((t) => (
              <button key={t.id} className={topic === t.id ? 'on' : ''} onClick={() => setTopic(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="cm-compose-foot">
            <small>{draft.length}/140</small>
            <span className="grow" />
            <button
              className="cm-cancel"
              onClick={() => {
                setWriting(false)
                setDraft('')
              }}
            >
              취소
            </button>
            <button className="cm-post" disabled={!draft.trim()} onClick={post}>
              올리기
            </button>
          </div>
        </section>
      ) : (
        <button className="cm-compose-mini" onClick={() => setWriting(true)}>
          <Mate g={g} id={myId} size={32} />
          <span>길드 친구들에게 이야기해요</span>
          <i>✏️</i>
        </button>
      )}

      <ul className="cm-feed">
        {items.length === 0 && <li className="cm-empty">아직 글이 없어요. 첫 글을 남겨볼까요?</li>}
        {items.map((it) =>
          it.kind === 'post' ? (
            <PostCard key={it.p.id} p={it.p} myId={myId} />
          ) : it.kind === 'trade' ? (
            <TradeCard
              key={it.p.id + it.side}
              p={it.p}
              side={it.side}
              first={it.side === 'buy' && it.p.id === firstBuyId}
              myId={myId}
              onTalk={() => {
                setTopic('invest')
                setWriting(true)
                setDraft(`[${tickerOf(it.p.ticker).name}] `)
                window.scrollTo({ top: 0 })
                document.querySelector('.app-main')?.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          ) : it.kind === 'retro' ? (
            <RetroCard key={it.r.id} r={it.r} />
          ) : (
            <CelebrateCard key={it.f.id} f={it.f} />
          ),
        )}
      </ul>

      {/* ⑦ 지난 주 협동 기록 */}
      <WeekAlbum />

      {invite && (
        <div className="ask-layer" onClick={() => setInvite(false)}>
          <div className="ask-sheet" onClick={(e) => e.stopPropagation()}>
            <section className="card invite">
              <div className="card-title">친구 부르기</div>
              <div className="code">{g.code}</div>
              <button
                className="btn btn-primary btn-block"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(g.code)
                  } catch {
                    /* 복사 불가 */
                  }
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }}
              >
                {copied ? '복사했어요!' : '초대 코드 복사'}
              </button>
              <p className="fineprint">친구가 첫 화면 '길드 참가'에 이 코드를 넣으면 같은 고양이를 같이 키워요. 최대 5명.</p>
            </section>
          </div>
        </div>
      )}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}

function PostCard({ p, myId }: { p: Post; myId: string }) {
  const s = useGame()
  const g = s.guild!
  const [open, setOpen] = useState(false)
  const [reply, setReply] = useState('')
  const liked = p.hearts.includes(myId)
  const comments = p.comments ?? []
  return (
    <li className="cm-post-card">
      <div className="cm-post-head">
        <Mate g={g} id={p.memberId} size={36} />
        <div className="grow">
          <b>{memberName(g, p.memberId)}</b>
          <small>
            {topicLabel(p.topic)} · {ago(p.at)}
          </small>
        </div>
      </div>
      <p className="cm-post-text">{p.text}</p>
      <div className="cm-post-actions">
        <button className={liked ? 'on' : ''} onClick={() => actions.heartPost(p.id)}>
          <img src={ART.i_heart} alt="" />
          좋아요 {p.hearts.length || ''}
        </button>
        <button onClick={() => setOpen(!open)}>💬 댓글 {comments.length || ''}</button>
      </div>
      {(open || comments.length > 0) && (
        <div className="cm-comments">
          {(open ? comments : comments.slice(-1)).map((c) => (
            <div key={c.id} className="cm-comment">
              <Mate g={g} id={c.memberId} size={24} />
              <p>
                <b>{memberName(g, c.memberId)}</b> {c.text}
              </p>
            </div>
          ))}
          {!open && comments.length > 1 && (
            <button className="cm-more" onClick={() => setOpen(true)}>
              댓글 {comments.length}개 모두 보기
            </button>
          )}
          {open && (
            <form
              className="cm-reply"
              onSubmit={(e) => {
                e.preventDefault()
                actions.commentPost(p.id, reply)
                setReply('')
              }}
            >
              <input value={reply} maxLength={100} onChange={(e) => setReply(e.target.value)} placeholder="댓글 달기" />
              <button disabled={!reply.trim()}>등록</button>
            </form>
          )}
        </div>
      )}
    </li>
  )
}

// 우리 길드: 고양이 · 기록 · 이번 주 같이 할 일

// 체결된 거래: 누가 / 무엇을 / 얼마에 / 왜 / 지금 수익률
function TradeCard({ p, side, first, myId, onTalk }: { p: Proposal; side: 'buy' | 'sell'; first: boolean; myId: string; onTalk: () => void }) {
  const s = useGame()
  const g = s.guild!
  const t = tickerOf(p.ticker)
  const liked = (p.likes ?? []).includes(myId)
  const at = side === 'buy' ? p.boughtAt : p.soldAt
  return (
    <li className={`cm-trade ${side}`}>
      <div className="cm-post-head">
        <Mate g={g} id={p.proposerId} size={36} />
        <div className="grow">
          <b>
            {memberName(g, p.proposerId)}
            {first && <span className="cm-first">첫 매수!</span>}
          </b>
          <small>
            {t.name} {side === 'buy' ? '샀어요' : '팔았어요'}
            {at ? ` · ${ago(at)}` : ''}
          </small>
        </div>
        <span className={`cm-side ${side}`}>{side === 'buy' ? '매수' : '매도'}</span>
      </div>
      <p className="cm-trade-why">{side === 'buy' ? p.reasons[0] : (p.sellReason ?? '이유를 남기지 않았어요')}</p>
      <div className="cm-post-actions">
        <button className={liked ? 'on' : ''} onClick={() => actions.likeTrade(p.id)}>
          <img src={ART.i_heart} alt="" />
          좋아요 {(p.likes ?? []).length || ''}
        </button>
        <button onClick={onTalk}>이야기하기</button>
      </div>
    </li>
  )
}

// 큰 일 축하 카드 (장 완성, 레벨 업, 새 친구, 길드 탄생)
const CELEBRATE: Record<string, { art: string; tone: string }> = {
  '🏘️': { art: 't_jump', tone: 'mint' },
  '🎉': { art: 'crown', tone: 'gold' },
  '🔓': { art: 't_happy', tone: 'blue' },
  '🐣': { art: 't_wave', tone: 'pink' },
  '👋': { art: 't_wave', tone: 'blue' },
}
function CelebrateCard({ f }: { f: FeedItem }) {
  const c = CELEBRATE[f.icon] ?? CELEBRATE['🔓']
  return (
    <li className={`cm-celebrate ${c.tone}`}>
      <img src={ART[c.art]} alt="" />
      <div>
        <b>{f.text}</b>
        <small>{ago(f.at)}</small>
      </div>
    </li>
  )
}

// 돌아보기 카드: 팔고 나서 쓴 맞았던 것 / 빗나간 것 / 다음엔
function RetroCard({ r }: { r: Retro }) {
  const s = useGame()
  const g = s.guild!
  const p = g.proposals.find((x) => x.id === r.proposalId)
  const parts = r.parts ?? [r.text, '', '']
  return (
    <li className="cm-retro">
      <div className="cm-post-head">
        <Mate g={g} id={r.authorId} size={34} />
        <div className="grow">
          <b>{memberName(g, r.authorId)}님의 돌아보기</b>
          <small>
            {p ? tickerOf(p.ticker).name : ''}
            {r.at ? ` · ${ago(r.at)}` : ''}
          </small>
        </div>
        <img className="cm-retro-ico" src={ART.t_think} alt="" />
      </div>
      <dl className="cm-retro-parts">
        {['맞았던 것', '빗나간 것', '다음엔'].map((l, i) =>
          parts[i] ? (
            <div key={l}>
              <dt>{l}</dt>
              <dd>{parts[i]}</dd>
            </div>
          ) : null,
        )}
      </dl>
    </li>
  )
}
