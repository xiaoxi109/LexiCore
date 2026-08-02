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

// Web Audio 兜底播放。url 传入时在播放结束/失败后 revoke，避免 blob URL 泄漏。
function playViaWebAudio(
  blob: Blob,
  rate: number,
  reqId: number,
  onEnded?: () => void,
  setSpeakingFn?: (v: boolean) => void,
  url?: string,
): void {
  const revoke = () => {
    if (!url) return
    try {
      URL.revokeObjectURL(url)
    } catch {
      /* noop */
    }
  }
  const ctx = getAudioCtx()
  if (!ctx) {
    setSpeakingFn?.(false)
    revoke()
    return
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  blob
    .arrayBuffer()
    .then((buf) => ctx!.decodeAudioData(buf))
    .then((audioBuf) => {
      if (reqId !== reqIdShared) {
        // 已被更新的请求取代，本结果作废
        revoke()
        return
      }
      const src = ctx!.createBufferSource()
      src.buffer = audioBuf
      src.playbackRate.value = rate
      src.connect(ctx!.destination)
      audioShared = src
      src.onended = () => {
        setSpeakingFn?.(false)
        if (audioShared === src) audioShared = null
        revoke()
        onEnded?.()
      }
      src.start(0)
    })
    .catch((e) => {
      console.error('Web Audio 播放失败:', e)
      setSpeakingFn?.(false)
      revoke()
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
  if (_status === 'downloading' && initPromiseShared) return initPromiseShared

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
      // 防御断言：两个语音必须是独立会话。若库仍为单例（补丁未生效），
      // 二次 create 会复用同一实例并覆盖 _wasmPaths，导致 predict 必败
      // （wasm 被当目录 fetch → 拿到 index.html → magic word 错误）。
      if (sessionZh === sessionShared) {
        throw new Error('TtsSession 复用了同一实例（单例补丁未生效），中英文会话必须独立')
      }
      if (sessionZh?.ready) {
        emitProgress(100, '完成')
        emit('ready')
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
 * Uses en_US-lessac-medium voice (American English, female, clear) and
 * zh_CN-huayan-medium (Mandarin) for Chinese text.
 */
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<DownloadStatus>(_status)
  const [progress, setProgress] = useState<{ pct: number; label: string }>({
    pct: _progress,
    label: _progressLabel,
  })

  // Sync shared status into local state
  useEffect(() => onStatusChange(setStatus), [])
  // Sync shared download progress into local state
  useEffect(() => onProgressChange(setProgress), [])

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
    (text: string, rate: number, onEnded?: () => void, lang: 'en' | 'zh' = 'en') => {
      try {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
          console.error('系统 TTS 不可用，且 Piper 失败')
          return
        }
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)
        // 按文本语言选择系统语音：中文走 zh-CN，英文走 en-US。
        const voiceLang = lang === 'zh' ? 'zh-CN' : 'en-US'
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
        u.onerror = () => {
          setSpeaking(false)
          // 系统 TTS 也失败：仍然走完回调链，避免听词自动连播卡死。
          onEnded?.()
        }
        window.speechSynthesis.speak(u)
      } catch (e) {
        console.error('fallback TTS failed:', e)
        setSpeaking(false)
      }
    },
    [],
  )

  // Ensure session: wait for download if in progress, trigger download if idle
  const ensureSession = useCallback(async (lang: 'en' | 'zh' = 'en') => {
    const sess = lang === 'zh' ? sessionZh : sessionShared
    if (sess?.ready) return sess
    if (_status === 'downloading') {
      await initPromiseShared
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
      setLoading(false)
      return lang === 'zh' ? sessionZh : sessionShared!
    } catch (err) {
      setLoading(false)
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Piper 初始化失败:', err)
      throw new Error('Piper init failed: ' + msg)
    }
  }, [])

  const speak = useCallback(
    async (text: string, rate = 0.9, onEnded?: () => void, lang: 'en' | 'zh' = 'en') => {
      if (!text) return

      // ── 浏览器环境：直接用原生 SpeechSynthesis，不加载模型、不联网 ──
      if (!isCapacitor) {
        if (!synthAvailable) {
          console.warn('浏览器环境 speechSynthesis 不可用')
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
        const session = await ensureSession(lang)
        if (!session) {
          console.error('ensureSession 返回空 session')
          setSpeaking(false)
          return
        }

        setSpeaking(true)
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
          console.error('Piper predict failed, fallback to system TTS:', pe, pm)
          setSpeaking(false)
          // 回退：用 WebView 内置系统语音合成（不需要模型、不需要联网）
          fallbackSpeechSynthesis(text, rate, onEnded, lang)
          return
        }

        // 主路径：<audio> 元素播放 blob wav（真机此前验证可正常出声）。
        // WebView 对 blob:wav 的 <audio> 支持稳定，且点击手势内 play() 不受自动播放限制。
        const url = URL.createObjectURL(audioBlob)
        const audio = new Audio(url)
        audio.playbackRate = rate
        // 用 HTMLAudioElement 持有，stop() 时 pause+revoke
        audioSharedHtml = audio

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
        // <audio> 失败与 play() 被拒绝都可能触发回退；用标志防重入，避免双次播放。
        let webAudioTried = false
        const tryWebAudio = () => {
          if (webAudioTried) return
          webAudioTried = true
          playViaWebAudio(audioBlob, rate, id, onEnded, setSpeaking, url)
        }
        audio.onerror = () => {
          // <audio> 失败时回退 Web Audio（decodeAudioData + bufferSource）
          console.warn('HTMLAudio onerror（blob 无法播放，可能 WebView 不支持 blob:wav）', url)
          tryWebAudio()
        }
        const p = audio.play()
        if (p && typeof p.catch === 'function') {
          p.catch((e) => {
            // play() 被拒绝（如自动播放策略）：尝试 Web Audio 兜底
            console.warn(`HTMLAudio play() 被拒绝: ${String(e)}`)
            tryWebAudio()
          })
        }
      } catch (err) {
        console.error('Piper TTS speak failed:', err)
        setSpeaking(false)
        // ensureSession/downloadModel 失败（模型未就绪且重试失败）：回退系统 TTS，保证至少能出声。
        fallbackSpeechSynthesis(text, rate, onEnded, lang)
      }
    },
    [ensureSession, fallbackSpeechSynthesis],
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
  }
}
