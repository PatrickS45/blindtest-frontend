'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseAudioOptions {
  volume?: number
  loop?: boolean
  autoPlay?: boolean
}

interface UseAudioReturn {
  play: () => Promise<void>
  pause: () => void
  stop: () => void
  setVolume: (volume: number) => void
  isPlaying: boolean
  duration: number
  currentTime: number
  error: string | null
}

/**
 * Custom hook for audio playback management
 */
export function useAudio(
  src?: string,
  options: UseAudioOptions = {}
): UseAudioReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const { volume = 1.0, loop = false, autoPlay = false } = options

  // Initialize audio element
  useEffect(() => {
    if (!src) return

    const audio = new Audio(src)
    audio.volume = volume
    audio.loop = loop

    // Event listeners
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration)
    })

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime)
    })

    audio.addEventListener('ended', () => {
      setIsPlaying(false)
      setCurrentTime(0)
    })

    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e)
      setError('Failed to load audio')
      setIsPlaying(false)
    })

    audioRef.current = audio

    if (autoPlay) {
      audio.play().catch((err) => {
        console.error('Autoplay failed:', err)
        setError('Autoplay blocked by browser')
      })
    }

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [src, volume, loop, autoPlay])

  const play = useCallback(async () => {
    if (!audioRef.current) return

    try {
      await audioRef.current.play()
      setIsPlaying(true)
      setError(null)
    } catch (err) {
      console.error('Play failed:', err)
      setError('Failed to play audio')
    }
  }, [])

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }, [])

  const setVolumeCallback = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume))
    }
  }, [])

  return {
    play,
    pause,
    stop,
    setVolume: setVolumeCallback,
    isPlaying,
    duration,
    currentTime,
    error,
  }
}

/**
 * Hook for playing sound effects
 */
export function useSoundEffect() {
  const play = useCallback((soundPath: string, volume = 1.0) => {
    const audio = new Audio(soundPath)
    audio.volume = volume
    audio.play().catch((err) => {
      console.error('Sound effect failed:', err)
    })
  }, [])

  const playBuzzer = useCallback((buzzerNumber: number) => {
    const buzzerPath = `/sounds/buzzer_${buzzerNumber}.mp3`
    play(buzzerPath, 0.7)
  }, [play])

  const playCorrect = useCallback(() => {
    const randomCorrect = Math.random() < 0.5 ? 1 : 2
    play(`/sounds/correct_${randomCorrect}.mp3`, 0.6)
  }, [play])

  const playWrong = useCallback(() => {
    const randomWrong = Math.random() < 0.5 ? 1 : 2
    play(`/sounds/wrong_${randomWrong}.mp3`, 0.6)
  }, [play])

  const playTimeout = useCallback(() => {
    play('/sounds/timeout_1.mp3', 0.5)
  }, [play])

  return {
    play,
    playBuzzer,
    playCorrect,
    playWrong,
    playTimeout,
  }
}
