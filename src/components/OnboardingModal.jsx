import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { GENRES, ONBOARDING_GENRE_IDS } from '../constants'

const AVAILABLE_GENRES = GENRES.filter((genre) =>
  ONBOARDING_GENRE_IDS.includes(genre.id),
)

function OnboardingModal({
  onSave,
  initialInterests = [],
  onCancel,
  onSkip,
  editing = false,
}) {
  const [selected, setSelected] = useState(() => initialInterests.map(Number))

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return
      if (onCancel) onCancel()
      else if (onSkip) onSkip()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onCancel, onSkip])

  const toggleGenre = (id) => {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((genreId) => genreId !== id)
        : [...previous, id],
    )
  }

  const handleSubmit = () => {
    if (!selected.length) return
    onSave?.(selected)
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/90 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-heading"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-zinc-950 p-6 text-center shadow-2xl sm:max-h-[90dvh] sm:rounded-3xl md:p-8"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E50914]">
          {editing ? 'Personalize DannaFlix' : 'Welcome to DannaFlix'}
        </span>
        <h2
          id="onboarding-heading"
          className="mb-3 mt-1 text-2xl font-black uppercase tracking-tighter text-white"
        >
          {editing ? 'Update your interests' : 'Choose your interests'}
        </h2>
        <p className="mb-6 text-xs leading-5 text-zinc-400">
          Select genres you love to personalize your feed. You can change this anytime in
          Settings — no account needed.
        </p>

        <div className="mb-6 grid grid-cols-2 gap-3">
          {AVAILABLE_GENRES.map((genre) => {
            const isSelected = selected.includes(genre.id)

            return (
              <button
                key={genre.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleGenre(genre.id)}
                className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-left text-xs font-bold transition-all ${
                  isSelected
                    ? 'border-[#E50914] bg-[#E50914] text-white shadow-lg shadow-[#E50914]/20'
                    : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <span>{genre.name}</span>
                {isSelected ? <Check size={14} /> : null}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selected.length}
          className={`w-full cursor-pointer rounded-xl py-3 text-xs font-black uppercase tracking-wider transition-all ${
            selected.length > 0
              ? 'bg-white text-black hover:bg-zinc-200'
              : 'cursor-not-allowed bg-zinc-800 text-zinc-500'
          }`}
        >
          {editing ? 'Save interests' : "Let's start browsing"}
        </button>

        {editing && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="mt-3 w-full rounded-xl py-3 text-xs font-bold text-zinc-400 transition hover:text-white"
          >
            Cancel
          </button>
        ) : null}

        {!editing && onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="mt-3 w-full rounded-xl py-3 text-xs font-bold text-zinc-500 transition hover:text-white"
          >
            Skip for now
          </button>
        ) : null}
      </motion.div>
    </div>
  )
}

export default OnboardingModal
