// 처음 화면: 소개 3장 → 닉네임·학년 → 설문 6문항 → 길드 만들기 / 초대 코드로 참가 (F7)
// 개인정보 원칙: 실명·연락처·학교명은 받지 않고 닉네임과 학년만 저장
import { useState } from 'react'
import { actions, useGame } from '../store'
import { Playground } from '../components/Playground'
import { Wordmark } from '../components/Wordmark'
import { ART } from '../components/CatView'
import type { Cat } from '../types'
import { Survey } from './Survey'

const GRADES = ['중1', '중2', '중3', '고1', '고2', '고3', '기타']

const SLIDES = [
  { art: ['friend_grey', 'sit', 'friend_orange'], title: '친구들이랑\n고양이 한 마리를 같이 키워요', body: '길드는 2~5명. 금고도, 고양이도 함께 써요.' },
  { art: ['hug'], title: '고양이 밥값은\n같이 투자해서 벌어요', body: '사고 싶은 이유를 3칸에 쓰고, 친구들이 좋다고 하면 연습용 골드로 사요.' },
  { art: ['crown'], title: '돈을 벌어서가 아니라\n생각해서 자라요', body: '레벨은 수익이 아니라 이유를 쓰고 같이 돌아볼 때만 올라요. 손해를 봐도 고양이는 괜찮아요.' },
]

const demoCat = (name: string): Cat => ({
  name,
  level: 1,
  exp: 0,
  hunger: 80,
  mood: 70,
  clean: 90,
  updatedAt: Date.now(),
  lastClaimAt: 0,
  equipped: [],
})

export function Onboarding() {
  const s = useGame()
  const inviteFromLink = new URLSearchParams(location.search).get('invite') ?? ''
  const [slide, setSlide] = useState(0)
  const [nickname, setNickname] = useState('')
  const [grade, setGrade] = useState('')
  const [mode, setMode] = useState<'create' | 'join'>(inviteFromLink ? 'join' : 'create')
  const [guildName, setGuildName] = useState('')
  const [catName, setCatName] = useState('')
  const [code, setCode] = useState(inviteFromLink)

  // 1) 소개
  if (!s.tutorialDone && !s.user) {
    const sl = SLIDES[slide]
    const last = slide === SLIDES.length - 1
    return (
      <div className="onboard intro">
        <div className="intro-top">
          <Wordmark />
          <button className="text-btn" onClick={actions.finishTutorial}>
            건너뛰기
          </button>
        </div>
        <div key={slide} className="intro-slide">
          <div className={`intro-arts n${sl.art.length}`}>
            {sl.art.map((a, i) => (
              <img key={a + i} src={ART[a]} alt="" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
          <h1>
            {sl.title.split('\n').map((l) => (
              <span key={l}>
                {l}
                <br />
              </span>
            ))}
          </h1>
          <p className="intro-body">{sl.body}</p>
        </div>
        <div className="dots">
          {SLIDES.map((_, i) => (
            <span key={i} className={i === slide ? 'on' : ''} />
          ))}
        </div>
        <button className="btn btn-primary btn-block" onClick={() => (last ? actions.finishTutorial() : setSlide(slide + 1))}>
          {last ? '시작하기' : '다음'}
        </button>
      </div>
    )
  }

  // 2) 나 소개
  if (!s.user) {
    return (
      <div className="onboard">
        <div className="onboard-hero">
          <Wordmark large />
          <p className="tagline">
            친구들이 부를 이름만
            <br />
            알려주세요
          </p>
        </div>
        <div className="card form">
          <label>
            닉네임
            <input id="nickname" value={nickname} maxLength={10} onChange={(e) => setNickname(e.target.value)} placeholder="친구들이 부를 이름" />
          </label>
          <div className="field-label">학년</div>
          <div className="chips">
            {GRADES.map((g) => (
              <button key={g} className={`chip ${grade === g ? 'on' : ''}`} onClick={() => setGrade(g)}>
                {g}
              </button>
            ))}
          </div>
          <p className="fineprint">이름·연락처·학교는 묻지 않아요. 골드는 연습용이라 현금으로 바꿀 수 없어요.</p>
          <button className="btn btn-primary btn-block" disabled={!nickname.trim() || !grade} onClick={() => actions.createUser(nickname.trim(), grade)}>
            다음
          </button>
        </div>
      </div>
    )
  }

  // 3) 설문
  if (!s.user.survey) return <Survey onDone={actions.saveSurvey} />

  // 4) 길드
  return (
    <div className="onboard">
      <div className="onboard-head">
        <h1>{s.user.nickname}님, 반가워요!</h1>
        <p>새 길드를 만들거나, 친구가 보낸 코드로 들어가요</p>
      </div>
      <div className="seg">
        <button className={mode === 'create' ? 'on' : ''} onClick={() => setMode('create')}>
          길드 만들기
        </button>
        <button className={mode === 'join' ? 'on' : ''} onClick={() => setMode('join')}>
          초대 코드로 참가
        </button>
      </div>

      {mode === 'create' ? (
        <>
          <div className="bleed name-preview">
            <Playground cat={demoCat(catName || '이름 없는 고양이')} height={210} catHeight={104} />
            <span className="np-tag">{catName ? `안녕, 나는 ${catName}!` : '내 이름은 뭐야?'}</span>
          </div>
          <div className="card form">
            <label>
              길드 이름
              <input id="guild-name" value={guildName} maxLength={12} onChange={(e) => setGuildName(e.target.value)} placeholder="예: 3반 투자부" />
            </label>
            <label>
              함께 키울 고양이 이름
              <input id="cat-name" value={catName} maxLength={8} onChange={(e) => setCatName(e.target.value)} placeholder="예: 주니" />
            </label>
            <div className="chips">
              {['주니', '모찌', '콩이', '두부', '플로'].map((n) => (
                <button key={n} className={`chip ${catName === n ? 'on' : ''}`} onClick={() => setCatName(n)}>
                  {n}
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-block" disabled={!guildName.trim() || !catName.trim()} onClick={() => actions.createGuild(guildName.trim(), catName.trim())}>
              고양이 데려오기
            </button>
            <p className="fineprint">지금은 테스트용 친구 하늘·도윤이 같이 들어와요.</p>
          </div>
        </>
      ) : (
        <div className="card form">
          <label>
            초대 코드
            <input id="invite-code" value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="6자리 코드" className="code-input" />
          </label>
          <button className="btn btn-primary btn-block" disabled={code.trim().length < 4} onClick={() => actions.joinGuild(code.trim())}>
            길드 참가하기
          </button>
          <p className="fineprint">테스트 버전에선 어떤 코드든 연습 길드로 들어가요.</p>
        </div>
      )}
    </div>
  )
}
