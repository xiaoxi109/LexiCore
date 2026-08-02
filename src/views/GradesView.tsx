import { useMemo, useState } from 'react'
import type { Word, CategoryId } from '../data'
import { GRADES, GRADE_STYLE, wordsByGrade } from '../data/grades'
import type { GradeId } from '../data/grades'
import { FilterBar, Stat, WordGrid } from '../components/word'

export default function GradesView({
  masteredSet,
  onOpen,
  onToggleMastered,
}: {
  masteredSet: Set<string>
  onOpen: (w: Word) => void
  onToggleMastered: (w: Word) => void
}) {
  const [gradeFilter, setGradeFilter] = useState<GradeId | 'all'>('all')
  const [catFilter, setCatFilter] = useState<CategoryId | 'all'>('all')
  const [search, setSearch] = useState('')
  const [commonOnly, setCommonOnly] = useState(false)
  const [showUnmastered, setShowUnmastered] = useState(true)
  const [showMastered, setShowMastered] = useState(false)

  const byGrade = useMemo(() => wordsByGrade(), [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const grades = gradeFilter === 'all' ? GRADES : GRADES.filter((g) => g.id === gradeFilter)
    return grades.flatMap((g) =>
      byGrade[g.id].filter((w) => {
        if (catFilter !== 'all' && (w.category ?? 'thinking') !== catFilter) return false
        if (commonOnly && !w.common) return false
        if (!showUnmastered && !showMastered) return false
        if (!showUnmastered && showMastered && !masteredSet.has(w.word)) return false
        if (showUnmastered && !showMastered && masteredSet.has(w.word)) return false
        if (!q) return true
        return w.word.toLowerCase().includes(q) || w.meaning.includes(q) || w.ipa.toLowerCase().includes(q)
      }),
    )
  }, [byGrade, gradeFilter, catFilter, commonOnly, showUnmastered, showMastered, masteredSet, search])

  const pepTotal = useMemo(() => GRADES.reduce((sum, g) => sum + byGrade[g.id].length, 0), [byGrade])
  const masteredCount = useMemo(
    () => GRADES.reduce((sum, g) => sum + byGrade[g.id].filter((w) => masteredSet.has(w.word)).length, 0),
    [byGrade, masteredSet],
  )
  const overallPct = pepTotal ? Math.round((masteredCount / pepTotal) * 100) : 0

  return (
    <>
      <section className="mb-6 grid grid-cols-2 gap-3">
        <Stat label="已掌握 / 分级总词数" value={`${masteredCount} / ${pepTotal}`} accent />
        <Stat label="掌握率" value={`${overallPct}%`} />
      </section>

      {/* 年级筛选 + 进度 融合卡片：点选即筛选，内嵌进度条表达掌握情况 */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {GRADES.map((g) => {
          const total = byGrade[g.id].length
          const done = byGrade[g.id].filter((w) => masteredSet.has(w.word)).length
          const pct = total ? Math.round((done / total) * 100) : 0
          const s = GRADE_STYLE[g.id]
          const active = gradeFilter === g.id
          return (
            <button
              key={g.id}
              onClick={() => setGradeFilter(active ? 'all' : g.id)}
              className={`flex flex-col gap-1.5 rounded-2xl border p-3 text-left transition ${
                active
                  ? `${s.badge} border-transparent shadow-sm`
                  : 'border-slate-200 bg-white hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                  {g.label}
                </span>
                <span className={`text-xs font-semibold ${active ? '' : 'text-slate-400'}`}>{done}/{total}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div className={`h-full rounded-full ${s.bar} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </button>
          )
        })}
      </div>

      <FilterBar
        levelFilter="all"
        setLevelFilter={() => {}}
        catFilter={catFilter}
        setCatFilter={setCatFilter}
        hideLevel
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

      <div className="mt-5">
        {filtered.length > 0 ? (
          <WordGrid words={filtered} masteredSet={masteredSet} onOpen={onOpen} onToggleMastered={onToggleMastered} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400 dark:border-slate-700">
            该筛选条件下暂无单词
          </div>
        )}
      </div>
    </>
  )
}
