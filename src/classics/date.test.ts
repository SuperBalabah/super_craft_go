import { afterEach, describe, expect, it } from 'vitest'
import { setLang } from '../i18n'
import { dateText } from './useClassics'

describe('a classic game\'s date', () => {
  afterEach(() => setLang('zh'))
  it('formats dates in Traditional Chinese and English', () => {
    setLang('zh')
    expect(dateText('1851-12-01')).toBe('1851年12月1日')
    expect(dateText('1846-09-11')).toBe('1846年9月11日')
    expect(dateText('1835-12')).toBe('1835年12月')
    setLang('en')
    expect(dateText('1851-12-01')).toBe('1 December 1851')
  })
})
