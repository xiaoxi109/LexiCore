import { PRE_A1 } from './preA1'
import { A1 } from './a1'
import { A2 } from './a2'
import { B1 } from './b1'
import { B2 } from './b2'
import { EXTENSION } from './extension'
import { CATEGORIES, categoryOf, isCommon } from './generated/categories'
import { CATEGORY_THEMES, WORD_THEME } from './themes'
import type { Level, LevelMeta, Word, CategoryId, CategoryMeta } from './types'

export { PRE_A1, A1, A2, B1, B2, EXTENSION, CATEGORIES }
export type { Level, LevelMeta, Word, CategoryId }

/** All words ordered Pre-A1 → A1 → A2 → B1 → B2, INCLUDING supplementary words
 *  folded into their CEFR level (flagged `extended`). Those folded words ARE counted
 *  in the per-level / total statistics. */
const RAW_WORDS: Word[] = [
  ...PRE_A1, ...A1, ...A2, ...B1, ...B2,
  // 扩展词（LexiCore 补充词表）全部归入对应 CEFR 级别，参与统计与浏览。
  ...EXTENSION,
]

/** De-duplicated by lowercase word (keeps first occurrence / lowest level) + scene category attached. */
const seen = new Set<string>()
export const ALL_WORDS: Word[] = RAW_WORDS.filter((w) => {
  const k = w.word.toLowerCase()
  if (seen.has(k)) return false
  seen.add(k)
  return true
}).map((w) => ({
  ...w,
  category: categoryOf(w.word),
  common: isCommon(w.word),
}))

// 注：扩展词已通过上面的 `...EXTENSION` 全部并入 ALL_WORDS，不再有独立的扩展包。
// 它们按各自的 level 归入对应分级，参与全部统计与浏览展示。

/**
 * Group words by scene category, and within each category further group them
 * by theme so related words sit together (e.g. 季节/春夏秋冬, 天气/晴雨雪风).
 * Categories with no matching words are omitted.
 */
export interface ThemeGroup {
  id: string
  label: string
  items: Word[]
}

export interface CategoryGroup {
  category: CategoryMeta
  themes: ThemeGroup[]
  count: number
}

function sortWords(arr: Word[]): Word[] {
  return arr.sort((a, b) => {
    // 常用词优先，其次按字母序，便于关联记忆与重点突破
    if (!!a.common !== !!b.common) return a.common ? -1 : 1
    return a.word.localeCompare(b.word)
  })
}

/** Group words by scene category, preserving the canonical category order. */
export function groupByCategory(words: Word[]): CategoryGroup[] {
  const map = new Map<CategoryId, Word[]>()
  for (const w of words) {
    const id = w.category ?? 'thinking'
    if (!map.has(id)) map.set(id, [])
    map.get(id)!.push(w)
  }

  const result: CategoryGroup[] = []
  for (const c of CATEGORIES) {
    const items = map.get(c.id)
    if (!items || items.length === 0) continue

    const defs = CATEGORY_THEMES[c.id] ?? []
    const buckets = new Map<string, Word[]>()
    for (const d of defs) buckets.set(d.id, [])
    const other: Word[] = []

    for (const w of items) {
      const th = WORD_THEME[w.word]
      if (th && buckets.has(th)) buckets.get(th)!.push(w)
      else other.push(w)
    }

    const themes: ThemeGroup[] = []
    for (const d of defs) {
      const arr = buckets.get(d.id)!
      if (arr.length) themes.push({ id: d.id, label: d.label, items: sortWords(arr) })
    }
    // 未归入任何主题的单词：若本场景定义了主题则放入"其他"，否则直接平铺
    if (other.length) {
      themes.push({ id: 'other', label: defs.length ? '其他' : '', items: sortWords(other) })
    }

    result.push({ category: c, themes, count: items.length })
  }
  return result
}

export const LEVELS: LevelMeta[] = [
  { id: 'Pre-A1', label: 'Pre-A1', desc: '最基础 · 起步词汇', accent: 'emerald' },
  { id: 'A1', label: 'A1', desc: '基础 · 日常必备', accent: 'sky' },
  { id: 'A2', label: 'A2', desc: '进阶 · 表达更丰富', accent: 'violet' },
  { id: 'B1', label: 'B1', desc: '中级 · 独立运用', accent: 'amber' },
  { id: 'B2', label: 'B2', desc: '中高级 · 流利表达', accent: 'rose' },
]

// 各级词数：从 ALL_WORDS 统计，已包含归入级别的扩展词。
const COUNT: Record<Level, number> = { 'Pre-A1': 0, A1: 0, A2: 0, B1: 0, B2: 0 }
for (const w of ALL_WORDS) COUNT[w.level]++

export function countByLevel(level: Level): number {
  return COUNT[level]
}

export const TOTAL = ALL_WORDS.length
