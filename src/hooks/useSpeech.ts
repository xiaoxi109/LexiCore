import { useCallback, useEffect, useState } from 'react'

// ─── Module-level shared state (all SpeakerBtn & header button share one session) ───
type DownloadStatus = 'idle' | 'downloading' | 'ready' | 'error'

let _status: DownloadStatus = 'idle'
let sessionShared: any = null
let initPromiseShared: Promise<void> | null = null
let audioShared: HTMLAudioElement | null = null
let reqIdShared = 0

const subscribers = new Set<(s: DownloadStatus) => void>()

function emit(s: DownloadStatus) {
  _status = s
  subscribers.forEach((fn) => fn(s))
}

/** Subscribe to shared download status. Returns unsubscribe function. */
function onStatusChange(fn: (s: DownloadStatus) => void) {
  subscribers.add(fn)
  return () => { subscribers.delete(fn) }
}

/** Manually trigger model download. Safe to call multiple times. */
export async function downloadModel(): Promise<void> {
  if (_status === 'ready') return
  if (_status === 'downloading') return initPromiseShared!

  emit('downloading')
  initPromiseShared = (async () => {
    try {
      const { TtsSession } = await import('@realtimex/piper-tts-web')
      sessionShared = await TtsSession.create({ voiceId: 'en_US-lessac-medium' })
      if (sessionShared?.ready) {
        emit('ready')
      } else {
        throw new Error('TtsSession not ready after create')
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

/**
 * Text-to-speech via Piper WASM (local inference, no system TTS needed).
 * Uses en_US-lessac-medium voice (American English, female, clear).
 */
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<DownloadStatus>(_status)
  const supported = true // Piper works on any modern browser with WASM

  // Sync shared status into local state
  useEffect(() => onStatusChange(setStatus), [])

  // Ensure session: wait for download if in progress, trigger download if idle
  const ensureSession = useCallback(async () => {
    if (_status === 'ready' && sessionShared?.ready) return sessionShared
    if (_status === 'downloading') {
      await initPromiseShared
      return sessionShared!
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
      return sessionShared!
    } catch {
      setLoading(false)
      throw new Error('Piper init failed')
    }
  }, [])

  const speak = useCallback(
    async (text: string, rate = 0.9) => {
      if (!text) return

      // Stop currently playing audio
      if (audioShared) {
        audioShared.pause()
        URL.revokeObjectURL(audioShared.src)
        audioShared = null
      }

      const id = ++reqIdShared

      try {
        const session = await ensureSession()
        if (id !== reqIdShared) return

        setSpeaking(true)
        const audioBlob = await session.predict(text)
        if (id !== reqIdShared) return

        const url = URL.createObjectURL(audioBlob)
        const audio = new Audio(url)
        audio.playbackRate = rate
        audioShared = audio

        audio.onended = () => {
          setSpeaking(false)
          URL.revokeObjectURL(url)
          audioShared = null
        }
        audio.onerror = () => {
          setSpeaking(false)
          URL.revokeObjectURL(url)
          audioShared = null
        }
        await audio.play()
      } catch (err) {
        console.error('Piper TTS speak failed:', err)
        setSpeaking(false)
      }
    },
    [ensureSession],
  )

  return { speak, speaking, supported, loading, downloadStatus: status }
}
