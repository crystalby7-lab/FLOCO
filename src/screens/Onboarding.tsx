// 가입 → 길드 만들기 / 초대 코드로 참가 (F7)
// 개인정보 원칙: 실명·연락처·학교명은 받지 않고 닉네임과 학년만 저장
import { useState } from 'react'
import { actions, useGame } from '../store'
import { CatView } from '../components/CatView'
import { Scene } from '../components/Scene'

const GRADES = ['중1', '중2', '중3', '고1', '고2', '고3', '기타']

export function Onboarding() {
  const s = useGame()
  const inviteFromLink = new URLSearchParams(location.search).get('invite') ?? ''
  const [nickname, setNickname] = useState('')
  const [grade, setGrade] = useState('')
  const [mode, setMode] = useState<'create' | 'join'>(inviteFromLink ? 'join' : 'create')
  const [guildName, setGuildName] = useState('')
  const [catName, setCatName] = useState('')
  const [code, setCode] = useState(inviteFromLink)

  if (!s.user) {
    return (
      <div className="onboard">
        <Scene compact>
          <div className="onboard-hero">
            <h1 className="logo">FLOCO</h1>
            <p className="tagline">친구들이랑 고양이 한 마리, 같이 키워볼래?</p>
            <CatView
              cat={{ name: '', level: 1, exp: 0, hunger: 80, mood: 80, updatedAt: 0, lastClaimAt: 0, equipped: ['scarf'] }}
              size={180}
            />
          </div>
        </Scene>
        <div className="card form">
          <label>
            닉네임
            <input value={nickname} maxLength={10} onChange={(e) => setNickname(e.target.value)} placeholder="친구들이 부를 이름" />
          </label>
          <div className="field-label">학년</div>
          <div className="chips">
            {GRADES.map((g) => (
              <button key={g} className={`chip ${grade === g ? 'on' : ''}`} onClick={() => setGrade(g)}>
                {g}
              </button>
            ))}
          </div>
          <p className="fineprint">이름·연락처·학교는 묻지 않아요.</p>
          <button className="btn primary" disabled={!nickname.trim() || !grade} onClick={() => actions.createUser(nickname.trim(), grade)}>
            시작하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="onboard">
      <div className="onboard-head">
        <h1>{s.user.nickname}님, 반가워요!</h1>
        <p>고양이는 친구들이랑 같이 키워요 (2~5명)</p>
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
        <div className="card form">
          <label>
            길드 이름
            <input value={guildName} maxLength={12} onChange={(e) => setGuildName(e.target.value)} placeholder="예: 3반 투자부" />
          </label>
          <label>
            함께 키울 고양이 이름
            <input value={catName} maxLength={8} onChange={(e) => setCatName(e.target.value)} placeholder="예: 주니" />
          </label>
          <button className="btn primary" disabled={!guildName.trim() || !catName.trim()} onClick={() => actions.createGuild(guildName.trim(), catName.trim())}>
            고양이 데려오기
          </button>
          <p className="fineprint">지금은 테스트용 친구 하늘·도윤이 같이 들어와요.</p>
        </div>
      ) : (
        <div className="card form">
          <label>
            초대 코드
            <input value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="6자리 코드" className="code-input" />
          </label>
          <button className="btn primary" disabled={code.trim().length < 4} onClick={() => actions.joinGuild(code.trim())}>
            길드 참가하기
          </button>
          <p className="fineprint">테스트 버전에선 어떤 코드든 연습 길드로 들어가요.</p>
        </div>
      )}
    </div>
  )
}
