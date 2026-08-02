import { useEffect, useMemo, useRef, useState } from 'react'
import { ALL_WORDS } from '../data'
import { LEVELS } from '../data'
import { GRADES, wordsByGrade, GRADE_STYLE, type GradeId } from '../data/grades'
import type { Level, Word } from '../data'
import { useSpeech } from '../hooks/useSpeech'
import { SpeakerBtn, LEVEL_STYLE } from '../components/word'
import {
  CheckCheckIcon,
  CheckIcon,
  EyeIcon,
  HeadphonesIcon,
  ListIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
  XIcon,
} from '../components/icons'

const RATE = 0.9
const AUTOPLAY_GAP = 1400 // ms between words in autoplay
const SWIPE_THRESHOLD = 50 // px

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function ListenView({
  onOpen,
}: {
  onOpen: (w: Word) => void
}) {
  const [mode, setMode] = useState<'play' | 'quiz'>('play')
  const [cefrSel, setCefrSel] = useState<Level | 'all'>('all')
  const [gradeSel, setGradeSel] = useState<GradeId | 'all'>('all')
  const [shuffleOn, setShuffleOn] = useState(true)
  const [autoplay, setAutoplay] = useState(false)
  const [showMeaning, setShowMeaning] = useState(false)
  const [index, setIndex] = useState(0)

  const { speak, stop, preload } = useSpeech()
  const autoplayRef = useRef(autoplay)

  // 进入听词页即预加载模型（不播放），使后续用户手势内的朗读能同步播放，
  // 避免首次 await 加载模型后 audio.play() 失去用户手势被 Android WebView 拦截。
  useEffect(() => {
    preload().catch(() => {})
  }, [preload])
  autoplayRef.current = autoplay
  const mounted = useRef(true)
  // 中文朗读跟随「显示中文」开关；用 ref 读取最新值，避免开关变化重启播放 effect。
  const showMeaningRef = useRef(showMeaning)
  showMeaningRef.current = showMeaning

  // 人教年级词表（含每个年级的词汇），一次性构建。
  const byGrade = useMemo(() => wordsByGrade(), [])
  // CEFR 各级词数。
  const cefrCounts = useMemo(() => {
    const c: Record<Level, number> = { 'Pre-A1': 0, A1: 0, A2: 0, B1: 0, B2: 0 }
    for (const w of ALL_WORDS) c[w.level]++
    return c
  }, [])

  // 选中的分级词源（CEFR 与人教互斥）。
  const gradedList = useMemo<Word[] | null>(() => {
    if (cefrSel !== 'all') return ALL_WORDS.filter((w) => w.level === cefrSel)
    if (gradeSel !== 'all') return byGrade[gradeSel]
    return null
  }, [cefrSel, gradeSel, byGrade])

  const baseList = useMemo<Word[]>(() => (gradedList ? gradedList : ALL_WORDS), [gradedList])
  const list = useMemo(() => (shuffleOn ? shuffle(baseList) : baseList), [baseList, shuffleOn])

  const reset = () => setIndex(0)
  const pickCefr = (l: Level) => {
    setCefrSel((cur) => (cur === l ? 'all' : l))
    setGradeSel('all')
    reset()
  }
  const pickGrade = (g: GradeId) => {
    setGradeSel((cur) => (cur === g ? 'all' : g))
    setCefrSel('all')
    reset()
  }
  const graded = cefrSel !== 'all' || gradeSel !== 'all'

  // Auto-speak current word on index change; auto-advance if autoplay on.
  // 串行连播：英文朗读 → 开启「显示中文」时英文结束后自动接中文释义 →
  // 自动连播时再进入下一词（未显示中文则英文结束直接下一词）。
  useEffect(() => {
    mounted.current = true
    if (!list.length) return
    const w = list[index]
    if (!w) return
    const timers: number[] = []
    const advance = () => {
      if (autoplayRef.current && mounted.current) {
        const t2 = window.setTimeout(() => {
          if (!mounted.current) return
          setIndex((i) => (i + 1 < list.length ? i + 1 : i))
        }, AUTOPLAY_GAP)
        timers.push(t2)
      }
    }
    const t = window.setTimeout(() => {
      if (!mounted.current) return
      speak(w.word, RATE, () => {
        if (!mounted.current) return
        if (showMeaningRef.current) {
          if (!w.meaning) {
            advance()
            return
          }
          speak(w.meaning, RATE, advance, 'zh')
        } else {
          advance()
        }
      })
    }, 300)
    timers.push(t)
    return () => {
      mounted.current = false
      timers.forEach((x) => window.clearTimeout(x))
    }
  }, [index, list, speak])

  useEffect(() => () => stop(), [stop])

  const replay = () => {
    const w = list[index]
    if (!w) return
    // 与自动连播一致：开启「显示中文」时英文结束后自动接中文。
    speak(w.word, RATE, () => {
      if (showMeaning && w.meaning) speak(w.meaning, RATE, undefined, 'zh')
    })
  }
  const prev = () => setIndex((i) => Math.max(0, i - 1))
  const next = () => setIndex((i) => (i + 1 < list.length ? i + 1 : i))

  // 滑动手势：左滑下一张、右滑上一张（使用 touch 事件，避免与滚动/手势冲突）。
  const touchX = useRef<number | null>(null)
  const touchY = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX
    touchY.current = e.touches[0].clientY
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchX.current
    const dy = touchY.current !== null ? t.clientY - touchY.current : 0
    touchX.current = null
    touchY.current = null
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next()
      else prev()
    }
  }

  /* ----------------------------- 分级选择面板 ----------------------------- */
  const LevelGradePicker = (
    <div className="mb-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
      <div>
        <p className="mb-1.5 text-xs font-semibold text-slate-400">CEFR 等级</p>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => {
            const active = cefrSel === l.id
            const s = LEVEL_STYLE[l.id]
            return (
              <button
                key={l.id}
                onClick={() => pickCefr(l.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? `${s.badge} border-transparent shadow-sm`
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                {l.label}
                <span className={`text-xs ${active ? '' : 'text-slate-400'}`}>{cefrCounts[l.id]}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold text-slate-400">人教版年级</p>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((g) => {
            const active = gradeSel === g.id
            const s = GRADE_STYLE[g.id]
            return (
              <button
                key={g.id}
                onClick={() => pickGrade(g.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? `${s.badge} border-transparent shadow-sm`
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                {g.label}
                <span className={`text-xs ${active ? '' : 'text-slate-400'}`}>{byGrade[g.id].length}</span>
              </button>
            )
          })}
        </div>
      </div>
      {graded && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">已选分级 · 共 {baseList.length} 个词</span>
          <button
            onClick={() => {
              setCefrSel('all')
              setGradeSel('all')
              reset()
            }}
            className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200"
          >
            <XIcon width={12} height={12} />
            清除分级
          </button>
        </div>
      )}
    </div>
  )

  /* ----------------------------- Quiz mode ----------------------------- */
  if (mode === 'quiz') {
    return (
      <QuizMode
        gradedList={gradedList}
        LevelGradePicker={LevelGradePicker}
        onBack={() => setMode('play')}
      />
    )
  }

  if (!list.length) {
    return (
      <div>
        {LevelGradePicker}
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">
          当前分级下没有可听的词
        </div>
      </div>
    )
  }

  const w = list[index]

  return (
    <div>
      {LevelGradePicker}

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-800 dark:text-slate-100">
            <HeadphonesIcon width={20} height={20} className="text-brand-600 dark:text-brand-300" />
            听词练习
          </h2>
          <p className="text-xs text-slate-400">听发音，点卡片看详情，左右滑动切换</p>
        </div>
        <button
          onClick={() => setMode('quiz')}
          className="inline-flex items-center gap-2 rounded-xl border border-brand-300 px-3 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 dark:border-brand-500/50 dark:text-brand-300 dark:hover:bg-brand-500/10"
        >
          <CheckCheckIcon width={16} height={16} />
          测验
        </button>
      </div>

      {/* Toggles */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShuffleOn((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
            shuffleOn ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <ShuffleIcon width={14} height={14} />
          乱序
        </button>
        <button
          onClick={() => setShowMeaning((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
            showMeaning ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <EyeIcon width={14} height={14} />
          显示中文
        </button>
        <button
          onClick={() => setAutoplay((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
            autoplay ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {autoplay ? <PauseIcon width={14} height={14} /> : <PlayIcon width={14} height={14} />}
          自动连播
        </button>
      </div>

      {/* Player card (swipe left/right to switch) */}
      <div
        className="select-none rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800/60"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="mb-1 flex items-center justify-between">
          <button
            onClick={() => onOpen(w)}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
          >
            <ListIcon width={14} height={14} />
            详情
          </button>
          <p className="text-sm text-slate-400">
            {index + 1} / {list.length}
            {showMeaning && <span className="ml-2 text-xs text-brand-500">· 中文已显示</span>}
          </p>
        </div>

        <button
          onClick={replay}
          className="mx-auto my-6 flex h-28 w-28 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition active:scale-95 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
        >
          <SpeakerBtn text={w.word} className="!h-16 !w-16 !bg-transparent !p-0" rate={RATE} />
        </button>

        {showMeaning ? (
          <div className="animate-fade-in">
            <h2 className="break-words text-3xl font-extrabold text-slate-900 dark:text-white">{w.word}</h2>
            <p className="mt-1 text-slate-400 dark:text-slate-500">{w.ipa}</p>
            <p className="mt-2 text-base font-semibold text-slate-700 dark:text-slate-200">{w.meaning}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-400">开启「显示中文」可见释义 · 左右滑动切换单词</p>
        )}

        {/* transport */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={prev}
            className="rounded-full bg-slate-100 p-3 text-slate-600 transition hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-700 dark:text-slate-200"
            disabled={index === 0}
          >
            <SkipBackIcon width={20} height={20} />
          </button>
          <button
            onClick={replay}
            className="rounded-full bg-brand-600 p-4 text-white transition hover:bg-brand-700 active:scale-95"
          >
            <RotateCcwIcon width={22} height={22} />
          </button>
          <button
            onClick={next}
            className="rounded-full bg-slate-100 p-3 text-slate-600 transition hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-700 dark:text-slate-200"
            disabled={index === list.length - 1}
          >
            <SkipForwardIcon width={20} height={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------- Quiz sub-mode ----------------------------- */
function QuizMode({
  gradedList,
  LevelGradePicker,
  onBack,
}: {
  gradedList: Word[] | null
  LevelGradePicker: React.ReactNode
  onBack: () => void
}) {
  const { speak, stop } = useSpeech()
  const [questions, setQuestions] = useState<{ answer: string; options: string[] }[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [started, setStarted] = useState(false)

  const pool = useMemo(() => gradedList ?? ALL_WORDS, [gradedList])

  const buildQuestions = () => {
    const shuffledPool = shuffle(pool).slice(0, Math.min(10, pool.length))
    const qs = shuffledPool.map((target) => {
      const distractors = shuffle(ALL_WORDS.filter((d) => d.word !== target.word)).slice(0, 3).map((d) => d.word)
      const options = shuffle([target.word, ...distractors])
      return { answer: target.word, options }
    })
    setQuestions(qs)
    setQIndex(0)
    setSelected(null)
    setScore(0)
    setStarted(true)
  }

  // Speak current question's answer word when it changes
  useEffect(() => {
    if (!started || !questions.length) return
    const q = questions[qIndex]
    if (!q) return
    const t = window.setTimeout(() => speak(q.answer, RATE), 300)
    return () => window.clearTimeout(t)
  }, [qIndex, questions, started, speak])

  useEffect(() => () => stop(), [stop])

  if (!started) {
    return (
      <div>
        {LevelGradePicker}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">听词测验</h2>
          <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-600">
            返回听词
          </button>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            听发音，从 4 个拼写中选出正确单词，共 {Math.min(10, pool.length)} 题
          </p>
          <button
            onClick={buildQuestions}
            disabled={pool.length < 4}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-40"
          >
            <PlayIcon width={18} height={18} />
            开始测验
          </button>
        </div>
      </div>
    )
  }

  if (qIndex >= questions.length) {
    const total = questions.length
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800/60">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
          <CheckCheckIcon width={32} height={32} />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">测验完成</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          答对 <span className="text-2xl font-extrabold text-emerald-500">{score}</span> / {total}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button onClick={buildQuestions} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700">
            <RotateCcwIcon width={18} height={18} />
            再来一次
          </button>
          <button onClick={onBack} className="rounded-xl border border-slate-300 py-3 font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300">
            返回听词
          </button>
        </div>
      </div>
    )
  }

  const q = questions[qIndex]
  const isCorrect = (opt: string) => opt === q.answer
  const answered = selected !== null

  const pick = (opt: string) => {
    if (answered) return
    setSelected(opt)
    if (isCorrect(opt)) setScore((s) => s + 1)
  }
  const gotoNext = () => {
    setSelected(null)
    setQIndex((i) => i + 1)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
          第 {qIndex + 1} / {questions.length} 题
        </h2>
        <span className="text-sm text-slate-400">答对 {score}</span>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-800/60">
        <p className="text-sm text-slate-400">听到的是哪个单词？</p>
        <button
          onClick={() => speak(q.answer, RATE)}
          className="mx-auto my-5 flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition active:scale-95 dark:bg-brand-500/10 dark:text-brand-300"
        >
          <SpeakerBtn text={q.answer} className="!h-12 !w-12 !bg-transparent !p-0" rate={RATE} />
        </button>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {q.options.map((opt) => {
            let cls = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-700'
            if (answered && isCorrect(opt)) cls = 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
            else if (answered && opt === selected) cls = 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
            return (
              <button
                key={opt}
                onClick={() => pick(opt)}
                disabled={answered}
                className={`rounded-2xl border-2 px-4 py-3 text-lg font-bold transition ${cls}`}
              >
                {opt}
                {answered && isCorrect(opt) && <CheckIcon width={18} height={18} className="ml-2 inline" />}
                {answered && opt === selected && !isCorrect(opt) && <XIcon width={18} height={18} className="ml-2 inline" />}
              </button>
            )
          })}
        </div>

        {answered && (
          <button onClick={gotoNext} className="mt-5 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700">
            {qIndex + 1 < questions.length ? '下一题' : '查看结果'}
          </button>
        )}
      </div>
    </div>
  )
}
