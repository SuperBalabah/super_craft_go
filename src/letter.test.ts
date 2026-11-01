import { describe, expect, it } from 'vitest'
import { en } from './i18n/en'
import { zh } from './i18n/zh'
import type { Event } from './journal'
import { letterLines, loadCounts, monthFacts, months, type Sources } from './letter'
import type { Entry } from './library'
import type { Read } from './rank'

const at = (d: number, m = 9, h = 12) => new Date(2026, m, d, h).getTime() // October 2026 by default
const side = { name: '', rank: '' }
const entry = (id: string, date: number, source: Entry['source'], me: Entry['me'], result?: string): Entry =>
  ({ id, date, source, me, size: 19, komi: 6.5, handicap: 0, black: side, white: side, ...result && { result } })
const read = (t: number, all: number): Read => ({ k: String(t), t, all, n: 100, phases: [null, null, null] })
const ev = (t: number, k: Event['k'], ok: boolean, id?: string): Event => ({ t, k, ok, ...id && { id } })

const fixture: Sources = {
  entries: [
    entry('ai-1', at(2), 'ai', 1, 'B+R'), entry('ai-2', at(5), 'ai', -1, 'B+4.5'), entry('ai-3', at(9), 'ai', -1, 'W+R'),
    entry('ai-4', at(12), 'ai', 1), // unfinished: played, not counted in the wins
    entry('ogs-7', at(3), 'ogs', 1, 'W+T'), entry('two-1', at(4), 'two', 0, 'B+R'), { ...entry('file-x', new Date(2019, 4, 3).getTime(), 'file', 1, 'B+R'), added: at(6) }, // a 2019 file, reviewed in October
    entry('ai-0', at(28, 8), 'ai', 1, 'B+R'), // September
  ],
  ranks: [read(at(20, 8), 14), read(at(3), 14), read(at(10), 16)], // 6k before October, then 5k-ish readings
  played: [{ k: 'a', t: at(5), loss: [3, 12, 4] }, { k: 'b', t: at(9), loss: [1, 8, 2] }, { k: 'c', t: at(20, 8), loss: [30, 0, 0] }],
  counts: [{ t: at(2), err: 2 }, { t: at(3), err: 5 }, { t: at(4), err: 3 }, { t: at(30, 8), err: 20 }],
  journal: [
    ev(at(25, 8), 'joseki', true, 'j1'), // learned in September
    ev(at(2), 'joseki', true, 'j1'), ev(at(2), 'joseki', false, 'j2'), ev(at(3), 'joseki', true, 'j2'), ev(at(4), 'joseki', true, 'j3'),
    ev(at(5), 'fuseki', true, 'f1'),
    ev(at(6), 'tsumego', true, 't1'), ev(at(7), 'tsumego', true, 't1'), ev(at(7), 'tsumego', false, 't2'), ev(at(8), 'tsumego', true, 't3'),
    ...[1, 2, 3, 6, 7].map(d => ev(at(d, 9, 21), 'ritual', true)), ev(at(30, 8, 21), 'ritual', true),
  ],
}

describe('the facts of a month', () => {
  it('reads October 2026 from the library, the decks, the rank readings, the counting store and the journal', () => {
    expect(monthFacts(2026, 9, fixture)).toEqual({
      played: { ai: 4, ogs: 1, two: 1, position: 0 }, files: 1,
      wins: { won: 2, of: 3 }, // B+R as Black, W+R as White; B+4.5 as White is a loss
      rank: { from: 14, to: (14 + 14 + 16) / 3 }, // the rank before the month (6k), then the local rank at its end (5k)
      phase: { p: 1, lost: 10 },
      joseki: 2, fuseki: 1, // j1 was learned in September; j2 failed first, then came right
      tsumego: 2, // t1 twice is one problem
      counting: { n: 3, err: 3 },
      ritual: { days: 5, run: 3 },
    })
  })
  it('counts a file when it entered the library; an older file with no such date is left out, months included', () => {
    const old = entry('file-y', new Date(2019, 4, 3).getTime(), 'file', 1)
    expect(months({ ...fixture, entries: [old] }, at(15))).toEqual(months({ ...fixture, entries: [] }, at(15)))
    expect(monthFacts(2026, 9, { ...fixture, entries: [old] }).files).toBe(0)
  })
  it('a month without anything says only so, in both languages', () => {
    const f = monthFacts(2026, 7, fixture)
    expect(letterLines(f, zh)).toEqual(['本月暫無統計紀錄。'])
    expect(letterLines(f, en)).toEqual(['Nothing this month.'])
  })
  it('a month without a game says only so, whatever else it held', () => {
    const quiet: Sources = { entries: [], played: [], ranks: [], counts: [{ t: at(2), err: 2 }], journal: [ev(at(6), 'tsumego', true, 't1'), ev(at(2, 9, 21), 'ritual', true)] }
    expect(letterLines(monthFacts(2026, 9, quiet), zh)).toEqual(['本月暫無統計紀錄。'])
  })
  it('a game reviewed in October but played in September counts where it was played', () => {
    const late: Sources = { ...fixture, played: [{ k: 'a', t: at(5), loss: [3, 12, 4] }, { k: 'z', t: at(6), d: at(28, 8), loss: [40, 0, 0] }] }
    expect(monthFacts(2026, 9, late).phase).toEqual({ p: 1, lost: 12 })
    expect(monthFacts(2026, 8, late).phase).toEqual({ p: 0, lost: 40 })
  })
  it('a first month takes its rank from its own first reading', () => {
    expect(monthFacts(2026, 8, fixture).rank).toEqual({ from: 14, to: 14 })
  })
  it('lists this month first, then back to the oldest with anything in it', () => {
    expect(months(fixture, at(14))).toEqual([{ y: 2026, m: 9 }, { y: 2026, m: 8 }])
    expect(months({ ...fixture, entries: [entry('old', new Date(2025, 0, 5).getTime(), 'ai', 1)] }, at(14), 12)).toHaveLength(12)
    expect(months({ entries: [], journal: [], played: [], ranks: [], counts: [] }, at(14))).toEqual([{ y: 2026, m: 9 }])
  })
})

describe('the letter, sentence by sentence', () => {
  it('says October 2026 in Chinese, one sentence per fact', () => {
    expect(letterLines(monthFacts(2026, 9, fixture), zh)).toEqual([
      '您共下了 6 盤棋：包括 與 AI 對弈 4 盤、在 OGS 網棋對戰 1 盤、雙人對局 1 盤。',
      '您回顧了本機的 1 份歷史棋譜。',
      '在與 AI 的 3 盤戰鬥中，贏得了 2 場勝利。',
      '您的 AI 段位從 6k 穩步躍升至 5k！',
      '您失誤最頻繁的階段是中盤階段：平均每盤失分約 10 目。',
      '您掌握了 2 個全新定石變化。',
      '您研習了 1 種大局布局走法。',
      '您攻克了解答了 2 道實戰死活題。',
      '您完成了 3 次盤面點目練習，評估通常誤差在 3 目以內。',
      '您本月共修行 5 天，最高連續堅持 3 天。',
    ])
  })
  it('says it in English', () => {
    expect(letterLines(monthFacts(2026, 9, fixture), en)).toEqual([
      'You played 6 games: 4 against the AI, 1 on OGS and 1 between two players.',
      'You went back over a game from a file.',
      'Against the AI, you won 2 of 3 games.',
      'Your rank read in your moves went from 6k to 5k.',
      'Your points went mostly in the middle game: 10 points per game.',
      'You learned 2 new joseki sequences.',
      'You learned a new fuseki.',
      'You solved 2 tsumego.',
      'You counted 3 positions, usually within 3 points.',
      'You did the ritual on 5 days, up to 3 in a row.',
    ])
  })
  it('singular and plural in Chinese and English', () => {
    const one = { ai: 1, ogs: 0, two: 0, position: 0 }
    expect(zh.letter.played(one)).toBe('您與 AI 對弈共下了 1 盤棋。')
    expect(en.letter.played({ ...one, ai: 3 })).toBe('You played 3 games against the AI.')
    expect(zh.letter.files(2)).toBe('您回顧了本機的 2 份歷史棋譜。')
    expect(zh.letter.wins(1, 1)).toBe('您在與 AI 的對決中取得勝利。')
    expect(en.letter.wins(0, 1)).toBe('You lost your game against the AI.')
    expect(en.letter.wins(0, 2)).toBe('Against the AI, no win in 2 games.')
    expect(zh.letter.rank('5k', '5k')).toBe('您的 AI 實戰段位評定穩定在 5k。')
    expect(zh.letter.joseki(1)).toBe('您掌握了 1 個全新定石變化。')
    expect(en.letter.joseki(1)).toBe('You learned a new joseki sequence.')
    expect(zh.letter.fuseki(3)).toBe('您研習了 3 種大局布局走法。')
    expect(zh.letter.tsumego(1)).toBe('您攻克了解答了 1 道實戰死活題。')
    expect(en.letter.tsumego(1)).toBe('You solved a tsumego.')
    expect(en.letter.counting(4, 0.2)).toBe('You counted 4 positions, usually to the point.')
    expect(zh.letter.ritual(1, 1)).toBe('您堅持了 1 天的每日修行。')
    expect(zh.letter.ritual(4, 4)).toBe('您已連續堅持每日修煉達 4 天！')
    expect(en.letter.ritual(3, 1)).toBe('You did the ritual on 3 days.')
  })
  it('titles the month', () => {
    expect(zh.letter.title(2026, 9)).toBe('2026 年 10 月棋力成長手札')
    expect(en.letter.title(2026, 9)).toBe('October 2026')
    expect(zh.letter.fileName(2026, 9)).toBe('masame-letter-2026-10.png')
  })
})

describe('the counting store', () => {
  it('reads its answers, and nothing from garbage', () => {
    const st = (v: string | null) => ({ getItem: () => v })
    expect(loadCounts(st(JSON.stringify({ v: 1, errs: [{ t: 1, err: 2 }, { t: 'x', err: 1 }] })))).toEqual([{ t: 1, err: 2 }])
    expect(loadCounts(st('{'))).toEqual([])
    expect(loadCounts(st(null))).toEqual([])
  })
})
