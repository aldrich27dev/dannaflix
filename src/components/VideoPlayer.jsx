import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LoaderCircle,
  Star,
  Volume2,
  VolumeX,
  X,
  Film,
  Tv,
  ChevronDown,
} from 'lucide-react'
import {
  getMovieDetails,
  getMovieVideos,
  getTVDetails,
  getTVSeasonDetails,
} from '../services/tmdb'

const PROVIDERS = [
  (id, season, episode, isTV) => isTV 
    ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`
    : `https://vidsrc.me/embed/movie?tmdb=${id}`,
  (id, season, episode, isTV) => isTV 
    ? `https://vidsrc.cc/v2/tv/${id}/${season}/${episode}`
    : `https://vidsrc.cc/v2/movie/${id}`,
];

function VideoPlayer({ movie, onClose, onProgressUpdate }) {
  const isTV =
    movie?.mediaType === 'tv' ||
    movie?.media_type === 'tv' ||
    movie?.first_air_date !== undefined ||
    movie?.name !== undefined
  const resumeSeasonNumber = Number(movie?.resumeSeasonNumber ?? movie?.seasonNumber ?? 0) || 0
  const resumeEpisodeNumber = Number(movie?.resumeEpisodeNumber ?? movie?.episodeNumber ?? 0) || 0
  const resumeAtSeconds = Number(movie?.resumeAt ?? 0) || 0

  const [videoKey, setVideoKey] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState(() => (movie?.playbackMode === 'trailer' ? 'trailer' : 'movie'))
  const [error, setError] = useState('')
  const [tvDetails, setTVDetails] = useState(null)
  const [movieDetails, setMovieDetails] = useState(null)
  const [seasonNumber, setSeasonNumber] = useState(() => (isTV ? resumeSeasonNumber || 1 : 1))
  const [seasonEpisodes, setSeasonEpisodes] = useState([])
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState(() => (isTV ? resumeEpisodeNumber || 1 : 1))
  const [episodesLoading, setEpisodesLoading] = useState(false)
  const [playbackSeconds, setPlaybackSeconds] = useState(resumeAtSeconds)
  const [boostLevel, setBoostLevel] = useState(1)
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false)
  const [providerIndex, setProviderIndex] = useState(0);

  const playbackSecondsRef = useRef(resumeAtSeconds)
  const hasHydratedEpisodeRef = useRef(false)
  const onProgressUpdateRef = useRef(onProgressUpdate)
  const iframeRef = useRef(null)

  useEffect(() => {
    onProgressUpdateRef.current = onProgressUpdate
  }, [onProgressUpdate])

  const seasons = useMemo(() => {
    if (!isTV) return []
    return (tvDetails?.seasons ?? []).filter((season) => season?.season_number > 0)
  }, [isTV, tvDetails])

  const selectedEpisode = useMemo(() => {
    return (
      seasonEpisodes.find((episode) => episode.episode_number === selectedEpisodeNumber) ??
      seasonEpisodes[0] ??
      null
    )
  }, [seasonEpisodes, selectedEpisodeNumber])

const movieUrl = useMemo(() => {
  return PROVIDERS[providerIndex](movie?.id, seasonNumber, selectedEpisodeNumber, isTV);
}, [movie?.id, seasonNumber, selectedEpisodeNumber, isTV, providerIndex]);

  useEffect(() => {
    setProviderIndex(0)
  }, [seasonNumber, selectedEpisodeNumber])

  const runtimeMinutes = isTV
    ? selectedEpisode?.runtime || tvDetails?.episode_run_time?.[0] || movie.runtimeMinutes || null
    : movieDetails?.runtime || movie.runtimeMinutes || null

  const handleBoostChange = (event) => {
    setBoostLevel(Number(event.target.value))
  }

  // --- Effects remain same as your provided code (Logic preserved) ---
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
    if (isTV || !movie?.id) return

    let mounted = true
    const controller = new AbortController()

    async function loadMovieMetadata() {
      try {
        const details = await getMovieDetails(movie.id, {
          signal: controller.signal,
        })

        if (!mounted) return

        setMovieDetails(details)
      } catch {
        if (!mounted) return
        setMovieDetails(null)
      }
    }

    loadMovieMetadata()

    return () => {
      mounted = false
      controller.abort()
    }
  }, [isTV, movie?.id])

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

        const firstSeason = (details?.seasons ?? []).find((season) => season?.season_number > 0)

        if (!resumeSeasonNumber && firstSeason?.season_number) {
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
  }, [isTV, movie, movie?.id, resumeSeasonNumber])

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
        const matchingResumeEpisode =
          resumeSeasonNumber === seasonNumber && resumeEpisodeNumber
            ? resumeEpisodeNumber
            : null

        setSelectedEpisodeNumber(
          matchingResumeEpisode || episodes[0]?.episode_number || 1,
        )
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
  }, [isTV, movie, movie?.id, resumeEpisodeNumber, resumeSeasonNumber, seasonNumber])

  useEffect(() => {
    if (!isTV || !hasHydratedEpisodeRef.current) return

    playbackSecondsRef.current = 0
    setPlaybackSeconds(0)
    const runtime = runtimeMinutes ? runtimeMinutes * 60 : 0
    const progress = runtime > 0 ? Math.min(100, Math.round((0 / runtime) * 100)) : 0
    onProgressUpdateRef.current?.({
      ...movie,
      id: movie?.id,
      mediaType: isTV ? 'tv' : 'movie',
      playbackMode: 'movie',
      seasonNumber,
      episodeNumber: selectedEpisodeNumber,
      resumeSeasonNumber: seasonNumber,
      resumeEpisodeNumber: selectedEpisodeNumber,
      resumeAt: 0,
      runtimeMinutes: runtimeMinutes || null,
      progress,
    })
  }, [isTV, movie, movie?.id, runtimeMinutes, seasonNumber, selectedEpisodeNumber])

  useEffect(() => {
    if (!movie?.id || mode !== 'movie') return

    const baseSeconds = Number(playbackSecondsRef.current ?? movie?.resumeAt ?? 0) || 0
    const startedAt = Date.now()
    playbackSecondsRef.current = baseSeconds
    setPlaybackSeconds(baseSeconds)
    onProgressUpdateRef.current?.({
      ...movie,
      id: movie?.id,
      mediaType: isTV ? 'tv' : 'movie',
      playbackMode: 'movie',
      seasonNumber: isTV ? seasonNumber : null,
      episodeNumber: isTV ? selectedEpisodeNumber : null,
      resumeSeasonNumber: isTV ? seasonNumber : null,
      resumeEpisodeNumber: isTV ? selectedEpisodeNumber : null,
      resumeAt: baseSeconds,
      runtimeMinutes: runtimeMinutes || null,
      progress:
        runtimeMinutes && runtimeMinutes > 0
          ? Math.min(100, Math.round((baseSeconds / (runtimeMinutes * 60)) * 100))
          : 0,
    })

    const interval = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000)
      const currentSeconds = baseSeconds + elapsedSeconds

      playbackSecondsRef.current = currentSeconds
      setPlaybackSeconds(currentSeconds)
      onProgressUpdateRef.current?.({
        ...movie,
        id: movie?.id,
        mediaType: isTV ? 'tv' : 'movie',
        playbackMode: 'movie',
        seasonNumber: isTV ? seasonNumber : null,
        episodeNumber: isTV ? selectedEpisodeNumber : null,
        resumeSeasonNumber: isTV ? seasonNumber : null,
        resumeEpisodeNumber: isTV ? selectedEpisodeNumber : null,
        resumeAt: currentSeconds,
        runtimeMinutes: runtimeMinutes || null,
        progress:
          runtimeMinutes && runtimeMinutes > 0
            ? Math.min(100, Math.round((currentSeconds / (runtimeMinutes * 60)) * 100))
            : 0,
      })
    }, 5000)

    return () => {
      window.clearInterval(interval)
    }
  }, [isTV, movie, movie?.id, mode, seasonNumber, selectedEpisodeNumber, runtimeMinutes])

  if (!movie) return null

  const releaseYear =
    movie.release_date?.split('-')[0] ||
    movie.first_air_date?.split('-')[0] ||
    'N/A'

  const handleClose = () => {
    if (mode === 'movie') {
      const currentSeconds = playbackSecondsRef.current
      onProgressUpdateRef.current?.({
        ...movie,
        id: movie?.id,
        mediaType: isTV ? 'tv' : 'movie',
        playbackMode: 'movie',
        seasonNumber: isTV ? seasonNumber : null,
        episodeNumber: isTV ? selectedEpisodeNumber : null,
        resumeSeasonNumber: isTV ? seasonNumber : null,
        resumeEpisodeNumber: isTV ? selectedEpisodeNumber : null,
        resumeAt: currentSeconds,
        runtimeMinutes: runtimeMinutes || null,
        progress:
          runtimeMinutes && runtimeMinutes > 0
            ? Math.min(100, Math.round((currentSeconds / (runtimeMinutes * 60)) * 100))
            : 0,
      })
    }
    onClose?.()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col overflow-hidden bg-zinc-950 text-white"
    >
      {/* Header Bar */}
      <div className="z-20 flex flex-col gap-3 border-b border-white/5 bg-zinc-900/90 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer rounded-full p-2 transition-colors hover:bg-white/10"
          >
            <X size={24} />
          </button>
          <h2 className="truncate text-base font-bold md:text-lg">
            {movie.title || movie.name}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
          <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMode('movie')}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-[10px] font-black tracking-wider transition-all ${
                mode === 'movie' ? 'bg-[#E50914] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {isTV ? 'SERIES' : 'MOVIE'}
            </button>
            <button
              type="button"
              onClick={() => setMode('trailer')}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-[10px] font-black tracking-wider transition-all ${
                mode === 'trailer' ? 'bg-[#E50914] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              TRAILER
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-4 lg:overflow-hidden">
        <div className="relative aspect-video bg-black lg:col-span-3 lg:h-full lg:w-full lg:aspect-auto">
          {loading ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black">
              <LoaderCircle className="animate-spin text-[#E50914]" size={48} />
            </div>
          ) : mode === 'movie' ? (
            <iframe
              key={`${movie.id}-${mode}-${seasonNumber}-${selectedEpisodeNumber}`}
              src={movieUrl}
              ref={iframeRef}
              className="h-full w-full pointer-events-auto"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              title={movie.title || movie.name}
            />
          ) : (
            <iframe
              key={`${movie.id}-${mode}`}
              src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&controls=1&rel=0`}
              ref={iframeRef}
              className="h-full w-full pointer-events-auto"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              title={`${movie.title || movie.name} trailer`}
            />
          )}
        </div>

        {/* Details Panel */}
<div className="flex flex-col gap-4 bg-zinc-900 p-4 lg:col-span-1 lg:h-full lg:overflow-y-auto lg:border-l lg:border-white/5">
  <div className="space-y-2">
    <h3 className="text-xs font-black uppercase text-white">{movie.title || movie.name}</h3>
    <p className="text-[11px] text-zinc-400 line-clamp-3">{movie.overview}</p>
  </div>

  {isTV && (
    <div className="space-y-4">
      {/* Season Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-xs font-bold text-white hover:border-[#E50914]"
        >
          Season {seasonNumber}
          <ChevronDown size={16} />
        </button>
        <AnimatePresence>
          {isSeasonDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-zinc-900 p-1 shadow-2xl"
            >
              {seasons.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSeasonNumber(s.season_number);
                    setIsSeasonDropdownOpen(false);
                  }}
                  className={`block w-full rounded-lg px-4 py-2 text-left text-xs ${
                    seasonNumber === s.season_number ? 'bg-[#E50914] text-white' : 'text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  Season {s.season_number}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Episodes List (Compact) */}
      <div className="space-y-2">
        <p className="text-[9px] font-bold uppercase text-zinc-500">Episodes</p>
        <div className="grid grid-cols-4 gap-2">
          {seasonEpisodes.map((ep) => (
            <button
              key={ep.id}
              title={ep.name || `Episode ${ep.episode_number}`}
              onClick={() => setSelectedEpisodeNumber(ep.episode_number)}
              className={`flex h-10 w-full items-center justify-center rounded-lg border text-xs font-bold transition-all ${
                selectedEpisodeNumber === ep.episode_number
                  ? 'border-[#E50914] bg-[#E50914] text-white'
                  : 'border-white/5 bg-zinc-950 text-zinc-500 hover:border-white/20 hover:text-white'
              }`}
            >
              {ep.episode_number}
            </button>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* Server Fallback Button - Always visible for both Movies and TV */}
  <button 
    onClick={() => setProviderIndex((prev) => (prev + 1) % PROVIDERS.length)}
    className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-950 py-3 text-[10px] font-bold text-zinc-400 transition hover:border-[#E50914] hover:text-white"
  >
    Video not working? Try Server {providerIndex + 1} / {PROVIDERS.length}
  </button>
        </div>
      </div>
    </motion.div>
  )
}

export default VideoPlayer