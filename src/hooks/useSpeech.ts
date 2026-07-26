import { useCallback, useRef, useState } from 'react'

/**
 * Text-to-speech via Piper WASM (local inference, no system TTS needed).
 * Uses en_US-lessac-medium voice (American English, female, clear).
 * On first click, downloads ~60MB Piper model from CDN (one-time).
 * Subsequent clicks synthesize in milliseconds.
 */
export function useSpeech() {
  const [supported, setSupported] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const sessionRef = useRef<any>(null)
  const initPromiseRef = useRef<Promise<any> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const reqIdRef = useRef(0)

  // Lazy initialize Piper TTS on first use
  const ensureSession = useCallback(async () => {
    if (sessionRef.current?.ready) return sessionRef.current

    if (initPromiseRef.current) {
      return initPromiseRef.current
    }

    setLoading(true)
    initPromiseRef.current = (async () => {
      try {
        const { TtsSession } = await import('@realtimex/piper-tts-web')
        const session = await TtsSession.create({
          voiceId: 'en_US-lessac-medium',
        })
        sessionRef.current = session
        setLoading(false)
        return session
      } catch (err) {
        console.error('Piper TTS init failed:', err)
        setSupported(false)
        setLoading(false)
        throw err
      }
    })()

    return initPromiseRef.current
  }, [])

  const speak = useCallback(
    async (text: string, rate = 0.9) => {
      if (!supported || !text) return

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        URL.revokeObjectURL(audioRef.current.src)
        audioRef.current = null
      }

      // Invalidate stale requests (rapid multi-click)
      const id = ++reqIdRef.current

      try {
        const session = await ensureSession()
        if (id !== reqIdRef.current) return // stale

        setSpeaking(true)
        const audioBlob = await session.predict(text)
        if (id !== reqIdRef.current) return // stale

        const url = URL.createObjectURL(audioBlob)
        const audio = new Audio(url)
        audio.playbackRate = rate
        audioRef.current = audio

        audio.onended = () => {
          setSpeaking(false)
          URL.revokeObjectURL(url)
          audioRef.current = null
        }
        audio.onerror = () => {
          setSpeaking(false)
          URL.revokeObjectURL(url)
          audioRef.current = null
        }
        await audio.play()
      } catch (err) {
        console.error('Piper TTS speak failed:', err)
        setSpeaking(false)
      }
    },
    [supported, ensureSession],
  )

  return { speak, speaking, supported, loading }
}
