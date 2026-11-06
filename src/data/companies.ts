// 대형주 실적 (매출·영업이익)
// scripts/fetch-companies.mjs가 OpenDART에서 받아 public/companies.json에 넣는다.
// 파일이 없으면 종목 상세에서 실적 줄만 안 보인다.

export type Company = {
  name: string
  corpName: string
  corpCode: string
  year: number
  period: string // '2026년 3분기'
  revenue: number | null
  profit: number | null
  unit: string
}

type File = { updatedAt: string; source: string; items: Record<string, Company> }

const REMOTE = 'https://raw.githubusercontent.com/crystalby7-lab/FLOCO/main/public/companies.json'
const LOCAL = `${import.meta.env.BASE_URL}companies.json`

let items: Record<string, Company> | null = null

export async function loadCompanies(): Promise<boolean> {
  for (const url of [REMOTE, LOCAL]) {
    try {
      const ctl = new AbortController()
      const timer = setTimeout(() => ctl.abort(), 5000)
      const res = await fetch(url, { signal: ctl.signal, cache: 'no-cache' }).finally(() => clearTimeout(timer))
      if (!res.ok) continue
      const data = (await res.json()) as File
      if (data?.items && Object.keys(data.items).length) {
        items = data.items
        return true
      }
    } catch {
      /* 다음 주소로 */
    }
  }
  return false
}

export const companyOf = (code: string) => items?.[code] ?? null

// 1,234,500,000,000 → '1조 2,345억원' (중학생이 읽을 수 있게)
export function moneyLabel(n: number | null): string {
  if (!n) return '-'
  const minus = n < 0 ? '-' : ''
  const v = Math.abs(n)
  const jo = Math.floor(v / 1_000_000_000_000)
  const eok = Math.round((v % 1_000_000_000_000) / 100_000_000)
  if (jo > 0) return `${minus}${jo}조 ${eok.toLocaleString()}억원`
  return `${minus}${Math.round(v / 100_000_000).toLocaleString()}억원`
}
