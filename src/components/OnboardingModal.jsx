import { useState } from 'react'
import { motion } from 'framer-motion'

const AVAILABLE_GENRES = [
  { id: 28, name: 'Action' },
  { id: 27, name: 'Horror' },
  { id: 878, name: 'Sci-Fi' },
  { id: 35, name: 'Comedy' },
  { id: 10749, name: 'Romance' },
  { id: 53, name: 'Thriller' },
  { id: 14, name: 'Fantasy' },
  { id: 18, name: 'Drama' },
]

function OnboardingModal({ onSave }) {
  const [selected, setSelected] = useState([])

  const toggleGenre = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((genreId) => genreId !== id) : [...prev, id],
    )
  }

  const handleSubmit = () => {
    if (!selected.length) return

    window.localStorage.setItem('dannaflix_interests', JSON.stringify(selected))
    onSave?.(selected)
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 text-center shadow-2xl md:p-8"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E50914]">
          Welcome to Dannaflix
        </span>
        <h2 className="mt-1 mb-3 text-2xl font-black uppercase tracking-tighter text-white">
          Choose your interests
        </h2>
        <p className="mb-6 text-xs text-zinc-400">
          Select genres you love to personalize your feed immediately.
        </p>

        <div className="mb-6 grid grid-cols-2 gap-3">
          {AVAILABLE_GENRES.map((genre) => {
            const isSelected = selected.includes(genre.id)

            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => toggleGenre(genre.id)}
                className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-left text-xs font-bold transition-all ${
                  isSelected
                    ? 'border-[#E50914] bg-[#E50914] text-white shadow-lg shadow-[#E50914]/20'
                    : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <span>{genre.name}</span>
                {isSelected ? <span className="text-[10px]">+</span> : null}
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
          Let's Start Browsing
        </button>
      </motion.div>
    </div>
  )
}

export default OnboardingModal
