import { ALL_WORDS } from './index'
import { WORD_CATEGORY } from './generated/categories'
import type { Level, Word, CategoryId } from './types'
import { PEP_GRADE_WORDS, type PepWord } from './pepGrades'
import { PEP_ENRICH } from './pepEnrich'

/** 取人教词的场景分类：优先主词库自带，否则从 WORD_CATEGORY 字典查。 */
const categoryOf = (en: string, fallback?: CategoryId): CategoryId => fallback ?? WORD_CATEGORY[en] ?? 'thinking'

/** 人教版教材分级：小学 / 初一~初三 / 高一~高三（共 7 段）。 */
export type GradeId = 'primary' | 'g7' | 'g8' | 'g9' | 'g10' | 'g11' | 'g12'

export interface GradeMeta {
  id: GradeId
  label: string
  desc: string
}

export const GRADES: GradeMeta[] = [
  { id: 'primary', label: '小学', desc: '三年级起点 · 基础起步' },
  { id: 'g7', label: '初一', desc: '七年级 · 入门表达' },
  { id: 'g8', label: '初二', desc: '八年级 · 日常拓展' },
  { id: 'g9', label: '初三', desc: '九年级 · 中考必备' },
  { id: 'g10', label: '高一', desc: '必修 · 独立运用' },
  { id: 'g11', label: '高二', desc: '选择性必修 · 进阶' },
  { id: 'g12', label: '高三', desc: '总复习 · 流利表达' },
]

/** 各年级配色（Tailwind 字面类，供进度条 / 圆点使用）。 */
export const GRADE_STYLE: Record<GradeId, { badge: string; dot: string; bar: string }> = {
  primary: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  g7: { badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', dot: 'bg-sky-500', bar: 'bg-sky-500' },
  g8: { badge: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300', dot: 'bg-violet-500', bar: 'bg-violet-500' },
  g9: { badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300', dot: 'bg-indigo-500', bar: 'bg-indigo-500' },
  g10: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  g11: { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300', dot: 'bg-orange-500', bar: 'bg-orange-500' },
  g12: { badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', dot: 'bg-rose-500', bar: 'bg-rose-500' },
}

const norm = (s: string) => s.toLowerCase().normalize('NFKC').replace(/[^a-z0-9'-]/g, '')

const WORD_BY_NORM = new Map<string, Word>()
for (const w of ALL_WORDS) WORD_BY_NORM.set(norm(w.word), w)

/** 各年级映射到 CEFR 难度，仅用于 PEP 专有词（不在主词库）做兜底 level。 */
const GRADE_LEVEL: Record<GradeId, Level> = {
  primary: 'Pre-A1',
  g7: 'A1',
  g8: 'A2',
  g9: 'A2',
  g10: 'B1',
  g11: 'B1',
  g12: 'B2',
}

/**
 * 判定是否为「人名」专有名词：中文释义含 人名 / 女子名 / 男子名 / [人名] 标记，
 * 但排除 国家名 / 城市名 / 州名 / 地名 / 河流名 / 首都 等地理专有名词。
 * 用于在分级词表中剔除教材角色名（Alice、Tom、Mary …）。
 */
function isPersonName(zh: string): boolean {
  if (!zh) return false
  if (/国家名|城市名|州名|地名|河流名|首都/.test(zh)) return false
  return /人名|女子名|男子名|\[人名\]/.test(zh)
}

/**
 * 年级词表 = 真实人教版（PEP）逐册词汇本身，不依赖 Oxford 3000 体系。
 * 每个 PEP 单词：
 *   - 若命中主词库 → 仅复用其 音标 / 词性 / 释义 / 例句（去掉牛津体系的 category / level / extended 标记）；
 *   - 若命中不到（人教版专有词）→ 用 PEP 自带 phonetic + zh 兜底，examples 为空。
 * 同时剔除「人名」专有名词（教材角色名）。
 * 同一单词若在多册重复出现，归入其**首次出现**的年级（小学 → 高三 顺序）。
 *
 * 数据来源：cyforkk/pep-english-words（人教版 PEP 词库，MIT），由生成脚本从逐册
 * JSON 聚合并写入 `pepGrades.ts`。
 */
export function wordsByGrade(): Record<GradeId, Word[]> {
  const out: Record<GradeId, Word[]> = {
    primary: [],
    g7: [],
    g8: [],
    g9: [],
    g10: [],
    g11: [],
    g12: [],
  }
  const assigned = new Set<string>()
  for (const g of GRADES) {
    for (const pw of PEP_GRADE_WORDS[g.id] as PepWord[]) {
      const key = norm(pw.en)
      if (assigned.has(key)) continue
      assigned.add(key)
      if (isPersonName(pw.zh)) continue
      const full = WORD_BY_NORM.get(key)
      if (full) {
        out[g.id].push({
          word: full.word,
          level: GRADE_LEVEL[g.id],
          ipa: full.ipa,
          pos: full.pos,
          meaning: full.meaning,
          examples: full.examples,
          category: categoryOf(full.word, full.category),
          pepOnly: false,
          grade: g.id,
        })
      } else {
        const en = pw.en
        const enrich = PEP_ENRICH[en]
        out[g.id].push({
          word: en,
          level: GRADE_LEVEL[g.id],
          ipa: enrich?.ipa || pw.phonetic,
          pos: '',
          meaning: pw.zh || en,
          examples: enrich?.examples ?? [],
          category: categoryOf(en),
          pepOnly: true,
          grade: g.id,
        })
      }
    }
  }
  return out
}
