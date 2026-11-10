import { useEffect, useState } from 'react'
import { Info, Play, Star } from 'lucide-react'
import { getMovieVideos, imageSrcSet, imageUrl } from '../services/tmdb'

function Hero({ movie, genres = [], onPlay, onDetails }) {
  const [trailerKey, setTrailerKey] = useState(null)

  useEffect(() => {
    if (!movie?.id) return undefined

    let mounted = true
    const controller = new AbortController()
    const isTV =
      movie.media_type === 'tv' ||
      movie.first_air_date !== undefined ||
      (movie.name !== undefined && movie.title === undefined)

    getMovieVideos(movie.id, isTV ? 'tv' : 'movie', { signal: controller.signal })
      .then((data) => {
        if (!mounted) return
        const trailer =
          data?.results?.find(
            (video) => video.site === 'YouTube' && video.type === 'Trailer' && video.key,
          ) ??
          data?.results?.find(
            (video) => video.site === 'YouTube' && video.type === 'Teaser' && video.key,
          )
        setTrailerKey(trailer?.key ?? null)
      })
      .catch(() => {
        if (mounted) setTrailerKey(null)
      })

    return () => {
      mounted = false
      controller.abort()
    }
  }, [movie])

  if (!movie) {
    return (
      <div className="h-[74svh] min-h-[520px] max-h-[700px] animate-pulse bg-zinc-950 sm:h-[72vh] sm:max-h-none md:h-[86vh]" />
    )
  }

  const isTV =
    movie.media_type === 'tv' ||
    movie.first_air_date !== undefined ||
    (movie.name !== undefined && movie.title === undefined)
  const title = movie.title || movie.name
  const year = movie.release_date?.slice(0, 4) ?? movie.first_air_date?.slice(0, 4)
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null
  const genreNames =
    Array.isArray(movie.genres) && movie.genres.length
      ? movie.genres
          .map((genre) => (typeof genre === 'string' ? genre : genre.name))
          .filter(Boolean)
      : (movie.genre_ids ?? [])
          .map((id) => genres.find((genre) => String(genre.id) === String(id))?.name)
          .filter(Boolean)
  const backdrop = imageUrl(movie.backdrop_path || movie.poster_path, 'w1280')
  const backdropSrcSet = imageSrcSet(movie.backdrop_path || movie.poster_path, ['w780', 'w1280'])

  return (
    <section className="relative h-[74svh] min-h-[520px] max-h-[700px] w-full select-none overflow-hidden bg-[#060607] sm:h-[72vh] sm:max-h-none md:h-[86vh]">
      <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden">
        {backdrop ? (
          <img
            src={backdrop}
            srcSet={backdropSrcSet}
            sizes="100vw"
            className="h-full w-full object-cover object-[center_26%] opacity-90 sm:opacity-75"
            alt=""
            fetchPriority="high"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(229,9,20,0.25),transparent_45%),linear-gradient(180deg,_#1b1b1d,_#070708)]" />
        )}

        {trailerKey ? (
          <div className="absolute left-1/2 top-1/2 hidden aspect-video h-full min-h-[56.25vw] w-[177.77777778vh] min-w-full -translate-x-1/2 -translate-y-1/2 opacity-40 mix-blend-screen md:block md:opacity-55">
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&playsinline=1`}
              className="h-full w-full border-0 object-cover"
              allow="autoplay; encrypted-media"
              title={`${title} trailer`}
              loading="eager"
            />
          </div>
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-transparent md:from-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/42 to-transparent md:via-[#0a0a0a]/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.82),transparent_60%)] md:hidden" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-[#0a0a0a]/90 via-[#0a0a0a]/30 to-transparent md:block" />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 mx-auto flex h-full w-full max-w-[1600px] flex-col justify-end gap-2.5 p-4 pb-9 sm:gap-3 sm:p-8 sm:pb-14 md:gap-4 md:p-12 md:pb-14 lg:px-10">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E50914]/30 bg-black/35 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.26em] text-white/85 shadow-lg shadow-black/30 backdrop-blur sm:text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E50914] shadow-[0_0_12px_rgba(229,9,20,0.9)]" />
          {isTV ? 'Spotlight Series' : 'Spotlight Movie'}
        </span>

        <h1 className="line-clamp-2 max-w-3xl text-[2rem] font-black uppercase leading-[0.94] tracking-tighter text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl">
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-semibold text-white/75 sm:text-sm">
          {year ? <span>{year}</span> : null}
          {rating ? (
            <span className="inline-flex items-center gap-1">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              {rating}
            </span>
          ) : null}
          <span className="rounded border border-white/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/70">
            HD
          </span>
          {genreNames.slice(0, 3).map((name) => (
            <span key={name} className="text-white/55">
              {name}
            </span>
          ))}
        </div>

        {movie.overview ? (
          <p className="line-clamp-2 max-w-xl text-[11px] font-medium leading-[1.5] text-white/70 drop-shadow sm:text-sm sm:leading-6 md:line-clamp-4">
            {movie.overview}
          </p>
        ) : null}

        <div className="flex items-stretch gap-2 pt-1 sm:gap-3 sm:pt-2">
          <button
            type="button"
            onClick={() => onPlay?.(movie)}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-black/40 transition hover:bg-zinc-200 active:scale-95 sm:min-h-12 sm:flex-none sm:px-6 sm:text-sm"
          >
            <Play size={16} fill="currentColor" />
            Play
          </button>

          <button
            type="button"
            onClick={() => onDetails?.(movie)}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/15 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white backdrop-blur transition hover:bg-white/25 active:scale-95 sm:min-h-12 sm:flex-none sm:px-6 sm:text-sm"
          >
            <Info size={16} />
            More info
          </button>

          {trailerKey ? (
            <button
              type="button"
              onClick={() => onPlay?.({ ...movie, playbackMode: 'trailer' })}
              className="hidden min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/35 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white/85 backdrop-blur transition hover:bg-black/60 hover:text-white active:scale-95 sm:inline-flex sm:min-h-12 sm:px-6 sm:text-sm"
            >
              Watch trailer
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default Hero
