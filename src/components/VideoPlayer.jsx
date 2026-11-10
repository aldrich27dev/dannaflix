import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronDown,
  ListVideo,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Play,
  RefreshCw,
  Server,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { getMovieVideos, getTVDetails, getTVSeasonDetails } from '../services/tmdb'

const PROVIDERS = [
  {
    name: 'Server 1',
    build: (id, season, episode, isTV) =>
      isTV
        ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`
        : `https://vidsrc.me/embed/movie?tmdb=${id}`,
  },
  {
    name: 'Server 2',
    build: (id, season, episode, isTV) =>
      isTV
        ? `https://vidsrc.cc/v2/tv/${id}/${season}/${episode}`
        : `https://vidsrc.cc/v2/movie/${id}`,
  },
]

function isTVTitle(movie) {
  return (
    movie?.media_type === 'tv' ||
    movie?.first_air_date !== undefined ||
    (movie?.name !== undefined && movie?.title === undefined)
  )
}

let youtubeApiPromise

function loadYouTubePlayerApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (youtubeApiPromise) return youtubeApiPromise

  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.()
      resolve(window.YT)
    }

    let script = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.onerror = () => reject(new Error('YouTube player API could not be loaded'))
      document.head.appendChild(script)
    }
  })

  return youtubeApiPromise
}

function FullscreenTrailerStage({
  movie,
  videoKey,
  loading,
  isTV,
  onClose,
  onSwitchToMovie,
}) {
  const [overlayVisible, setOverlayVisible] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const playerHostRef = useRef(null)
  const playerRef = useRef(null)
  const overlayTimerRef = useRef(null)
  const overlayHoveredRef = useRef(false)

  useEffect(() => {
    if (!videoKey || loading) return undefined
    let cancelled = false

    loadYouTubePlayerApi()
      .then((YT) => {
        if (cancelled || !playerHostRef.current) return
        playerRef.current = new YT.Player(playerHostRef.current, {
          width: '100%',
          height: '100%',
          videoId: videoKey,
          playerVars: {
            autoplay: 1,
            controls: 0,
            rel: 0,
            mute: 1,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => event.target.playVideo(),
          },
        })
      })
      .catch(() => {})

    return () => {
      cancelled = true
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [videoKey, loading])

  useEffect(() => {
    overlayTimerRef.current = window.setTimeout(() => {
      if (!overlayHoveredRef.current) setOverlayVisible(false)
    }, 4000)
    return () => window.clearTimeout(overlayTimerRef.current)
  }, [movie?.id])

  const hideOverlayLater = () => {
    window.clearTimeout(overlayTimerRef.current)
    overlayTimerRef.current = window.setTimeout(() => {
      if (!overlayHoveredRef.current) setOverlayVisible(false)
    }, 4000)
  }

  const revealOverlay = () => {
    setOverlayVisible(true)
    hideOverlayLater()
  }

  const holdOverlay = () => {
    overlayHoveredRef.current = true
    window.clearTimeout(overlayTimerRef.current)
    setOverlayVisible(true)
  }

  const releaseOverlay = () => {
    overlayHoveredRef.current = false
    hideOverlayLater()
  }

  const toggleSound = () => {
    if (!soundEnabled) {
      playerRef.current?.unMute()
      playerRef.current?.playVideo()
    } else {
      playerRef.current?.mute()
    }
    setSoundEnabled((enabled) => !enabled)
  }

  return (
    <section
      className="relative flex-1 overflow-hidden bg-black"
      onMouseEnter={revealOverlay}
      onMouseMove={revealOverlay}
      onTouchStart={revealOverlay}
    >
      {loading ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black">
          <LoaderCircle className="animate-spin text-[#E50914]" size={42} />
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">
            Loading trailer
          </p>
        </div>
      ) : videoKey ? (
        <div
          ref={playerHostRef}
          className="absolute inset-0 h-full w-full"
          title={`${movie.title || movie.name} trailer`}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black px-6 text-center">
          <p className="text-sm text-zinc-400">Trailer not available for this title.</p>
          <button
            type="button"
            onClick={onSwitchToMovie}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-black text-black transition hover:bg-zinc-200"
          >
            <Play size={17} fill="currentColor" />
            Play {isTV ? 'series' : 'movie'}
          </button>
        </div>
      )}

      {videoKey && !loading ? (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/65 via-transparent to-black/80" />
      ) : null}

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-b from-black/80 via-black/30 to-transparent px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] sm:px-7 sm:py-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close player"
            className="grid h-11 w-11 flex-none place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/80"
          >
            <X size={23} />
          </button>
          <h2 className="truncate text-sm font-bold text-white drop-shadow sm:text-lg">
            {movie.title || movie.name}
          </h2>
        </div>
        <div className="flex flex-none items-center gap-2">
          <button
            type="button"
            onClick={onSwitchToMovie}
            aria-label={isTV ? 'Play series' : 'Play movie'}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-black transition hover:bg-zinc-200 sm:hidden"
          >
            <Play size={15} fill="currentColor" />
            Play
          </button>
          <button
            type="button"
            onClick={toggleSound}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-black/80"
            aria-label={soundEnabled ? 'Mute trailer' : 'Enable trailer sound'}
          >
            {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
            <span className="hidden sm:inline">
              {soundEnabled ? 'Sound on' : 'Enable sound'}
            </span>
          </button>
          <div className="hidden rounded-full border border-white/15 bg-black/55 p-1 backdrop-blur sm:flex">
            <button
              type="button"
              onClick={onSwitchToMovie}
              className="rounded-full px-4 py-2 text-[10px] font-black tracking-wider text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              {isTV ? 'SERIES' : 'MOVIE'}
            </button>
            <span className="rounded-full bg-[#E50914] px-4 py-2 text-[10px] font-black tracking-wider text-white">
              TRAILER
            </span>
          </div>
        </div>
      </div>

      <div
        onMouseEnter={holdOverlay}
        onMouseLeave={releaseOverlay}
        className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/65 to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-16 transition-opacity duration-500 sm:px-10 sm:py-10 ${
          overlayVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <p className="mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-red-300 drop-shadow">
          Now watching trailer
        </p>
        <h1 className="max-w-3xl text-xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,1)] sm:text-3xl">
          {movie.title || movie.name}
        </h1>
        {movie.overview ? (
          <p className="mt-2 line-clamp-3 max-w-2xl text-xs font-medium leading-5 text-white drop-shadow-[0_1px_6px_rgba(0,0,0,1)] sm:text-sm sm:leading-6">
            {movie.overview}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onSwitchToMovie}
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/25 sm:hidden"
        >
          <Play size={15} fill="currentColor" />
          Play {isTV ? 'series' : 'movie'}
        </button>
      </div>
    </section>
  )
}

function VideoPlayer({ movie, initialState = null, onClose, onStateChange }) {
  const isTV = isTVTitle(movie)
  const resumeSeasonNumber = Number(movie?.resumeSeasonNumber ?? movie?.seasonNumber ?? 0) || 0
  const resumeEpisodeNumber = Number(movie?.resumeEpisodeNumber ?? movie?.episodeNumber ?? 0) || 0
  const storedMode =
    initialState?.mode === 'trailer' || initialState?.mode === 'movie'
      ? initialState.mode
      : null
  const storedProviderIndex = Number(initialState?.providerIndex)
  const storedSeasonNumber = Number(initialState?.seasonNumber) || 0
  const storedEpisodeNumber = Number(initialState?.episodeNumber) || 0

  const [mode, setMode] = useState(() =>
    storedMode ?? (movie?.playbackMode === 'trailer' ? 'trailer' : 'movie'),
  )
  const [trailerCache, setTrailerCache] = useState({})
  const [tvDetails, setTVDetails] = useState(null)
  const [seasonNumber, setSeasonNumber] = useState(() =>
    isTV ? storedSeasonNumber || resumeSeasonNumber || 1 : 1,
  )
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState(() =>
    isTV ? storedEpisodeNumber || resumeEpisodeNumber || 1 : 1,
  )
  const [episodesByKey, setEpisodesByKey] = useState({})
  const [providerIndex, setProviderIndex] = useState(() =>
    Number.isInteger(storedProviderIndex) && storedProviderIndex >= 0
      ? storedProviderIndex % PROVIDERS.length
      : 0,
  )
  const [loadedUrl, setLoadedUrl] = useState('')
  const [playerReloadKey, setPlayerReloadKey] = useState(0)
  const [chromeVisible, setChromeVisible] = useState(false)
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false)

  const playerShellRef = useRef(null)

  const trailerKey = `${isTV ? 'tv' : 'movie'}-${movie?.id}`
  const trailerState = trailerCache[trailerKey]
  const trailerLoading = mode === 'trailer' && !trailerState

  const episodesKey = `${movie?.id}-${seasonNumber}`
  const episodeData = episodesByKey[episodesKey]
  const seasonEpisodes = episodeData?.episodes ?? []
  const episodesLoading = isTV && Boolean(movie?.id && seasonNumber) && !episodeData

  useEffect(() => {
    if (mode !== 'trailer' || !movie?.id || trailerCache[trailerKey]) return undefined

    let mounted = true
    const controller = new AbortController()

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
        setTrailerCache((current) => ({
          ...current,
          [trailerKey]: { key: trailer?.key ?? null },
        }))
      })
      .catch(() => {
        if (!mounted) return
        setTrailerCache((current) => ({ ...current, [trailerKey]: { key: null } }))
      })

    return () => {
      mounted = false
      controller.abort()
    }
  }, [isTV, mode, movie?.id, trailerCache, trailerKey])

  useEffect(() => {
    if (!isTV || !movie?.id) return undefined

    let mounted = true
    const controller = new AbortController()

    getTVDetails(movie.id, { signal: controller.signal })
      .then((details) => {
        if (!mounted) return
        setTVDetails(details)
        const firstSeason =
          (details?.seasons ?? []).find((season) => season?.season_number > 0) ??
          (details?.seasons ?? [])[0]

        if (!resumeSeasonNumber && !storedSeasonNumber && firstSeason?.season_number) {
          setSeasonNumber(firstSeason.season_number)
        }
      })
      .catch(() => {
        if (mounted) setTVDetails(null)
      })

    return () => {
      mounted = false
      controller.abort()
    }
  }, [isTV, movie?.id, resumeSeasonNumber, storedSeasonNumber])

  useEffect(() => {
    if (!isTV || !movie?.id || !seasonNumber || episodesByKey[episodesKey]) return undefined

    let mounted = true
    const controller = new AbortController()

    getTVSeasonDetails(movie.id, seasonNumber, { signal: controller.signal })
      .then((data) => {
        if (!mounted) return
        const episodes = data?.episodes ?? []
        const matchingStoredEpisode =
          storedSeasonNumber === seasonNumber && storedEpisodeNumber
            ? storedEpisodeNumber
            : null
        const matchingResumeEpisode =
          matchingStoredEpisode ??
          (resumeSeasonNumber === seasonNumber && resumeEpisodeNumber
            ? resumeEpisodeNumber
            : null)

        setEpisodesByKey((current) => ({
          ...current,
          [episodesKey]: { episodes },
        }))
        setSelectedEpisodeNumber(matchingResumeEpisode || episodes[0]?.episode_number || 1)
      })
      .catch(() => {
        if (!mounted) return
        setEpisodesByKey((current) => ({
          ...current,
          [episodesKey]: { episodes: [] },
        }))
        setSelectedEpisodeNumber(1)
      })

    return () => {
      mounted = false
      controller.abort()
    }
  }, [
    episodesByKey,
    episodesKey,
    isTV,
    movie?.id,
    resumeEpisodeNumber,
    resumeSeasonNumber,
    seasonNumber,
    storedEpisodeNumber,
    storedSeasonNumber,
  ])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    const syncFullscreenState = () =>
      setIsPlayerFullscreen(document.fullscreenElement === playerShellRef.current)
    document.addEventListener('fullscreenchange', syncFullscreenState)
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState)
  }, [])

  useEffect(() => {
    onStateChange?.({
      mode,
      providerIndex,
      seasonNumber,
      episodeNumber: selectedEpisodeNumber,
    })
  }, [mode, onStateChange, providerIndex, seasonNumber, selectedEpisodeNumber])

  const togglePlayerFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement === playerShellRef.current) {
        await document.exitFullscreen()
      } else {
        await playerShellRef.current?.requestFullscreen()
      }
    } catch {
      // Fullscreen can be unavailable when the browser denies the request.
    }
  }, [])

  const handleClose = useCallback(() => {
    onClose?.()
  }, [onClose])

  useEffect(() => {
    const handleKeyboardShortcut = (event) => {
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        return
      }
      if (event.altKey || event.ctrlKey || event.metaKey) return

      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        togglePlayerFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyboardShortcut)
    return () => window.removeEventListener('keydown', handleKeyboardShortcut)
  }, [handleClose, togglePlayerFullscreen])

  const movieUrl = useMemo(
    () => PROVIDERS[providerIndex].build(movie?.id, seasonNumber, selectedEpisodeNumber, isTV),
    [isTV, movie?.id, providerIndex, seasonNumber, selectedEpisodeNumber],
  )

  const moviePlaybackUrl = useMemo(() => {
    const url = new URL(movieUrl)
    url.searchParams.set('autoplay', '1')
    return url.toString()
  }, [movieUrl])

  const playerLoading = mode === 'movie' && Boolean(moviePlaybackUrl) && loadedUrl !== moviePlaybackUrl
  const releaseYear =
    movie?.release_date?.slice(0, 4) ??
    movie?.first_air_date?.slice(0, 4) ??
    null

  const handleSwitchProvider = () => {
    setProviderIndex((index) => (index + 1) % PROVIDERS.length)
    setLoadedUrl('')
  }

  const handleRetry = () => {
    setLoadedUrl('')
    setPlayerReloadKey((key) => key + 1)
  }

  const handleSeasonChange = (event) => {
    setSeasonNumber(Number(event.target.value))
    setSelectedEpisodeNumber(1)
    setProviderIndex(0)
    setLoadedUrl('')
  }

  const handleEpisodeChange = (event) => {
    setSelectedEpisodeNumber(Number(event.target.value))
    setProviderIndex(0)
    setLoadedUrl('')
  }

  if (!movie) return null

  return (
    <motion.div
      ref={playerShellRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex h-[100dvh] flex-col overflow-hidden bg-zinc-950 text-white"
    >
      {mode === 'trailer' ? (
        <FullscreenTrailerStage
          movie={movie}
          videoKey={trailerState?.key ?? null}
          loading={trailerLoading}
          isTV={isTV}
          onClose={handleClose}
          onSwitchToMovie={() => setMode('movie')}
        />
      ) : (
        <>
          <div className="absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/80 via-black/35 to-transparent">
            <div className="flex items-start justify-between gap-3 px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] sm:px-7 sm:py-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close player"
                  title="Close"
                  className="grid h-11 w-11 flex-none place-items-center rounded-full bg-black/50 text-white shadow-lg backdrop-blur-md transition hover:bg-black/75"
                >
                  <X size={24} />
                </button>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">
                    {isTV ? 'Series' : 'Movie'}
                    {releaseYear ? ` • ${releaseYear}` : ''}
                  </p>
                  <h2 className="truncate text-sm font-bold text-white drop-shadow sm:text-lg">
                    {movie.title || movie.name}
                  </h2>
                </div>
              </div>

              <div className="flex flex-none items-center gap-2">
                <button
                  type="button"
                  onClick={handleSwitchProvider}
                  title="Switch server"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-black/50 px-3.5 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md transition hover:bg-black/75"
                >
                  <RefreshCw size={16} />
                  <span className="hidden sm:inline">{PROVIDERS[providerIndex].name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChromeVisible((visible) => !visible)}
                  aria-expanded={chromeVisible}
                  aria-label={
                    isTV
                      ? chromeVisible
                        ? 'Hide season and episode controls'
                        : 'Show season and episode controls'
                      : chromeVisible
                        ? 'Hide server controls'
                        : 'Show server controls'
                  }
                  title={isTV ? 'Season and episode controls' : 'Server controls'}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md transition hover:bg-black/75 ${
                    chromeVisible ? 'bg-white/20 ring-1 ring-white/25' : 'bg-black/50'
                  }`}
                >
                  <ListVideo size={16} />
                  <span className="hidden sm:inline">{isTV ? 'Episodes' : 'Servers'}</span>
                </button>
                <button
                  type="button"
                  onClick={togglePlayerFullscreen}
                  aria-label={isPlayerFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  title={isPlayerFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  className="grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white shadow-lg backdrop-blur-md transition hover:bg-black/75"
                >
                  {isPlayerFullscreen ? <Minimize2 size={21} /> : <Maximize2 size={21} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="relative min-h-0 flex-1 bg-black">
              <iframe
                key={`${movie.id}-${providerIndex}-${seasonNumber}-${selectedEpisodeNumber}-${playerReloadKey}`}
                src={moviePlaybackUrl}
                className="h-full w-full"
                frameBorder="0"
                allow="autoplay; encrypted-media; picture-in-picture"
                title={movie.title || movie.name}
                onLoad={() => setLoadedUrl(moviePlaybackUrl)}
              />

              {playerLoading ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black px-6 text-center">
                  <LoaderCircle className="animate-spin text-[#E50914]" size={44} />
                  <div>
                    <p className="text-sm font-bold text-white">Loading player</p>
                    <p className="mt-1 text-xs text-white/40">
                      {PROVIDERS[providerIndex].name} is starting up.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                    >
                      <RefreshCw size={14} />
                      Retry
                    </button>
                    <button
                      type="button"
                      onClick={handleSwitchProvider}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                    >
                      <Server size={14} />
                      Switch server
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div
              className={`absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/90 via-black/45 to-transparent transition-opacity duration-300 ${
                chromeVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <div className="flex flex-wrap items-end justify-between gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-12 sm:px-7 sm:py-6">
                {isTV ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="relative">
                      <span className="sr-only">Season</span>
                      <select
                        value={seasonNumber}
                        onChange={handleSeasonChange}
                        className="min-h-10 appearance-none rounded-lg border border-white/15 bg-black/70 py-2 pl-3 pr-9 text-xs font-bold text-white outline-none backdrop-blur transition focus:border-[#E50914]"
                      >
                        {(tvDetails?.seasons ?? [])
                          .filter((season) => season.season_number > 0)
                          .map((season) => (
                            <option key={season.season_number} value={season.season_number}>
                              Season {season.season_number}
                            </option>
                          ))}
                        {!tvDetails?.seasons?.length ? (
                          <option value={seasonNumber}>Season {seasonNumber}</option>
                        ) : null}
                      </select>
                      <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/55"
                      />
                    </label>

                    <label className="relative">
                      <span className="sr-only">Episode</span>
                      <select
                        value={selectedEpisodeNumber}
                        onChange={handleEpisodeChange}
                        disabled={episodesLoading && !seasonEpisodes.length}
                        className="min-h-10 max-w-[220px] appearance-none rounded-lg border border-white/15 bg-black/70 py-2 pl-3 pr-9 text-xs font-bold text-white outline-none backdrop-blur transition focus:border-[#E50914] disabled:opacity-50"
                      >
                        {episodesLoading && !seasonEpisodes.length ? (
                          <option value={selectedEpisodeNumber}>Loading episodes...</option>
                        ) : null}
                        {seasonEpisodes.map((episode) => (
                          <option key={episode.episode_number} value={episode.episode_number}>
                            E{episode.episode_number} — {episode.name || `Episode ${episode.episode_number}`}
                          </option>
                        ))}
                        {!episodesLoading && !seasonEpisodes.length ? (
                          <option value={selectedEpisodeNumber}>Episode {selectedEpisodeNumber}</option>
                        ) : null}
                      </select>
                      <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/55"
                      />
                    </label>

                    {episodesLoading ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/55 backdrop-blur">
                        <LoaderCircle size={13} className="animate-spin" />
                        Episodes
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/50">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-2 backdrop-blur">
                    <Server size={13} />
                    {PROVIDERS[providerIndex].name}
                  </span>
                  <button
                    type="button"
                    onClick={handleSwitchProvider}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-white/75 backdrop-blur transition hover:bg-white/20 hover:text-white"
                  >
                    <RefreshCw size={13} />
                    Switch
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}

export default VideoPlayer
