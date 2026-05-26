import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { getMovieVideos } from '../services/tmdb'

function Hero({ movie, onPlay }) {
  const [trailerKey, setTrailerKey] = useState(null)

  useEffect(() => {
    let mounted = true

    async function loadTrailer() {
      if (!movie) return

      try {
        const data = await getMovieVideos(movie.id, movie.first_air_date ? 'tv' : 'movie')
        if (!mounted) return

        const trailer = data.results?.find(
          (v) => v.site === 'YouTube' && v.type === 'Trailer',
        )

        if (trailer) setTrailerKey(trailer.key)
      } catch (err) {
        console.error(err)
      }
    }

    loadTrailer()

    return () => {
      mounted = false
    }
  }, [movie])

  if (!movie) {
    return <div className="h-[65vh] animate-pulse bg-zinc-950 sm:h-[70vh] md:h-[85vh]" />
  }

  return (
    <div className="relative h-[65vh] w-full select-none overflow-hidden bg-black sm:h-[70vh] md:h-[85vh]">
      <div className="absolute inset-0 h-full w-full overflow-hidden pointer-events-none">
        {trailerKey ? (
          <div className="absolute left-1/2 top-1/2 h-full min-h-[56.25vw] w-[177.77777778vh] min-w-full -translate-x-1/2 -translate-y-1/2 aspect-video opacity-50 mix-blend-screen md:opacity-60">
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&playsinline=1&enablejsapi=1`}
              className="h-full w-full border-0 object-cover"
              allow="autoplay; encrypted-media"
              title="Hero Trailer"
            />
          </div>
        ) : (
          <img
            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path || movie.poster_path}`}
            className="h-full w-full object-cover opacity-50"
            alt="Hero Background"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-[#0a0a0a]/80 via-transparent to-transparent md:block" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 flex h-full max-w-2xl flex-col justify-end space-y-3 p-6 pb-16 md:space-y-4 md:p-12 md:pb-12">
        <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-[#E50914] drop-shadow-md md:text-[10px]">
          Spotlight
        </span>

        <h1 className="max-w-sm truncate-3-lines text-2xl font-black uppercase leading-none tracking-tighter text-white drop-shadow-lg sm:max-w-xl sm:text-4xl md:text-6xl">
          {movie.title || movie.name}
        </h1>

        <p className="max-w-xs text-[11px] font-semibold leading-relaxed text-zinc-300 drop-shadow sm:max-w-md md:text-sm line-clamp-3 md:line-clamp-4">
          {movie.overview}
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => onPlay(movie)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-black/40 transition-all hover:bg-zinc-200 active:scale-95 sm:w-auto md:py-3"
          >
            <Play size={14} fill="currentColor" />
            Play Trailer
          </button>
        </div>
      </div>
    </div>
  )
}

export default Hero
