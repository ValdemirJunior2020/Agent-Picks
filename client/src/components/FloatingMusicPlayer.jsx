// client/src/components/FloatingMusicPlayer.jsx
import { useEffect, useRef, useState } from 'react'
import { Music, Pause, Play, Volume2, VolumeX } from 'lucide-react'

export default function FloatingMusicPlayer() {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const startMusic = async () => {
    const audio = audioRef.current

    if (!audio) return

    try {
      audio.volume = 0.45
      audio.loop = true
      await audio.play()
      setIsPlaying(true)
      setIsBlocked(false)
    } catch (error) {
      setIsPlaying(false)
      setIsBlocked(true)
    }
  }

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) return

    audio.volume = 0.45
    audio.loop = true

    startMusic()

    const startAfterFirstClick = async () => {
      if (!audio.paused) return

      try {
        await audio.play()
        setIsPlaying(true)
        setIsBlocked(false)
        window.removeEventListener('click', startAfterFirstClick)
        window.removeEventListener('keydown', startAfterFirstClick)
        window.removeEventListener('touchstart', startAfterFirstClick)
      } catch (error) {
        setIsPlaying(false)
        setIsBlocked(true)
      }
    }

    window.addEventListener('click', startAfterFirstClick)
    window.addEventListener('keydown', startAfterFirstClick)
    window.addEventListener('touchstart', startAfterFirstClick)

    return () => {
      window.removeEventListener('click', startAfterFirstClick)
      window.removeEventListener('keydown', startAfterFirstClick)
      window.removeEventListener('touchstart', startAfterFirstClick)
    }
  }, [])

  const handlePlayPause = async () => {
    const audio = audioRef.current

    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    await startMusic()
  }

  const handleMute = () => {
    const audio = audioRef.current

    if (!audio) return

    audio.muted = !audio.muted
    setIsMuted(audio.muted)
  }

  return (
    <>
      <audio ref={audioRef} src="/music.mp3" preload="auto" />

      <div className="fixed bottom-5 right-5 z-[9999]">
        <div className="rounded-[1.5rem] border-2 border-amber-300 bg-gradient-to-br from-amber-500 via-rose-600 to-emerald-700 p-1 shadow-2xl">
          <div className="rounded-[1.25rem] bg-stone-950/90 p-3 text-white backdrop-blur">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-300 text-stone-950 shadow">
                <Music className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">
                  Agent Picks Music
                </p>

                <p className="text-xs font-semibold text-stone-200">
                  {isPlaying
                    ? 'Playing now'
                    : isBlocked
                      ? 'Click anywhere to start'
                      : 'Paused'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePlayPause}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black shadow transition ${
                  isPlaying
                    ? 'bg-rose-500 text-white hover:bg-rose-600'
                    : 'bg-emerald-400 text-stone-950 hover:bg-emerald-300'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleMute}
                className="flex items-center justify-center rounded-full bg-amber-300 px-3 py-2 text-stone-950 shadow transition hover:bg-amber-200"
                title={isMuted ? 'Unmute music' : 'Mute music'}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>

            {isBlocked && (
              <p className="mt-2 max-w-[230px] text-xs font-semibold text-amber-100">
                Browser blocked autoplay. Click anywhere on the page once.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}