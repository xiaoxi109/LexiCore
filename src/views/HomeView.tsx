import { useMemo, useState } from 'react'
import { ALL_WORDS, LEVELS, TOTAL } from '../data'
import type { CategoryId, Level, Word } from '../data'
import { FilterBar, Stat, WordGrid, LEVEL_STYLE } from '../components/word'

export default function HomeView({
  masteredSet,
  onOpen,
  onToggleMastered,
}: {
  masteredSet: Set<string>
  onOpen: (w: Word) => void
  onToggleMastered: (w: Word) => void
}) {
  const [levelFilter, setLevelFilter] = useState<Level | 'all'>('all')
  const [catFilter, setCatFilter] = useState<CategoryId | 'all'>('all')
  const [commonOnly, setCommonOnly] = useState(false)
  const [showUnmastered, setShowUnmastered] = useState(true)
  const [showMastered, setShowMastered] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return ALL_WORDS.filter((w) => {
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

  const masteredCount = useMemo(() => ALL_WORDS.filter((w) => masteredSet.has(w.word)).length, [masteredSet])
  const overallPct = TOTAL ? Math.round((masteredCount / TOTAL) * 100) : 0

  return (
    <>
      {/* Progress overview */}
      <section className="mb-6 grid grid-cols-2 gap-3">
        <Stat label="已掌握 / CEFR 总词数" value={`${masteredCount} / ${TOTAL}`} accent />
        <Stat label="掌握率" value={`${overallPct}%`} />
      </section>

      {/* 等级筛选 + 进度 融合卡片：点选即筛选，内嵌进度条表达掌握情况 */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        {LEVELS.map((l) => {
          const total = ALL_WORDS.filter((w) => w.level === l.id).length
          const done = ALL_WORDS.filter((w) => w.level === l.id && masteredSet.has(w.word)).length
          const pct = total ? Math.round((done / total) * 100) : 0
          const s = LEVEL_STYLE[l.id]
          const active = levelFilter === l.id
          return (
            <button
              key={l.id}
              onClick={() => setLevelFilter(active ? 'all' : l.id)}
              className={`flex flex-col gap-1.5 rounded-2xl border p-3 text-left transition ${
                active
                  ? `${s.badge} border-transparent shadow-sm`
                  : 'border-slate-200 bg-white hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                  {l.label}
                </span>
                <span className={`text-xs font-semibold ${active ? '' : 'text-slate-400'}`}>{done}/{total}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div className={`h-full rounded-full ${s.dot} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </button>
          )
        })}
      </div>

      <FilterBar
        levelFilter={levelFilter}
        setLevelFilter={setLevelFilter}
        hideLevel
        catFilter={catFilter}
        setCatFilter={setCatFilter}
        commonOnly={commonOnly}
        setCommonOnly={setCommonOnly}
        search={search}
        setSearch={setSearch}
        showMasterChips
        showUnmastered={showUnmastered}
        setShowUnmastered={setShowUnmastered}
        showMastered={showMastered}
        setShowMastered={setShowMastered}
      />

      <WordGrid words={filtered} masteredSet={masteredSet} onOpen={onOpen} onToggleMastered={onToggleMastered} />
    </>
  )
}
