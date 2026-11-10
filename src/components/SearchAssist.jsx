import { ArrowRight, Film, Search, SearchX, Sparkles } from 'lucide-react'
import { QUICK_BROWSE_GENRES } from '../constants'
import { imageSrcSet, imageUrl } from '../services/tmdb'
import MovieRow from './movies/MovieRow'

function isTVTitle(title) {
  return (
    title?.media_type === 'tv' ||
    title?.first_air_date !== undefined ||
    (title?.name !== undefined && title?.title === undefined)
  )
}

function displayTitle(title) {
  return title?.title || title?.name || 'Untitled'
}

function displayYear(title) {
  return title?.release_date?.slice(0, 4) || title?.first_air_date?.slice(0, 4) || 'New'
}

function MatchCard({ movie, onSelect }) {
  const title = displayTitle(movie)
  const year = displayYear(movie)
  const poster = imageUrl(movie?.poster_path, 'w154')
  const posterSrcSet = imageSrcSet(movie?.poster_path, ['w154', 'w342'])

  return (
    <button
      type="button"
      onClick={() => onSelect?.(movie)}
      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-left transition hover:border-[#E50914]/40 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-[#E50914]"
    >
      <span className="relative h-20 w-14 flex-none overflow-hidden rounded-xl bg-white/5">
        {poster ? (
          <img
            src={poster}
            srcSet={posterSrcSet}
            sizes="56px"
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-white/25">
            <Film size={17} />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm font-semibold text-white">{title}</span>
        <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
          {year} · {isTVTitle(movie) ? 'Series' : 'Movie'}
        </span>
      </span>
      <ArrowRight
        size={15}
        className="flex-none text-white/20 transition group-hover:translate-x-0.5 group-hover:text-[#E50914]"
      />
    </button>
  )
}

function SearchAssist({
  query = '',
  corrections = [],
  correctionsLoading = false,
  popularTitles = [],
  onUseCorrection,
  onPickTitle,
  onSelectGenre,
}) {
  const trimmedQuery = query.trim()
  const hasQuery = Boolean(trimmedQuery)

  const matches = []
  const seen = new Set()

  for (const correction of corrections) {
    for (const movie of correction?.results ?? []) {
      const key = `${isTVTitle(movie) ? 'tv' : 'movie'}-${movie?.id}`
      if (!movie?.id || seen.has(key)) continue
      seen.add(key)
      matches.push(movie)
    }
  }

  return (
    <div className="space-y-7">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(229,9,20,0.14),transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] px-4 py-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.3)] sm:px-8">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-black/35 text-white/45 shadow-inner">
          {hasQuery ? <SearchX size={21} /> : <Search size={21} />}
        </span>
        <p className="mt-4 text-lg font-semibold tracking-tight text-white sm:text-xl">
          {hasQuery ? `No titles found for “${trimmedQuery}”` : 'Find your next favorite'}
        </p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-white/45 sm:text-sm">
          {hasQuery
            ? 'Check the spelling, or try one of the close matches below.'
            : 'Search by title, or start with a genre and see where it takes you.'}
        </p>

        {hasQuery && correctionsLoading ? (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/45">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/15 border-t-[#E50914]" />
            Looking for close matches...
          </div>
        ) : null}

        {hasQuery && corrections.length ? (
          <div className="mt-6">
            <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#ff5963]">
              <Sparkles size={13} />
              Did you mean
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {corrections.map((correction) => (
                <button
                  key={correction.query}
                  type="button"
                  onClick={() => onUseCorrection?.(correction.query)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#E50914]/35 bg-[#E50914]/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-[#E50914]/20 active:scale-95"
                >
                  <span className="capitalize">{correction.query}</span>
                  <ArrowRight size={14} className="text-[#E50914]" />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {matches.length ? (
        <section className="space-y-3" aria-label="Closest matches">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#E50914]/25 bg-[#E50914]/10 text-[#E50914]">
              <Sparkles size={16} />
            </span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
                Closest matches
              </p>
              <h4 className="text-base font-semibold text-white">Try these titles</h4>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {matches.slice(0, 6).map((movie) => (
              <MatchCard
                key={`${isTVTitle(movie) ? 'tv' : 'movie'}-${movie.id}`}
                movie={movie}
                onSelect={onPickTitle}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3" aria-label="Browse by genre">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white/45">
            <Film size={16} />
          </span>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
              Browse
            </p>
            <h4 className="text-base font-semibold text-white">Pick a genre</h4>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_BROWSE_GENRES.map((genre) => (
            <button
              key={genre.id}
              type="button"
              onClick={() => onSelectGenre?.(genre.id)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white/65 transition hover:border-[#E50914]/40 hover:bg-[#E50914]/10 hover:text-white active:scale-95"
            >
              {genre.name === 'Pinoy' ? 'Pinoy cinema' : genre.name}
            </button>
          ))}
        </div>
      </section>

      <MovieRow title="Popular right now" movies={popularTitles} onSelect={onPickTitle} />
    </div>
  )
}

export default SearchAssist
