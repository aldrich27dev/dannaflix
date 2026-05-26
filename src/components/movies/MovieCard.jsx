import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { getMovieVideos, imageUrl } from '../../services/tmdb'

function MovieCard({ movie, onSelect }) {
  const [hovered, setHovered] = useState(false)
  const [trailerKey, setTrailerKey] = useState(null)
  const hoverTimeoutRef = useRef(null)

  const poster = imageUrl(movie?.poster_path, 'w500')
  const title = movie?.title ?? movie?.name ?? 'Untitled'
  const year = movie?.release_date
    ? movie.release_date.slice(0, 4)
    : movie?.first_air_date
      ? movie.first_air_date.slice(0, 4)
      : 'New'
  const rating = movie?.vote_average ? movie.vote_average.toFixed(1) : '0.0'
  const progress = Number(movie?.progress ?? 0)
  const isSavedWatch = Boolean(movie?.mediaType)
  const mediaLabel =
    movie?.mediaType === 'tv'
      ? 'Series'
      : movie?.mediaType === 'movie'
        ? 'Movie'
        : 'Watch'

  useEffect(() => {
    if (!hovered || trailerKey || !movie?.id) return

    hoverTimeoutRef.current = window.setTimeout(() => {
      const type = movie.first_air_date ? 'tv' : 'movie'

      getMovieVideos(movie.id, type)
        .then((data) => {
          const clip = data?.results?.find(
            (video) =>
              video.site === 'YouTube' &&
              (video.type === 'Trailer' || video.type === 'Teaser'),
          )

          if (clip) {
            setTrailerKey(clip.key)
          }
        })
        .catch(() => {})
    }, 350)

    return () => {
      window.clearTimeout(hoverTimeoutRef.current)
    }
  }, [hovered, movie?.id, movie?.first_air_date, trailerKey])

  useEffect(
    () => () => {
      window.clearTimeout(hoverTimeoutRef.current)
    },
    [],
  )

  return (
    <motion.button
      type="button"
      onClick={() => onSelect?.(movie)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        window.clearTimeout(hoverTimeoutRef.current)
      }}
      whileHover={{ scale: 1.06, y: -6 }}
      whileTap={{ scale: 0.98 }}
      className="group relative w-36 snap-start flex-none overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition focus:outline-none focus:ring-2 focus:ring-[#E50914] sm:w-40 md:w-44 lg:w-48"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        {poster ? (
          <img
            src={poster}
            alt={title}
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-110 ${
              hovered && trailerKey ? 'opacity-0' : 'opacity-100'
            }`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(229,9,20,0.25),_transparent_45%),linear-gradient(180deg,_#202020,_#0c0c0c)] text-xs uppercase tracking-[0.35em] text-white/30">
            No poster
          </div>
        )}

        {hovered && trailerKey ? (
          <div className="absolute inset-0 hidden bg-black md:block">
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1`}
              className="h-full w-full scale-105 object-cover"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              title={`${title} trailer`}
            />
          </div>
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between text-xs text-white/80">
          <span className="rounded-full bg-black/45 px-2 py-1 backdrop-blur">
            {year}
          </span>
          <div className="flex items-center gap-2">
            {isSavedWatch ? (
              <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.28em] backdrop-blur">
                {mediaLabel}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 backdrop-blur">
              <Star className="h-3 w-3 fill-[#E50914] text-[#E50914]" />
              {rating}
            </span>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="space-y-2">
            <p className="line-clamp-2 text-sm font-semibold text-white">
              {title}
            </p>
            {isSavedWatch ? (
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#E50914] transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.button>
  )
}

export default MovieCard
