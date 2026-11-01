// The current language and its dictionary. `t` is a live ES binding: setLang swaps it, and importers see the new
// dictionary on their next read. App keeps the language in its settings state, so a switch re-renders the whole UI.
import { en, type Dict } from './en'
import { zh } from './zh'

export type Lang = 'zh' | 'en'
export type { Dict }
export const dicts: Record<Lang, Dict> = { zh, en }
export const isLang = (x: unknown): x is Lang => x === 'zh' || x === 'en'

/** URL Query Parameter (?lang=en or ?lang=zh) takes explicit precedence for admissions preview */
export function detectUrlLang(): Lang | null {
  try {
    if (typeof window !== 'undefined' && window.location) {
      const q = new URLSearchParams(window.location.search).get('lang')
      if (q) {
        const lower = q.toLowerCase()
        if (lower === 'en' || lower === 'en-us') return 'en'
        if (lower === 'zh' || lower === 'zh-tw' || lower === 'zh-cn') return 'zh'
      }
    }
  } catch {}
  return null
}

/** Traditional Chinese unless the user picked English in the UI or URL specifies it. */
export const storedLang = (s: { lang?: unknown; langChosen?: unknown }): Lang => {
  const urlLang = detectUrlLang()
  if (urlLang) return urlLang
  return (s.langChosen === true && isLang(s.lang) ? s.lang : 'zh')
}

export let lang: Lang = detectUrlLang() ?? 'zh'
export let t: Dict = dicts[lang]

export function setLang(l: Lang) {
  lang = l
  t = dicts[l]
  if (typeof document !== 'undefined') document.documentElement.lang = l === 'zh' ? 'zh-TW' : 'en'
}
setLang(lang)

/** Text of a keyed map entry (refusals, net labels, sections), or undefined for an unknown key. */
export const pick = (map: object, key: string): string | undefined => Object.hasOwn(map, key) ? (map as Record<string, string>)[key] : undefined

/** A message kept untranslated: App stores these and renders them with the current dictionary at display time, so a
 *  language switch re-translates what is already on screen. */
export type Msg = (d: Dict) => string

/** An Error whose text follows the language: failureText renders it with the dictionary it is given. */
export class LocalizedError extends Error {
  constructor(readonly text: Msg) { super(text(t)) }
}

/** Text for anything thrown by an invoke (a Rust `Failure`) or by our own code. */
export function failureText(e: unknown, d: Dict = t): string {
  if (e instanceof LocalizedError) return e.text(d)
  const f = e as { code?: unknown; detail?: unknown; message?: unknown }
  if (typeof f?.code === 'string') {
    const base = pick(d.failures, f.code) ?? f.code
    return typeof f.detail === 'string' && f.detail ? `${base} (${f.detail})` : base
  }
  return typeof f?.message === 'string' ? f.message : String(e)
}
