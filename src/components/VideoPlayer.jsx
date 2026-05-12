import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { LoaderCircle, Star, ChevronDown, X } from 'lucide-react'
import {
  getMovieVideos,
  getTVDetails,
  getTVSeasonDetails,
} from '../services/tmdb'

function VideoPlayer({ movie, onClose }) {
  const [videoKey, setVideoKey] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('movie')
  const [error, setError] = useState('')
  const [tvDetails, setTVDetails] = useState(null)
  const [seasonNumber, setSeasonNumber] = useState(1)
  const [seasonEpisodes, setSeasonEpisodes] = useState([])
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState(1)
  const [episodesLoading, setEpisodesLoading] = useState(false)

  const isTV = movie?.first_air_date !== undefined || movie?.name !== undefined

  const seasons = useMemo(() => {
    if (!isTV) return []
    return (tvDetails?.seasons ?? []).filter((season) => season?.season_number > 0)
  }, [isTV, tvDetails])

  const selectedEpisode = useMemo(() => {
    return (
      seasonEpisodes.find(
        (episode) => episode.episode_number === selectedEpisodeNumber,
      ) ?? seasonEpisodes[0] ?? null
    )
  }, [seasonEpisodes, selectedEpisodeNumber])

  const movieUrl = isTV
    ? `https://vidsrc.me/embed/tv?tmdb=${movie?.id}&season=${seasonNumber}&episode=${selectedEpisodeNumber}`
    : `https://vidsrc.me/embed/movie?tmdb=${movie?.id}`

  useEffect(() => {
    let mounted = true
    const controller = new AbortController()

    async function loadTrailerData() {
      if (!movie?.id) {
        setLoading(false)
        setError('Trailer not available')
        return
      }

      setLoading(true)
      setError('')
      setVideoKey(null)

      try {
        const data = await getMovieVideos(movie.id, {
          signal: controller.signal,
        })

        if (!mounted) return

        const videos = data?.results ?? []
        const trailer =
          videos.find((item) => item.site === 'YouTube' && item.type === 'Trailer') ||
          videos.find((item) => item.site === 'YouTube') ||
          null

        setVideoKey(trailer?.key ?? null)
        if (!trailer?.key) {
          setError('Trailer not available')
        }
      } catch (err) {
        if (!mounted || err?.name === 'AbortError') return
        setVideoKey(null)
        setError('Trailer not available')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadTrailerData()

    document.body.style.overflow = 'hidden'
    return () => {
      mounted = false
      controller.abort()
      document.body.style.overflow = 'unset'
    }
  }, [movie?.id])

  useEffect(() => {
    if (!isTV || !movie?.id) return

    let mounted = true
    const controller = new AbortController()

    async function loadTVMetadata() {
      try {
        const details = await getTVDetails(movie.id, {
          signal: controller.signal,
        })

        if (!mounted) return

        setTVDetails(details)

        const firstSeason = (details?.seasons ?? []).find(
          (season) => season?.season_number > 0,
        )

        if (firstSeason?.season_number) {
          setSeasonNumber(firstSeason.season_number)
        }
      } catch {
        if (!mounted) return
        setTVDetails(null)
      }
    }

    loadTVMetadata()

    return () => {
      mounted = false
      controller.abort()
    }
  }, [isTV, movie?.id])

  useEffect(() => {
    if (!isTV || !movie?.id || !seasonNumber) return

    let mounted = true
    const controller = new AbortController()

    async function loadSeasonEpisodes() {
      setEpisodesLoading(true)
      try {
        const data = await getTVSeasonDetails(movie.id, seasonNumber, {
          signal: controller.signal,
        })

        if (!mounted) return

        const episodes = data?.episodes ?? []
        setSeasonEpisodes(episodes)
        setSelectedEpisodeNumber(episodes[0]?.episode_number ?? 1)
      } catch {
        if (!mounted) return
        setSeasonEpisodes([])
        setSelectedEpisodeNumber(1)
      } finally {
        if (mounted) {
          setEpisodesLoading(false)
        }
      }
    }

    loadSeasonEpisodes()

    return () => {
      mounted = false
      controller.abort()
    }
  }, [isTV, movie?.id, seasonNumber])

  if (!movie) return null

  const releaseYear =
    movie.release_date?.split('-')[0] ||
    movie.first_air_date?.split('-')[0] ||
    'N/A'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col overflow-hidden bg-black text-white"
    >
      <div className="z-20 flex items-center justify-between border-b border-white/5 bg-zinc-950/80 p-4 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2 md:gap-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full p-2 transition-colors hover:bg-white/10"
          >
            <X size={24} />
          </button>
          <h2 className="max-w-[140px] truncate text-sm font-bold md:max-w-md md:text-lg">
            {movie.title || movie.name}
          </h2>
        </div>

        <div className="flex scale-90 rounded-full border border-white/10 bg-white/5 p-1 md:scale-100">
          <button
            type="button"
            onClick={() => setMode('movie')}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-[10px] font-black transition-all ${
              mode === 'movie' ? 'bg-[#E50914] text-white' : 'text-zinc-500'
            }`}
          >
            {isTV ? 'SERIES' : 'MOVIE'}
          </button>
          <button
            type="button"
            onClick={() => setMode('trailer')}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-[10px] font-black transition-all ${
              mode === 'trailer' ? 'bg-[#E50914] text-white' : 'text-zinc-500'
            }`}
          >
            TRAILER
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[1.4fr_0.6fr]">
        <div className="relative flex min-h-[45svh] flex-1 items-center justify-center overflow-hidden bg-black">
          {loading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
              <LoaderCircle className="animate-spin text-[#E50914]" size={48} />
            </div>
          ) : mode === 'movie' ? (
            <iframe
              key={`${movie.id}-${mode}-${seasonNumber}-${selectedEpisodeNumber}`}
              src={movieUrl}
              className="h-full w-full pointer-events-auto"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              title={movie.title || movie.name}
            />
          ) : videoKey ? (
            <iframe
              key={`${movie.id}-${mode}`}
              src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&controls=1`}
              className="h-full w-full pointer-events-auto"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              title={`${movie.title || movie.name} trailer`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-6 text-center text-white/70">
              {error || 'Trailer not available'}
            </div>
          )}
        </div>

        <aside className="hidden overflow-y-auto border-l border-white/10 bg-[#0f0f0f] p-6 lg:block">
          <div className="space-y-5">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-zinc-400">{releaseYear}</span>
              <span className="flex items-center gap-1 font-black text-[#E50914]">
                <Star size={14} fill="currentColor" />
                {movie.vote_average?.toFixed(1) || 'NR'}
              </span>
            </div>
            <h3 className="text-4xl font-black uppercase leading-none tracking-tighter">
              {movie.title || movie.name}
            </h3>
            <p className="text-sm leading-relaxed text-zinc-400">
              {movie.overview || 'No description available.'}
            </p>

            {isTV ? (
              <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/35">
                      Episodes
                    </p>
                    <p className="mt-1 text-sm text-white/70">
                      Choose a season, then pick an episode.
                    </p>
                  </div>

                  <div className="relative">
                    <select
                      value={seasonNumber}
                      onChange={(event) => setSeasonNumber(Number(event.target.value))}
                      className="appearance-none rounded-full border border-white/10 bg-black/60 px-4 py-2 pr-10 text-sm text-white outline-none transition focus:border-[#E50914]/60"
                    >
                      {seasons.length ? (
                        seasons.map((season) => (
                          <option key={season.id} value={season.season_number}>
                            Season {season.season_number}
                          </option>
                        ))
                      ) : (
                        <option value={1}>Season 1</option>
                      )}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto pr-1">
                  {episodesLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={index}
                          className="h-12 animate-pulse rounded-2xl border border-white/10 bg-white/5"
                        />
                      ))}
                    </div>
                  ) : seasonEpisodes.length ? (
                    <div className="grid grid-cols-2 gap-3">
                      {seasonEpisodes.map((episode) => {
                        const isActive = episode.episode_number === selectedEpisodeNumber

                        return (
                          <button
                            key={episode.id}
                            type="button"
                            onClick={() => setSelectedEpisodeNumber(episode.episode_number)}
                            className={`rounded-2xl border px-3 py-3 text-left transition ${
                              isActive
                                ? 'border-[#E50914] bg-[#E50914]/15 text-white'
                                : 'border-white/10 bg-black/25 text-white/70 hover:border-white/20 hover:bg-white/5'
                            }`}
                          >
                            <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                              Episode {episode.episode_number}
                            </p>
                            <p className="mt-2 line-clamp-2 text-sm font-medium">
                              {episode.name || `Episode ${episode.episode_number}`}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-white/50">No episodes available.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/35">
                    Current Selection
                  </p>
                  <p className="mt-2 text-sm text-white/80">
                    Season {seasonNumber}
                    {selectedEpisode ? `, Episode ${selectedEpisode.episode_number}` : ''}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      <div className="border-t border-white/5 bg-zinc-950 p-6 md:hidden">
        <div className="mb-2 flex items-center gap-3">
          <span className="flex items-center gap-1 font-bold text-[#E50914]">
            <Star size={14} fill="currentColor" /> {movie.vote_average?.toFixed(1) || 'NR'}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            {releaseYear}
          </span>
        </div>
        <p className="line-clamp-3 text-xs leading-relaxed italic text-zinc-400">
          {movie.overview || 'No description available.'}
        </p>

        {isTV ? (
          <div className="mt-5 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/35">
                  Episodes
                </p>
                <p className="mt-1 text-xs text-white/60">
                  Select a season, then tap an episode.
                </p>
              </div>

              <select
                value={seasonNumber}
                onChange={(event) => setSeasonNumber(Number(event.target.value))}
                className="rounded-full border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none"
              >
                {seasons.length ? (
                  seasons.map((season) => (
                    <option key={season.id} value={season.season_number}>
                      Season {season.season_number}
                    </option>
                  ))
                ) : (
                  <option value={1}>Season 1</option>
                )}
              </select>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {seasonEpisodes.map((episode) => {
                const isActive = episode.episode_number === selectedEpisodeNumber

                return (
                  <button
                    key={episode.id}
                    type="button"
                    onClick={() => setSelectedEpisodeNumber(episode.episode_number)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                      isActive
                        ? 'border-[#E50914] bg-[#E50914] text-white'
                        : 'border-white/10 bg-black/25 text-white/70'
                    }`}
                  >
                    Ep {episode.episode_number}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}

export default VideoPlayer
