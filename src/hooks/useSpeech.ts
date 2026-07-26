import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Text-to-speech via the Web Speech API (browser built-in, no audio files).
 * Picks a British-English voice when available, falls back to any en voice.
 */
export function useSpeech() {
  const [supported, setSupported] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false)
      return
    }
    const pick = () => {
      const voices = window.speechSynthesis.getVoices()
      if (!voices.length) return
      voiceRef.current =
        voices.find((v) => v.lang === 'en-GB') ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0]
    }
    pick()
    window.speechSynthesis.onvoiceschanged = pick
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  const speak = useCallback(
    (text: string, rate = 0.9) => {
      if (!supported || !text) return
      const synth = window.speechSynthesis
      synth.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-GB'
      u.rate = rate
      if (voiceRef.current) u.voice = voiceRef.current
      u.onstart = () => setSpeaking(true)
      u.onend = () => setSpeaking(false)
      u.onerror = () => setSpeaking(false)
      synth.speak(u)
    },
    [supported],
  )

  return { speak, speaking, supported }
}
