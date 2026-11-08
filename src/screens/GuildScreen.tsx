// 길드: 커뮤니티처럼. 피드(글·댓글·좋아요 + 길드에서 일어난 일) / 멤버(응원·초대) / 우리 길드(고양이·기록·이번 주 목표)
import { useState } from 'react'
import { actions, memberName, today, useGame } from '../store'
import { tickerOf } from '../data/market'
import { ART } from '../components/CatView'
import { Avatar, breedOf } from '../components/Avatar'
import { TabHeader } from '../components/TabHeader'
import type { Tab } from '../App'
import type { FeedItem, Post } from '../types'

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
  const acts = filter === 'all' ? g.feed.filter((f) => !['✏️', '📅'].includes(f.icon)).slice(0, 20) : []
  const items: ({ kind: 'post'; at: number; p: Post } | { kind: 'act'; at: number; f: FeedItem })[] = [
    ...posts.map((p) => ({ kind: 'post' as const, at: p.at, p })),
    ...acts.map((f) => ({ kind: 'act' as const, at: f.at, f })),
  ].sort((a, b) => b.at - a.at)
  const voting = g.proposals.filter((p) => p.status === 'voting' && !p.votes.some((v) => v.memberId === myId))

  const post = () => {
    if (!draft.trim()) return
    actions.postBoard(draft, topic)
    setDraft('')
  }

  return (
    <div className="tab-panel">
      <TabHeader
        title={g.name}
        sub={`멤버 ${g.members.length}/5 · 같이 키운 지 ${days}일`}
        right={
          <span className="head-avatars">
            {g.members.slice(0, 4).map((m) => (
              <Avatar key={m.id} g={g} id={m.id} size={30} />
            ))}
          </span>
        }
      />

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
          <section className="cm-compose">
            <div className="cm-compose-row">
              <Avatar g={g} id={myId} size={38} />
              <textarea value={draft} maxLength={140} rows={2} onChange={(e) => setDraft(e.target.value)} placeholder="길드 친구들에게 이야기해요" />
            </div>
            <div className="cm-compose-foot">
              <div className="cm-topics">
                {TOPICS.map((t) => (
                  <button key={t.id} className={topic === t.id ? 'on' : ''} onClick={() => setTopic(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>
              <button className="cm-post" disabled={!draft.trim()} onClick={post}>
                올리기
              </button>
            </div>
          </section>

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
              ) : (
                <li key={it.f.id} className="cm-act">
                  <span className="cm-act-ico">{it.f.icon}</span>
                  <span className="cm-act-text">{it.f.text}</span>
                  <small>{ago(it.f.at)}</small>
                </li>
              ),
            )}
          </ul>
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
