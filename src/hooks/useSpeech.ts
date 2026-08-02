import { useCallback, useEffect, useState } from 'react'

// ─── Module-level shared state (all SpeakerBtn & header button share one session) ───
type DownloadStatus = 'idle' | 'downloading' | 'ready' | 'error'

let _status: DownloadStatus = 'idle'
let _progress = 0
let _progressLabel = ''
let sessionShared: any = null
let sessionZh: any = null
let initPromiseShared: Promise<void> | null = null
let audioShared: AudioBufferSourceNode | null = null
let audioCtxShared: AudioContext | null = null
let reqIdShared = 0

// 共享 AudioContext（Web Audio 在 Android WebView 下对本地 wav 播放最稳定，
// 优于 new Audio(blobUrl).play()——后者在 WebView 中常静音且不报错）。
function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext
  if (!Ctor) return null
  if (!audioCtxShared) audioCtxShared = new Ctor()
  return audioCtxShared
}

// APK 播放双路径：主用 <audio>(new Audio) 播放 blob wav；失败时回退 Web Audio。
let audioSharedHtml: HTMLAudioElement | null = null

function playViaWebAudio(
  blob: Blob,
  rate: number,
  reqId: number,
  onEnded?: () => void,
  setSpeakingFn?: (v: boolean) => void,
  setLastErrorFn?: (v: string) => void,
): void {
  const ctx = getAudioCtx()
  if (!ctx) {
    setLastErrorFn?.('音频播放失败：无可用音频后端')
    setSpeakingFn?.(false)
    return
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  blob
    .arrayBuffer()
    .then((buf) => ctx!.decodeAudioData(buf))
    .then((audioBuf) => {
      if (reqId !== reqIdShared) return
      const src = ctx!.createBufferSource()
      src.buffer = audioBuf
      src.playbackRate.value = rate
      src.connect(ctx!.destination)
      audioShared = src
      src.onended = () => {
        setSpeakingFn?.(false)
        if (audioShared === src) audioShared = null
        onEnded?.()
      }
      src.start(0)
    })
    .catch((e) => {
      setLastErrorFn?.(`音频播放失败（Web Audio）：${String(e)}`)
      setSpeakingFn?.(false)
    })
}

// 运行环境判断：APK（Capacitor）用 Piper 离线模型；浏览器用原生 SpeechSynthesis。
const isCapacitor =
  typeof window !== 'undefined' && (window as any).Capacitor !== undefined
// 浏览器原生 TTS 是否可用
const synthAvailable =
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

const subscribers = new Set<(s: DownloadStatus) => void>()
const progressSubscribers = new Set<(p: { pct: number; label: string }) => void>()

function emit(s: DownloadStatus) {
  _status = s
  subscribers.forEach((fn) => fn(s))
}

function emitProgress(pct: number, label: string) {
  _progress = pct
  _progressLabel = label
  progressSubscribers.forEach((fn) => fn({ pct, label }))
}

// 全局诊断状态（所有 useSpeech 实例共享，调试条才能看到真实情况）
export type Diag = {
  engine: 'piper' | 'speechSynthesis' | 'unknown'
  speaking: boolean
  lastError: string | null
  blobSize: number | null
  audioErr: string | null
  sessionReady: boolean
  speakPhase: string
}
let _diag: Diag = {
  engine: 'unknown',
  speaking: false,
  lastError: null,
  blobSize: null,
  audioErr: null,
  sessionReady: false,
  speakPhase: 'idle',
}
const diagSubscribers = new Set<(d: Diag) => void>()
function setDiag(patch: Partial<Diag>) {
  _diag = { ..._diag, ...patch }
  diagSubscribers.forEach((fn) => fn(_diag))
}
export function getDiag(): Diag {
  return _diag
}
function onDiagChange(fn: (d: Diag) => void) {
  diagSubscribers.add(fn)
  return () => {
    diagSubscribers.delete(fn)
  }
}

/** Subscribe to shared download status. Returns unsubscribe function. */
function onStatusChange(fn: (s: DownloadStatus) => void) {
  subscribers.add(fn)
  return () => { subscribers.delete(fn) }
}

/** Subscribe to download progress {pct:0-100, label}. Returns unsubscribe function. */
function onProgressChange(fn: (p: { pct: number; label: string }) => void) {
  progressSubscribers.add(fn)
  return () => { progressSubscribers.delete(fn) }
}

/** Manually trigger model download. Safe to call multiple times. */
export async function downloadModel(): Promise<void> {
  // 仅当英文/中文 session 都已就绪时才跳过，避免假 ready（status=ready 但 session 为 null）导致永不重建
  if (sessionShared?.ready && sessionZh?.ready) return
  if (_status === 'downloading') return initPromiseShared!

  emit('downloading')
  emitProgress(0, '准备中…')
  initPromiseShared = (async () => {
    try {
      // Phase 1: load WASM engine (ONNX + Piper phonemize)
      emitProgress(5, '加载引擎…')
      const { TtsSession } = await import('@realtimex/piper-tts-web')

      // downloadModel 仅在 APK 环境被调用（浏览器走原生 SpeechSynthesis）。
      // 离线优先：allowLocalModels + local 策略，不回退 CDN。
      const strategy = 'local'

      sessionShared = await TtsSession.create({
        voiceId: 'en_US-lessac-medium',
        fallbackStrategy: strategy,
        allowLocalModels: true,
        wasmPaths: {
          onnxWasm: `${import.meta.env.BASE_URL}tts/onnx/`,
          piperData: `${import.meta.env.BASE_URL}tts/piper/`,
          piperWasm: `${import.meta.env.BASE_URL}tts/piper/`,
        },
          progress: (p: { url: string; total: number; loaded: number }) => {
            if (p.total > 0) {
              const modelPct = Math.round((p.loaded / p.total) * 100)
              emitProgress(10 + Math.round(modelPct * 0.4), '加载英文语音模型…')
            }
          },
        })
      if (sessionShared?.ready) {
        emitProgress(50, '英文模型就绪，加载中文模型…')
      } else {
        throw new Error('TtsSession not ready after create')
      }

      // 同时加载中文语音模型（zh_CN-huayan-medium），与英文共用同一 Piper 引擎。
      sessionZh = await TtsSession.create({
        voiceId: 'zh_CN-huayan-medium',
        fallbackStrategy: strategy,
        allowLocalModels: true,
        wasmPaths: {
          onnxWasm: `${import.meta.env.BASE_URL}tts/onnx/`,
          piperData: `${import.meta.env.BASE_URL}tts/piper/`,
          piperWasm: `${import.meta.env.BASE_URL}tts/piper/`,
        },
        progress: (p: { url: string; total: number; loaded: number }) => {
          if (p.total > 0) {
            const modelPct = Math.round((p.loaded / p.total) * 100)
            emitProgress(50 + Math.round(modelPct * 0.45), '加载中文语音模型…')
          }
        },
      })
      if (sessionZh?.ready) {
        emitProgress(100, '完成')
        emit('ready')
        setDiag({ sessionReady: true })
      } else {
        throw new Error('Chinese TtsSession not ready after create')
      }
    } catch (err) {
      console.error('Piper TTS download failed:', err)
      emit('error')
      // Reset so user can retry
      initPromiseShared = null
      sessionShared = null
      throw err
    }
  })()
  return initPromiseShared!
}

export function getDownloadStatus(): DownloadStatus {
  return _status
}

export function getDownloadProgress(): { pct: number; label: string } {
  return { pct: _progress, label: _progressLabel }
}

/**
 * Text-to-speech via Piper WASM (local inference, no system TTS needed).
 * Uses en_US-lessac-medium voice (American English, female, clear).
 */
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<DownloadStatus>(_status)
  const [progress, setProgress] = useState<{ pct: number; label: string }>({
    pct: _progress,
    label: _progressLabel,
  })
  // 诊断信息：提升到模块级共享，确保任意组件触发播放，调试条都能看到
  const [engine, setEngine] = useState<'piper' | 'speechSynthesis' | 'unknown'>(_diag.engine)
  const [lastError, setLastError] = useState<string | null>(_diag.lastError)
  const [blobSize, setBlobSize] = useState<number | null>(_diag.blobSize)
  const [audioErr, setAudioErr] = useState<string | null>(_diag.audioErr)
  const [sessionReady, setSessionReady] = useState<boolean>(_diag.sessionReady)
  const [speakPhase, setSpeakPhase] = useState<string>(_diag.speakPhase)

  // 同时更新本地 state 与全局诊断（供其它组件实例的调试条读取）
  const pushEngine = (v: typeof engine) => { setEngine(v); setDiag({ engine: v }) }
  const pushLastError = (v: string | null) => { setLastError(v); setDiag({ lastError: v }) }
  const pushBlobSize = (v: number | null) => { setBlobSize(v); setDiag({ blobSize: v }) }
  const pushAudioErr = (v: string | null) => { setAudioErr(v); setDiag({ audioErr: v }) }
  const pushSessionReady = (v: boolean) => { setSessionReady(v); setDiag({ sessionReady: v }) }
  const pushPhase = (v: string) => { setSpeakPhase(v); setDiag({ speakPhase: v }) }

  // Sync shared status into local state
  useEffect(() => onStatusChange(setStatus), [])
  // Sync shared download progress into local state
  useEffect(() => onProgressChange(setProgress), [])
  // 订阅全局诊断，更新本实例 UI（仅本地 set，避免回写全局导致循环）
  useEffect(() => onDiagChange((d) => {
    setEngine(d.engine)
    setLastError(d.lastError)
    setBlobSize(d.blobSize)
    setAudioErr(d.audioErr)
    setSessionReady(d.sessionReady)
    setSpeakPhase(d.speakPhase)
  }), [])

  // 浏览器环境：预热 SpeechSynthesis 语音列表（部分浏览器需异步 loaded）。
  useEffect(() => {
    if (isCapacitor || !synthAvailable) return
    // 立即触发一次加载；若为空，监听 voiceschanged 再次填充。
    if (!window.speechSynthesis.getVoices().length) {
      const onVoices = () => window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = onVoices
      return () => {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  // APK 环境：Android WebView 要求 AudioContext 在用户手势链内 resume，
  // 否则后续 setTimeout 内播放会被静音。首次用户交互（点击/触摸）即解锁。
  useEffect(() => {
    if (!isCapacitor) return
    const unlock = () => {
      const ctx = getAudioCtx()
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {})
    }
    const opts = { passive: true } as AddEventListenerOptions
    document.addEventListener('pointerdown', unlock, opts)
    document.addEventListener('touchstart', unlock, opts)
    document.addEventListener('keydown', unlock, opts)
    return () => {
      document.removeEventListener('pointerdown', unlock)
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [])

  // 回退方案：系统语音合成（WebView 内置，不需要模型/联网）。当 Piper 挂起或失败时兜底，保证至少能出声。
  const fallbackSpeechSynthesis = useCallback(
    (text: string, rate: number, onEnded?: () => void) => {
      pushEngine('speechSynthesis')
      try {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
          pushLastError('系统 TTS 不可用，且 Piper 失败')
          return
        }
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)
        const voiceLang = 'en-US'
        const voices = window.speechSynthesis.getVoices()
        const picked = voices.find((v) => v.lang === voiceLang) ?? null
        if (picked) u.voice = picked
        u.lang = voiceLang
        u.rate = rate
        setSpeaking(true)
        u.onend = () => {
          setSpeaking(false)
          onEnded?.()
        }
        u.onerror = () => setSpeaking(false)
        window.speechSynthesis.speak(u)
        pushPhase('playing(fallback)')
      } catch (e) {
        console.error('fallback TTS failed:', e)
        setSpeaking(false)
        pushLastError('系统 TTS 也失败: ' + (e instanceof Error ? e.message : String(e)))
      }
    },
    [],
  )

  // Ensure session: wait for download if in progress, trigger download if idle
  const ensureSession = useCallback(async (lang: 'en' | 'zh' = 'en') => {
    const sess = lang === 'zh' ? sessionZh : sessionShared
    if (sess?.ready) {
      pushSessionReady(true)
      return sess
    }
    if (_status === 'downloading') {
      await initPromiseShared
      pushSessionReady(!!(lang === 'zh' ? sessionZh?.ready : sessionShared?.ready))
      return lang === 'zh' ? sessionZh : sessionShared!
    }
    // idle or error → trigger download
    if (_status === 'error') {
      // Reset before retry
      _status = 'idle'
      emit('idle')
    }
    setLoading(true)
    try {
      await downloadModel()
      pushSessionReady(!!(lang === 'zh' ? sessionZh?.ready : sessionShared?.ready))
      setLoading(false)
      return lang === 'zh' ? sessionZh : sessionShared!
    } catch (err) {
      setLoading(false)
      const msg = err instanceof Error ? err.message : String(err)
      pushLastError('Piper 初始化失败: ' + msg)
      throw new Error('Piper init failed')
    }
  }, [])

  const speak = useCallback(
    async (text: string, rate = 0.9, onEnded?: () => void, lang: 'en' | 'zh' = 'en') => {
      if (!text) return

      // ── 浏览器环境：直接用原生 SpeechSynthesis，不加载模型、不联网 ──
      if (!isCapacitor) {
        pushEngine('speechSynthesis')
        if (!synthAvailable) {
          pushLastError('浏览器环境 speechSynthesis 不可用')
          console.warn('SpeechSynthesis 不可用')
          return
        }
        try {
          window.speechSynthesis.cancel() // 停止上一条
          const u = new SpeechSynthesisUtterance(text)
          // 选语音：优先匹配 lang 对应的本地语音包
          const voiceLang = lang === 'zh' ? 'zh-CN' : 'en-US'
          const voices = window.speechSynthesis.getVoices()
          const picked =
            voices.find((v) => v.lang === voiceLang) ??
            voices.find((v) => v.lang.startsWith(lang === 'zh' ? 'zh' : 'en')) ??
            null
          if (picked) u.voice = picked
          u.lang = voiceLang
          u.rate = rate
          setSpeaking(true)
          u.onend = () => {
            setSpeaking(false)
            onEnded?.()
          }
          u.onerror = () => setSpeaking(false)
          window.speechSynthesis.speak(u)
        } catch (err) {
          console.error('SpeechSynthesis speak failed:', err)
          setSpeaking(false)
        }
        return
      }

      // ── APK 环境：Piper 离线模型（中+英两个 medium） ──
      pushEngine('piper')
      // Stop currently playing audio
      if (audioSharedHtml) {
        try {
          audioSharedHtml.pause()
          if (audioSharedHtml.src.startsWith('blob:')) URL.revokeObjectURL(audioSharedHtml.src)
        } catch {
          /* noop */
        }
        audioSharedHtml = null
      }
      if (audioShared) {
        try {
          audioShared.stop()
        } catch {
          /* noop */
        }
        try {
          audioShared.disconnect()
        } catch {
          /* noop */
        }
        audioShared = null
      }

      const id = ++reqIdShared

      try {
        pushPhase('ensuring')
        const session = await ensureSession(lang)
        // 注意：不再因后续新请求而丢弃本结果，否则 predict 已出声却被静默 return，导致无声且无错
        if (!session) {
          pushPhase('no-session')
          pushLastError('ensureSession 返回空 session')
          setSpeaking(false)
          return
        }

        setSpeaking(true)
        pushPhase('predicting')
        let audioBlob: Blob
        try {
          // 超时保护：Piper phonemize wasm 在部分 WebView 下会永久挂起（既不 resolve 也不 reject）。
          // 超时后回退到系统 TTS，保证至少能出声。
          audioBlob = await Promise.race<Blob>([
            session.predict(text),
            new Promise<Blob>((_, reject) =>
              setTimeout(() => reject(new Error('predict-timeout(8s)')), 8000),
            ),
          ])
        } catch (pe) {
          const pm = pe instanceof Error ? pe.message : String(pe)
          pushPhase('predict-failed: ' + pm)
          pushLastError('predict 失败: ' + pm + ' → 回退系统 TTS')
          console.error('Piper predict failed, fallback to system TTS:', pe)
          setSpeaking(false)
          // 回退：用 WebView 内置系统语音合成（不需要模型、不需要联网）
          fallbackSpeechSynthesis(text, rate, onEnded)
          return
        }
        pushPhase('blobReady size=' + audioBlob.size)
        // 诊断：记录生成的音频字节数（正常英文词约 10KB~60KB；若极小≈44字节说明生成静音/空）
        pushBlobSize(audioBlob.size)
        pushAudioErr(null)

        // 主路径：<audio> 元素播放 blob wav（真机此前验证可正常出声）。
        // WebView 对 blob:wav 的 <audio> 支持稳定，且点击手势内 play() 不受自动播放限制。
        const url = URL.createObjectURL(audioBlob)
        const audio = new Audio(url)
        audio.playbackRate = rate
        // 用 HTMLAudioElement 持有，stop() 时 pause+revoke
        audioSharedHtml = audio

        pushPhase('playing')
        let ended = false
        const cleanup = () => {
          if (ended) return
          ended = true
          setSpeaking(false)
          try {
            URL.revokeObjectURL(url)
          } catch {
            /* noop */
          }
          audioSharedHtml = null
          onEnded?.()
        }
        audio.onended = cleanup
        audio.onerror = () => {
          const m = 'HTMLAudio onerror（blob 无法播放，可能 WebView 不支持 blob:wav）'
          console.warn(m, url)
          pushAudioErr(m)
          // <audio> 失败时回退 Web Audio（decodeAudioData + bufferSource）
          playViaWebAudio(audioBlob, rate, id, onEnded, setSpeaking, (e) => {
            pushAudioErr(e)
            pushLastError(e)
          })
        }
        const p = audio.play()
        if (p && typeof p.catch === 'function') {
          p.catch((e) => {
            const m = `HTMLAudio play() 被拒绝: ${String(e)}`
            console.warn(m)
            pushAudioErr(m)
            // play() 被拒绝（如自动播放策略）：尝试 Web Audio 兜底
            playViaWebAudio(audioBlob, rate, id, onEnded, setSpeaking, (er) => {
              pushAudioErr(er)
              pushLastError(er)
            })
          })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('Piper TTS speak failed:', err)
        pushLastError('Piper speak 失败: ' + msg)
        setSpeaking(false)
      }
    },
    [ensureSession],
  )

  const stop = useCallback(() => {
    if (!isCapacitor) {
      // 浏览器：停止原生语音合成
      if (synthAvailable) window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    if (audioSharedHtml) {
      try {
        audioSharedHtml.pause()
        if (audioSharedHtml.src.startsWith('blob:')) URL.revokeObjectURL(audioSharedHtml.src)
      } catch {
        /* noop */
      }
      audioSharedHtml = null
      setSpeaking(false)
    }
    if (audioShared) {
      try {
        audioShared.stop()
      } catch {
        /* noop */
      }
      try {
        audioShared.disconnect()
      } catch {
        /* noop */
      }
      audioShared = null
      setSpeaking(false)
    }
  }, [])

  // 浏览器环境：无需下载模型，视为永久 ready，loading 始终 false。
  const browserReady = !isCapacitor
  const finalStatus: DownloadStatus = browserReady ? 'ready' : status
  const finalLoading = browserReady ? false : loading
  const finalSupported = browserReady ? synthAvailable : true

  return {
    speak,
    stop,
    preload: downloadModel,
    speaking,
    supported: finalSupported,
    loading: finalLoading,
    downloadStatus: finalStatus,
    downloadProgress: browserReady ? { pct: 100, label: '就绪' } : progress,
    engine,
    lastError,
    audioErr,
    blobSize,
    sessionReady,
    speakPhase,
    crossOriginIsolated:
      typeof window !== 'undefined' && (window as any).crossOriginIsolated === true,
    isCapacitor,
  }
}
