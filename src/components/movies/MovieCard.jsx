import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { imageUrl } from '../../services/tmdb'

function MovieCard({ movie, onSelect }) {
  const poster = imageUrl(movie?.poster_path, 'w500')
  const title = movie?.title ?? movie?.name ?? 'Untitled'
  const year = movie?.release_date ? movie.release_date.slice(0, 4) : 'New'
  const rating = movie?.vote_average ? movie.vote_average.toFixed(1) : '0.0'

  return (
    <motion.button
      type="button"
      onClick={() => onSelect?.(movie)}
      whileHover={{ scale: 1.06, y: -6 }}
      whileTap={{ scale: 0.98 }}
      className="group relative w-36 snap-start flex-none overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition focus:outline-none focus:ring-2 focus:ring-[#E50914] sm:w-40 md:w-44 lg:w-48"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        {poster ? (
          <img
            src={poster}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(229,9,20,0.25),_transparent_45%),linear-gradient(180deg,_#202020,_#0c0c0c)] text-xs uppercase tracking-[0.35em] text-white/30">
            No poster
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between text-xs text-white/80">
          <span className="rounded-full bg-black/45 px-2 py-1 backdrop-blur">
            {year}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 backdrop-blur">
            <Star className="h-3 w-3 fill-[#E50914] text-[#E50914]" />
            {rating}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="line-clamp-2 text-sm font-semibold text-white">
            {title}
          </p>
        </div>
      </div>
    </motion.button>
  )
}

export default MovieCard
