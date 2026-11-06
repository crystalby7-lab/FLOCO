// 설정: 출시된 앱처럼 그룹으로 나눈 화면
// 계정 / 알림 / 화면과 소리 / 길드 / 보호자 / 개인정보와 안전 / 도움말
// 아직 서버가 없는 항목은 눌러도 '준비 중이에요' 토스트만 띄운다.
import { useState, type ReactNode } from 'react'
import { actions, RULES, useGame } from '../store'
import { QUESTIONS, labelOf, typeOf } from '../data/survey'
import { Sheet } from '../components/ui'
import { ConfirmDialog } from '../components/Page'
import { ART } from '../components/CatView'
import { Avatar } from '../components/Avatar'
import { Survey } from './Survey'
import { ProfileEditor } from './ProfileEditor'
import { useSyncStatus, type SyncStatus } from '../sync'
import { asOfLabel, isRealPrices } from '../data/market'
import logoFace from '../assets/logo-face.png'
import type { Prefs } from '../types'

const GRADES = ['중1', '중2', '중3', '고1', '고2', '고3', '기타']
const VERSION = '0.3.0'
const CHANNEL = 'MVP 테스트'

// 칭호: 고양이 레벨만큼 같이 자란다 (수익이 아니라 생각으로 오르는 레벨)
const titleOf = (level: number) =>
  level >= 10 ? '금고지기' : level >= 7 ? '길드 투자가' : level >= 4 ? '근거 수집가' : level >= 2 ? '이유 쓰는 중' : '새내기 집사'

const FONT_LABEL: Record<Prefs['fontScale'], string> = { small: '작게', normal: '보통', large: '크게' }
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`

// 서버 연결 상태에 따라 계정 그룹 아래 설명이 바뀐다
const syncNote = (sync: SyncStatus) =>
  sync === 'online'
    ? '익명으로 로그인해서 길드 친구들과 실시간으로 같이 보고 있어요.'
    : sync === 'connecting'
      ? '서버에 연결하는 중이에요.'
      : '서버에 닿지 못해 혼자 모드예요. 기록은 이 기기에만 저장돼요.'

type SheetId =
  | null
  | 'login'
  | 'profile'
  | 'answers'
  | 'redo'
  | 'cat'
  | 'guildname'
  | 'members'
  | 'theme'
  | 'fontsize'
  | 'quiet'
  | 'rules'
  | 'faq'
  | 'privacy'
  | 'terms'
  | 'oss'

type DialogId = null | 'leave' | 'delete1' | 'delete2'

export function Settings({ onClose }: { onClose: () => void }) {
  const s = useGame()
  const u = s.user!
  const g = s.guild!
  const p = s.prefs
  const [sheet, setSheet] = useState<SheetId>(null)
  const [dialog, setDialog] = useState<DialogId>(null)
  const [toast, setToast] = useState('')
  const [editPic, setEditPic] = useState(false)
  const [taps, setTaps] = useState(0)
  const [dev, setDev] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const sync = useSyncStatus()
  const type = u.survey ? typeOf(u.survey) : null

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 1700)
  }
  const soon = () => flash('준비 중이에요')

  // 앱 버전을 다섯 번 누르면 테스트 도구가 열린다
  const tapVersion = () => {
    if (dev) return
    const n = taps + 1
    setTaps(n)
    if (n >= 5) {
      setDev(true)
      flash('테스트 도구가 열렸어요')
    }
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(g.code)
      flash('초대 코드를 복사했어요')
    } catch {
      flash('복사하지 못했어요')
    }
  }

  const shareCode = async () => {
    const url = `${location.origin}${location.pathname}?invite=${g.code}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `${g.name} 길드 초대`, text: `FLOCO에서 ${g.cat.name}를 같이 키우자! 초대 코드 ${g.code}`, url })
        return
      } catch {
        /* 공유를 취소하면 아무것도 하지 않는다 */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      flash('초대 링크를 복사했어요')
    } catch {
      flash('공유하지 못했어요')
    }
  }

  // 내 데이터 내려받기: 지금 기기에 저장된 기록 전부를 JSON 파일로
  const downloadData = () => {
    const body = JSON.stringify({ app: 'FLOCO', version: VERSION, exportedAt: new Date().toISOString(), data: s }, null, 2)
    const url = URL.createObjectURL(new Blob([body], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `floco-my-data-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    flash('내 데이터를 내려받았어요')
  }

  if (sheet === 'redo')
    return (
      <div className="layer">
        <Survey
          initial={u.survey}
          onCancel={() => setSheet('answers')}
          onDone={(sv) => {
            actions.saveSurvey(sv)
            setSheet('answers')
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

      <div className="layer-body set2">
        <button className="set2-profile" onClick={() => setEditPic(true)}>
          <span className="sp-av">
            <Avatar g={g} id={u.id} size={58} />
            <i className="sp-edit" aria-hidden>
              <Ico n="pencil" />
            </i>
          </span>
          <span className="sp-text">
            <b>{u.nickname}</b>
            <small>
              {u.grade} · {titleOf(g.cat.level)}
            </small>
            {type && <i className="sp-tag">{type.name}</i>}
          </span>
          <Chev />
        </button>

        <Group title="계정" note={syncNote(sync)}>
          <Row icon="key" tone="sky" label="로그인 방식" value={sync === 'online' ? '익명 (서버 연결됨)' : '익명'} onClick={() => setSheet('login')} />
          <Row
            icon="cloud"
            tone={sync === 'online' ? 'mint' : 'grey'}
            label="서버 연결"
            value={sync === 'online' ? '연결됨' : sync === 'connecting' ? '연결 중…' : '혼자 모드'}
          />
          <Row icon="person" tone="sky" label="닉네임·학년" value={`${u.nickname} · ${u.grade}`} onClick={() => setSheet('profile')} />
          <Row icon="clipboard" tone="lilac" label="처음 설문 답변" value={type?.name ?? '아직 없음'} onClick={() => setSheet('answers')} />
          <Row icon="logout" tone="grey" label="로그아웃" onClick={soon} />
          <Row icon="trash" tone="red" label="계정 삭제" danger onClick={() => setDialog('delete1')} />
        </Group>

        <Group title="알림" note="정식 버전에서 휴대폰 알림으로 와요. 지금은 설정만 저장돼요.">
          <Toggle k="notifyAll" icon="bell" tone="honey" label="알림 받기" sub="끄면 아래 알림이 모두 멈춰요" onFlash={flash} />
          <Toggle k="notifyVote" icon="bulb" tone="sky" label="친구가 제안을 올리면" sub="의견을 기다리는 제안이 생겼을 때" dim={!p.notifyAll} onFlash={flash} />
          <Toggle k="notifyRetro" icon="loop" tone="mint" label="돌아볼 차례가 되면" sub="같이 판 종목을 돌아볼 때" dim={!p.notifyAll} onFlash={flash} />
          <Toggle k="notifyCat" icon="bowl" tone="pink" label={`${g.cat.name}가 배고프면`} sub="배부름이 30 아래로 내려갈 때" dim={!p.notifyAll} onFlash={flash} />
          <Toggle k="notifyCheer" icon="cheer" tone="honey" label="친구가 응원하면" sub="길드 친구가 나를 응원했을 때" dim={!p.notifyAll} onFlash={flash} />
          <Row
            icon="moon"
            tone="lilac"
            label="방해 금지 시간"
            value={p.quiet ? `${hh(p.quietFrom)} ~ ${hh(p.quietTo)}` : '꺼짐'}
            dim={!p.notifyAll}
            onClick={() => setSheet('quiet')}
          />
        </Group>

        <Group title="화면과 소리">
          <Row icon="moon" tone="lilac" label="다크 모드" value="밝게" onClick={() => setSheet('theme')} />
          <Row icon="text" tone="sky" label="글자 크기" value={FONT_LABEL[p.fontScale]} onClick={() => setSheet('fontsize')} />
          <Toggle k="calm" icon="motion" tone="mint" label="움직임 줄이기" sub="애니메이션을 최소로 해요" onFlash={flash} />
          <Toggle k="chatter" icon="talk" tone="sky" label="고양이 혼잣말" sub="방에서 가끔 말풍선을 띄워요" onFlash={flash} />
          <Toggle k="sound" icon="sound" tone="honey" label="효과음" sub="정식 버전에서 적용돼요" onFlash={flash} />
          <Toggle k="haptic" icon="vibrate" tone="grey" label="진동" sub="버튼을 누를 때 살짝 떨려요" onFlash={flash} />
        </Group>

        <Group title="길드" note={`${g.name} · ${g.members.length}명이 ${g.cat.name}를 같이 키우고 있어요.`}>
          <Row icon="flag" tone="sky" label="길드 이름" value={g.name} onClick={() => setSheet('guildname')} />
          <Row icon="paw" tone="pink" label="고양이 이름" value={g.cat.name} onClick={() => setSheet('cat')} />
          <div className="set2-row code-row">
            <span className="si sky">
              <Ico n="code" />
            </span>
            <span className="set2-label">
              <b>초대 코드</b>
              <small>친구에게 알려주면 같은 길드로 들어와요</small>
            </span>
            <span className="code-chip">{g.code}</span>
            <span className="code-btns">
              <button className="icon-btn" aria-label="초대 코드 복사" onClick={copyCode}>
                <Ico n="copy" />
              </button>
              <button className="icon-btn" aria-label="초대 링크 공유" onClick={shareCode}>
                <Ico n="share" />
              </button>
            </span>
          </div>
          <Row icon="users" tone="mint" label="멤버" value={`${g.members.length}명`} onClick={() => setSheet('members')} />
          <Row icon="exit" tone="red" label="길드 나가기" danger onClick={() => setDialog('leave')} />
        </Group>

        <Group title="보호자" note="만 14세 미만은 보호자 동의가 필요해요. 정식 버전에서 연결해요.">
          <Row icon="shield" tone="mint" label="보호자 동의 상태" value="확인 전" />
          <Row icon="link" tone="sky" label="보호자 연결" value="준비 중" onClick={soon} />
        </Group>

        <Group title="개인정보와 안전">
          <Row icon="download" tone="sky" label="내 데이터 내려받기" value="JSON" onClick={downloadData} />
          <Row icon="block" tone="red" label="차단·신고" onClick={soon} />
          <Row icon="doc" tone="lilac" label="개인정보처리방침" onClick={() => setSheet('privacy')} />
          <Row icon="doc" tone="lilac" label="이용약관" onClick={() => setSheet('terms')} />
          <Row icon="cloud" tone="grey" label="저장 위치" value={sync === 'online' ? '이 기기 + 서버' : '이 기기에만'} />
        </Group>

        <Group title="도움말">
          <Row icon="megaphone" tone="honey" label="공지사항" onClick={soon} />
          <Row icon="help" tone="sky" label="자주 묻는 질문" onClick={() => setSheet('faq')} />
          <Row icon="book" tone="mint" label="게임 규칙" onClick={() => setSheet('rules')} />
          <Row icon="mail" tone="sky" label="문의하기" onClick={soon} />
          <Row icon="heart" tone="pink" label="의견 보내기" onClick={soon} />
          <Row icon="code" tone="grey" label="오픈소스 라이선스" onClick={() => setSheet('oss')} />
          <Row icon="info" tone="grey" label="앱 버전" value={`${VERSION} (${CHANNEL})`} onClick={tapVersion} />
        </Group>

        {dev && (
          <Group title="테스트 도구" note="앱 버전을 다섯 번 눌러서 열었어요. 테스트 버전에서만 보여요.">
            {/* 실제 종가로 돌 때는 날짜를 우리가 넘기지 않는다 */}
            {isRealPrices() ? (
              <Row icon="calendar" tone="grey" label="시세" value={asOfLabel() ?? '실제 종가'} />
            ) : (
              <Row icon="calendar" tone="honey" label="하루 지나기" value={`거래일 ${s.day}`} onClick={() => (actions.nextDay(), flash('하루가 지났어요'))} />
            )}
            <Row
              icon="trash"
              tone="red"
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
        )}

        <footer className="set2-foot">
          <img src={logoFace} alt="" />
          <small>FLOCO v{VERSION}</small>
          <small className="fine">연습용 가상 골드 · 실제 주식을 사고팔지 않아요</small>
        </footer>
      </div>

      {sheet === 'login' && (
        <Sheet title="로그인 방식" onClose={() => setSheet(null)}>
          <OptionRow
            label="익명으로 쓰기"
            sub={sync === 'online' ? '로그인 없이 서버와 연결돼 있어요' : '서버에 닿지 못해 이 기기에만 기록이 남아요'}
            on
            onClick={() => setSheet(null)}
          />
          <OptionRow label="구글 계정 연결" sub="기기를 바꿔도 기록이 따라와요" soon onClick={soon} />
          <p className="fineprint">지금은 익명 로그인이라 기기를 바꾸면 기록이 이어지지 않아요. 구글 연결이 열리면 따라와요.</p>
        </Sheet>
      )}

      {sheet === 'theme' && (
        <Sheet title="다크 모드" onClose={() => setSheet(null)}>
          <OptionRow label="밝게" sub="지금 화면" on onClick={() => setSheet(null)} />
          <OptionRow label="시스템 설정 따르기" soon onClick={soon} />
          <OptionRow label="어둡게" soon onClick={soon} />
          <p className="fineprint">어두운 화면은 그림과 색을 다시 맞추는 중이에요.</p>
        </Sheet>
      )}

      {sheet === 'fontsize' && (
        <Sheet title="글자 크기" onClose={() => setSheet(null)}>
          {(['small', 'normal', 'large'] as const).map((f) => (
            <OptionRow
              key={f}
              label={FONT_LABEL[f]}
              sub={f === 'normal' ? '기본' : undefined}
              on={p.fontScale === f}
              onClick={() => {
                actions.setPref('fontScale', f)
                setSheet(null)
                flash(`글자 크기를 ${FONT_LABEL[f]}로 바꿨어요`)
              }}
            />
          ))}
          <p className="fineprint">화면 전체가 같이 커지고 작아져요.</p>
        </Sheet>
      )}

      {sheet === 'quiet' && (
        <Sheet title="방해 금지 시간" onClose={() => setSheet(null)}>
          <label className="set2-row sheet-row">
            <span className="set2-label">
              <b>방해 금지 시간 쓰기</b>
              <small>이 시간에는 알림이 오지 않아요</small>
            </span>
            <Switch on={p.quiet} onChange={(v) => actions.setPref('quiet', v)} />
          </label>
          <div className={`quiet-times ${p.quiet ? '' : 'off'}`}>
            <label>
              시작
              <select value={p.quietFrom} disabled={!p.quiet} onChange={(e) => actions.setPref('quietFrom', Number(e.target.value))}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {hh(h)}
                  </option>
                ))}
              </select>
            </label>
            <span className="quiet-dash">~</span>
            <label>
              끝
              <select value={p.quietTo} disabled={!p.quiet} onChange={(e) => actions.setPref('quietTo', Number(e.target.value))}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {hh(h)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="fineprint">정식 버전에서 휴대폰 알림에 적용돼요.</p>
        </Sheet>
      )}

      {sheet === 'members' && (
        <Sheet title="길드 멤버" onClose={() => setSheet(null)}>
          <ul className="set2-members">
            {g.members.map((m) => (
              <li key={m.id}>
                <Avatar g={g} id={m.id} size={40} />
                <span className="grow">
                  <b>{m.nickname}</b>
                  <small>{m.isMe ? '나' : m.isBot ? '데모 친구' : '친구'}</small>
                </span>
                {m.isMe && <span className="me-tag">나</span>}
              </li>
            ))}
          </ul>
          <p className="fineprint">하늘·도윤은 서버 연결 전까지 투표와 돌아보기를 대신하는 데모 친구예요.</p>
          <button className="btn btn-block" onClick={shareCode}>
            친구 초대하기
          </button>
        </Sheet>
      )}

      {sheet === 'profile' && <ProfileSheet onClose={() => setSheet(null)} onSaved={() => flash('저장했어요')} />}

      {sheet === 'cat' && (
        <NameSheet
          title="고양이 이름"
          current={g.cat.name}
          max={8}
          art={ART.sit}
          onClose={() => setSheet(null)}
          onSave={(n) => (actions.renameCat(n), flash('이름을 바꿨어요'))}
        />
      )}

      {sheet === 'guildname' && (
        <NameSheet
          title="길드 이름"
          current={g.name}
          max={12}
          art={ART.friend_orange}
          onClose={() => setSheet(null)}
          onSave={(n) => (actions.renameGuild(n), flash('이름을 바꿨어요'))}
        />
      )}

      {sheet === 'answers' && (
        <Sheet title="처음 설문 답변" onClose={() => setSheet(null)}>
          {u.survey && type ? (
            <>
              <div className="type-card">
                <img src={ART[type.art]} alt="" />
                <div>
                  <small>나의 시작 타입</small>
                  <b>{type.name}</b>
                  <p>{type.desc}</p>
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
              <p className="fineprint">
                답한 날 {new Date(u.survey.at).toLocaleDateString('ko-KR')} · 학기가 끝날 때 같은 질문을 한 번 더 물어서 얼마나 달라졌는지 보여줄 거예요.
              </p>
            </>
          ) : (
            <p className="muted">아직 답한 설문이 없어요.</p>
          )}
          <button className="btn btn-primary btn-block" onClick={() => setSheet('redo')}>
            {u.survey ? '다시 답하기' : '지금 답하기'}
          </button>
        </Sheet>
      )}

      {sheet === 'rules' && (
        <Sheet title="게임 규칙" onClose={() => setSheet(null)}>
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
              <b>돈은 두 가지예요</b>
              <span>
                모의투자 계좌(원): 시작 {(RULES.startCash / 10000).toLocaleString()}만원, 퀘스트 첫 완료마다 +{RULES.questCash / 10000}만원. 게임 코인: 고양이 돌보기·상점용으로, 혼자 하는 훈련(한 시간 {RULES.goldPerHour}개, 최대 {RULES.trainCapHours}시간)·퀘스트 +{RULES.questReward}·오늘의 미션 +{RULES.dailyReward}로 모아요. 둘은 서로 바꿀 수 없어요.
              </span>
            </li>
            <li>
              <b>없는 것</b>
              <span>확률 뽑기, 수익률 순위, 현금 충전, 투자에 유리한 아이템은 없어요.</span>
            </li>
          </ul>
        </Sheet>
      )}

      {sheet === 'faq' && (
        <Sheet title="자주 묻는 질문" onClose={() => setSheet(null)}>
          <ul className="rules">
            <li>
              <b>골드를 돈으로 바꿀 수 있나요?</b>
              <span>아니요. 연습용 가상 골드라 현금화가 없고, 충전도 없어요.</span>
            </li>
            <li>
              <b>실제로 주식을 사나요?</b>
              <span>사지 않아요. 모의매매로만 연습해요.</span>
            </li>
            <li>
              <b>어떤 종목을 사야 하는지 알려주나요?</b>
              <span>알려주지 않아요. AI 친구는 이유가 충분한지만 봐주고, 종목 추천은 하지 않아요.</span>
            </li>
            <li>
              <b>손해를 보면 고양이가 아픈가요?</b>
              <span>아니요. 배부름·기분·청결은 {RULES.floor} 아래로 내려가지 않아요.</span>
            </li>
            <li>
              <b>친구 없이 혼자 할 수 있나요?</b>
              <span>지금은 하늘·도윤이 데모 친구로 같이 해요. 정식 버전에서 진짜 친구를 초대할 수 있어요.</span>
            </li>
            <li>
              <b>기록을 다른 기기로 옮길 수 있나요?</b>
              <span>아직은 못 옮겨요. 계정 연결이 열리면 따라와요.</span>
            </li>
          </ul>
        </Sheet>
      )}

      {sheet === 'privacy' && (
        <Sheet title="개인정보처리방침" onClose={() => setSheet(null)}>
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
              <b>어디에 저장되나요</b>
              <span>
                이 휴대폰 브라우저에 저장하고, 서버에 연결되면 길드 친구들과 같이 보도록 서버에도 저장해요. 서버에 못 닿으면 이 기기에만 남아요.
              </span>
            </li>
            <li>
              <b>지우고 싶을 때</b>
              <span>'계정 삭제'를 누르면 이 기기의 기록이 모두 지워져요.</span>
            </li>
            <li>
              <b>내려받기</b>
              <span>'내 데이터 내려받기'로 지금 저장된 기록 전부를 파일로 받을 수 있어요.</span>
            </li>
          </ul>
          <p className="fineprint">정식 버전 공개 전에 보호자 동의 절차와 함께 다시 안내할게요.</p>
        </Sheet>
      )}

      {sheet === 'terms' && (
        <Sheet title="이용약관" onClose={() => setSheet(null)}>
          <ul className="rules">
            <li>
              <b>무엇을 하는 서비스인가요</b>
              <span>FLOCO는 금융을 배우는 연습용 게임이에요. 투자 자문이나 중개 서비스가 아니에요.</span>
            </li>
            <li>
              <b>골드</b>
              <span>골드는 게임 안에서만 쓰는 가상 화폐예요. 현금으로 바꿀 수 없고, 사고팔 수 없어요.</span>
            </li>
            <li>
              <b>시세</b>
              <span>지금 보이는 가격은 연습용 가상 시세예요. 실제 투자 판단의 근거로 쓰면 안 돼요.</span>
            </li>
            <li>
              <b>길드에서 지킬 것</b>
              <span>친구를 비난하거나 개인정보를 올리지 않기. 신고가 쌓이면 길드 활동이 제한될 수 있어요.</span>
            </li>
            <li>
              <b>테스트 버전</b>
              <span>기능과 기록은 테스트 중에 바뀌거나 초기화될 수 있어요.</span>
            </li>
          </ul>
        </Sheet>
      )}

      {sheet === 'oss' && (
        <Sheet title="오픈소스 라이선스" onClose={() => setSheet(null)}>
          <ul className="oss-list">
            <li>
              <b>React 19</b>
              <small>MIT License · Meta Platforms, Inc.</small>
            </li>
            <li>
              <b>Vite 8</b>
              <small>MIT License · Evan You & Vite Contributors</small>
            </li>
            <li>
              <b>TypeScript</b>
              <small>Apache License 2.0 · Microsoft</small>
            </li>
            <li>
              <b>SUIT</b>
              <small>SIL Open Font License 1.1 · SUIT Project</small>
            </li>
          </ul>
          <p className="fineprint">고양이와 마을 그림은 FLOCO가 직접 그린 캐릭터 시트예요.</p>
        </Sheet>
      )}

      {dialog === 'leave' && (
        <ConfirmDialog
          title="길드를 나갈까요?"
          message={`${g.name}에서 나가면 ${g.cat.name}와 금고, 지금까지의 제안·돌아보기를 더는 볼 수 없어요.`}
          ok="나가기"
          cancel="그대로 두기"
          onOk={() => {
            setDialog(null)
            actions.leaveGuild()
          }}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog === 'delete1' && (
        <ConfirmDialog
          title="계정을 삭제할까요?"
          message="닉네임, 설문 답변, 고양이와 길드 기록이 이 기기에서 모두 지워져요."
          ok="삭제하기"
          cancel="취소"
          onOk={() => setDialog('delete2')}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog === 'delete2' && (
        <ConfirmDialog
          title="정말 지울까요?"
          message="되돌릴 수 없어요. 남기고 싶다면 먼저 '내 데이터 내려받기'로 기록을 받아두세요."
          ok="네, 모두 지울게요"
          cancel="돌아가기"
          onOk={() => {
            setDialog(null)
            actions.reset()
          }}
          onCancel={() => setDialog(null)}
        />
      )}

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
      {editPic && <ProfileEditor onClose={() => setEditPic(false)} />}
    </div>
  )
}

// ───────── 줄과 그룹 ─────────

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="set2-group">
      <h2 className="set2-gtitle">{title}</h2>
      <div className="set2-card">{children}</div>
      {note && <p className="set2-note">{note}</p>}
    </section>
  )
}

function Row({
  icon,
  tone,
  label,
  sub,
  value,
  onClick,
  danger,
  dim,
}: {
  icon: IconName
  tone: Tone
  label: string
  sub?: string
  value?: string
  onClick?: () => void
  danger?: boolean
  dim?: boolean
}) {
  const inner = (
    <>
      <span className={`si ${tone}`}>
        <Ico n={icon} />
      </span>
      <span className="set2-label">
        <b>{label}</b>
        {sub && <small>{sub}</small>}
      </span>
      {value && <span className="set2-val">{value}</span>}
      {onClick && <Chev />}
    </>
  )
  const cls = `set2-row ${danger ? 'danger' : ''} ${dim ? 'dim' : ''}`
  return onClick ? (
    <button className={cls} onClick={onClick}>
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <span className="switch">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" />
    </span>
  )
}

function Toggle({
  k,
  icon,
  tone,
  label,
  sub,
  dim,
  onFlash,
}: {
  k: keyof Prefs
  icon: IconName
  tone: Tone
  label: string
  sub: string
  dim?: boolean
  onFlash: (msg: string) => void
}) {
  const s = useGame()
  const on = s.prefs[k] === true
  const change = (v: boolean) => {
    actions.setPref(k, v as Prefs[typeof k])
    // 진동은 켜져 있을 때만, 되는 기기에서만
    if (s.prefs.haptic && typeof navigator.vibrate === 'function') navigator.vibrate(10)
    if (k === 'calm' && v) onFlash('움직임을 줄였어요')
  }
  return (
    <label className={`set2-row ${dim ? 'dim' : ''}`}>
      <span className={`si ${tone}`}>
        <Ico n={icon} />
      </span>
      <span className="set2-label">
        <b>{label}</b>
        <small>{sub}</small>
      </span>
      <Switch on={on} onChange={change} />
    </label>
  )
}

function OptionRow({ label, sub, on, soon, onClick }: { label: string; sub?: string; on?: boolean; soon?: boolean; onClick: () => void }) {
  return (
    <button className={`opt-row ${on ? 'on' : ''}`} onClick={onClick}>
      <span className="set2-label">
        <b>{label}</b>
        {sub && <small>{sub}</small>}
      </span>
      {soon && <span className="soon-tag">준비 중</span>}
      {on && (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12.5 L10 17.5 L19 7" />
        </svg>
      )}
    </button>
  )
}

// ───────── 작은 화면들 ─────────

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
      <p className="fineprint">실명 대신 쓰고 싶은 이름을 적어요. 길드 친구들에게 이 이름으로 보여요.</p>
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

function NameSheet({
  title,
  current,
  max,
  art,
  onClose,
  onSave,
}: {
  title: string
  current: string
  max: number
  art: string
  onClose: () => void
  onSave: (n: string) => void
}) {
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

// ───────── 아이콘 (이모지 대신 직접 그린 선 아이콘) ─────────

type Tone = 'sky' | 'mint' | 'honey' | 'pink' | 'lilac' | 'grey' | 'red'
type IconName = keyof typeof PATHS

const PATHS = {
  person: <path d="M12 12.4a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4ZM4.8 20c0-3.6 3.2-5.6 7.2-5.6s7.2 2 7.2 5.6" />,
  key: (
    <>
      <circle cx="8.5" cy="12" r="3.8" />
      <path d="M12.3 12H20M17.4 12v3M20 12v2.6" />
    </>
  ),
  clipboard: (
    <>
      <path d="M8 5H6.6A1.6 1.6 0 0 0 5 6.6v12.8A1.6 1.6 0 0 0 6.6 21h10.8a1.6 1.6 0 0 0 1.6-1.6V6.6A1.6 1.6 0 0 0 17.4 5H16" />
      <rect x="8" y="3" width="8" height="4" rx="1.4" />
      <path d="M8.8 12h6.4M8.8 16h4" />
    </>
  ),
  logout: (
    <>
      <path d="M14 5H7.6A1.6 1.6 0 0 0 6 6.6v10.8A1.6 1.6 0 0 0 7.6 19H14" />
      <path d="M17 15.5 20.5 12 17 8.5M20 12h-9" />
    </>
  ),
  trash: (
    <>
      <path d="M4.8 7h14.4M9.5 7V5.4A1.4 1.4 0 0 1 10.9 4h2.2a1.4 1.4 0 0 1 1.4 1.4V7" />
      <path d="M6.6 7l.8 11.6A1.6 1.6 0 0 0 9 20h6a1.6 1.6 0 0 0 1.6-1.4L17.4 7" />
    </>
  ),
  bell: (
    <>
      <path d="M12 4a5.6 5.6 0 0 0-5.6 5.6c0 4.2-1.4 5.6-1.4 5.6h14s-1.4-1.4-1.4-5.6A5.6 5.6 0 0 0 12 4Z" />
      <path d="M10.3 19a2 2 0 0 0 3.4 0" />
    </>
  ),
  bulb: (
    <>
      <path d="M9.2 16.5a5.6 5.6 0 1 1 5.6 0v1.9H9.2v-1.9Z" />
      <path d="M10 21h4" />
    </>
  ),
  loop: (
    <>
      <path d="M5 11a7 7 0 0 1 12-4.4" />
      <path d="M19 13a7 7 0 0 1-12 4.4" />
      <path d="M17 3.5V7h-3.4M7 20.5V17h3.4" />
    </>
  ),
  bowl: (
    <>
      <path d="M4 12h16a8 6.5 0 0 1-16 0Z" />
      <path d="M8.6 8.4c.6-1.4 2-2.2 3.4-2.2s2.8.8 3.4 2.2" />
    </>
  ),
  cheer: (
    <>
      <path d="M4 10.5 17 5.5v11L4 11.5Z" />
      <path d="M7.5 12.8V18a1.6 1.6 0 0 0 3.2 0v-4.2M19.5 9.5h1.8M19 6.2l1.6-1.1M19 13l1.6 1.1" />
    </>
  ),
  moon: <path d="M19.5 14.2A8 8 0 0 1 9.8 4.5a8 8 0 1 0 9.7 9.7Z" />,
  text: (
    <>
      <path d="M4 7V5.5h9V7M8.5 5.5V19M6.5 19h4" />
      <path d="M14 13v-1h6v1M17 12v7M15.5 19h3" />
    </>
  ),
  motion: (
    <>
      <circle cx="12" cy="12" r="2.6" />
      <path d="M12 4.5v2.2M12 17.3v2.2M4.5 12h2.2M17.3 12h2.2M6.8 6.8l1.6 1.6M15.6 15.6l1.6 1.6M17.2 6.8l-1.6 1.6M8.4 15.6l-1.6 1.6" />
    </>
  ),
  talk: (
    <>
      <path d="M20 13.5a2.5 2.5 0 0 1-2.5 2.5H9l-4 3v-3H6.5A2.5 2.5 0 0 1 4 13.5v-6A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5Z" />
      <path d="M9 10.5h.01M12 10.5h.01M15 10.5h.01" />
    </>
  ),
  sound: (
    <>
      <path d="M5 9.5h3L12 6v12l-4-3.5H5Z" />
      <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10" />
    </>
  ),
  vibrate: (
    <>
      <rect x="8.5" y="4.5" width="7" height="15" rx="1.8" />
      <path d="M5 9.5v5M19 9.5v5" />
    </>
  ),
  flag: (
    <>
      <path d="M6 20V4.8" />
      <path d="M6 5.4h11l-2.2 3.4L17 12.2H6Z" />
    </>
  ),
  paw: (
    <>
      <ellipse cx="12" cy="15.5" rx="4.2" ry="3.4" />
      <circle cx="7.3" cy="10.2" r="1.9" />
      <circle cx="10.6" cy="7.6" r="1.9" />
      <circle cx="14.4" cy="7.6" r="1.9" />
      <circle cx="17.2" cy="10.6" r="1.8" />
    </>
  ),
  code: (
    <>
      <path d="M9 7.5 4.5 12 9 16.5M15 7.5 19.5 12 15 16.5" />
      <path d="M13.4 5.2 10.6 18.8" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
    </>
  ),
  share: (
    <>
      <circle cx="17.5" cy="6" r="2.5" />
      <circle cx="6.5" cy="12" r="2.5" />
      <circle cx="17.5" cy="18" r="2.5" />
      <path d="M8.8 10.8 15.3 7.2M8.8 13.2l6.5 3.6" />
    </>
  ),
  users: (
    <>
      <circle cx="9.5" cy="9" r="3.2" />
      <path d="M3.8 19c0-3.2 2.6-5 5.7-5s5.7 1.8 5.7 5" />
      <path d="M16 7.2a3 3 0 0 1 0 5.6M17.5 14.4c1.8.6 3 2.2 3 4.6" />
    </>
  ),
  exit: (
    <>
      <path d="M10 5H6.6A1.6 1.6 0 0 0 5 6.6v10.8A1.6 1.6 0 0 0 6.6 19H10" />
      <path d="m14.5 8.5 3.5 3.5-3.5 3.5M18 12H9" />
    </>
  ),
  shield: (
    <>
      <path d="M12 4 5.5 6.6v5.1c0 4 2.7 7 6.5 8.3 3.8-1.3 6.5-4.3 6.5-8.3V6.6Z" />
      <path d="m9.3 11.8 2 2 3.4-3.6" />
    </>
  ),
  link: (
    <>
      <path d="M10.5 13.5a3.6 3.6 0 0 0 5.1 0l2.6-2.6a3.6 3.6 0 1 0-5.1-5.1l-1 1" />
      <path d="M13.5 10.5a3.6 3.6 0 0 0-5.1 0L5.8 13a3.6 3.6 0 1 0 5.1 5.1l1-1" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v10M8.2 10.4 12 14.2l3.8-3.8" />
      <path d="M5 17v1.4A1.6 1.6 0 0 0 6.6 20h10.8a1.6 1.6 0 0 0 1.6-1.6V17" />
    </>
  ),
  block: (
    <>
      <circle cx="12" cy="12" r="7.8" />
      <path d="m6.8 6.8 10.4 10.4" />
    </>
  ),
  doc: (
    <>
      <path d="M13.4 3.5H7.6A1.6 1.6 0 0 0 6 5.1v13.8A1.6 1.6 0 0 0 7.6 20.5h8.8a1.6 1.6 0 0 0 1.6-1.6V8Z" />
      <path d="M13.4 3.5V8H18M9 12.5h6M9 16h4" />
    </>
  ),
  cloud: <path d="M7.2 18.5h9.4a3.9 3.9 0 0 0 .6-7.7 5.4 5.4 0 0 0-10.3-1A3.9 3.9 0 0 0 7.2 18.5Z" />,
  megaphone: (
    <>
      <path d="M4 10.5v3a1.6 1.6 0 0 0 1.6 1.6H8l7 4.4V6.1l-7 4.4H5.6A1.6 1.6 0 0 0 4 10.5Z" />
      <path d="M18 9.4a3.6 3.6 0 0 1 0 5.2" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M9.8 9.6a2.3 2.3 0 1 1 2.9 2.2c-.5.2-.7.6-.7 1.1v.6" />
      <path d="M12 16.6h.01" />
    </>
  ),
  book: (
    <>
      <path d="M4.5 5.6A2.1 2.1 0 0 1 6.6 3.5H19v14H6.6a2.1 2.1 0 0 0-2.1 2.1Z" />
      <path d="M4.5 19.6a2.1 2.1 0 0 1 2.1-2.1H19v3H6.6" />
    </>
  ),
  mail: (
    <>
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="m4.6 7.4 7.4 5.3 7.4-5.3" />
    </>
  ),
  heart: <path d="M12 19.3s-6.8-4-6.8-8.6A3.8 3.8 0 0 1 12 8.3a3.8 3.8 0 0 1 6.8 2.4c0 4.6-6.8 8.6-6.8 8.6Z" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5.2M12 7.9h.01" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M4 10h16M8.5 3.5V7M15.5 3.5V7" />
    </>
  ),
  pencil: <path d="M4.5 19.5h4l10-10a2.1 2.1 0 0 0-3-3l-10 10Z" />,
} as const

function Ico({ n }: { n: IconName }) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[n]}
    </svg>
  )
}

function Chev() {
  return (
    <svg className="set2-chev" viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 3 L11 8 L6 13" />
    </svg>
  )
}
