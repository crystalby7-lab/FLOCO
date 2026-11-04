// 설정: 내 정보 · 처음 설문 답변 · 고양이·길드 · 알림 · 화면 · 도움말 · 개인정보 · 테스트 도구
import { useState, type ReactNode } from 'react'
import { actions, RULES, useGame } from '../store'
import { QUESTIONS, labelOf, typeOf } from '../data/survey'
import { Sheet } from '../components/ui'
import { ART } from '../components/CatView'
import { Avatar } from '../components/Avatar'
import { Survey } from './Survey'
import { ProfileEditor } from './ProfileEditor'
import type { Prefs } from '../types'

const GRADES = ['중1', '중2', '중3', '고1', '고2', '고3', '기타']
const VERSION = '0.3.0 (MVP 테스트)'

type Page = null | 'profile' | 'answers' | 'redo' | 'cat' | 'guild' | 'rules' | 'privacy'

export function Settings({ onClose }: { onClose: () => void }) {
  const s = useGame()
  const u = s.user!
  const g = s.guild!
  const [page, setPage] = useState<Page>(null)
  const [toast, setToast] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const [editPic, setEditPic] = useState(false)
  const t = u.survey ? typeOf(u.survey) : null

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 1600)
  }

  if (page === 'redo')
    return (
      <div className="layer">
        <Survey
          initial={u.survey}
          onCancel={() => setPage('answers')}
          onDone={(sv) => {
            actions.saveSurvey(sv)
            setPage('answers')
            flash('답변을 저장했어요')
          }}
        />
      </div>
    )

  return (
    <div className="layer">
      <header className="layer-head">
        <button className="icon-btn" aria-label="닫기" onClick={onClose}>
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 4 L6.5 10 L12.5 16" />
          </svg>
        </button>
        <h1>설정</h1>
      </header>

      <div className="layer-body">
        <button className="profile-card" onClick={() => setEditPic(true)}>
          <span className="pc-av">
            <Avatar g={g} id={u.id} size={56} />
            <i className="pc-edit">꾸미기</i>
          </span>
          <div className="grow">
            <b>{u.nickname}</b>
            <small>
              {u.grade} · {t ? t.name : '설문 전'}
            </small>
          </div>
          <Chev />
        </button>

        <Group title="나">
          <Row label="프로필 사진 꾸미기" value="고양이·배경·스티커" onClick={() => setEditPic(true)} />
          <Row label="닉네임·학년" value={`${u.nickname} · ${u.grade}`} onClick={() => setPage('profile')} />
          <Row label="처음 설문 답변" value={t?.name ?? '없음'} onClick={() => setPage('answers')} />
        </Group>

        <Group title="고양이와 길드">
          <Row label="고양이 이름" value={g.cat.name} onClick={() => setPage('cat')} />
          <Row label="길드 이름" value={g.name} onClick={() => setPage('guild')} />
          <Row label="초대 코드" value={g.code} />
        </Group>

        <Group title="알림" note="정식 버전에서 휴대폰 알림으로 와요. 지금은 설정만 저장돼요.">
          <Toggle k="notifyVote" label="친구가 제안을 올리면" sub="의견을 기다리는 제안이 생겼을 때" />
          <Toggle k="notifyRetro" label="돌아볼 차례가 되면" sub="같이 판 종목을 돌아볼 때" />
          <Toggle k="notifyCat" label={`${g.cat.name}가 배고프면`} sub="배부름이 30 아래로 내려갈 때" />
        </Group>

        <Group title="화면">
          <Toggle k="chatter" label="고양이 혼잣말" sub="방에서 가끔 말풍선을 띄워요" />
          <Toggle k="calm" label="움직임 줄이기" sub="애니메이션을 최소로 해요" />
        </Group>

        <Group title="도움말">
          <Row label="게임 규칙" onClick={() => setPage('rules')} />
          <Row label="개인정보는 이렇게 다뤄요" onClick={() => setPage('privacy')} />
          <Row label="버전" value={VERSION} />
        </Group>

        <Group title="테스트 도구" note="테스트 버전에서만 보여요.">
          <Row label="하루 지나기" value={`거래일 ${s.day}`} onClick={() => (actions.nextDay(), flash('하루가 지났어요'))} />
          <Row
            label={confirmReset ? '한 번 더 누르면 모두 지워요' : '처음부터 다시 하기'}
            danger
            onClick={() => {
              if (confirmReset) actions.reset()
              else {
                setConfirmReset(true)
                setTimeout(() => setConfirmReset(false), 3000)
              }
            }}
          />
        </Group>
      </div>

      {page === 'profile' && <ProfileSheet onClose={() => setPage(null)} onSaved={() => flash('저장했어요')} />}
      {page === 'cat' && (
        <NameSheet title="고양이 이름" current={g.cat.name} max={8} art={ART.sit} onClose={() => setPage(null)} onSave={(n) => (actions.renameCat(n), flash('이름을 바꿨어요'))} />
      )}
      {page === 'guild' && (
        <NameSheet title="길드 이름" current={g.name} max={12} art={ART.friend_orange} onClose={() => setPage(null)} onSave={(n) => (actions.renameGuild(n), flash('이름을 바꿨어요'))} />
      )}
      {page === 'answers' && (
        <Sheet title="처음 설문 답변" onClose={() => setPage(null)}>
          {u.survey && t ? (
            <>
              <div className="type-card">
                <img src={ART[t.art]} alt="" />
                <div>
                  <small>나의 시작 타입</small>
                  <b>{t.name}</b>
                  <p>{t.desc}</p>
                </div>
              </div>
              <dl className="answers">
                {QUESTIONS.map((q) => {
                  const v = u.survey![q.key]
                  const list = Array.isArray(v) ? v : [v]
                  return (
                    <div key={q.key}>
                      <dt>{q.title}</dt>
                      <dd>
                        {list.map((id) => (
                          <span key={id} className="pill">
                            {id === 'etc' && u.survey!.sourceEtc ? `기타: ${u.survey!.sourceEtc}` : labelOf(q, id)}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )
                })}
              </dl>
              <p className="fineprint">답한 날 {new Date(u.survey.at).toLocaleDateString('ko-KR')} · 학기가 끝날 때 같은 질문을 한 번 더 물어서 얼마나 달라졌는지 보여줄 거예요.</p>
            </>
          ) : (
            <p className="muted">아직 답한 설문이 없어요.</p>
          )}
          <button className="btn btn-primary btn-block" onClick={() => setPage('redo')}>
            {u.survey ? '다시 답하기' : '지금 답하기'}
          </button>
        </Sheet>
      )}
      {page === 'rules' && (
        <Sheet title="게임 규칙" onClose={() => setPage(null)}>
          <ul className="rules">
            <li>
              <b>고양이는 길드가 같이 키워요</b>
              <span>길드는 2~5명. 금고 골드로 밥·간식·목욕·옷을 사요.</span>
            </li>
            <li>
              <b>투자는 이유 3칸부터</b>
              <span>왜 사는지, 아직 모르는 것, 안 사기로 한 것을 쓰고 AI 친구 확인을 받아야 올라가요.</span>
            </li>
            <li>
              <b>과반이 좋다고 하면 사요</b>
              <span>걱정을 한 줄로 남기면 경험치 +{RULES.exp.opposeReason}.</span>
            </li>
            <li>
              <b>레벨은 수익이 아니라 생각으로</b>
              <span>
                이유 통과 +{RULES.exp.proposalPass}, 돌아보기 +{RULES.exp.retro}. 벌어도 잃어도 같아요.
              </span>
            </li>
            <li>
              <b>손해를 봐도 고양이는 괜찮아요</b>
              <span>배부름·기분·청결은 {RULES.floor} 아래로 내려가지 않아요.</span>
            </li>
            <li>
              <b>골드를 버는 방법</b>
              <span>
                혼자 하는 훈련(한 시간 {RULES.goldPerHour}G, 최대 {RULES.trainCapHours}시간), 퀘스트 첫 완료 +{RULES.questReward}G, 오늘의 미션 +{RULES.dailyReward}G.
              </span>
            </li>
            <li>
              <b>없는 것</b>
              <span>확률 뽑기, 수익률 순위, 현금 충전, 투자에 유리한 아이템은 없어요.</span>
            </li>
          </ul>
        </Sheet>
      )}
      {page === 'privacy' && (
        <Sheet title="개인정보는 이렇게 다뤄요" onClose={() => setPage(null)}>
          <ul className="rules">
            <li>
              <b>받는 것</b>
              <span>닉네임, 학년, 처음 설문 답변, 게임 기록(제안·의견·돌아보기)만 받아요.</span>
            </li>
            <li>
              <b>받지 않는 것</b>
              <span>실명, 전화번호, 학교 이름, 실제 계좌 정보는 묻지 않아요.</span>
            </li>
            <li>
              <b>누가 보나요</b>
              <span>설문 답변은 나만 봐요. 제안·의견·돌아보기는 같은 길드 친구들이 봐요.</span>
            </li>
            <li>
              <b>골드는 연습용</b>
              <span>현금으로 바꿀 수 없고, 실제 주식을 사고팔지 않아요.</span>
            </li>
            <li>
              <b>지금 테스트 버전은</b>
              <span>모든 기록이 이 휴대폰 브라우저에만 저장돼요. '처음부터 다시 하기'를 누르면 모두 지워져요.</span>
            </li>
          </ul>
        </Sheet>
      )}

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
      {editPic && <ProfileEditor onClose={() => setEditPic(false)} />}
    </div>
  )
}

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="set-group">
      <h2 className="list-title">{title}</h2>
      <div className="list">{children}</div>
      {note && <p className="fineprint set-note">{note}</p>}
    </section>
  )
}

function Row({ label, value, onClick, danger }: { label: string; value?: string; onClick?: () => void; danger?: boolean }) {
  const inner = (
    <>
      <span className="row-text">{label}</span>
      {value && <span className="val">{value}</span>}
      {onClick && !danger && <Chev />}
    </>
  )
  return onClick ? (
    <button className={`list-row ${danger ? 'danger' : ''}`} onClick={onClick}>
      {inner}
    </button>
  ) : (
    <div className="list-row">{inner}</div>
  )
}

function Toggle({ k, label, sub }: { k: keyof Prefs; label: string; sub: string }) {
  const s = useGame()
  const on = s.prefs[k]
  return (
    <label className="list-row toggle-row">
      <span className="row-text">
        {label}
        <small>{sub}</small>
      </span>
      <span className="switch">
        <input type="checkbox" id={`pref-${k}`} checked={on} onChange={(e) => actions.setPref(k, e.target.checked)} />
        <span className="track" />
      </span>
    </label>
  )
}

function ProfileSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const u = useGame().user!
  const [nick, setNick] = useState(u.nickname)
  const [grade, setGrade] = useState(u.grade)
  return (
    <Sheet title="닉네임·학년" onClose={onClose}>
      <label>
        닉네임
        <input id="edit-nickname" value={nick} maxLength={10} onChange={(e) => setNick(e.target.value)} />
      </label>
      <div className="field-label">학년</div>
      <div className="chips">
        {GRADES.map((x) => (
          <button key={x} className={`chip ${grade === x ? 'on' : ''}`} onClick={() => setGrade(x)}>
            {x}
          </button>
        ))}
      </div>
      <button
        className="btn btn-primary btn-block"
        disabled={!nick.trim()}
        onClick={() => {
          actions.updateProfile(nick.trim(), grade)
          onSaved()
          onClose()
        }}
      >
        저장하기
      </button>
    </Sheet>
  )
}

function NameSheet({ title, current, max, art, onClose, onSave }: { title: string; current: string; max: number; art: string; onClose: () => void; onSave: (n: string) => void }) {
  const [name, setName] = useState(current)
  return (
    <Sheet title={title} onClose={onClose}>
      <img className="name-art" src={art} alt="" />
      <label>
        새 이름
        <input id="edit-name" value={name} maxLength={max} onChange={(e) => setName(e.target.value)} />
      </label>
      <p className="fineprint">바꾸면 길드 친구들 모두에게 바뀐 이름으로 보여요.</p>
      <button
        className="btn btn-primary btn-block"
        disabled={!name.trim() || name.trim() === current}
        onClick={() => {
          onSave(name.trim())
          onClose()
        }}
      >
        바꾸기
      </button>
    </Sheet>
  )
}

function Chev() {
  return (
    <svg className="chev" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 3 L11 8 L6 13" />
    </svg>
  )
}
