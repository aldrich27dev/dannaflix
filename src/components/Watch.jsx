import { useEffect, useMemo, useState } from 'react'
import ReactPlayer from 'react-player'
import { X, Star, Film, LoaderCircle } from 'lucide-react'
import { getMovieVideos, imageUrl } from '../services/tmdb'

function Watch({ movie, onBack }) {
  const [trailerKey, setTrailerKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const title = movie?.title ?? movie?.name ?? 'Now Playing'
  const overview =
    movie?.overview ??
    'The selected film opens instantly inside the embedded trailer player.'
  const poster = imageUrl(movie?.poster_path, 'w500')
  const year = movie?.release_date ? movie.release_date.slice(0, 4) : 'Now'
  const rating = movie?.vote_average ? movie.vote_average.toFixed(1) : '8.0'
  const hasMovie = Boolean(movie?.id)

  useEffect(() => {
    if (!movie?.id) return

    const controller = new AbortController()
    let isActive = true

    async function loadTrailer() {
      setLoading(true)
      setError('')
      setTrailerKey('')

      try {
        const response = await getMovieVideos(movie.id, {
          signal: controller.signal,
        })

        if (!isActive) return

        const trailer = (response?.results ?? []).find(
          (item) => item.type === 'Trailer' && item.site === 'YouTube',
        )

        if (trailer?.key) {
          setTrailerKey(trailer.key)
        } else {
          setError('No trailer available for this title.')
        }
      } catch {
        if (!isActive) return
        setError('No trailer available for this title.')
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadTrailer()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [movie?.id])

  const trailerUrl = useMemo(
    () => (trailerKey ? `https://www.youtube.com/watch?v=${trailerKey}` : ''),
    [trailerKey],
  )

  return (
    <section className="fixed inset-0 z-[100] flex min-h-screen flex-col bg-[#0a0a0a]/95 text-white backdrop-blur-xl">
      <div className="border-b border-white/10 bg-black/40">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.45em] text-white/35">
              Trailer view
            </p>
            <h2 className="truncate text-lg font-semibold text-white sm:text-2xl">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1600px] flex-1 gap-6 overflow-y-auto px-4 py-5 sm:px-6 lg:grid-cols-[1.45fr_0.55fr] lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
          <div className="relative aspect-video w-full bg-black">
            {!hasMovie ? (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(229,9,20,0.2),_transparent_45%),linear-gradient(180deg,_#181818,_#090909)] px-6 text-center">
                <p className="text-base text-white/75">
                  No trailer available for this title.
                </p>
              </div>
            ) : loading ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,_rgba(229,9,20,0.22),_transparent_45%),linear-gradient(180deg,_#181818,_#090909)]">
                <LoaderCircle className="h-7 w-7 animate-spin text-[#E50914]" />
                <p className="text-sm text-white/75">Loading...</p>
              </div>
            ) : error ? (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(229,9,20,0.2),_transparent_45%),linear-gradient(180deg,_#181818,_#090909)] px-6 text-center">
                <p className="text-base text-white/75">{error}</p>
              </div>
            ) : trailerUrl ? (
              <ReactPlayer
                url={trailerUrl}
                width="100%"
                height="100%"
                controls
                playing
                config={{
                  youtube: {
                    playerVars: {
                      modestbranding: 1,
                      rel: 0,
                      showinfo: 0,
                    },
                  },
                }}
              />
            ) : null}
          </div>
        </div>

        <aside className="grid gap-4 self-start rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30">
            {poster ? (
              <img
                src={poster}
                alt={title}
                className="h-72 w-full object-cover"
              />
            ) : (
              <div className="flex h-72 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(229,9,20,0.2),_transparent_45%),linear-gradient(180deg,_#222,_#111)] text-sm uppercase tracking-[0.3em] text-white/40">
                No poster
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-white/45">
              Now Playing
            </p>
            <h3 className="text-3xl font-black uppercase tracking-[-0.04em]">
              {title}
            </h3>
            <div className="flex items-center gap-3 text-sm text-white/70">
              <span>{year}</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-[#E50914] text-[#E50914]" />
                {rating}
              </span>
            </div>
            <p className="text-sm leading-7 text-white/70">{overview}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-black/35 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/35">
                Player
              </p>
              <p className="mt-2 text-sm text-white/85">YouTube Trailer</p>
            </div>
            <div className="rounded-2xl bg-black/35 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/35">
                Mode
              </p>
              <p className="mt-2 text-sm text-white/85">Netflix dark</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
              <Film className="h-4 w-4 text-[#E50914]" />
              Trailer source
            </div>
            <p className="mt-2 text-sm text-white/60">
              {loading
                ? 'Fetching the first YouTube trailer from TMDB...'
                : error || 'Ready to play.'}
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default Watch
