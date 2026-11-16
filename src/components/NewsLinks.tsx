// 경제 뉴스 바로가기: 요약 없이 카테고리별로 믿을 만한 뉴스 페이지로 연결만 한다.
import { useState } from 'react'
import { ART } from './CatView'

type Link = { title: string; desc: string; url: string; source: string }
const CATS: { id: string; label: string; cat: string; links: Link[] }[] = [
  {
    id: 'market',
    label: '주식시장',
    cat: 'b_tuxedo',
    links: [
      { title: '오늘 코스피·코스닥은 왜 움직였을까', desc: '증권 속보와 시장 흐름', url: 'https://news.naver.com/breakingnews/section/101/258', source: '네이버 뉴스 · 증권' },
      { title: '오늘의 주요 시황 한눈에', desc: '증권사가 정리한 하루 시장 요약', url: 'https://finance.naver.com/news/mainnews.naver', source: '네이버 증권' },
    ],
  },
  {
    id: 'life',
    label: '생활 경제',
    cat: 'b_orange',
    links: [
      { title: '물가·용돈·장바구니 이야기', desc: '내 지갑과 가까운 경제 소식', url: 'https://news.naver.com/breakingnews/section/101/310', source: '네이버 뉴스 · 생활경제' },
      { title: '금리와 예금·적금 소식', desc: '은행 이자와 금융 상품', url: 'https://news.naver.com/breakingnews/section/101/259', source: '네이버 뉴스 · 금융' },
    ],
  },
  {
    id: 'biz',
    label: '기업·산업',
    cat: 'b_grey',
    links: [{ title: '회사들은 요즘 무엇을 할까', desc: '반도체·배터리·자동차 등 산업 소식', url: 'https://news.naver.com/breakingnews/section/101/261', source: '네이버 뉴스 · 산업' }],
  },
  {
    id: 'world',
    label: '해외 경제',
    cat: 'b_black',
    links: [
      { title: '미국·중국·세계 경제 소식', desc: '환율과 해외 증시에 영향을 주는 뉴스', url: 'https://news.naver.com/breakingnews/section/101/262', source: '네이버 뉴스 · 글로벌 경제' },
      { title: 'World business news', desc: '영어로 읽는 세계 경제 (BBC)', url: 'https://www.bbc.com/business', source: 'BBC Business' },
    ],
  },
  {
    id: 'easy',
    label: '쉽게 읽기',
    cat: 'sit',
    links: [
      { title: '청소년을 위한 경제 신문', desc: '중고생 눈높이로 쓴 경제 기사', url: 'https://sgsg.hankyung.com', source: '한국경제 생글생글' },
      { title: '금융 용어와 금융 생활 길잡이', desc: '모르는 금융 말을 찾아보기', url: 'https://fine.fss.or.kr', source: '금융감독원 파인' },
    ],
  },
]

export function NewsLinks() {
  const [cat, setCat] = useState(CATS[0].id)
  const c = CATS.find((x) => x.id === cat)!
  return (
    <section className="card news-links">
      <div className="nl-head">
        <h3 className="card-title">경제 뉴스 보러 가기</h3>
        <small>누르면 뉴스 사이트로 이동해요</small>
      </div>
      <div className="nl-chips">
        {CATS.map((x) => (
          <button key={x.id} className={cat === x.id ? 'on' : ''} onClick={() => setCat(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <ul className="nl-list">
        {c.links.map((l) => (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noreferrer">
              <img src={ART[c.cat]} alt="" />
              <span>
                <b>{l.title}</b>
                <small>
                  {l.desc} · {l.source}
                </small>
              </span>
              <i>›</i>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
