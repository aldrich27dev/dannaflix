import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  ExternalLink,
  LoaderCircle,
  Maximize2,
  Play,
  Plus,
  Star,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { getTitleDetails, imageSrcSet, imageUrl } from '../../services/tmdb'
import { REGIONS } from '../../constants'

function isTVTitle(movie) {
  return (
    movie?.media_type === 'tv' ||
    movie?.first_air_date !== undefined ||
    (movie?.name !== undefined && movie?.title === undefined)
  )
}

function TitleDetailsModal({
  movie,
  genres = [],
  region = 'US',
  isSaved = false,
  onClose,
  onPlay,
  onToggleSave,
}) {
  const [extrasByKey, setExtrasByKey] = useState({})
  const [mutedByKey, setMutedByKey] = useState({})
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)

  const mediaType = isTVTitle(movie) ? 'tv' : 'movie'
  const extrasKey = movie?.id ? `${mediaType}-${movie.id}-${region}` : ''
  const extras = extrasKey ? extrasByKey[extrasKey] : null
  const details = extras?.details ?? null
  const loading = Boolean(movie?.id) && !extras
  const providers = details?.watchProviders ?? extras?.providers ?? null
  const muted = mutedByKey[extrasKey] ?? true
  const regionLabel =
    REGIONS.find((entry) => entry.code === region)?.label ?? region

  useEffect(() => {
    if (!movie?.id || extrasByKey[extrasKey]) return undefined

    let mounted = true
    const controller = new AbortController()

    getTitleDetails(movie.id, mediaType, { region, signal: controller.signal })
      .then((data) => {
        if (!mounted) return
        setExtrasByKey((current) => ({
          ...current,
          [extrasKey]: {
            details: data,
            providers: data?.watchProviders ?? null,
          },
        }))
      })
      .catch(() => {
        if (!mounted) return
        setExtrasByKey((current) => ({
          ...current,
          [extrasKey]: { details: null, providers: null },
        }))
      })

    return () => {
      mounted = false
      controller.abort()
    }
  }, [extrasByKey, extrasKey, mediaType, movie?.id, region])

  useEffect(() => {
    if (!movie) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [movie, onClose])

  const providerGroups = useMemo(() => {
    if (!providers) return []

    return [
      { label: 'Stream', items: providers.flatrate },
      { label: 'Free', items: providers.free },
      { label: 'With ads', items: providers.ads },
      { label: 'Rent', items: providers.rent },
      { label: 'Buy', items: providers.buy },
    ].filter((group) => group.items?.length)
  }, [providers])

  const detailTrailer = details?.videos?.results?.find(
    (video) => video.site === 'YouTube' && video.type === 'Trailer' && video.key,
  ) ?? details?.videos?.results?.find(
    (video) => video.site === 'YouTube' && video.type === 'Teaser' && video.key,
  )
  const trailerKey = detailTrailer?.key ?? null

  const year =
    details?.release_date?.slice(0, 4) ??
    movie?.release_date?.slice(0, 4) ??
    details?.first_air_date?.slice(0, 4) ??
    movie?.first_air_date?.slice(0, 4)
  const rating = details?.vote_average ?? movie?.vote_average
  const genreNames = details?.genres?.length
    ? details.genres.map((genre) => genre.name).filter(Boolean)
    : Array.isArray(movie?.genres) && movie.genres.length
      ? movie.genres
          .map((genre) => (typeof genre === 'string' ? genre : genre.name))
          .filter(Boolean)
      : (movie?.genre_ids ?? [])
          .map((id) => genres.find((genre) => String(genre.id) === String(id))?.name)
          .filter(Boolean)
  const backdropPath = movie?.backdrop_path || movie?.poster_path
  const backdrop = imageUrl(backdropPath, 'w1280')
  const backdropSrcSet = imageSrcSet(backdropPath, ['w780', 'w1280'])
  const watchLink =
    providers?.link ??
    (movie?.id
      ? `https://www.themoviedb.org/${mediaType}/${movie.id}/watch?locale=${region}`
      : null)
  const runtimeLabel = mediaType === 'tv'
    ? details?.number_of_seasons
      ? `${details.number_of_seasons} season${details.number_of_seasons === 1 ? '' : 's'}`
      : null
    : details?.runtime
      ? `${details.runtime} min`
      : null

  const handleDialogKeyDown = (event) => {
    if (event.key !== 'Tab') return

    const focusable = dialogRef.current?.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    if (!focusable?.length) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <AnimatePresence>
      {movie ? (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-end justify-center overflow-hidden bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose?.()
          }}
        >
          <motion.section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="title-details-heading"
            onKeyDown={handleDialogKeyDown}
            className="relative flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b0b0f] shadow-[0_30px_120px_rgba(0,0,0,0.85)] sm:max-h-[90dvh] sm:rounded-2xl"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.22 }}
          >
            <div className="absolute right-4 top-4 z-30 flex items-center gap-2">
              {trailerKey ? (
                <button
                  type="button"
                  onClick={() => setMutedByKey((current) => ({ ...current, [extrasKey]: !muted }))}
                  aria-label={muted ? 'Unmute trailer' : 'Mute trailer'}
                  className="grid h-10 w-10 place-items-center rounded-full bg-black/65 text-white backdrop-blur transition hover:bg-black"
                >
                  {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
                </button>
              ) : null}
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close title details"
                className="grid h-10 w-10 place-items-center rounded-full bg-black/65 text-white backdrop-blur transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-[#E50914]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="no-scrollbar overflow-y-auto">
              <div className="relative">
                <div className="absolute inset-x-0 top-0 h-[62dvh] sm:h-[560px]">
                  {trailerKey ? (
                    <iframe
                      key={`${trailerKey}-${muted ? 'muted' : 'sound'}`}
                      src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
                      title={`${movie.title || movie.name} trailer`}
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  ) : backdrop ? (
                    <img
                      src={backdrop}
                      srcSet={backdropSrcSet}
                      sizes="(max-width: 1024px) 100vw, 1024px"
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover object-top"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-[#0b0b0f]/55 to-black/20" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0f]/90 via-[#0b0b0f]/40 to-transparent" />
                </div>

                <div className="relative z-10 flex min-h-[62dvh] max-w-2xl flex-col justify-end p-6 pb-8 pt-24 sm:min-h-[560px] sm:p-10">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-[#E50914]">
                    {mediaType === 'tv' ? 'Series details' : 'Movie details'}
                  </p>
                  <h2
                    id="title-details-heading"
                    className="max-w-2xl text-3xl font-black tracking-tight text-white drop-shadow-lg sm:text-4xl"
                  >
                    {movie.title || movie.name}
                  </h2>

                  {details?.tagline ? (
                    <p className="mt-2 text-sm font-medium italic text-white/50">{details.tagline}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-white/80">
                    {year ? <span className="rounded-md bg-white/10 px-2.5 py-1.5">{year}</span> : null}
                    {rating ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1.5">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {Number(rating).toFixed(1)}
                      </span>
                    ) : null}
                    {runtimeLabel ? (
                      <span className="rounded-md bg-white/10 px-2.5 py-1.5">{runtimeLabel}</span>
                    ) : null}
                    {details?.status ? (
                      <span className="rounded-md border border-white/15 px-2.5 py-1.5 text-white/60">
                        {details.status}
                      </span>
                    ) : null}
                    {genreNames.slice(0, 4).map((name) => (
                      <span key={name} className="rounded-md border border-white/20 px-2.5 py-1.5">
                        {name}
                      </span>
                    ))}
                  </div>

                  <p className="mt-4 max-w-xl text-xs leading-5 text-white/80 sm:text-sm sm:leading-6">
                    {details?.overview || movie.overview || 'No description is available for this title yet.'}
                  </p>

                  <div className="mt-7 flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => onPlay?.(movie)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-black text-black transition hover:bg-white/85"
                    >
                      <Play size={18} fill="currentColor" /> Play
                    </button>
                    {trailerKey ? (
                      <button
                        type="button"
                        onClick={() => onPlay?.({ ...movie, playbackMode: 'trailer' })}
                        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/15 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
                      >
                        <Maximize2 size={16} /> Full-screen trailer
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onToggleSave?.(movie)}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold backdrop-blur transition ${
                        isSaved
                          ? 'border-[#E50914] bg-[#E50914]/20 text-white'
                          : 'border-white/15 bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {isSaved ? <Check size={17} /> : <Plus size={17} />}
                      {isSaved ? 'In My List' : 'My List'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative z-10 border-t border-white/10 bg-[#0b0b0f] p-6 sm:p-10">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E50914]">
                      Where to watch
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-white">
                      Official options in {regionLabel}
                    </h3>
                  </div>
                  {watchLink ? (
                    <a
                      href={watchLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                      JustWatch <ExternalLink size={12} />
                    </a>
                  ) : null}
                </div>

                {loading ? (
                  <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
                    <LoaderCircle size={16} className="animate-spin" />
                    Checking providers...
                  </div>
                ) : providerGroups.length ? (
                  <div className="mt-4 space-y-4">
                    {providerGroups.map((group) => (
                      <div key={group.label}>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">
                          {group.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {group.items.map((provider) => (
                            <a
                              key={`${group.label}-${provider.provider_id}`}
                              href={watchLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                              title={provider.provider_name}
                            >
                              {provider.logo_path ? (
                                <img
                                  src={imageUrl(provider.logo_path, 'w92')}
                                  alt=""
                                  className="h-7 w-7 rounded-lg"
                                  loading="lazy"
                                />
                              ) : null}
                              {provider.provider_name}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-white/40">
                    No official streaming options were found in {regionLabel} for this title.
                  </p>
                )}

                <p className="mt-5 text-[11px] leading-5 text-white/30">
                  Official availability can differ from the embedded playback. The player below
                  is provided by a third party, and its ads and availability are outside this
                  app&apos;s control.
                </p>
              </div>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default TitleDetailsModal
