// Firebase 연동: 익명 로그인 → 내 정보(users/{uid})와 길드(guilds/{초대코드})를 서버와 맞춘다.
// - 길드는 문서 하나에 통째로 저장하고, 친구가 바꾸면 실시간으로 받아온다.
// - 서버에 못 닿는 환경(미리보기 링크 등)에서는 조용히 혼자 쓰는 데모로 남는다.
import { useSyncExternalStore } from 'react'
import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { arrayUnion, doc, getDoc, getFirestore, onSnapshot, setDoc, updateDoc, type Unsubscribe } from 'firebase/firestore'
import { applyRemote, getState, setRemote, subscribeState } from './store'
import type { GameState, Guild } from './types'

const firebaseConfig = {
  apiKey: 'AIzaSyA0c5zEluCRfnnY8wQqibJSNDvc1T23poM',
  authDomain: 'floco-35df3.firebaseapp.com',
  projectId: 'floco-35df3',
  storageBucket: 'floco-35df3.firebasestorage.app',
  messagingSenderId: '561788771386',
  appId: '1:561788771386:web:4d196567a8e13d1c96e903',
}

// ── 연결 상태 (설정 화면에 표시) ──
export type SyncStatus = 'connecting' | 'online' | 'offline'
let status: SyncStatus = 'connecting'
const statusListeners = new Set<() => void>()
const setStatus = (s: SyncStatus) => {
  status = s
  statusListeners.forEach((l) => l())
}
export const useSyncStatus = () =>
  useSyncExternalStore(
    (l) => {
      statusListeners.add(l)
      return () => statusListeners.delete(l)
    },
    () => status,
  )

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])

// 서버에 저장할 모양: undefined 제거, '나' 표시(isMe)는 사람마다 다르니 빼고, 멤버 id 목록을 붙인다
const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
function toRemoteGuild(g: Guild): Guild {
  const members = g.members.map(({ isMe: _isMe, ...m }) => m)
  return clean({ ...g, members, memberIds: members.filter((m) => !m.isBot).map((m) => m.id) })
}
function fromRemoteGuild(g: Guild, uid: string): Guild {
  let members = g.members.map((m) => ({ ...m, isMe: m.id === uid }))
  // 진짜 친구가 들어오면 테스트용 봇 친구는 빠진다
  if (members.filter((m) => !m.isBot).length >= 2) members = members.filter((m) => !m.isBot)
  return { ...g, members }
}
const personal = (s: GameState) =>
  clean({ user: s.user, quests: s.quests, daily: s.daily, prefs: s.prefs, streak: s.streak, watch: s.watch, guides: s.guides, tutorialDone: s.tutorialDone, guildCode: s.guild?.code ?? null })

export async function startSync() {
  try {
    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app)
    const db = getFirestore(app)
    const cred = await withTimeout(signInAnonymously(auth), 8000)
    const uid = cred.user.uid

    let lastUser = ''
    let lastGuild = ''
    let unsubGuild: Unsubscribe | null = null
    let watching = ''

    const watchGuild = (code: string) => {
      if (watching === code) return
      unsubGuild?.()
      watching = code
      unsubGuild = onSnapshot(doc(db, 'guilds', code), (snap) => {
        if (!snap.exists() || snap.metadata.hasPendingWrites) return
        const g = fromRemoteGuild(snap.data() as Guild, uid)
        lastGuild = JSON.stringify(toRemoteGuild(g))
        applyRemote({ guild: g, day: g.day ?? getState().day })
      })
    }

    // 1) 서버에 내 정보가 있으면 불러오기 (다른 기기에서 이어하기)
    const meSnap = await withTimeout(getDoc(doc(db, 'users', uid)), 8000)
    setRemote(
      {
        // 초대 코드로 친구 길드에 들어가기
        async join(code) {
          const s = getState()
          if (!s.user) return '먼저 닉네임을 정해주세요.'
          try {
            await updateDoc(doc(db, 'guilds', code), {
              members: arrayUnion({ id: uid, nickname: s.user.nickname }),
              memberIds: arrayUnion(uid),
            })
          } catch {
            return '그 코드의 길드를 찾을 수 없어요.'
          }
          watchGuild(code)
          return null
        },
        // 길드 나가기: 구독을 먼저 끊고 멤버 목록에서 나를 뺀다 (빠지고 나면 더는 읽을 수 없다)
        async leave(code) {
          unsubGuild?.()
          unsubGuild = null
          watching = ''
          lastGuild = ''
          try {
            const snap = await getDoc(doc(db, 'guilds', code))
            if (!snap.exists()) return
            const g = snap.data() as Guild
            const members = g.members.filter((m) => m.id !== uid)
            await setDoc(doc(db, 'guilds', code), clean({ ...g, members, memberIds: members.filter((m) => !m.isBot).map((m) => m.id) }))
          } catch {
            /* 서버에 못 닿아도 내 기기에서는 나간다 */
          }
        },
      },
      uid,
    )
    if (meSnap.exists() && !getState().user) {
      const d = meSnap.data() as ReturnType<typeof personal>
      applyRemote({ user: d.user, quests: d.quests, daily: d.daily, prefs: d.prefs, streak: d.streak, tutorialDone: d.tutorialDone })
      if (d.guildCode) watchGuild(d.guildCode)
    }

    // 2) 이미 길드가 있으면: 서버에 없을 땐 올리고, 있으면 구독
    const g0 = getState().guild
    if (g0) {
      const remoteSnap = await getDoc(doc(db, 'guilds', g0.code)).catch(() => null)
      if (!remoteSnap || !remoteSnap.exists()) {
        await setDoc(doc(db, 'guilds', g0.code), toRemoteGuild(g0)).catch(() => {})
      }
      watchGuild(g0.code)
    }

    // 3) 내 화면에서 바뀐 건 잠깐 모았다가 서버에 쓰기
    let timer: number | undefined
    const flush = () => {
      const s = getState()
      if (s.user) {
        const pj = JSON.stringify(personal(s))
        if (pj !== lastUser) {
          lastUser = pj
          setDoc(doc(db, 'users', uid), JSON.parse(pj)).catch(() => {})
        }
      }
      if (s.guild) {
        const rg = toRemoteGuild(s.guild)
        const gj = JSON.stringify(rg)
        if (gj !== lastGuild) {
          lastGuild = gj
          setDoc(doc(db, 'guilds', s.guild.code), rg).catch(() => {})
        }
        watchGuild(s.guild.code)
      }
    }
    subscribeState(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(flush, 500)
    })
    flush()
    setStatus('online')
  } catch {
    // 서버에 못 닿으면 혼자 쓰는 데모로
    setRemote(null, null)
    setStatus('offline')
  }
}
