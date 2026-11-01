import { afterEach, describe, expect, it } from 'vitest'
import { loadSgf } from '../sgf'
import { dicts, failureText, setLang, storedLang, t, type Msg } from '.'

const nb = (s: string) => s.replace(/[  ]/g, ' ')

/** Every leaf as [path, value]; functions are leaves too. */
function leaves(o: object, path = ''): [string, unknown][] {
  return Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v) ? leaves(v, `${path}${k}.`) : [[`${path}${k}`, v] as [string, unknown]])
}

describe('dictionaries', () => {
  afterEach(() => setLang('zh'))
  it('keep the result card\'s notes short enough for its two lines', () => {
    const SAID_MAX = 34
    for (const d of Object.values(dicts)) for (const s of [d.mentorStops(0), d.mentorStops(3), d.saved, d.postcardSaved, d.gameResumed,
      d.ritualDone(1), d.ritualDone(365), d.memSaid(288, 361, 12), d.memSaid(1, 61, 1),
      ...['7k', '18k', '25k', '9d'].flatMap(r => [d.autoDone(0, r), d.autoDone(1, r), d.autoDone(12, r)]), d.autoDone(0), d.autoDone(12)])
      expect(s.length, s).toBeLessThanOrEqual(SAID_MAX)
  })
  it('have identical keys, kinds and arities', () => {
    const shape = (o: object) => leaves(o).map(([k, v]) => `${k}:${typeof v}${typeof v === 'function' ? v.length : ''}`).sort()
    expect(shape(dicts.zh)).toEqual(shape(dicts.en))
  })
  it('have no empty strings', () => {
    for (const d of Object.values(dicts)) for (const [k, v] of leaves(d)) if (typeof v === 'string') expect(v.trim(), k).not.toBe('')
  })
  it('switch live', () => {
    setLang('en'); expect(t.pass).toBe('Pass')
    setLang('zh'); expect(t.pass).toBe('停一手')
  })
})

describe('result letters', () => {
  afterEach(() => setLang('zh'))
  const all = ['B+R', 'W+T', 'B+F', 'W+3.5', 'B+0.5', 'b+r', '0', 'Void', '?', 'B+']
  it('stay standard SGF in Chinese and English', () => {
    setLang('zh')
    expect(all.map(t.resultShort)).toEqual(all)
    setLang('en')
    expect(all.map(t.resultShort)).toEqual(all)
  })
})

describe('language setting', () => {
  it('defaults to Traditional Chinese unless chosen otherwise', () => {
    expect(storedLang({})).toBe('zh')
    expect(storedLang({ lang: 'zh', langChosen: true })).toBe('zh')
    expect(storedLang({ lang: 'en', langChosen: true })).toBe('en')
    expect(storedLang({ lang: 'fr', langChosen: true })).toBe('zh')
  })
})

describe('formatting', () => {
  it('Chinese: correct units, punctuation, and terms', () => {
    setLang('zh')
    expect(t.score(-4.5)).toBe('白棋以 4.5 目優勢獲勝。')
    expect(t.score(12)).toBe('黑棋以 12 目優勢獲勝。')
    expect(t.score(0)).toBe('和棋。')
    expect(t.estimate(3.4)).toBe('形勢判斷：黑棋 領先 3.5 目')
    expect(t.estimate(-0.6)).toBe('形勢判斷：白棋 領先 0.5 目')
    expect([0, 1, 2].map(t.captures)).toEqual(['提子 0', '提子 1', '提子 2'])
    expect(t.board(19, 6.5)).toBe('19×19 · 貼目 6.5 目 · 日本規則')
    expect(t.points(81.5)).toBe('81.5 目')
    expect(t.tally(70, 5, 6.5)).toBe('70 實地 · 提子 5 · 貼目 6.5')
    expect(t.clScore(1, 3)).toBe('在 3 手棋中猜中了 1 手')
    expect(t.clEnd(1, 12, null)).toBe('全盤 12 手中您猜中了大師的 1 手！')
    expect(t.tally(70, 1)).toBe('70 實地 · 提子 1')
    expect(t.mb(99_066_230)).toBe('99\u00a0MB')
    expect(t.games(12345)).toBe('12,345 局')
    expect(t.progress(42, '12 MB', '99 MB')).toBe('42% · 12 MB / 99 MB')
    expect(t.month('2026-10-11T00:00:00Z')).toBe('2026年10月')
    expect(t.botName('8k')).toBe('KataGo 擬人圍棋 AI (8k)')
  })
  it('engine tuning progress and the bot passing', () => {
    setLang('en')
    expect(t.engineTuning(3, 40, 120)).toBe('Tuning KataGo for this graphics card (first launch only, a few minutes) · step 3 · 40/120')
    expect(t.engineTuning(0, 0, 0)).toBe('Tuning KataGo for this graphics card (first launch only, a few minutes)')
    expect(t.botPasses(-1)).toBe('White passes. Your move.')
    expect(t.tuningProgress(3, 40, 120)).toBe('step 3 · 40/120')
    expect(t.tuningProgress(0, 0, 63)).toBe('0/63')
    setLang('zh')
    expect(t.engineTuning(3, 40, 120)).toBe('正在針對您的顯示卡進行 OpenCL 自動效能調校（僅首次需要數分鐘） · 步驟 3 · 40/120')
    expect(t.botPasses(-1)).toBe('白棋 停一手。請落子。')
    expect(t.tuningProgress(3, 40, 120)).toBe('步驟 3 · 40/120')
    expect([t.yourMove, t.thinking, t.waiting, t.wins, t.territory]).toEqual(['輪到你下', '思考中…', '等待中', '獲勝', '算地 (形勢判斷)'])
  })
  it('English: decimal point, plurals with 0 plural, MB', () => {
    setLang('en')
    expect(t.score(-4.5)).toBe('White wins by 4.5.')
    expect(t.score(0)).toBe('Draw.')
    expect(t.estimate(3.4)).toBe('Estimate: Black +3.5')
    expect([0, 1, 2].map(t.captures)).toEqual(['0 captures', '1 capture', '2 captures'])
    expect(t.board(19, 6.5)).toBe('19×19 · komi 6.5 · Japanese rules')
    expect(t.points(81.5)).toBe('81.5 points')
    expect(t.clEnd(1, 12, null)).toBe('You found 1 move out of 12.')
    expect(t.tally(70, 5, 6.5)).toBe('70 territory · 5 prisoners · komi 6.5')
    expect(t.tally(70, 1)).toBe('70 territory · 1 prisoner')
    expect([t.yourMove, t.thinking, t.passed, t.resigned, t.wins, t.territory]).toEqual(['Your move', 'thinking…', 'passed', 'resigned', 'wins', 'Light and shadow'])
    expect(t.mb(99_066_230)).toBe('99\u00a0MB')
    expect(t.games(12345)).toBe('12,345 games')
    expect(t.progress(42, '12 MB', '99 MB')).toBe('42% · 12 MB / 99 MB')
    expect(t.month('2026-10-11T00:00:00Z')).toBe('Oct 2026')
    expect(t.botName('8k')).toBe('KataGo human 8k')
    expect(() => loadSgf('(;SZ[30])')).toThrow('Unsupported board size: 30')
  })
  it('maps Rust error codes to text in both languages', () => {
    setLang('zh')
    expect(failureText({ code: 'hash_mismatch' })).toContain('SHA-256')
    expect(failureText({ code: 'engine_crashed', detail: 'Metal error' })).toBe('KataGo 引擎異常結束。 (Metal error)')
    setLang('en')
    expect(failureText({ code: 'engine_crashed', detail: 'Metal error' })).toBe('KataGo stopped unexpectedly. (Metal error)')
    expect(failureText({ code: 'new_code' })).toBe('new_code')
    expect(failureText({ code: 'constructor' })).toBe('constructor')
    expect(failureText(new Error('x'))).toBe('x')
  })
})

describe('game review', () => {
  afterEach(() => setLang('zh'))
  it('formats points, moves and colours in both languages', () => {
    setLang('en')
    expect(t.moment(1, 3, 47, 6.54)).toBe('Moment 1/3 · move 47 · −6.5 points')
    expect([t.shortOf(1.23), t.shortOf(1)]).toEqual(['1.2 points from the best punishment.', '1 point from the best punishment.'])
    expect(t.tryAsk(-1, 47)).toBe('Play White: how do you punish move 47?')
    expect(t.noMoments(1)).toBe('No move by Black lost 2 points or more.')
    setLang('zh')
    expect(t.moment(1, 3, 47, 6.54)).toBe('關鍵轉折 1/3 · 第 47 手 · 虧損 6.5 目')
    expect([t.shortOf(1.23), t.shortOf(1)]).toEqual(['下法不錯，但距離最佳懲罰手段仍差 1.2 目。', '下法不錯，但距離最佳懲罰手段仍差 1 目。'])
    expect(t.tryAsk(-1, 47)).toBe('輪到白棋下：面對第 47 手的失誤，你該如何嚴懲對手？')
    expect(t.noMoments(0)).toBe('整盤棋沒有虧損達 2 目以上的顯著失誤。')
  })
})

describe('exercises', () => {
  afterEach(() => setLang('zh'))
  it('words progress, phases and help in both languages', () => {
    setLang('en')
    expect([t.exProgress(1, 0, 0), t.exProgress(2, 3, 4), t.exProgress(0, 0, 1)]).toEqual(['1 exercise due', '2 exercises due · 3 new today · 4 from tomorrow', '1 from tomorrow'])
    expect([t.exLost(3.6), t.exLost(0.4)]).toEqual(['−4', '0'])
    expect(t.exAsk(1, 'G4', 5)).toBe('Black to play. G4 (×) lost 5 points in the game: find better.')
    expect(t.exWhereHelp(1)).toMatch(/over your last reviewed game\./)
    expect([t.exPerGame(3.6, 47.4), t.exPerGame(1.2, 100)]).toEqual(['−4 points per game · 47% of what you lose', '−1 point per game · 100% of what you lose'])
    expect([t.exKept(1), t.exKept(3)]).toEqual(['This moment is saved to your exercises (E).', 'These moments are saved to your exercises (E).'])
    setLang('zh')
    expect([t.exProgress(1, 1, 0), t.exProgress(2, 3, 4)]).toEqual(['今日待複習 1 題 · 新題目 1 題', '今日待複習 2 題 · 新題目 3 題 · 明日待做 4 題'])
    expect(t.exPerGame(3.6, 47.4)).toBe('平均每盤虧損 4 目 · 占總失誤的 47%')
    expect(t.exAsk(-1, null, 2)).toBe('輪到白棋走棋。實戰走 停一手 虧損了 2 目：請找出正解好手！')
  })
})

describe('OGS', () => {
  afterEach(() => setLang('zh'))
  it('words results, searches and clocks in both languages', () => {
    setLang('en')
    expect([t.ogsResult(-1, 'resign'), t.ogsResult(1, 'time'), t.ogsResult(-1, 'score', 4.5), t.ogsResult(1, 'forfeit'), t.ogsResult(0, 'cancel')])
      .toEqual(['White wins by resignation.', 'Black wins on time.', 'White wins by 4.5 points.', 'Black wins by forfeit.', 'Game cancelled.'])
    expect([t.ogsResult(0, 'score', 0), t.ogsResult(0, 'score', 4.5), t.ogsResult(0, 'resign')]).toEqual(['Draw.', 'Game over.', 'Game over.'])
    expect([nb(t.periods(3, 30)), nb(t.days(2, 4))]).toEqual(['3×30 s', '2 d 4 h'])
    expect(t.periods(3, 30) + t.days(2, 4)).not.toMatch(/ /)
    expect(t.ogsSearching(9, t.paces.blitz)).toBe('Looking for a 9×9 blitz opponent…')
    expect(t.ogsBoard(19, 6.5, t.rules.chinese)).toBe('19×19 · komi 6.5 · Chinese rules · OGS')
    setLang('zh')
    expect([t.ogsResult(-1, 'resign'), t.ogsResult(1, 'time'), t.ogsResult(-1, 'score', 4.5), t.ogsResult(1, 'forfeit'), t.ogsResult(0, 'cancel')])
      .toEqual(['白棋勝 中盤勝。', '黑棋勝 超時勝。', '白棋勝 4.5 目勝。', '黑棋勝 對方棄權。', '對局已取消。'])
    expect([t.ogsResult(0, 'score', 0), t.ogsResult(0, 'resign')]).toEqual(['和棋。', '對局結束。'])
    expect(t.ogsSearching(9, t.paces.blitz)).toBe('正在搜尋 9×9 路 超快棋 (Blitz) 對手…')
  })
})

describe('stored messages', () => {
  afterEach(() => setLang('zh'))
  const caught = (f: () => unknown) => { try { f() } catch (e) { return e } }
  it('render in the language current at display time, not at creation', () => {
    setLang('en')
    const sgfError = caught(() => loadSgf('(;SZ[30])'))
    const msgs: Msg[] = [
      d => d.score(-6.5),
      d => d.botFailed(failureText({ code: 'engine_stopped' }, d)),
      d => d.openFailed(failureText(sgfError, d)),
      d => d.fellBack,
    ]
    const en = msgs.map(m => m(t))
    expect(en[0]).toBe('White wins by 6.5.')
    expect(en[1]).toBe('The AI can’t play right now. The engine is stopped.')
    expect(en[2]).toBe('Couldn’t open this file: Unsupported board size: 30')
    setLang('zh')
    const zh = msgs.map(m => m(t))
    expect(zh[0]).toBe('白棋以 6.5 目優勢獲勝。')
    expect(zh[1]).toBe(dicts.zh.botFailed(dicts.zh.failures.engine_stopped))
    expect(zh[2]).toBe(dicts.zh.openFailed(dicts.zh.sgfBadSize('30')))
    expect(zh[3]).toBe(dicts.zh.fellBack)
    expect(zh.some((s, i) => s === en[i])).toBe(false)
  })
})
