import { useEffect, useMemo, type ReactNode } from 'react'
import { CATEGORIES, groupByCategory } from '../data'
import type { CategoryId, Level, Word } from '../data'
import { GRADE_STYLE, GRADES } from '../data/grades'
import { useSpeech } from '../hooks/useSpeech'
import { CheckIcon, SearchIcon, SpeakerIcon, XIcon } from './icons'

export const LEVEL_STYLE: Record<Level, { badge: string; dot: string }> = {
  'Pre-A1': { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', dot: 'bg-emerald-500' },
  A1: { badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', dot: 'bg-sky-500' },
  A2: { badge: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300', dot: 'bg-violet-500' },
  B1: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', dot: 'bg-amber-500' },
  B2: { badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', dot: 'bg-rose-500' },
}

// 年级徽标：人教词表显示「小学 / 初一 / 初二 …」而非 CEFR 等级。
const GRADE_LABEL: Record<string, string> = Object.fromEntries(GRADES.map((g) => [g.id, g.label]))

export function GradeBadge({ grade }: { grade: string }) {
  const s = GRADE_STYLE[grade as keyof typeof GRADE_STYLE]
  if (!s) return null
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {GRADE_LABEL[grade] ?? grade}
    </span>
  )
}

// Scene category accent dots (used in grouped section headers).
export const CAT_DOT: Record<CategoryId, string> = {
  people: 'bg-pink-500',
  body: 'bg-rose-500',
  health: 'bg-red-400',
  clothes: 'bg-fuchsia-500',
  food: 'bg-orange-500',
  home: 'bg-indigo-500',
  animals: 'bg-amber-500',
  nature: 'bg-green-500',
  space: 'bg-cyan-500',
  time: 'bg-violet-500',
  numbers: 'bg-red-500',
  colors: 'bg-purple-500',
  size: 'bg-teal-500',
  actions: 'bg-lime-500',
  emotions: 'bg-rose-400',
  communication: 'bg-sky-400',
  education: 'bg-teal-400',
  work: 'bg-emerald-500',
  travel: 'bg-cyan-400',
  shopping: 'bg-amber-600',
  society: 'bg-slate-500',
  science: 'bg-emerald-600',
  media: 'bg-rose-500',
  arts: 'bg-fuchsia-600',
  thinking: 'bg-indigo-400',
  grammar: 'bg-slate-400',
  questions: 'bg-blue-500',
  toys: 'bg-yellow-500',
}

export function LevelBadge({ level }: { level: Level }) {
  const s = LEVEL_STYLE[level]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {level}
    </span>
  )
}

export function SpeakerBtn({ text, className = '', rate }: { text: string; className?: string; rate?: number }) {
  const { speak, speaking, loading, preload, downloadStatus } = useSpeech()
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation()
        // 模型未就绪时先初始化（首次点击可能加载中，第二次必响）
        if (downloadStatus !== 'ready') {
          try {
            await preload()
          } catch {
            /* ignore */
          }
        }
        speak(text, rate)
      }}
      title={loading ? '正在加载语音模型…' : '发音'}
      className={`inline-flex items-center justify-center rounded-full p-2 text-brand-600 transition hover:bg-brand-50 hover:text-brand-700 active:scale-95 dark:text-brand-300 dark:hover:bg-brand-500/10 ${
        speaking || loading ? 'animate-pulse' : ''
      } ${className}`}
    >
      <SpeakerIcon width={18} height={18} />
    </button>
  )
}

/* ----------------------------- Browse card ----------------------------- */
export function WordCard({
  word,
  mastered,
  onOpen,
  onToggleMastered,
}: {
  word: Word
  mastered: boolean
  onOpen: () => void
  onToggleMastered: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex flex-col items-start gap-1 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-brand-500/50"
    >
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {word.grade ? <GradeBadge grade={word.grade} /> : <LevelBadge level={word.level} />}
          {word.common && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              常用
            </span>
          )}
        </div>
        <span
          role="button"
          tabIndex={0}
          title={mastered ? '已掌握' : '标记为已掌握'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleMastered()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              onToggleMastered()
            }
          }}
          className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
            mastered
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-slate-300 text-transparent hover:border-emerald-400 dark:border-slate-600'
          }`}
        >
          <CheckIcon width={14} height={14} />
        </span>
      </div>
      <div className="mt-1 flex w-full min-w-0 items-baseline justify-between gap-2">
        <span className="min-w-0 break-words text-lg font-bold text-slate-800 dark:text-slate-100">{word.word}</span>
        <SpeakerBtn text={word.word} />
      </div>
      <span className="text-sm text-slate-400 dark:text-slate-500">{word.ipa}</span>
      <span className="line-clamp-1 text-sm text-slate-600 dark:text-slate-300">{word.meaning}</span>
    </button>
  )
}

/* ----------------------------- Detail modal ----------------------------- */
export function WordDetail({
  word,
  mastered,
  onClose,
  onToggleMastered,
}: {
  word: Word
  mastered: boolean
  onClose: () => void
  onToggleMastered: () => void
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-scale-in dark:bg-slate-800 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700 sm:px-6">
          <div className="flex items-center gap-2">
            {word.grade ? <GradeBadge grade={word.grade} /> : <LevelBadge level={word.level} />}
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700">
            <XIcon width={20} height={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="break-words text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">{word.word}</h2>
              <p className="mt-1 text-slate-400 dark:text-slate-500">{word.ipa}</p>
            </div>
            <SpeakerBtn text={word.word} rate={0.85} className="h-12 w-12 bg-brand-50 dark:bg-brand-500/10" />
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/40">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              {word.pos && (
                <span className="rounded-md bg-white px-2 py-0.5 font-mono text-xs shadow-sm dark:bg-slate-800">{word.pos}</span>
              )}
              <span className="text-base font-semibold text-slate-800 dark:text-slate-100">{word.meaning}</span>
            </div>
          </div>

          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">例句</p>
          {word.examples.length > 0 ? (
            <ul className="space-y-3">
              {word.examples.map((ex, i) => (
                <li key={i} className="rounded-xl border border-slate-100 p-3 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-slate-800 dark:text-slate-100">{ex.en}</p>
                    <SpeakerBtn text={ex.en} rate={0.9} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{ex.zh}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 py-4 text-center text-sm text-slate-400 dark:border-slate-700">
              暂无例句（人教版补充词）
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-100 px-5 py-4 dark:border-slate-700 sm:px-6">
          <button
            onClick={onToggleMastered}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold transition ${
              mastered
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            <CheckIcon width={18} height={18} />
            {mastered ? '已掌握 · 点击取消' : '标记为已掌握'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${accent ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-100'}`}>{value}</p>
    </div>
  )
}

export function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-brand-600 text-white shadow-sm'
          : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  )
}

/* Configurable filter bar reused by Home and Unmastered list views. */
export function FilterBar({
  levelFilter,
  setLevelFilter,
  catFilter,
  setCatFilter,
  commonOnly,
  setCommonOnly,
  search,
  setSearch,
  showMasterChips = false,
  showUnmastered,
  setShowUnmastered,
  showMastered,
  setShowMastered,
  hideLevel = false,
  hideCategory = false,
}: {
  levelFilter: Level | 'all'
  setLevelFilter: (v: Level | 'all') => void
  catFilter: CategoryId | 'all'
  setCatFilter: (v: CategoryId | 'all') => void
  commonOnly: boolean
  setCommonOnly: (v: boolean) => void
  search: string
  setSearch: (v: string) => void
  showMasterChips?: boolean
  showUnmastered?: boolean
  setShowUnmastered?: (v: boolean) => void
  showMastered?: boolean
  setShowMastered?: (v: boolean) => void
  hideLevel?: boolean
  hideCategory?: boolean
}) {
  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {!hideLevel && (
            <>
              <FilterChip active={levelFilter === 'all'} onClick={() => setLevelFilter('all')}>
                全部
              </FilterChip>
              {['Pre-A1', 'A1', 'A2', 'B1', 'B2'].map((l) => (
                <FilterChip key={l} active={levelFilter === l} onClick={() => setLevelFilter(l as Level)}>
                  {l}
                </FilterChip>
              ))}
              {showMasterChips && <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />}
            </>
          )}
          {showMasterChips && (
            <>
              <FilterChip active={!!showUnmastered} onClick={() => setShowUnmastered?.(!(showUnmastered ?? false))}>
                未掌握
              </FilterChip>
              <FilterChip active={!!showMastered} onClick={() => setShowMastered?.(!(showMastered ?? false))}>
                已掌握
              </FilterChip>
            </>
          )}
        </div>
        <div className="relative">
          <SearchIcon width={16} height={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索单词 / 释义 / 音标"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:ring-brand-500/20 sm:w-64"
          />
        </div>
      </div>

      {!hideCategory && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="shrink-0 text-xs font-medium text-slate-400">场景</span>
          <FilterChip active={catFilter === 'all'} onClick={() => setCatFilter('all')}>
            全部场景
          </FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip key={c.id} active={catFilter === c.id} onClick={() => setCatFilter(c.id)}>
              {c.label}
            </FilterChip>
          ))}
          <span className="mx-1 hidden h-4 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
          <FilterChip active={commonOnly} onClick={() => setCommonOnly(!commonOnly)}>
            ★ 只看常用
          </FilterChip>
        </div>
      )}
      {hideCategory && (
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={commonOnly} onClick={() => setCommonOnly(!commonOnly)}>
            ★ 只看常用
          </FilterChip>
        </div>
      )}
    </div>
  )
}

/* Grouped word grid with empty state, reused by Home and Unmastered list. */
export function WordGrid({
  words,
  masteredSet,
  onOpen,
  onToggleMastered,
}: {
  words: Word[]
  masteredSet: Set<string>
  onOpen: (w: Word) => void
  onToggleMastered: (w: Word) => void
}) {
  const groups = useMemo(() => groupByCategory(words), [words])
  const themeCount = useMemo(() => groups.reduce((s, g) => s + g.themes.length, 0), [groups])

  if (words.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">
        没有找到匹配的单词
      </div>
    )
  }

  return (
    <>
      <p className="mb-3 text-sm text-slate-400">
        共 {words.length} 个单词 · {groups.length} 个场景 · {themeCount} 个分组
      </p>
      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.category.id}>
            <div className="mb-3 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${CAT_DOT[g.category.id]}`} />
              <h2 className="text-base font-bold text-slate-700 dark:text-slate-200">{g.category.label}</h2>
              <span className="text-xs text-slate-400">{g.category.en}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">{g.count}</span>
            </div>
            <div className="space-y-4">
              {g.themes.map((t) => (
                <div key={t.id}>
                  {t.label && (
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <span className={`h-1.5 w-1.5 rounded-full ${CAT_DOT[g.category.id]} opacity-60`} />
                      {t.label}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {t.items.map((w) => (
                      <WordCard
                        key={w.word}
                        word={w}
                        mastered={masteredSet.has(w.word)}
                        onOpen={() => onOpen(w)}
                        onToggleMastered={() => onToggleMastered(w)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
