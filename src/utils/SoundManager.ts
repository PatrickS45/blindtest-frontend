/**
 * Sound Manager for Trivia Mode
 * Handles all sound effects for the trivia game mode
 */

export type TriviaSoundType =
  | 'countdown'
  | 'countdownUrgent'
  | 'timeUp'
  | 'correct'
  | 'wrong'
  | 'reveal'
  | 'nextQuestion'

export class SoundManager {
  private volume: number
  private sounds: Map<TriviaSoundType, HTMLAudioElement>
  private enabled: boolean

  constructor(volume: number = 80) {
    this.volume = volume / 100
    this.sounds = new Map()
    this.enabled = true
    this.loadSounds()
  }

  private loadSounds() {
    const soundFiles: Record<TriviaSoundType, string> = {
      countdown: '/sounds/trivia/countdown.mp3',
      countdownUrgent: '/sounds/trivia/countdown_urgent.mp3',
      timeUp: '/sounds/trivia/time_up.mp3',
      correct: '/sounds/correct_1.mp3', // Use existing correct sound
      wrong: '/sounds/wrong_1.mp3', // Use existing wrong sound
      reveal: '/sounds/trivia/reveal.mp3',
      nextQuestion: '/sounds/trivia/next_question.mp3',
    }

    for (const [key, path] of Object.entries(soundFiles)) {
      try {
        const audio = new Audio(path)
        audio.volume = this.volume
        audio.preload = 'auto'
        this.sounds.set(key as TriviaSoundType, audio)
      } catch (error) {
        console.warn(`Failed to load sound: ${path}`, error)
      }
    }
  }

  play(soundName: TriviaSoundType) {
    if (!this.enabled) return

    const sound = this.sounds.get(soundName)
    if (sound) {
      // Reset to beginning if already playing
      sound.currentTime = 0
      sound.play().catch((err) => {
        console.warn(`Error playing sound ${soundName}:`, err)
      })
    } else {
      console.warn(`Sound not found: ${soundName}`)
    }
  }

  stop(soundName: TriviaSoundType) {
    const sound = this.sounds.get(soundName)
    if (sound) {
      sound.pause()
      sound.currentTime = 0
    }
  }

  stopAll() {
    this.sounds.forEach((sound) => {
      sound.pause()
      sound.currentTime = 0
    })
  }

  setVolume(volume: number) {
    this.volume = volume / 100
    this.sounds.forEach((sound) => {
      sound.volume = this.volume
    })
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!enabled) {
      this.stopAll()
    }
  }

  preload() {
    // Preload all sounds by playing them silently
    const originalVolume = this.volume
    this.setVolume(0)
    this.sounds.forEach((sound) => {
      sound.play().then(() => {
        sound.pause()
        sound.currentTime = 0
      }).catch(() => {
        // Ignore errors during preload
      })
    })
    this.setVolume(originalVolume * 100)
  }
}

// Singleton instance
let soundManagerInstance: SoundManager | null = null

export function getSoundManager(volume: number = 80): SoundManager {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager(volume)
  }
  return soundManagerInstance
}

export function resetSoundManager() {
  if (soundManagerInstance) {
    soundManagerInstance.stopAll()
    soundManagerInstance = null
  }
}
