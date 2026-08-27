export type UiSound = 'login' | 'logout' | 'navigation'

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  const AudioContextConstructor = window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextConstructor) return null

  audioContext ??= new AudioContextConstructor()
  return audioContext
}

function playTone(context: AudioContext, frequency: number, startTime: number, duration: number, volume: number) {
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(frequency, startTime)
  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration + 0.02)
}

export function playUiSound(sound: UiSound): void {
  const context = getAudioContext()
  if (!context) return

  const sequences: Record<UiSound, Array<[number, number, number, number]>> = {
    login: [[523.25, 0, 0.16, 0.055], [659.25, 0.1, 0.24, 0.065]],
    logout: [[493.88, 0, 0.16, 0.05], [349.23, 0.1, 0.24, 0.055]],
    navigation: [[440, 0, 0.1, 0.035]],
  }

  const play = () => {
    for (const [frequency, offset, duration, volume] of sequences[sound]) {
      playTone(context, frequency, context.currentTime + offset, duration, volume)
    }
  }

  if (context.state === 'suspended') {
    void context.resume().then(play).catch(() => undefined)
  } else {
    play()
  }
}
