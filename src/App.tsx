import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ALL_WORDS, LEVELS, TOTAL, CATEGORIES, groupByCategory } from './data'
import type { Level, Word, CategoryId } from './data'
import { useSpeech } from './hooks/useSpeech'
import { useLocalStorage } from './hooks/useLocalStorage'
import {
  CheckIcon,
  MoonIcon,
  SearchIcon,
  SpeakerIcon,
  SunIcon,
  XIcon,
} from './components/icons'

type Theme = 'light' | 'dark'

const LEVEL_STYLE: Record<Level, { badge: string; dot: string }> = {
  'Pre-A1': { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', dot: 'bg-emerald-500' },
  A1: { badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', dot: 'bg-sky-500' },
  A2: { badge: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300', dot: 'bg-violet-500' },
  B1: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', dot: 'bg-amber-500' },
  B2: { badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', dot: 'bg-rose-500' },
}

// Scene category accent dots (used in grouped section headers).
const CAT_DOT: Record<CategoryId, string> = {
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

function LevelBadge({ level }: { level: Level }) {
  const s = LEVEL_STYLE[level]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {level}
    </span>
  )
}

function SpeakerBtn({ text, className = '', rate }: { text: string; className?: string; rate?: number }) {
  const { speak, speaking } = useSpeech()
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        speak(text, rate)
      }}
      title="发音"
      className={`inline-flex items-center justify-center rounded-full p-2 text-brand-600 transition hover:bg-brand-50 hover:text-brand-700 active:scale-95 dark:text-brand-300 dark:hover:bg-brand-500/10 ${
        speaking ? 'animate-pulse' : ''
      } ${className}`}
    >
      <SpeakerIcon width={18} height={18} />
    </button>
  )
}

/* ----------------------------- Browse card ----------------------------- */
function WordCard({
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
          <LevelBadge level={word.level} />
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
function WordDetail({
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
        className="w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-scale-in dark:bg-slate-800 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <LevelBadge level={word.level} />
            
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700">
            <XIcon width={20} height={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="break-words text-3xl font-extrabold text-slate-900 dark:text-white">{word.word}</h2>
              <p className="mt-1 text-slate-400 dark:text-slate-500">{word.ipa}</p>
            </div>
            <SpeakerBtn text={word.word} rate={0.85} className="h-12 w-12 bg-brand-50 dark:bg-brand-500/10" />
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/40">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="rounded-md bg-white px-2 py-0.5 font-mono text-xs shadow-sm dark:bg-slate-800">{word.pos}</span>
              <span className="text-base font-semibold text-slate-800 dark:text-slate-100">{word.meaning}</span>
            </div>
          </div>

          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">例句</p>
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
        </div>

        <div className="border-t border-slate-100 px-6 py-4 dark:border-slate-700">
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

/* ------------------------------- App ------------------------------- */
export default function App() {
  const [theme, setTheme] = useLocalStorage<Theme>('lexicore-theme', 'light')
  const [levelFilter, setLevelFilter] = useState<Level | 'all'>('all')
  const [catFilter, setCatFilter] = useState<CategoryId | 'all'>('all')
  const [commonOnly, setCommonOnly] = useState(false)
  const [showUnmastered, setShowUnmastered] = useState(true)
  const [showMastered, setShowMastered] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Word | null>(null)
  const [masteredArr, setMasteredArr] = useLocalStorage<string[]>('lexicore-mastered', [])

  const masteredSet = useMemo(() => new Set(masteredArr), [masteredArr])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  const toggleMastered = useCallback(
    (w: Word) => {
      setMasteredArr((prev) => (prev.includes(w.word) ? prev.filter((x) => x !== w.word) : [...prev, w.word]))
    },
    [setMasteredArr],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    // 按级别 + 场景筛选
    const base = ALL_WORDS
    return base.filter((w) => {
      if (levelFilter !== 'all' && w.level !== levelFilter) return false
      if (catFilter !== 'all' && (w.category ?? 'thinking') !== catFilter) return false
      if (commonOnly && !w.common) return false
      if (!showUnmastered && !showMastered) return false
      if (!showUnmastered && showMastered && !masteredSet.has(w.word)) return false
      if (showUnmastered && !showMastered && masteredSet.has(w.word)) return false
      if (!q) return true
      return w.word.toLowerCase().includes(q) || w.meaning.includes(q) || w.ipa.toLowerCase().includes(q)
    })
  }, [levelFilter, catFilter, commonOnly, showUnmastered, showMastered, masteredSet, search])

  const groups = useMemo(() => groupByCategory(filtered), [filtered])

  const masteredCount = useMemo(() => ALL_WORDS.filter((w) => masteredSet.has(w.word)).length, [masteredSet])
  const overallPct = TOTAL ? Math.round((masteredCount / TOTAL) * 100) : 0

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow">
              <BookIcon />
            </div>
            <div>
              <h1 className="text-lg font-extrabold leading-tight">LexiCore 分级词汇</h1>
              <p className="text-xs text-slate-400">基础篇 · Pre-A1 → B2</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              title="切换主题"
            >
              {theme === 'dark' ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Progress overview */}
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="总词数" value={String(TOTAL)} />
          <Stat label="已掌握" value={`${masteredCount}`} accent />
          <Stat label="掌握率" value={`${overallPct}%`} />
          <Stat
            label="剩余"
            value={`${TOTAL - masteredCount}`}
          />
        </section>

        {/* Per-level progress */}
        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {LEVELS.map((l) => {
            const total = ALL_WORDS.filter((w) => w.level === l.id).length
            const done = ALL_WORDS.filter((w) => w.level === l.id && masteredSet.has(w.word)).length
            const pct = total ? Math.round((done / total) * 100) : 0
            const s = LEVEL_STYLE[l.id]
            return (
              <div key={l.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                    <span className="font-bold">{l.label}</span>
                  </div>
                  <span className="text-xs text-slate-400">{done}/{total}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{l.desc}</p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div className={`h-full rounded-full ${s.dot} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </section>

        <p className="mb-5 text-center text-xs text-slate-400">
          词表共 <span className="font-semibold text-slate-500 dark:text-slate-300">{TOTAL}</span> 个（含牛津 3000 补充词表）·
          {LEVELS.map((l) => `${l.label} ${ALL_WORDS.filter((w) => w.level === l.id).length}`).join(' · ')}
        </p>

        <>
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3">
              {/* Level + search */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <FilterChip active={levelFilter === 'all'} onClick={() => setLevelFilter('all')}>
                  全部
                </FilterChip>
                {LEVELS.map((l) => (
                  <FilterChip key={l.id} active={levelFilter === l.id} onClick={() => setLevelFilter(l.id)}>
                    {l.label}
                  </FilterChip>
                ))}
                <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />
                <FilterChip active={showUnmastered} onClick={() => setShowUnmastered((v) => !v)}>
                  未掌握
                </FilterChip>
                <FilterChip active={showMastered} onClick={() => setShowMastered((v) => !v)}>
                  已掌握
                </FilterChip>
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

              {/* Scene category filter */}
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
                <FilterChip active={commonOnly} onClick={() => setCommonOnly((v) => !v)}>
                  ★ 只看常用
                </FilterChip>
              </div>
            </div>

            <p className="mb-3 text-sm text-slate-400">
              共 {filtered.length} 个单词 · {groups.length} 个场景 ·{' '}
              {groups.reduce((s, g) => s + g.themes.length, 0)} 个分组
            </p>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">
                没有找到匹配的单词
              </div>
            ) : (
              <div className="space-y-8">
                {groups.map((g) => (
                  <section key={g.category.id}>
                    <div className="mb-3 flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${CAT_DOT[g.category.id]}`} />
                      <h2 className="text-base font-bold text-slate-700 dark:text-slate-200">{g.category.label}</h2>
                      <span className="text-xs text-slate-400">{g.category.en}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">
                        {g.count}
                      </span>
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
                                onOpen={() => setSelected(w)}
                                onToggleMastered={() => toggleMastered(w)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
      </main>

      <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-slate-400">
        点击单词卡片查看详情与发音 · 进度自动保存在本地浏览器
      </footer>

      {selected && (
        <WordDetail
          word={selected}
          mastered={masteredSet.has(selected.word)}
          onClose={() => setSelected(null)}
          onToggleMastered={() => toggleMastered(selected)}
        />
      )}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${accent ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-100'}`}>{value}</p>
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
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

function BookIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}
