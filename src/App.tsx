import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Word } from './data'
import { useSpeech } from './hooks/useSpeech'
import { WordDetail } from './components/word'
import HomeView from './views/HomeView'
import GradesView from './views/GradesView'
import ListenView from './views/ListenView'
import {
  CheckIcon,
  DownloadIcon,
  HeadphonesIcon,
  HomeIcon,
  ListIcon,
  MoonIcon,
  SpinnerIcon,
  SunIcon,
  UploadIcon,
  XIcon,
} from './components/icons'

type View = 'home' | 'grades' | 'listen'

/* ----------------------------- Toast ----------------------------- */
type Toast = { id: number; msg: string; type: 'success' | 'error' | 'info' }
let toastId = 0

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex max-w-sm items-center gap-2 rounded-xl px-4 py-2.5 text-sm shadow-lg ${
            t.type === 'success'
              ? 'bg-emerald-600 text-white'
              : t.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-800 text-white dark:bg-slate-700'
          }`}
        >
          {t.type === 'success' && <CheckIcon width={16} height={16} />}
          {t.type === 'error' && <XIcon width={16} height={16} />}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}

/* ----------------------------- Model download ----------------------------- */
function ModelDownloadBtn({ onToast }: { onToast: (msg: string, type?: Toast['type']) => void }) {
  const { downloadStatus, downloadProgress, speak, speaking, preload } = useSpeech()
  const ready = downloadStatus === 'ready'
  const downloading = downloadStatus === 'downloading'

  const handle = async () => {
    if (ready) {
      // 模型已就绪：直接试听（在用户手势内播放，避免自动播放拦截）
      try {
        await speak('Hello, this is a test.', 0.95)
      } catch {
        onToast('播放失败', 'error')
      }
      return
    }
    if (downloading) return
    // 未就绪：仅初始化模型（不播放，避免异步加载后 play 失去手势被拦）
    try {
      onToast('开始初始化语音模型（约 60MB，首次较慢）…', 'info')
      await preload()
      onToast('语音模型已就绪 🎉 点击可试听', 'success')
    } catch {
      onToast('语音模型加载失败，请检查资源是否完整', 'error')
    }
  }

  return (
    <button
      onClick={handle}
      disabled={downloading}
      title={ready ? '点击试听' : '点击初始化语音模型'}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        ready
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
          : 'bg-brand-600 text-white hover:bg-brand-700'
      } disabled:opacity-60`}
    >
      {downloading ? (
        <>
          <SpinnerIcon width={16} height={16} className="animate-spin" />
          {downloadProgress.pct}%
        </>
      ) : (
        <>
          <DownloadIcon width={16} height={16} />
          {ready ? '语音已就绪' : '下载语音'}
        </>
      )}
      {speaking && <span className="ml-1 h-2 w-2 animate-pulse rounded-full bg-amber-400" />}
    </button>
  )
}

/* ----------------------------- Sync progress ----------------------------- */
function SyncProgressBtns({ onToast }: { onToast: (msg: string, type?: Toast['type']) => void }) {
  const exportProgress = () => {
    try {
      const data = localStorage.getItem('lexicore-mastered') || '[]'
      const blob = new Blob([JSON.stringify(JSON.parse(data), null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'lexicore-progress.json'
      a.click()
      URL.revokeObjectURL(url)
      onToast('已导出掌握进度', 'success')
    } catch {
      onToast('导出失败', 'error')
    }
  }

  const importProgress = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const arr = JSON.parse(text)
        if (!Array.isArray(arr)) throw new Error('格式错误')
        const merged = Array.from(new Set([...(JSON.parse(localStorage.getItem('lexicore-mastered') || '[]')), ...arr]))
        localStorage.setItem('lexicore-mastered', JSON.stringify(merged))
        onToast(`已导入 ${arr.length} 个进度`, 'success')
        setTimeout(() => location.reload(), 800)
      } catch {
        onToast('导入失败：文件格式不正确', 'error')
      }
    }
    input.click()
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={exportProgress}
        title="导出掌握进度"
        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
      >
        <UploadIcon width={15} height={15} />
      </button>
      <button
        onClick={importProgress}
        title="导入掌握进度"
        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
      >
        <DownloadIcon width={15} height={15} />
      </button>
    </div>
  )
}

/* ----------------------------- App ----------------------------- */
export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('lexicore-theme')
    if (saved) return saved as 'light' | 'dark'
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [masteredArr, setMasteredArr] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('lexicore-mastered') || '[]')
    } catch {
      return []
    }
  })
  const [selected, setSelected] = useState<Word | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [view, setView] = useState<View>('home')

  const masteredSet = useMemo(() => new Set(masteredArr), [masteredArr])

  // App 启动即预加载 Piper 模型（不播放）。模型尽早就绪，可使后续用户手势内的
  // 朗读同步播放，避免首次 await 加载模型后 audio.play() 失去手势被 Android WebView 拦截。
  const { preload } = useSpeech()
  useEffect(() => {
    preload().catch(() => {})
  }, [preload])

  const toggleMastered = useCallback((word: string) => {
    setMasteredArr((prev) => (prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]))
  }, [])

  const pushToast = useCallback((msg: string, type: Toast['type'] = 'success') => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, msg, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2600)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('lexicore-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('lexicore-mastered', JSON.stringify(masteredArr))
  }, [masteredArr])

  const openDetail = useCallback((w: Word) => setSelected(w), [])
  const toggleFromDetail = useCallback(() => selected && toggleMastered(selected.word), [selected, toggleMastered])

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-900 dark:text-slate-100 ${theme === 'dark' ? 'dark' : ''}`}>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white">
              <span className="text-lg font-black">学</span>
            </span>
            <div className="leading-tight">
              <h1 className="text-base font-extrabold">分级背单词</h1>
              <p className="text-[11px] text-slate-400">CEFR 分级词库 · 人教版分级</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SyncProgressBtns onToast={pushToast} />
            <ModelDownloadBtn onToast={pushToast} />
            <button
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="rounded-lg bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              title="切换主题"
            >
              {theme === 'dark' ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 md:pb-8">
        {view === 'home' && (
          <HomeView masteredSet={masteredSet} onOpen={openDetail} onToggleMastered={(w) => toggleMastered(w.word)} />
        )}
        {view === 'grades' && (
          <GradesView masteredSet={masteredSet} onOpen={openDetail} onToggleMastered={(w) => toggleMastered(w.word)} />
        )}
        {view === 'listen' && <ListenView onOpen={openDetail} />}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:hidden">
        <div className="mx-auto flex max-w-5xl items-stretch justify-around">
          <NavBtn active={view === 'home'} onClick={() => setView('home')} icon={<HomeIcon width={22} height={22} />} label="CEFR" />
          <NavBtn active={view === 'grades'} onClick={() => setView('grades')} icon={<ListIcon width={22} height={22} />} label="人教" />
          <NavBtn active={view === 'listen'} onClick={() => setView('listen')} icon={<HeadphonesIcon width={22} height={22} />} label="听词" />
        </div>
      </nav>

      {selected && (
        <WordDetail word={selected} mastered={masteredSet.has(selected.word)} onClose={() => setSelected(null)} onToggleMastered={toggleFromDetail} />
      )}

      <ToastContainer toasts={toasts} />

      <footer className="mx-auto max-w-5xl px-4 pb-3 pt-2 text-center text-[11px] leading-relaxed text-slate-400">
        分级词表依据人教版教材整理（来源：cyforkk/pep-english-words, MIT）；
        单词释义/音标/例句来自公开词典接口，仅供个人学习，非牛津官方授权。
      </footer>
    </div>
  )
}

function NavBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
        active ? 'text-brand-600 dark:text-brand-300' : 'text-slate-400 dark:text-slate-500'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
