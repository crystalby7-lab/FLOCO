// F4 AI 근거 검토 — 임시 규칙 버전
// 실제 서비스에서는 서버 함수(Firebase Functions)가 위닛 세이프가드에 요청하고,
// API 키는 서버 환경변수에만 둔다. 화면 코드에는 키를 넣지 않는다.

import type { AiResult } from './types'

const VAGUE = ['오를 것 같', '오를것같', '그냥', '다들', '추천', '유튜브', '리딩방', '단톡', '느낌', '대박', '무조건', '떡상']
const CONCRETE = [
  '실적', '매출', '이익', '수수료', '보수', '분산', '지수', '금리', '환율', '배당', '산업', '회사', '기업',
  '담', '비중', '흔들', '변동', '채권', '장기', '국가', '미국', '한국', '기술', '배터리', '200', '500', '100',
]

export function reviewReasons(reasons: [string, string, string], previousFirstReasons: string[]): AiResult {
  const [why, notChecked, notBought] = reasons.map((r) => r.trim())

  if (why.length < 15) {
    return { pass: false, message: '"왜 사는지"가 너무 짧아요.', hint: '무엇을 담은 상품인지, 그게 왜 좋다고 봤는지 한 문장 더 써보세요.' }
  }
  if (VAGUE.some((v) => why.includes(v)) && !CONCRETE.some((c) => why.includes(c))) {
    return {
      pass: false,
      message: '남의 말이나 느낌만 있고, 직접 확인한 근거가 안 보여요.',
      hint: '담은 회사·산업, 수수료, 최근 흔들림처럼 직접 확인한 사실을 넣어보세요.',
    }
  }
  if (!CONCRETE.some((c) => why.includes(c)) && !/\d/.test(why)) {
    return { pass: false, message: '근거의 대상이 구체적이지 않아요.', hint: '무엇을 보고 판단했는지(지수, 산업, 수수료, 숫자 등)를 적어보세요.' }
  }
  if (notChecked.length < 6) {
    return { pass: false, message: '"무엇을 확인하지 않았는지"를 채워주세요.', hint: '모르는 부분을 적는 것도 근거예요. 예상 못 한 위험을 한 가지 적어보세요.' }
  }
  if (notBought.length < 6) {
    return { pass: false, message: '"무엇을 사지 않기로 했는지"를 채워주세요.', hint: '비교했다가 고르지 않은 상품과 그 이유를 적어보세요.' }
  }
  const norm = (s: string) => s.replace(/\s/g, '')
  if (previousFirstReasons.some((p) => norm(p) === norm(why))) {
    return { pass: false, message: '이전 제안과 같은 문장이에요.', hint: '이번 판단만의 이유를 새로 써보세요.' }
  }
  return { pass: true, message: '근거가 확인됐어요. 길드에 제안을 올릴 수 있어요.' }
}
