import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Star } from 'lucide-react'
import { getMovieVideos, imageSrcSet, imageUrl } from '../../services/tmdb'

function isTVTitle(movie) {
  return (
    movie?.media_type === 'tv' ||
    movie?.first_air_date !== undefined ||
    (movie?.name !== undefined && movie?.title === undefined)
  )
}

function MovieCard({ movie, onSelect, variant = 'row' }) {
  const [hovered, setHovered] = useState(false)
  const [trailerKey, setTrailerKey] = useState(null)
  const hoverTimeoutRef = useRef(null)

  const isGrid = variant === 'grid'
  const poster = imageUrl(movie?.poster_path, 'w500')
  const posterSrcSet = imageSrcSet(movie?.poster_path, ['w342', 'w500', 'w780'])
  const title = movie?.title ?? movie?.name ?? 'Untitled'
  const year = movie?.release_date
    ? movie.release_date.slice(0, 4)
    : movie?.first_air_date
      ? movie.first_air_date.slice(0, 4)
      : 'New'
  const rating = movie?.vote_average ? movie.vote_average.toFixed(1) : '0.0'
  const progress = Number(movie?.progress ?? 0)
  const isTV = isTVTitle(movie)
  const mediaLabel = isTV ? 'Series' : 'Movie'

  useEffect(() => {
    if (!hovered || trailerKey || !movie?.id) return

    hoverTimeoutRef.current = window.setTimeout(() => {
      getMovieVideos(movie.id, isTV ? 'tv' : 'movie')
        .then((data) => {
          const clip = data?.results?.find(
            (video) =>
              video.site === 'YouTube' &&
              (video.type === 'Trailer' || video.type === 'Teaser'),
          )

          if (clip?.key) {
            setTrailerKey(clip.key)
          }
        })
        .catch(() => {})
    }, 500)

    return () => {
      window.clearTimeout(hoverTimeoutRef.current)
    }
  }, [hovered, isTV, movie?.id, trailerKey])

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
      whileHover={isGrid ? { scale: 1.03, y: -4 } : { scale: 1.06, y: -6 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative snap-start overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition focus:outline-none focus:ring-2 focus:ring-[#E50914] ${
        isGrid ? 'w-full' : 'w-36 flex-none sm:w-40 md:w-44 lg:w-48'
      }`}
      aria-label={`${title}${year && year !== 'New' ? `, ${year}` : ''}`}
      title={title}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        {poster ? (
          <img
            src={poster}
            srcSet={posterSrcSet}
            sizes={
              isGrid
                ? '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw'
                : '(max-width: 640px) 144px, (max-width: 768px) 160px, (max-width: 1024px) 176px, 192px'
            }
            alt={title}
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-110 ${
              hovered && trailerKey ? 'opacity-0' : 'opacity-100'
            }`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(229,9,20,0.25),_transparent_45%),linear-gradient(180deg,_#202020,_#0c0c0c)] text-xs uppercase tracking-[0.35em] text-white/30">
            No poster
          </div>
        )}

        {hovered && trailerKey ? (
          <div className="absolute inset-0 hidden bg-black md:block">
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1`}
              className="pointer-events-none h-full w-full scale-105 object-cover"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              loading="lazy"
              referrerPolicy="no-referrer"
              title={`${title} trailer`}
            />
          </div>
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />

        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 text-xs text-white/80">
          <span className="rounded-full bg-black/45 px-2 py-1 backdrop-blur">{year}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 backdrop-blur">
            <Star className="h-3 w-3 fill-[#E50914] text-[#E50914]" />
            {rating}
          </span>
        </div>

        <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/60 text-white shadow-lg backdrop-blur">
            <Play size={18} fill="currentColor" />
          </span>
        </span>

        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/10 bg-black/55 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
                {mediaLabel}
              </span>
              {movie?.recommendationReason ? (
                <span className="rounded-full border border-white/15 bg-black/60 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/75 backdrop-blur">
                  {movie.recommendationReason === 'genre' ? 'Your genres' : 'Recent'}
                </span>
              ) : null}
            </div>
            <p className="line-clamp-2 text-sm font-semibold text-white">{title}</p>
            {progress > 0 ? (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#E50914] transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.button>
  )
}

export default MovieCard
