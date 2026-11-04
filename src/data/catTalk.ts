// 고양이가 먼저 묻는 질문 (일방형). 답을 고르면 고양이가 한마디 하고 끝난다.
// 정답은 없고, 돈·투자를 자기 말로 생각해보게 하는 게 목적. 종목 추천은 하지 않는다.
import type { GameState } from '../types'
import { memberName, me, vault } from '../store'
import { tickerOf } from './market'
import type { Face } from '../components/CatView'

export type Ask = { q: string; choices: { t: string; reply: string; face?: Face }[] }

const GENERIC: Ask[] = [
  {
    q: '용돈 받으면 제일 먼저 뭐 해?',
    choices: [
      { t: '바로 써!', reply: '맛있는 거 사 먹으면 행복하지. 나도 간식 좋아해', face: 'happy' },
      { t: '조금 떼서 모아둬', reply: '오 멋지다. 먼저 떼어두면 덜 흔들린대', face: 'wow' },
      { t: '어디 쓸지 먼저 정해', reply: '계획 세우는 집사라니, 든든해', face: 'calm' },
    ],
  },
  {
    q: '친구가 "이거 무조건 오른대" 하면 어떻게 해?',
    choices: [
      { t: '일단 따라 사', reply: '음… 무조건은 없대. 이유부터 물어보자', face: 'sad' },
      { t: '왜 오르는지 물어봐', reply: '그거야! 이유를 들어야 내 판단이 되지', face: 'happy' },
      { t: '그냥 무시해', reply: '조심하는 것도 좋아. 근데 이유를 들어보면 배울 수도 있어', face: 'calm' },
    ],
  },
  {
    q: '갖고 싶은 게 비싸면 어떻게 해?',
    choices: [
      { t: '조금씩 모아', reply: '기다린 만큼 더 반갑대. 나도 밥 기다릴 때 그래', face: 'happy' },
      { t: '더 싼 걸 찾아', reply: '비교해보는 거 좋다! 같은 거면 싼 게 최고지', face: 'wow' },
      { t: '포기해', reply: '정말 필요한지 생각해보는 것도 용기야', face: 'calm' },
    ],
  },
  {
    q: '돈을 잃으면 어떤 기분일 것 같아?',
    choices: [
      { t: '엄청 속상해', reply: '맞아. 그래서 잃어도 괜찮은 만큼만 하는 거래', face: 'sad' },
      { t: '다시 찾고 싶어', reply: '급하게 만회하려다 더 잃는 경우가 많대. 숨 한번 쉬자', face: 'calm' },
      { t: '배운 셈 칠래', reply: '돌아보기를 쓰면 진짜 배운 게 돼!', face: 'happy' },
    ],
  },
  {
    q: '나 오늘 뭐 하고 놀까?',
    choices: [
      { t: '낮잠 자', reply: '좋아… 하암… 쿨쿨', face: 'sleepy' },
      { t: '장난감 놀이', reply: '낚싯대 흔들어줘! 상점에 있어', face: 'happy' },
      { t: '창밖 구경', reply: '새가 지나가면 알려줄게', face: 'wow' },
    ],
  },
  {
    q: 'ETF가 뭐였는지 기억나?',
    choices: [
      { t: '여러 회사를 묶은 거', reply: '정답 같은 느낌! 한 바구니에 여러 개 담은 거래', face: 'happy' },
      { t: '한 회사 주식', reply: '음, 그건 그냥 주식이야. 지도에서 다시 보자', face: 'calm' },
      { t: '모르겠어', reply: '괜찮아. ETF 숲에 가면 알려줄게', face: 'calm' },
    ],
  },
  {
    q: '오래 갖고 있는 거랑 자주 사고파는 거, 뭐가 나을까?',
    choices: [
      { t: '오래 갖고 있기', reply: '수수료도 덜 들고 마음도 편하대', face: 'happy' },
      { t: '자주 사고팔기', reply: '타이밍 맞추기는 어른들도 어렵대. 이유를 꼭 적자', face: 'wow' },
      { t: '때에 따라 달라', reply: '그치, 그래서 이유가 중요한 거야', face: 'calm' },
    ],
  },
]

// 지금 길드 상황에 맞는 질문을 먼저, 없으면 일반 질문을 돌아가며
export function pickAsk(s: GameState, n: number): Ask {
  const g = s.guild!
  const myId = me(g).id
  const v = vault(g, s.day)
  const ctx: Ask[] = []
  const waiting = g.proposals.find((p) => p.status === 'voting' && !p.votes.some((x) => x.memberId === myId))
  if (waiting)
    ctx.push({
      q: `${memberName(g, waiting.proposerId)}가 ${tickerOf(waiting.ticker).name} 사자고 했잖아. 어떻게 생각해?`,
      choices: [
        { t: '좋아 보여', reply: '그럼 투자 탭에서 좋아요 눌러줘! 이유도 한 줄', face: 'happy' },
        { t: '좀 걱정돼', reply: '걱정도 소중한 의견이야. 적어주면 다 같이 볼 수 있어', face: 'calm' },
        { t: '아직 안 읽었어', reply: '이유 세 칸만 읽어보자. 금방이야', face: 'wow' },
      ],
    })
  const h = v.holdings[0]
  if (h)
    ctx.push({
      q: `우리 ${tickerOf(h.p.ticker).name} 왜 샀었는지 기억나?`,
      choices: [
        { t: '기억나!', reply: '그 이유가 아직도 맞는지 가끔 확인하자', face: 'happy' },
        { t: '가물가물해', reply: '그래서 이유를 적어두는 거야. 투자 탭에 남아 있어', face: 'calm' },
        { t: `${h.pct >= 0 ? '올라서 기뻐' : '내려서 속상해'}`, reply: '오르고 내리는 건 자연스러워. 이유가 바뀌었는지가 중요해', face: h.pct >= 0 ? 'happy' : 'sad' },
      ],
    })
  const all = [...ctx, ...GENERIC]
  const seed = Number(s.daily.date.replace(/\D/g, '')) || 0
  return n < ctx.length ? ctx[n] : all[(seed + n) % all.length]
}
