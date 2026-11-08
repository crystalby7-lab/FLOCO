// 길드: 커뮤니티처럼. 피드(글·댓글·좋아요 + 길드에서 일어난 일) / 멤버(응원·초대) / 우리 길드(고양이·기록·이번 주 목표)
import { useState } from 'react'
import { actions, memberName, today, useGame } from '../store'
import { priceOf, tickerOf } from '../data/market'
import { ART } from '../components/CatView'
import { Avatar, breedOf } from '../components/Avatar'
import { GuildBanner } from '../components/GuildBanner'
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

export function GuildScreen({ go }: { go?: (t: Tab) => void }) {
  const s = useGame()
  const g = s.guild!
  const [tab, setTab] = useState<'feed' | 'members' | 'guild'>('feed')
  const [filter, setFilter] = useState<'all' | Topic>('all')
  const [draft, setDraft] = useState('')
  const [topic, setTopic] = useState<Topic>('chat')
  const [writing, setWriting] = useState(false)
  const [toast, setToast] = useState('')
  const [copied, setCopied] = useState(false)
  const myId = g.members.find((m) => m.isMe)!.id
  const days = Math.max(1, Math.floor((Date.now() - g.createdAt) / 86_400_000) + 1)
  const flash = (t: string) => {
    setToast(t)
    setTimeout(() => setToast(''), 1600)
  }

  // 피드: 글 + 길드 활동을 시간순으로 섞는다
  const posts = g.board.filter((p) => filter === 'all' || (p.topic ?? 'chat') === filter)
  // 큰 일만 축하 카드로 (밥·목욕·응원 같은 작은 기록은 피드에서 뺀다)
  const BIG = ['🏘️', '🎉', '🔓', '🐣', '👋']
  const acts = filter === 'all' || filter === 'invest' ? g.feed.filter((f) => BIG.includes(f.icon)).slice(0, 12) : []
  const showActs = filter === 'all'
  // 체결된 거래 카드 (매수, 매도 각각)
  const trades = filter === 'all' || filter === 'invest'
    ? g.proposals.flatMap((p) => [
        ...(p.buyPrice && p.qty ? [{ kind: 'trade' as const, at: p.boughtAt ?? g.createdAt, p, side: 'buy' as const }] : []),
        ...(p.status === 'sold' && p.sellPrice ? [{ kind: 'trade' as const, at: p.soldAt ?? p.boughtAt ?? g.createdAt, p, side: 'sell' as const }] : []),
      ])
    : []
  const retroItems = filter === 'all' || filter === 'invest' ? g.retros.map((r) => ({ kind: 'retro' as const, at: r.at ?? g.proposals.find((p) => p.id === r.proposalId)?.soldAt ?? g.createdAt, r })) : []
  const firstBuyId = g.proposals.filter((p) => p.buyPrice).sort((a, b) => (a.boughtAt ?? 0) - (b.boughtAt ?? 0))[0]?.id
  const items: ({ kind: 'post'; at: number; p: Post } | { kind: 'act'; at: number; f: FeedItem } | { kind: 'trade'; at: number; p: Proposal; side: 'buy' | 'sell' } | { kind: 'retro'; at: number; r: Retro })[] = [
    ...retroItems,
    ...posts.map((p) => ({ kind: 'post' as const, at: p.at, p })),
    ...(showActs ? acts.map((f) => ({ kind: 'act' as const, at: f.at, f })) : []),
    ...trades,
  ].sort((a, b) => b.at - a.at)
  const voting = g.proposals.filter((p) => p.status === 'voting' && !p.votes.some((v) => v.memberId === myId))

  const post = () => {
    if (!draft.trim()) return
    actions.postBoard(draft, topic)
    setDraft('')
    setWriting(false)
  }

  return (
    <div className="tab-panel">
      <GuildBanner g={g} days={days} />

      <div className="cm-tabs">
        {(
          [
            ['feed', '피드'],
            ['members', '멤버'],
            ['guild', '우리 길드'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'feed' && (
        <>
          {/* 글쓰기 */}
          {writing ? (
            <section className="cm-compose">
              <div className="cm-compose-row">
                <Avatar g={g} id={myId} size={38} />
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
              <Avatar g={g} id={myId} size={32} />
              <span>길드 친구들에게 이야기해요</span>
              <i>✏️</i>
            </button>
          )}

          {/* 의견 기다리는 제안 (고정) */}
          {voting.map((p) => (
            <button key={p.id} className="cm-pin" onClick={() => go?.('invest')}>
              <Avatar g={g} id={p.proposerId} size={34} />
              <span>
                <small>📌 의견을 기다려요</small>
                <b>
                  {memberName(g, p.proposerId)}님이 {tickerOf(p.ticker).name} 매수를 제안했어요
                </b>
              </span>
              <i>›</i>
            </button>
          ))}

          <div className="cm-filter">
            {(['all', 'chat', 'invest', 'ask'] as const).map((k) => (
              <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>
                {k === 'all' ? '전체' : topicLabel(k)}
              </button>
            ))}
          </div>

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
          {filter === 'all' && <WeeklyReport />}
        </>
      )}

      {tab === 'members' && (
        <>
          <ul className="cm-members">
            {g.members.map((m) => {
              const proposals = g.proposals.filter((p) => p.proposerId === m.id).length
              const retros = g.retros.filter((r) => r.authorId === m.id).length
              const postsN = g.board.filter((p) => p.memberId === m.id).length
              const cheered = g.cheers[`${myId}>${m.id}`] === today()
              return (
                <li key={m.id}>
                  <img className="member-cat" src={ART[m.isMe ? (s.user?.avatar?.art ?? 'sit') : breedOf(g, m.id)]} alt="" />
                  <div className="grow">
                    <b>
                      {m.nickname}
                      {m.isMe && <span className="me-tag">나</span>}
                      {m.isBot && <span className="bot-tag">테스트</span>}
                    </b>
                    <div className="contrib">
                      <span>제안 {proposals}</span>
                      <span>글 {postsN}</span>
                      <span>돌아보기 {retros}</span>
                    </div>
                  </div>
                  {!m.isMe && (
                    <button
                      className={`cheer-btn ${cheered ? 'done' : ''}`}
                      onClick={() => {
                        const err = actions.cheer(m.id)
                        flash(err ?? `${m.nickname}에게 응원을 보냈어요`)
                      }}
                    >
                      <img src={ART.i_heart} alt="" />
                      응원
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
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
        </>
      )}

      {tab === 'guild' && <GuildInfo />}

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
        <Avatar g={g} id={p.memberId} size={36} />
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
              <Avatar g={g} id={c.memberId} size={24} />
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
function GuildInfo() {
  const s = useGame()
  const g = s.guild!
  const decided = g.proposals.filter((p) => p.status !== 'voting')
  const passed = decided.filter((p) => p.status !== 'rejected').length
  const days = Math.max(1, Math.floor((Date.now() - g.createdAt) / 86_400_000) + 1)
  const stats = [
    { label: '함께한 날', value: `${days}일` },
    { label: '올라온 제안', value: `${g.proposals.length}개` },
    { label: '통과율', value: decided.length ? `${Math.round((passed / decided.length) * 100)}%` : '-' },
    { label: '같이 돌아보기', value: `${g.retros.length}번` },
  ]
  const recent = g.proposals.filter((p) => p.createdDay >= s.day - 4)
  const recentIds = new Set(recent.map((p) => p.id))
  const week = Date.now() - 7 * 86_400_000
  const goals = [
    { label: '제안 올리기', now: recent.length, goal: 2 },
    { label: '의견 내기', now: recent.reduce((n, p) => n + p.votes.length, 0), goal: 6 },
    { label: '같이 돌아보기', now: g.retros.filter((r) => recentIds.has(r.proposalId)).length, goal: 1 },
    { label: '글·댓글 남기기', now: g.board.filter((p) => p.at >= week).reduce((n, p) => n + 1 + (p.comments?.length ?? 0), 0), goal: 8 },
  ]
  return (
    <>
      <section className="card guild-hero">
        <img src={ART.crown} alt="" className="gh-cat" />
        <div className="grow">
          <b>
            {g.cat.name} · Lv.{g.cat.level}
          </b>
          <small className="sub">우리가 같이 쓴 이유와 돌아보기로 자랐어요</small>
        </div>
      </section>
      <div className="stat-grid">
        {stats.map((x) => (
          <div key={x.label} className="stat">
            <b className="num">{x.value}</b>
            <small>{x.label}</small>
          </div>
        ))}
      </div>
      <section className="card week-card">
        <div className="card-row">
          <h3 className="card-title">이번 주 같이 할 일</h3>
          <span className="small sub">최근 7일</span>
        </div>
        {goals.map((x) => (
          <div key={x.label} className="week-row">
            <span>{x.label}</span>
            <div className="bar grow">
              <div style={{ width: `${Math.min(100, (x.now / x.goal) * 100)}%` }} />
            </div>
            <b className={x.now >= x.goal ? 'ok' : ''}>
              {Math.min(x.now, x.goal)}/{x.goal}
            </b>
          </div>
        ))}
      </section>
    </>
  )
}

// 체결된 거래: 누가 / 무엇을 / 얼마에 / 왜 / 지금 수익률
function TradeCard({ p, side, first, myId, onTalk }: { p: Proposal; side: 'buy' | 'sell'; first: boolean; myId: string; onTalk: () => void }) {
  const s = useGame()
  const g = s.guild!
  const t = tickerOf(p.ticker)
  const price = side === 'buy' ? p.buyPrice! : p.sellPrice!
  const now = priceOf(p.ticker, s.day)
  const rate = side === 'buy' ? ((now - p.buyPrice!) / p.buyPrice!) * 100 : ((p.sellPrice! - p.buyPrice!) / p.buyPrice!) * 100
  const liked = (p.likes ?? []).includes(myId)
  const at = side === 'buy' ? p.boughtAt : p.soldAt
  return (
    <li className={`cm-trade ${side}`}>
      <div className="cm-post-head">
        <Avatar g={g} id={p.proposerId} size={36} />
        <div className="grow">
          <b>
            {memberName(g, p.proposerId)}
            {first && <span className="cm-first">첫 매수!</span>}
          </b>
          <small>
            {side === 'buy' ? '매수 체결' : '매도 체결'}
            {at ? ` · ${ago(at)}` : ''}
          </small>
        </div>
        <span className={`cm-side ${side}`}>{side === 'buy' ? '매수' : '매도'}</span>
      </div>
      <div className="cm-trade-box">
        <div>
          <b>{t.name}</b>
          <small>
            {p.qty}주 × {price.toLocaleString()}원 = {(p.qty! * price).toLocaleString()}원
          </small>
        </div>
        <div className={`cm-rate ${rate > 0 ? 'up' : rate < 0 ? 'down' : ''}`}>
          <small>{side === 'buy' && p.status === 'holding' ? '지금' : '결과'}</small>
          <b>
            {rate >= 0 ? '+' : ''}
            {rate.toFixed(2)}%
          </b>
        </div>
      </div>
      <p className="cm-trade-why">
        <span>{side === 'buy' ? '산 이유' : '판 이유'}</span>
        {side === 'buy' ? p.reasons[0] : p.sellReason ?? '이유를 남기지 않았어요'}
      </p>
      <div className="cm-post-actions">
        <button className={liked ? 'on' : ''} onClick={() => actions.likeTrade(p.id)}>
          <img src={ART.i_heart} alt="" />
          좋아요 {(p.likes ?? []).length || ''}
        </button>
        <button onClick={onTalk}>💬 이 거래 얘기하기</button>
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
        <Avatar g={g} id={r.authorId} size={34} />
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

// 이번 주 정리 (피드 맨 아래)
function WeeklyReport() {
  const s = useGame()
  const g = s.guild!
  const week = Date.now() - 7 * 86_400_000
  const count = (fn: (id: string) => number) => g.members.map((m) => ({ m, n: fn(m.id) })).sort((a, b) => b.n - a.n)[0]
  const reasonKing = count((id) => g.proposals.filter((p) => p.proposerId === id && (p.boughtAt ?? 0) >= week).length)
  const talkKing = count((id) => g.board.filter((p) => p.at >= week).reduce((n, p) => n + (p.memberId === id ? 1 : 0) + (p.comments ?? []).filter((c) => c.memberId === id).length, 0))
  const trades = g.proposals.filter((p) => (p.boughtAt ?? 0) >= week || (p.soldAt ?? 0) >= week).length
  const retros = g.retros.filter((r) => (r.at ?? 0) >= week).length
  return (
    <section className="cm-week">
      <div className="cm-week-head">
        <img src={ART.t_sprout} alt="" />
        <div>
          <b>이번 주 우리 길드</b>
          <small>최근 7일 정리</small>
        </div>
      </div>
      <div className="cm-week-stats">
        <div>
          <b>{trades}</b>
          <small>거래</small>
        </div>
        <div>
          <b>{retros}</b>
          <small>돌아보기</small>
        </div>
        <div>
          <b>{g.board.filter((p) => p.at >= week).length}</b>
          <small>글</small>
        </div>
      </div>
      <ul className="cm-week-kings">
        {reasonKing && reasonKing.n > 0 && (
          <li>
            <span>📝 근거왕</span>
            <b>{reasonKing.m.nickname}</b>
            <small>근거 쓰고 산 거래 {reasonKing.n}번</small>
          </li>
        )}
        {talkKing && talkKing.n > 0 && (
          <li>
            <span>💬 수다왕</span>
            <b>{talkKing.m.nickname}</b>
            <small>글·댓글 {talkKing.n}개</small>
          </li>
        )}
        {(!reasonKing || reasonKing.n === 0) && (!talkKing || talkKing.n === 0) && <li className="cm-week-empty">이번 주는 아직 조용해요. 첫 거래나 글을 남겨볼까요?</li>}
      </ul>
    </section>
  )
}
