import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  ChevronDown,
  Film,
  Globe2,
  Home,
  LoaderCircle,
  Play,
  Search,
  Settings2,
  Sparkles,
  Tv,
  X,
} from 'lucide-react'
import { CATEGORIES, QUICK_BROWSE_GENRES } from '../constants'
import { getQuickSuggestions, getSearchCorrections } from '../services/searchSuggestions'
import { imageUrl } from '../services/tmdb'

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

function SuggestionRow({ movie, onSelect }) {
  const title = displayTitle(movie)
  const year = displayYear(movie)
  const poster = imageUrl(movie?.poster_path, 'w92')
  const mediaLabel = isTVTitle(movie) ? 'Series' : 'Movie'

  return (
    <button
      type="button"
      onClick={() => onSelect?.(movie)}
      className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/[0.06] focus:bg-white/[0.06] focus:outline-none"
    >
      <span className="relative h-14 w-10 flex-none overflow-hidden rounded-lg bg-white/5">
        {poster ? (
          <img
            src={poster}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-white/25">
            <Film size={15} />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-white">{title}</span>
        <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">
          {year} · {mediaLabel}
        </span>
      </span>
      <ArrowRight
        size={15}
        className="flex-none text-white/20 transition group-hover:translate-x-0.5 group-hover:text-[#E50914]"
      />
    </button>
  )
}

function SuggestionPanel({
  query,
  suggestions,
  loading,
  corrections,
  checkingCorrections,
  onSelect,
  onCorrection,
  onSeeAll,
  className = '',
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/10 bg-[#09090b]/[0.98] shadow-[0_24px_80px_rgba(0,0,0,0.9)] backdrop-blur-2xl ${className}`}
    >
      <div className="flex items-center justify-between gap-2 px-3 pb-1 pt-2.5">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
          Suggestions
        </p>
        {loading ? (
          <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white/30">
            <LoaderCircle size={11} className="animate-spin" />
            Searching
          </span>
        ) : null}
      </div>

      {loading && !suggestions.length ? (
        <div className="space-y-1 p-1">
          {[0, 1, 2].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl px-2.5 py-2">
              <span className="h-14 w-10 flex-none animate-pulse rounded-lg bg-white/5" />
              <span className="flex-1 space-y-2">
                <span className="block h-3 w-3/4 animate-pulse rounded bg-white/5" />
                <span className="block h-2 w-1/3 animate-pulse rounded bg-white/5" />
              </span>
            </div>
          ))}
        </div>
      ) : suggestions.length ? (
        <div className="no-scrollbar max-h-[19rem] overflow-y-auto p-1">
          {suggestions.map((movie) => (
            <SuggestionRow
              key={`${isTVTitle(movie) ? 'tv' : 'movie'}-${movie.id}`}
              movie={movie}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : (
        <div className="px-3 pb-2 pt-3 text-xs leading-5 text-white/40">
          No quick matches for “{query}”.
        </div>
      )}

      {!loading && !suggestions.length ? (
        <div className="px-2 pb-2">
          {checkingCorrections ? (
            <p className="inline-flex items-center gap-2 px-2 py-2 text-[11px] text-white/35">
              <LoaderCircle size={12} className="animate-spin text-[#E50914]" />
              Looking for close matches...
            </p>
          ) : corrections.length ? (
            <div className="rounded-xl border border-[#E50914]/20 bg-[#E50914]/[0.07] p-2.5">
              <p className="inline-flex items-center gap-1.5 px-1 text-[9px] font-black uppercase tracking-[0.24em] text-[#ff5963]">
                <Sparkles size={11} />
                Did you mean
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {corrections.map((correction) => (
                  <button
                    key={correction.query}
                    type="button"
                    onClick={() => onCorrection?.(correction.query)}
                    className="rounded-full border border-[#E50914]/30 bg-[#E50914]/10 px-3 py-1.5 text-xs font-bold capitalize text-white transition hover:bg-[#E50914]/20 active:scale-95"
                  >
                    {correction.query}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onSeeAll}
        className="flex w-full items-center justify-between gap-3 border-t border-white/10 px-3.5 py-3 text-left text-xs font-bold text-white/75 transition hover:bg-white/[0.05] hover:text-white"
      >
        <span className="truncate">See all results for “{query}”</span>
        <ArrowRight size={15} className="flex-none text-[#E50914]" />
      </button>
    </div>
  )
}

function Navbar({
  activeTab = 'home',
  setActiveTab,
  searchQuery = '',
  onSearchChange,
  onCategorySelect,
  onPickTitle,
  selectedCategoryId,
  watchRegion = 'PH',
}) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [inputValue, setInputValue] = useState(searchQuery)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [suggestionState, setSuggestionState] = useState({
    query: '',
    items: [],
    loading: false,
    corrections: [],
    correcting: false,
  })
  const categoriesRef = useRef(null)
  const searchRef = useRef(null)
  const suggestionRequestId = useRef(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setInputValue(searchQuery)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [searchQuery])

  useEffect(() => {
    const query = inputValue.trim()
    const requestId = ++suggestionRequestId.current

    if (query.length < 2) return undefined

    const timer = window.setTimeout(() => {
      setSuggestionState({
        query,
        items: [],
        loading: true,
        corrections: [],
        correcting: false,
      })

      getQuickSuggestions(query)
        .then((results) => {
          if (requestId !== suggestionRequestId.current) return undefined

          setSuggestionState({
            query,
            items: results,
            loading: false,
            corrections: [],
            correcting: false,
          })

          if (results.length || query.length < 3) return undefined

          setSuggestionState((current) =>
            current.query === query ? { ...current, correcting: true } : current,
          )

          return getSearchCorrections(query)
            .then((corrections) => {
              if (requestId !== suggestionRequestId.current) return
              setSuggestionState((current) =>
                current.query === query
                  ? { ...current, corrections, correcting: false }
                  : current,
              )
            })
            .catch(() => {
              if (requestId !== suggestionRequestId.current) return
              setSuggestionState((current) =>
                current.query === query ? { ...current, correcting: false } : current,
              )
            })
        })
        .catch(() => {
          if (requestId !== suggestionRequestId.current) return
          setSuggestionState({
            query,
            items: [],
            loading: false,
            corrections: [],
            correcting: false,
          })
        })
    }, 180)

    return () => window.clearTimeout(timer)
  }, [inputValue])

  useEffect(() => {
    if (!isCategoriesOpen) return undefined

    const handlePointerDown = (event) => {
      if (!categoriesRef.current?.contains(event.target)) {
        setIsCategoriesOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isCategoriesOpen])

  useEffect(() => {
    if (!suggestionsOpen) return undefined

    const handlePointerDown = (event) => {
      if (!searchRef.current?.contains(event.target)) {
        setSuggestionsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [suggestionsOpen])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return
      if (mobileSearchOpen) setMobileSearchOpen(false)
      if (isCategoriesOpen) setIsCategoriesOpen(false)
      if (suggestionsOpen) setSuggestionsOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileSearchOpen, isCategoriesOpen, suggestionsOpen])

  useEffect(() => {
    if (!mobileSearchOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileSearchOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('resize', handleResize)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('resize', handleResize)
    }
  }, [mobileSearchOpen])

  const handleSearch = (value) => {
    setInputValue(value)
    onSearchChange?.(value)
    setSuggestionsOpen(value.trim().length >= 2)
    if (value.trim()) setActiveTab?.('search')
  }

  const applyCorrection = (value) => {
    setInputValue(value)
    onSearchChange?.(value)
    setSuggestionsOpen(true)
    setActiveTab?.('search')
  }

  const submitSearch = () => {
    if (!inputValue.trim()) return
    setSuggestionsOpen(false)
    setMobileSearchOpen(false)
    setIsCategoriesOpen(false)
    onSearchChange?.(inputValue)
    setActiveTab?.('search')
  }

  const pickSuggestion = (movie) => {
    setSuggestionsOpen(false)
    setMobileSearchOpen(false)
    setIsCategoriesOpen(false)

    const nextQuery = displayTitle(movie)
    if (nextQuery) {
      setInputValue(nextQuery)
      onSearchChange?.(nextQuery)
      setActiveTab?.('search')
    }

    onPickTitle?.(movie)
  }

  const openSearch = () => {
    setIsCategoriesOpen(false)
    setMobileSearchOpen(true)
    setActiveTab?.('search')
  }

  const closeSearch = () => setMobileSearchOpen(false)

  const goHome = () => {
    closeSearch()
    setIsCategoriesOpen(false)
    setSuggestionsOpen(false)
    onSearchChange?.('')
    setActiveTab?.('home')
  }

  const navigate = (tab) => {
    closeSearch()
    setIsCategoriesOpen(false)
    setSuggestionsOpen(false)
    setActiveTab?.(tab)
  }

  const selectCategory = (id) => {
    closeSearch()
    setIsCategoriesOpen(false)
    setSuggestionsOpen(false)
    setActiveTab?.('movies')
    onCategorySelect?.(id)
  }

  const buttonClasses = (section) =>
    activeTab === section
      ? 'text-white'
      : 'text-zinc-400 transition-colors hover:text-white'

  const mobileNavItems = [
    { label: 'Home', icon: Home, active: activeTab === 'home', onClick: goHome },
    {
      label: 'Movies',
      icon: Film,
      active: activeTab === 'movies',
      onClick: () => navigate('movies'),
    },
    { label: 'Search', icon: Search, active: activeTab === 'search', onClick: openSearch },
    {
      label: 'Series',
      icon: Tv,
      active: activeTab === 'series',
      onClick: () => navigate('series'),
    },
    {
      label: 'Settings',
      icon: Settings2,
      active: activeTab === 'profile',
      onClick: () => navigate('profile'),
    },
  ]

  const activeTransition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring', stiffness: 440, damping: 36 }

  const trimmedInput = inputValue.trim()
  const activeSuggestionState =
    suggestionState.query === trimmedInput ? suggestionState : null
  const visibleSuggestions = activeSuggestionState?.items ?? []
  const visibleSuggestionsLoading =
    trimmedInput.length >= 2 && (!activeSuggestionState || activeSuggestionState.loading)
  const visibleSuggestionCorrections = activeSuggestionState?.corrections ?? []
  const visibleSuggestionCorrecting = activeSuggestionState?.correcting ?? false
  const desktopSuggestionsVisible = suggestionsOpen && trimmedInput.length >= 2
  const mobileSuggestionsVisible = trimmedInput.length >= 2

  return (
    <>
      {/* Mobile floating top bar */}
      <div className="fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[95] md:hidden">
        <div className="relative mx-auto flex max-w-xl items-center justify-between gap-3 overflow-hidden rounded-[22px] border border-white/10 bg-black/70 px-3 py-2.5 shadow-[0_18px_60px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <button
            type="button"
            onClick={goHome}
            className="group flex min-w-0 items-center gap-2.5"
            aria-label="Go to home"
          >
            <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-gradient-to-br from-[#ff2633] via-[#E50914] to-[#850008] text-white shadow-[0_8px_24px_rgba(229,9,20,0.35)] transition group-active:scale-95">
              <Play size={15} fill="currentColor" className="ml-0.5" />
            </span>
            <span className="min-w-0 text-left leading-none">
              <span className="block text-[8px] font-bold uppercase tracking-[0.38em] text-white/30">
                Movies &amp; series
              </span>
              <span className="mt-1 block truncate text-base font-black tracking-tight text-white">
                DANNA<span className="text-[#E50914]">FLIX</span>
              </span>
            </span>
          </button>

          <div className="flex flex-none items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigate('profile')}
              aria-label={`Region ${watchRegion}. Open preferences`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-[10px] font-black tracking-[0.12em] text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <Globe2 size={12} className="text-[#E50914]" />
              {watchRegion}
            </button>
            <button
              type="button"
              onClick={openSearch}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:bg-white/10 active:scale-95"
              aria-label="Search movies and series"
            >
              <Search size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navbar */}
      <nav className="fixed left-1/2 top-6 z-[90] hidden -translate-x-1/2 items-center gap-8 rounded-full border border-white/10 bg-black/60 px-8 py-3 shadow-2xl backdrop-blur-xl md:flex">
        <button
          type="button"
          onClick={goHome}
          className="mr-4 text-xl font-black italic tracking-tighter text-[#E50914]"
        >
          DANNAFLIX
        </button>

        <div className="flex gap-6 text-xs font-bold uppercase tracking-widest text-zinc-400">
          <button type="button" onClick={goHome} className={buttonClasses('home')}>
            Home
          </button>
          <button type="button" onClick={() => navigate('movies')} className={buttonClasses('movies')}>
            Movies
          </button>
          <button type="button" onClick={() => navigate('series')} className={buttonClasses('series')}>
            Series
          </button>

          <div ref={categoriesRef} className="relative">
            <button
              type="button"
              onClick={() => setIsCategoriesOpen((open) => !open)}
              className={`flex items-center gap-1 transition-colors ${
                isCategoriesOpen ? 'text-white' : 'text-zinc-400 hover:text-white'
              }`}
              aria-expanded={isCategoriesOpen}
              aria-haspopup="true"
            >
              Categories <ChevronDown size={14} />
            </button>

            <div
              className={`absolute left-0 top-full pt-2 transition-opacity duration-200 ${
                isCategoriesOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <div className="no-scrollbar max-h-80 w-52 overflow-y-auto rounded-2xl border border-white/10 bg-black/95 p-2 shadow-2xl backdrop-blur-xl">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => selectCategory(category.id)}
                    className={`block w-full rounded-lg px-4 py-2 text-left text-xs font-medium transition ${
                      String(selectedCategoryId) === String(category.id)
                        ? 'bg-[#E50914] text-white'
                        : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="ml-4 flex items-center gap-4">
          <div ref={searchRef} className="relative w-56 xl:w-64">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="search"
              value={inputValue}
              onChange={(event) => handleSearch(event.target.value)}
              onFocus={() => {
                if (inputValue.trim().length >= 2) setSuggestionsOpen(true)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setSuggestionsOpen(false)
                  event.currentTarget.blur()
                }
                if (event.key === 'Enter') {
                  event.preventDefault()
                  submitSearch()
                  event.currentTarget.blur()
                }
              }}
              placeholder="Search movies & series..."
              aria-label="Search movies and series"
              aria-expanded={desktopSuggestionsVisible}
              autoComplete="off"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#E50914]/60"
            />
            {inputValue ? (
              <button
                type="button"
                onClick={() => handleSearch('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}

            {desktopSuggestionsVisible ? (
              <div className="absolute left-1/2 top-full z-[100] mt-2 w-[22rem] -translate-x-1/2 xl:w-[25rem]">
                <SuggestionPanel
                  query={trimmedInput}
                  suggestions={visibleSuggestions}
                  loading={visibleSuggestionsLoading}
                  corrections={visibleSuggestionCorrections}
                  checkingCorrections={visibleSuggestionCorrecting}
                  onSelect={pickSuggestion}
                  onCorrection={applyCorrection}
                  onSeeAll={submitSearch}
                />
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => navigate('profile')}
            aria-label="Preferences"
            title="Preferences"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-[#E50914] text-white transition hover:scale-105"
          >
            <Settings2 size={17} />
          </button>
        </div>
      </nav>

      {/* Mobile floating bottom dock */}
      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[90] md:hidden"
      >
        <div className="relative mx-auto flex w-full max-w-md items-stretch gap-0.5 overflow-hidden rounded-[26px] border border-white/10 bg-black/75 p-1.5 shadow-[0_24px_80px_rgba(0,0,0,0.8)] ring-1 ring-white/[0.04] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          {mobileNavItems.map(({ label, icon: Icon, active, onClick }) => (
            <motion.button
              key={label}
              type="button"
              layout
              onClick={onClick}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              transition={activeTransition}
              className={`relative flex min-h-14 min-w-0 items-center justify-center gap-2 rounded-2xl px-1 text-[9px] font-bold uppercase tracking-[0.08em] transition-colors ${
                active ? 'flex-[2]' : 'flex-1'
              }`}
            >
              {active ? (
                <motion.span
                  layoutId="mobile-nav-active"
                  transition={activeTransition}
                  className="absolute inset-0 rounded-2xl bg-[#E50914]/15 ring-1 ring-[#E50914]/35"
                />
              ) : null}
              <Icon
                size={20}
                strokeWidth={active ? 2.4 : 1.8}
                className={`relative z-10 flex-none transition-colors ${
                  active ? 'text-[#ff3b45]' : 'text-white/40'
                }`}
              />
              <motion.span
                layout
                className={`relative z-10 overflow-hidden whitespace-nowrap transition-opacity ${
                  active ? 'max-w-28 text-white opacity-100' : 'max-w-0 text-white/40 opacity-0'
                }`}
              >
                {label}
              </motion.span>
            </motion.button>
          ))}
        </div>
      </nav>

      {/* Mobile search sheet */}
      <AnimatePresence>
        {mobileSearchOpen ? (
          <motion.div
            key="mobile-search"
            role="dialog"
            aria-modal="true"
            aria-label="Search movies and series"
            className="fixed inset-0 z-[120] h-[100dvh] overflow-y-auto bg-[#050506] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(229,9,20,0.14),transparent_42%)]" />
            <motion.div
              className="mx-auto flex min-h-full w-full max-w-xl flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
              initial={{ opacity: 0, y: reduceMotion ? 0 : -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
              transition={{ duration: reduceMotion ? 0 : 0.24 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.42em] text-[#E50914]">
                    Find your next
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
                    Search DannaFlix
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeSearch}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white/65 transition hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="relative mt-5">
                <Search
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  type="search"
                  value={inputValue}
                  onChange={(event) => handleSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') closeSearch()
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      submitSearch()
                    }
                  }}
                  placeholder="Movies, series, documentaries..."
                  aria-label="Search movies and series"
                  autoComplete="off"
                  className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-12 pr-12 text-base text-white outline-none transition placeholder:text-white/30 focus:border-[#E50914]/60 focus:bg-white/[0.08]"
                  autoFocus
                />
                {inputValue ? (
                  <button
                    type="button"
                    onClick={() => handleSearch('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/5 text-white/55 transition hover:bg-white/10 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>
              <p className="mt-2 px-1 text-[11px] leading-5 text-white/35">
                Search movies and series across the PH and US catalogs.
              </p>

              {mobileSuggestionsVisible ? (
                <div className="mt-3">
                  <SuggestionPanel
                    query={trimmedInput}
                    suggestions={visibleSuggestions}
                    loading={visibleSuggestionsLoading}
                    corrections={visibleSuggestionCorrections}
                    checkingCorrections={visibleSuggestionCorrecting}
                    onSelect={pickSuggestion}
                    onCorrection={applyCorrection}
                    onSeeAll={submitSearch}
                  />
                </div>
              ) : null}

              {trimmedInput && !mobileSuggestionsVisible ? (
                <button
                  type="button"
                  onClick={submitSearch}
                  className="mt-4 inline-flex items-center justify-between gap-3 rounded-2xl border border-[#E50914]/30 bg-[#E50914]/10 px-4 py-3.5 text-left text-sm font-bold text-white transition hover:bg-[#E50914]/20"
                >
                  <span className="truncate">Show results for “{trimmedInput}”</span>
                  <ArrowRight size={17} className="flex-none text-[#E50914]" />
                </button>
              ) : null}

              <div className="mt-7">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35">
                  Browse by genre
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUICK_BROWSE_GENRES.map((genre) => (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => selectCategory(genre.id)}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white/65 transition hover:border-[#E50914]/40 hover:bg-[#E50914]/10 hover:text-white"
                    >
                      {genre.name === 'Pinoy' ? 'Pinoy cinema' : genre.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 pt-10 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
                <span className="inline-flex items-center gap-1.5">
                  <Globe2 size={12} className="text-[#E50914]" />
                  Region {watchRegion}
                </span>
                <span>No sign-in needed</span>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

export default Navbar
