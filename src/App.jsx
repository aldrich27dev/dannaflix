import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import SearchAssist from './components/SearchAssist'
import Footer from './components/Footer'
import MovieCard from './components/movies/MovieCard'
import MovieRow from './components/movies/MovieRow'
import MovieLoadingSkeleton from './components/movies/MovieLoadingSkeleton'
import TitleDetailsModal from './components/movies/TitleDetailsModal'
import OnboardingModal from './components/OnboardingModal'
import VideoPlayer from './components/VideoPlayer'
import { CATEGORIES, DEFAULT_REGION, GENRES, REGIONS } from './constants'
import {
  getAsianSeries,
  getCustomFeaturedSeries,
  getFilipinoMovies,
  getLatestNetflixMovies,
  getLatestNetflixSeries,
  getLatestPrimeMovies,
  getLatestPrimeSeries,
  getMoreFilipinoMovies,
  getMoviesByCategory,
  getMoviesByPersonalInterests,
  getNowPlayingMovies,
  getOnTheAirTV,
  getPopularMovies,
  getTrending,
  getTrendingTV,
  searchTitles,
} from './services/tmdb'
import { getSearchCorrections } from './services/searchSuggestions'

const BROWSE_KEY = 'dannaflix_browse_state'
const INTERESTS_KEY = 'dannaflix_interests'
const ONBOARDED_KEY = 'dannaflix_onboarded'
const REGION_KEY = 'dannaflix_region'
const WATCHLIST_KEY = 'dannaflix_watchlist'
const RECENT_KEY = 'dannaflix_recent'
const PLAYBACK_KEY = 'dannaflix_active_playback'
const MAX_SAVED_TITLES = 100
const MAX_RECENT_TITLES = 20

function readStoredJSON(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? 'null')
    return value ?? fallback
  } catch {
    return fallback
  }
}

function readRegion() {
  if (typeof window === 'undefined') return DEFAULT_REGION
  const stored = window.localStorage.getItem(REGION_KEY)
  return REGIONS.some((region) => region.code === stored) ? stored : DEFAULT_REGION
}

function readInterests() {
  const value = readStoredJSON(INTERESTS_KEY, [])
  return Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : []
}

function readSavedTitles(key, limit) {
  const value = readStoredJSON(key, [])
  return Array.isArray(value)
    ? value.filter((item) => item && item.id).slice(0, limit)
    : []
}

function isTVTitle(title) {
  return (
    title?.media_type === 'tv' ||
    title?.first_air_date !== undefined ||
    (title?.name !== undefined && title?.title === undefined)
  )
}

function titleKey(title) {
  if (!title?.id) return ''
  return `${isTVTitle(title) ? 'tv' : 'movie'}-${title.id}`
}

function withMediaType(results, mediaType) {
  return (results ?? []).map((item) => ({
    ...item,
    media_type: item.media_type ?? mediaType,
  }))
}

function uniqueTitles(titles) {
  return Array.from(
    new Map(
      (titles ?? [])
        .filter(Boolean)
        .map((title) => [titleKey(title) || `${title.id}`, title]),
    ).values(),
  )
}

function isRenderableTitle(title) {
  if (!title?.id) return false

  const hasName = Boolean(title.title || title.name)
  const hasArtwork = Boolean(title.poster_path || title.backdrop_path)

  return hasName && hasArtwork
}

function readBrowseSession() {
  if (typeof window === 'undefined') {
    return { activeTab: 'home', categoryId: null, scrollY: 0, searchQuery: '' }
  }
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(BROWSE_KEY) ?? '{}')
    return {
      activeTab: ['home', 'movies', 'series', 'search', 'profile'].includes(saved.activeTab)
        ? saved.activeTab
        : 'home',
      categoryId: saved.categoryId ?? null,
      scrollY: Number(saved.scrollY) || 0,
      searchQuery: typeof saved.searchQuery === 'string' ? saved.searchQuery : '',
    }
  } catch {
    return { activeTab: 'home', categoryId: null, scrollY: 0, searchQuery: '' }
  }
}

function readActivePlayback() {
  if (typeof window === 'undefined') return null
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(PLAYBACK_KEY) ?? 'null')
    const movie = saved?.movie
    if (!movie?.id || !(movie.title || movie.name)) return null

    return {
      movie: {
        ...movie,
        media_type: isTVTitle(movie) ? 'tv' : 'movie',
      },
      player:
        saved?.player && typeof saved.player === 'object' ? saved.player : null,
      returnState:
        saved?.returnState && typeof saved.returnState === 'object'
          ? {
              activeTab: ['home', 'movies', 'series', 'search', 'profile'].includes(
                saved.returnState.activeTab,
              )
                ? saved.returnState.activeTab
                : 'home',
              categoryId: saved.returnState.categoryId ?? null,
              scrollY: Number(saved.returnState.scrollY) || 0,
            }
          : null,
    }
  } catch {
    return null
  }
}

function writeActivePlayback(snapshot) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(PLAYBACK_KEY, JSON.stringify(snapshot))
  } catch { /* Ignore unavailable storage. */ }
}

function clearActivePlayback() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(PLAYBACK_KEY)
  } catch { /* Ignore unavailable storage. */ }
}

function App() {
  const [initialBrowseState] = useState(readBrowseSession)
  const [initialPlayback] = useState(readActivePlayback)
  const [playerInitialState, setPlayerInitialState] = useState(
    initialPlayback?.player ?? null,
  )
  const [activeTab, setActiveTab] = useState(initialBrowseState.activeTab)
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialBrowseState.categoryId)
  const [searchQuery, setSearchQuery] = useState(initialBrowseState.searchQuery)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(
    initialBrowseState.searchQuery.trim(),
  )
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(() =>
    Boolean(initialBrowseState.searchQuery.trim()),
  )
  const [searchError, setSearchError] = useState('')
  const [searchRetryKey, setSearchRetryKey] = useState(0)
  const [correctionsState, setCorrectionsState] = useState({
    query: '',
    items: [],
    loading: false,
  })

  const [watchRegion, setWatchRegion] = useState(readRegion)
  const [watchlist, setWatchlist] = useState(() =>
    readSavedTitles(WATCHLIST_KEY, MAX_SAVED_TITLES),
  )
  const [recent, setRecent] = useState(() =>
    readSavedTitles(RECENT_KEY, MAX_RECENT_TITLES),
  )

  const [trending, setTrending] = useState([])
  const [popularMovies, setPopularMovies] = useState([])
  const [nowPlayingMovies, setNowPlayingMovies] = useState([])
  const [netflixMovies, setNetflixMovies] = useState([])
  const [netflixSeries, setNetflixSeries] = useState([])
  const [primeMovies, setPrimeMovies] = useState([])
  const [primeSeries, setPrimeSeries] = useState([])
  const [filipinoMovies, setFilipinoMovies] = useState([])
  const [moreFilipinoMovies, setMoreFilipinoMovies] = useState([])
  const [trendingTV, setTrendingTV] = useState([])
  const [featuredSeries, setFeaturedSeries] = useState([])
  const [recommended, setRecommended] = useState([])
  const [recommendationLoading, setRecommendationLoading] = useState(
    () => readInterests().length > 0,
  )
  const [recommendationError, setRecommendationError] = useState('')
  const [recommendationRetryKey, setRecommendationRetryKey] = useState(0)
  const [onAirTV, setOnAirTV] = useState([])
  const [asianSeries, setAsianSeries] = useState([])
  const [categoryMovies, setCategoryMovies] = useState([])
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [categoryError, setCategoryError] = useState('')
  const [categoryPage, setCategoryPage] = useState(1)
  const [categoryHasMore, setCategoryHasMore] = useState(false)
  const categoryRequestId = useRef(0)
  const categoryLoaderRef = useRef(null)

  const [selected, setSelected] = useState(initialPlayback?.movie ?? null)
  const [selectedTitle, setSelectedTitle] = useState(null)
  const [showInterestEditor, setShowInterestEditor] = useState(false)
  const [savedInterests, setSavedInterests] = useState(readInterests)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false
    if (window.localStorage.getItem(ONBOARDED_KEY) === '1') return false
    return readInterests().length === 0
  })

  const playbackReturnState = useRef(initialPlayback?.returnState ?? null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [catalogRetryKey, setCatalogRetryKey] = useState(0)
  const initialScrollRestored = useRef(!initialBrowseState.scrollY)
  const lastScrollSave = useRef(0)

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      try {
        const [
          trendingResponse,
          popularMoviesResponse,
          nowPlayingResponse,
          netflixMoviesResponse,
          netflixSeriesResponse,
          primeMoviesResponse,
          primeSeriesResponse,
          filipinoResponse,
          moreFilipinoResponse,
          trendingTVResponse,
          featuredSeriesResponse,
          onAirTVResponse,
          asianSeriesResponse,
        ] = await Promise.all([
          getTrending(),
          getPopularMovies(),
          getNowPlayingMovies(),
          getLatestNetflixMovies(watchRegion),
          getLatestNetflixSeries(watchRegion),
          getLatestPrimeMovies(watchRegion),
          getLatestPrimeSeries(watchRegion),
          getFilipinoMovies(),
          getMoreFilipinoMovies(),
          getTrendingTV(),
          getCustomFeaturedSeries(),
          getOnTheAirTV(),
          getAsianSeries(),
        ])

        if (!mounted) return

        setTrending(withMediaType(trendingResponse?.results, 'movie'))
        setPopularMovies(withMediaType(popularMoviesResponse?.results, 'movie'))
        setNowPlayingMovies(withMediaType(nowPlayingResponse?.results, 'movie'))
        setNetflixMovies(withMediaType(netflixMoviesResponse?.results, 'movie'))
        setNetflixSeries(withMediaType(netflixSeriesResponse?.results, 'tv'))
        setPrimeMovies(withMediaType(primeMoviesResponse?.results, 'movie'))
        setPrimeSeries(withMediaType(primeSeriesResponse?.results, 'tv'))
        setFilipinoMovies(withMediaType(filipinoResponse?.results, 'movie'))
        setTrendingTV(withMediaType(trendingTVResponse?.results, 'tv'))
        setMoreFilipinoMovies(withMediaType(moreFilipinoResponse?.results, 'movie'))
        setFeaturedSeries(withMediaType(featuredSeriesResponse?.results, 'tv'))
        setOnAirTV(withMediaType(onAirTVResponse?.results, 'tv'))
        setAsianSeries(withMediaType(asianSeriesResponse?.results, 'tv'))
      } catch {
        if (!mounted) return
        setError('TMDB could not be reached right now.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [catalogRetryKey, watchRegion])

  useEffect(() => {
    if (!savedInterests.length) return

    let mounted = true
    getMoviesByPersonalInterests(savedInterests)
      .then((response) => {
        if (mounted) setRecommended(withMediaType(response?.results, 'movie'))
      })
      .catch(() => {
        if (!mounted) return
        setRecommended([])
        setRecommendationError('Recommendations could not be loaded.')
      })
      .finally(() => {
        if (mounted) setRecommendationLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [savedInterests, recommendationRetryKey])

  useEffect(() => {
    try {
      window.localStorage.setItem(REGION_KEY, watchRegion)
    } catch { /* Ignore unavailable storage. */ }
  }, [watchRegion])

  useEffect(() => {
    try {
      window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist))
    } catch { /* Ignore unavailable storage. */ }
  }, [watchlist])

  useEffect(() => {
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
    } catch { /* Ignore unavailable storage. */ }
  }, [recent])

  useEffect(() => {
    const saveBrowseState = () => {
      const scrollY =
        selected && playbackReturnState.current
          ? playbackReturnState.current.scrollY
          : !initialScrollRestored.current
            ? initialBrowseState.scrollY
            : window.scrollY
      try {
        window.sessionStorage.setItem(
          BROWSE_KEY,
          JSON.stringify({
            activeTab,
            categoryId: selectedCategoryId,
            scrollY,
            searchQuery,
          }),
        )
      } catch { /* Ignore unavailable storage. */ }
    }

    const handleScroll = () => {
      const now = Date.now()
      if (now - lastScrollSave.current < 250) return
      lastScrollSave.current = now
      saveBrowseState()
    }

    saveBrowseState()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('beforeunload', saveBrowseState)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', saveBrowseState)
    }
  }, [activeTab, selectedCategoryId, selected, searchQuery, initialBrowseState.scrollY])

  useEffect(() => {
    if (loading || categoryLoading || initialScrollRestored.current) return
    const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    const categoryNeedsMorePages = Boolean(
      selectedCategoryId && categoryHasMore && initialBrowseState.scrollY > maxScrollY,
    )
    const targetScrollY = Math.min(initialBrowseState.scrollY, maxScrollY)
    if (!categoryNeedsMorePages) initialScrollRestored.current = true
    requestAnimationFrame(() => {
      const root = document.documentElement
      const previousBehavior = root.style.scrollBehavior
      root.style.scrollBehavior = 'auto'
      window.scrollTo(0, categoryNeedsMorePages ? maxScrollY : targetScrollY)
      root.style.scrollBehavior = previousBehavior
    })
  }, [
    loading,
    categoryLoading,
    categoryHasMore,
    categoryPage,
    selectedCategoryId,
    initialBrowseState.scrollY,
  ])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextQuery = searchQuery.trim()
      if (nextQuery === debouncedSearchQuery) return

      setDebouncedSearchQuery(nextQuery)

      if (nextQuery) {
        setSearchLoading(true)
        setSearchError('')
      } else {
        setSearchResults([])
        setCorrectionsState({ query: '', items: [], loading: false })
        setSearchLoading(false)
        setSearchError('')
      }
    }, 350)

    return () => window.clearTimeout(timer)
  }, [debouncedSearchQuery, searchQuery])

  useEffect(() => {
    const query = debouncedSearchQuery

    if (!query) return undefined

    let mounted = true
    const controller = new AbortController()

    searchTitles(query, { signal: controller.signal })
      .then((response) => {
        if (!mounted) return
        const results = response?.results ?? []
        setSearchResults(results)

        if (results.some(isRenderableTitle) || query.trim().length < 3) {
          setCorrectionsState({ query, items: [], loading: false })
          return
        }

        setCorrectionsState({ query, items: [], loading: true })

        getSearchCorrections(query, { signal: controller.signal })
          .then((corrections) => {
            if (mounted) setCorrectionsState({ query, items: corrections, loading: false })
          })
          .catch((error) => {
            if (!mounted || error?.name === 'AbortError') return
            setCorrectionsState({ query, items: [], loading: false })
          })
      })
      .catch((searchFailure) => {
        if (!mounted || searchFailure?.name === 'AbortError') return
        setSearchError('Search results could not be loaded right now.')
        setSearchResults([])
        setCorrectionsState({ query, items: [], loading: false })
      })
      .finally(() => {
        if (mounted) setSearchLoading(false)
      })

    return () => {
      mounted = false
      controller.abort()
    }
  }, [debouncedSearchQuery, searchRetryKey])

  useEffect(() => {
    if (selected || !playbackReturnState.current) return
    const returnState = playbackReturnState.current
    playbackReturnState.current = null
    setActiveTab(returnState.activeTab)
    setSelectedCategoryId(returnState.categoryId)
    const timer = window.setTimeout(() => {
      requestAnimationFrame(() => {
        const root = document.documentElement
        const previousBehavior = root.style.scrollBehavior
        root.style.scrollBehavior = 'auto'
        window.scrollTo(0, returnState.scrollY)
        root.style.scrollBehavior = previousBehavior
      })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [selected])

  const fetchCategoryPage = useCallback(async (id, page, replace = false) => {
    const requestId = replace ? ++categoryRequestId.current : categoryRequestId.current
    setCategoryLoading(true)
    setCategoryError('')

    try {
      const data =
        id === 'ph'
          ? await getFilipinoMovies(page)
          : await getMoviesByCategory(id, page)

      if (requestId !== categoryRequestId.current) return

      const results = withMediaType(data?.results, 'movie')
      setCategoryMovies((current) => {
        const combined = replace ? results : [...current, ...results]
        return uniqueTitles(combined)
      })
      setCategoryPage(page)
      setCategoryHasMore(page < (data?.total_pages ?? 1))
    } catch (categoryFailure) {
      if (requestId !== categoryRequestId.current) return
      if (replace) setCategoryMovies([])
      setCategoryHasMore(false)
      setCategoryError('Movies could not be loaded.')
      console.error('Error fetching category:', categoryFailure)
    } finally {
      if (requestId === categoryRequestId.current) setCategoryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedCategoryId) return

    // Defer so the loading state can paint before the request starts.
    const timer = window.setTimeout(() => {
      fetchCategoryPage(selectedCategoryId, 1, true)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [selectedCategoryId, fetchCategoryPage])

  useEffect(() => {
    if (!selectedCategoryId || !categoryHasMore || categoryLoading) return
    const loader = categoryLoaderRef.current
    if (!loader) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fetchCategoryPage(selectedCategoryId, categoryPage + 1)
        }
      },
      { rootMargin: '300px' },
    )
    observer.observe(loader)
    return () => observer.disconnect()
  }, [
    categoryHasMore,
    categoryLoading,
    categoryPage,
    fetchCategoryPage,
    selectedCategoryId,
  ])

  const handleSaveInterests = (genreIds) => {
    const nextInterests = genreIds.map(Number)
    setSavedInterests(nextInterests)
    setShowOnboarding(false)
    setShowInterestEditor(false)
    setRecommended([])
    setRecommendationError('')
    setRecommendationLoading(nextInterests.length > 0)
    try {
      window.localStorage.setItem(INTERESTS_KEY, JSON.stringify(nextInterests))
      window.localStorage.setItem(ONBOARDED_KEY, '1')
    } catch { /* Ignore unavailable storage. */ }
  }

  const handleSkipOnboarding = () => {
    setShowOnboarding(false)
    try {
      window.localStorage.setItem(ONBOARDED_KEY, '1')
    } catch { /* Ignore unavailable storage. */ }
  }

  const handleRegionChange = (regionCode) => {
    if (regionCode === watchRegion) return
    setLoading(true)
    setError('')
    setWatchRegion(regionCode)
  }

  const toggleWatchlist = useCallback((movie) => {
    if (!movie?.id) return
    const key = titleKey(movie)

    setWatchlist((current) => {
      const exists = current.some((item) => titleKey(item) === key)
      const next = exists
        ? current.filter((item) => titleKey(item) !== key)
        : [{ ...movie, addedAt: Date.now() }, ...current].slice(0, MAX_SAVED_TITLES)
      try {
        window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next))
      } catch { /* Ignore unavailable storage. */ }
      return next
    })
  }, [])

  const addRecent = useCallback((movie) => {
    if (!movie?.id) return
    const key = titleKey(movie)

    setRecent((current) => {
      const next = [
        { ...movie, lastOpenedAt: Date.now() },
        ...current.filter((item) => titleKey(item) !== key),
      ].slice(0, MAX_RECENT_TITLES)
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      } catch { /* Ignore unavailable storage. */ }
      return next
    })
  }, [])

  const featuredMovie =
    uniqueTitles([
      ...trending,
      ...popularMovies,
      ...nowPlayingMovies,
      ...filipinoMovies,
    ]).find((movie) => isRenderableTitle(movie) && movie.backdrop_path) ??
    uniqueTitles([...trending, ...popularMovies, ...nowPlayingMovies, ...filipinoMovies]).find(
      isRenderableTitle,
    ) ??
    null

  const movieRows = useMemo(
    () => [
      { title: 'Trending Now', movies: uniqueTitles(trending.filter(isRenderableTitle)) },
      { title: 'Popular Movies', movies: uniqueTitles(popularMovies.filter(isRenderableTitle)) },
      { title: 'New Releases', movies: uniqueTitles(nowPlayingMovies.filter(isRenderableTitle)) },
      { title: 'Latest Netflix Movies', movies: uniqueTitles(netflixMovies.filter(isRenderableTitle)) },
      { title: 'Latest Prime Video Movies', movies: uniqueTitles(primeMovies.filter(isRenderableTitle)) },
      { title: 'Pinoy Cinema', movies: uniqueTitles(filipinoMovies.filter(isRenderableTitle)) },
      { title: 'More Filipino Hits', movies: uniqueTitles(moreFilipinoMovies.filter(isRenderableTitle)) },
    ],
    [filipinoMovies, moreFilipinoMovies, netflixMovies, nowPlayingMovies, popularMovies, primeMovies, trending],
  )

  const featuredSeriesRow = useMemo(
    () => ({
      title: 'Sci-Fi & Action Favorites',
      movies: uniqueTitles(featuredSeries.filter(isRenderableTitle)),
    }),
    [featuredSeries],
  )

  const tvRows = useMemo(
    () => [
      { title: 'Trending Series', movies: uniqueTitles(trendingTV.filter(isRenderableTitle)) },
      { title: 'Latest Netflix Series', movies: uniqueTitles(netflixSeries.filter(isRenderableTitle)) },
      { title: 'Latest Prime Video Series', movies: uniqueTitles(primeSeries.filter(isRenderableTitle)) },
      featuredSeriesRow,
      { title: 'On The Air', movies: uniqueTitles(onAirTV.filter(isRenderableTitle)) },
      { title: 'Asian Dramas', movies: uniqueTitles(asianSeries.filter(isRenderableTitle)) },
    ],
    [
      asianSeries,
      featuredSeriesRow,
      netflixSeries,
      onAirTV,
      primeSeries,
      trendingTV,
    ],
  )

  const allLibraryTitles = useMemo(
    () => uniqueTitles([...movieRows, ...tvRows].flatMap((row) => row.movies)),
    [movieRows, tvRows],
  )

  const visibleRows = useMemo(() => {
    if (selectedCategoryId) {
      const categoryName =
        CATEGORIES.find((category) => String(category.id) === String(selectedCategoryId))?.name ??
        'Category'
      const localFiltered = allLibraryTitles.filter(
        (movie) =>
          !isTVTitle(movie) &&
          Array.isArray(movie.genre_ids) &&
          movie.genre_ids.map(String).includes(String(selectedCategoryId)),
      )
      const availableCategoryMovies = categoryMovies.filter(isRenderableTitle)
      const combinedMovies = uniqueTitles([...localFiltered, ...availableCategoryMovies])

      return [{ title: categoryName, movies: combinedMovies }]
    }

    if (activeTab === 'movies') {
      return [
        {
          title: 'All Movies',
          movies: uniqueTitles(allLibraryTitles.filter((movie) => !isTVTitle(movie))),
        },
        ...movieRows,
      ]
    }
    if (activeTab === 'series') return tvRows

    const personalizedRows = []
    const savedTitles = uniqueTitles(watchlist.filter(isRenderableTitle))
    if (savedTitles.length) {
      personalizedRows.push({ title: 'My List', movies: savedTitles })
    }
    const recentTitles = uniqueTitles(recent.filter(isRenderableTitle))
    if (recentTitles.length) {
      personalizedRows.push({ title: 'Recently Watched', movies: recentTitles })
    }
    if (recommended.length) {
      personalizedRows.push({
        title: 'Recommended For You',
        movies: uniqueTitles(recommended.filter(isRenderableTitle)),
      })
    }

    return [...personalizedRows, ...movieRows, ...tvRows]
  }, [
    activeTab,
    allLibraryTitles,
    categoryMovies,
    movieRows,
    recent,
    recommended,
    selectedCategoryId,
    tvRows,
    watchlist,
  ])

  const homeRows = visibleRows
  const selectedTitleIsSaved = selectedTitle
    ? watchlist.some((item) => titleKey(item) === titleKey(selectedTitle))
    : false
  const searchPending = searchLoading || searchQuery.trim() !== debouncedSearchQuery
  const normalizedSearchQuery = searchQuery.trim()
  const visibleSearchResults = searchResults.filter(isRenderableTitle)
  const searchCorrections =
    correctionsState.query === normalizedSearchQuery ? correctionsState.items : []
  const correctionsLoading =
    correctionsState.query === normalizedSearchQuery ? correctionsState.loading : false
  const searchFallbackTitles = useMemo(
    () => uniqueTitles(trending.filter(isRenderableTitle)).slice(0, 10),
    [trending],
  )
  const handleSearchChange = (value) => {
    setSearchQuery(value)
    setSelectedCategoryId(null)
    setActiveTab('search')
    setSelected(null)
  }

  const handleUseCorrection = useCallback((value) => {
    const nextQuery = String(value ?? '').trim()
    if (!nextQuery) return

    setSearchError('')
    setSearchLoading(true)
    setCorrectionsState({ query: nextQuery, items: [], loading: false })
    setSearchQuery(nextQuery)
    setDebouncedSearchQuery(nextQuery)
    setSelectedCategoryId(null)
    setSelected(null)
    setActiveTab('search')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handlePlay = useCallback(
    (movie) => {
      if (!movie) return
      setSelectedTitle(null)

      const returnState = {
        activeTab,
        categoryId: selectedCategoryId,
        scrollY: window.scrollY,
      }

      playbackReturnState.current = returnState

      const catalogMatch = allLibraryTitles.find(
        (entry) => titleKey(entry) === titleKey(movie),
      )
      const playableMovie = {
        ...catalogMatch,
        ...movie,
        media_type: isTVTitle(movie) ? 'tv' : 'movie',
      }

      if (isTVTitle(playableMovie)) {
        playableMovie.resumeSeasonNumber =
          playableMovie.resumeSeasonNumber ?? playableMovie.seasonNumber ?? 1
        playableMovie.resumeEpisodeNumber =
          playableMovie.resumeEpisodeNumber ?? playableMovie.episodeNumber ?? 1
      }

      setPlayerInitialState(null)
      writeActivePlayback({
        movie: playableMovie,
        player: {
          mode: playableMovie.playbackMode === 'trailer' ? 'trailer' : 'movie',
          providerIndex: 0,
          seasonNumber: playableMovie.resumeSeasonNumber ?? 1,
          episodeNumber: playableMovie.resumeEpisodeNumber ?? 1,
        },
        returnState,
      })

      setSelected(playableMovie)
      addRecent(playableMovie)
    },
    [activeTab, addRecent, allLibraryTitles, selectedCategoryId],
  )

  const handleShowDetails = useCallback((movie) => {
    if (movie) setSelectedTitle(movie)
  }, [])

  const handleCloseDetails = useCallback(() => {
    setSelectedTitle(null)
  }, [])

  const handleClosePlayer = useCallback(() => {
    clearActivePlayback()
    setPlayerInitialState(null)
    setSelected(null)
  }, [])

  const handlePlaybackStateChange = useCallback(
    (playerState) => {
      if (!selected) return
      writeActivePlayback({
        movie: selected,
        player: playerState,
        returnState: playbackReturnState.current,
      })
    },
    [selected],
  )

  const handleNavigation = useCallback((tab) => {
    setSelectedCategoryId(null)
    setSelectedTitle(null)
    setActiveTab(tab)
    if (tab !== 'search') {
      setSearchQuery('')
      setDebouncedSearchQuery('')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleCategorySelect = (id) => {
    const isSameCategory = String(selectedCategoryId) === String(id)
    setSelectedCategoryId(id)
    setActiveTab('movies')
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setSelectedTitle(null)
    setCategoryError('')
    if (!isSameCategory) {
      setCategoryMovies([])
      setCategoryLoading(true)
      setCategoryPage(1)
      setCategoryHasMore(false)
    } else {
      fetchCategoryPage(id, 1, true)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClearCategory = () => {
    setSelectedCategoryId(null)
    setCategoryMovies([])
    setCategoryError('')
    setCategoryPage(1)
    setCategoryHasMore(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const showHero = activeTab === 'home' && !selectedCategoryId && !selected
  const regionLabel =
    REGIONS.find((region) => region.code === watchRegion)?.label ?? watchRegion

  return (
    <main
      className={`min-h-screen bg-[#0a0a0a] pb-[calc(6.25rem+env(safe-area-inset-bottom))] text-white md:pb-0 ${
        showHero
          ? 'pt-0'
          : 'pt-[calc(5.5rem+env(safe-area-inset-top))] md:pt-28'
      }`}
    >
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigation}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onCategorySelect={handleCategorySelect}
        onPickTitle={handleShowDetails}
        selectedCategoryId={selectedCategoryId}
        watchRegion={watchRegion}
      />

      {showOnboarding || showInterestEditor ? (
        <OnboardingModal
          key={showInterestEditor ? 'edit-interests' : 'welcome-interests'}
          onSave={handleSaveInterests}
          onSkip={showInterestEditor ? undefined : handleSkipOnboarding}
          initialInterests={savedInterests}
          editing={showInterestEditor}
          onCancel={showInterestEditor ? () => setShowInterestEditor(false) : undefined}
        />
      ) : null}

      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div
            key={`${titleKey(selected)}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28 }}
          >
            <VideoPlayer
              movie={selected}
              initialState={playerInitialState}
              onStateChange={handlePlaybackStateChange}
              onClose={handleClosePlayer}
            />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28 }}
          >
            {showHero ? (
              <Hero
                movie={featuredMovie}
                genres={GENRES}
                onPlay={handlePlay}
                onDetails={handleShowDetails}
              />
            ) : null}

            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
              {error ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 backdrop-blur">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>{error}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setError('')
                        setLoading(true)
                        setCatalogRetryKey((key) => key + 1)
                      }}
                      className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : null}

              {loading && !selectedCategoryId && ['home', 'movies', 'series'].includes(activeTab) ? (
                <div className="space-y-8">
                  <MovieLoadingSkeleton title="Trending Now" />
                  <MovieLoadingSkeleton title="Popular Movies" />
                  <MovieLoadingSkeleton title="New Releases" />
                </div>
              ) : activeTab === 'search' ? (
                <section className="space-y-4">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em] text-white/35">Search</p>
                      <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                        {searchQuery.trim()
                          ? `Results for "${searchQuery.trim()}"`
                          : 'Find something to watch'}
                      </h3>
                    </div>
                    {searchQuery.trim() && !searchPending && !searchError ? (
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                        {visibleSearchResults.length} titles
                      </p>
                    ) : null}
                  </div>

                  {searchQuery.trim() ? (
                    searchPending ? (
                      <MovieLoadingSkeleton mode="grid" count={8} />
                    ) : searchError ? (
                      <div className="space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 backdrop-blur">
                          <span>{searchError}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchError('')
                              setSearchLoading(true)
                              setSearchRetryKey((key) => key + 1)
                            }}
                            className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
                          >
                            Retry
                          </button>
                        </div>
                        <SearchAssist
                          popularTitles={searchFallbackTitles}
                          onPickTitle={handleShowDetails}
                          onSelectGenre={handleCategorySelect}
                        />
                      </div>
                    ) : visibleSearchResults.length ? (
                      <div
                        className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
                        aria-live="polite"
                      >
                        {visibleSearchResults.map((movie) => (
                          <MovieCard
                            key={titleKey(movie)}
                            movie={movie}
                            variant="grid"
                            onSelect={handleShowDetails}
                          />
                        ))}
                      </div>
                    ) : (
                      <SearchAssist
                        query={debouncedSearchQuery || searchQuery}
                        corrections={searchCorrections}
                        correctionsLoading={correctionsLoading}
                        popularTitles={searchFallbackTitles}
                        onUseCorrection={handleUseCorrection}
                        onPickTitle={handleShowDetails}
                        onSelectGenre={handleCategorySelect}
                      />
                    )
                  ) : (
                    <SearchAssist
                      popularTitles={searchFallbackTitles}
                      onPickTitle={handleShowDetails}
                      onSelectGenre={handleCategorySelect}
                    />
                  )}
                </section>
              ) : activeTab === 'profile' ? (
                <section className="mx-auto w-full max-w-lg space-y-5 pt-2">
                  <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6 text-center shadow-xl">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/20 bg-[#E50914] text-xl font-black text-white">
                      D
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tight">
                      Guest session
                    </h3>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      No account needed. Your preferences stay in this browser.
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-3 text-left">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">My List</p>
                        <p className="mt-1 text-xl font-black text-white">{watchlist.length}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">Recent</p>
                        <p className="mt-1 text-xl font-black text-white">{recent.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-xl">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E50914]">
                          Region
                        </p>
                        <h4 className="mt-1 text-base font-bold text-white">Where to watch</h4>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                        {regionLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-white/45">
                      Provider rows and official watch links use this region.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {REGIONS.map((region) => {
                        const isActive = region.code === watchRegion
                        return (
                          <button
                            key={region.code}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => handleRegionChange(region.code)}
                            className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                              isActive
                                ? 'border-[#E50914] bg-[#E50914] text-white'
                                : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {region.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-xl">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E50914]">
                      Personalization
                    </p>
                    <h4 className="mt-1 text-base font-bold text-white">Genre interests</h4>
                    <p className="mt-2 text-xs leading-5 text-white/45">
                      {savedInterests.length
                        ? 'Recommendations are built from the genres you picked.'
                        : 'Pick a few genres to get a personalized row on Home.'}
                    </p>
                    <div className="mt-4 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setShowInterestEditor(true)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-white transition hover:border-[#E50914]/60 hover:bg-[#E50914]/10"
                      >
                        {savedInterests.length ? 'Update genre interests' : 'Choose genre interests'}
                      </button>
                      {savedInterests.length ? (
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              window.localStorage.removeItem(INTERESTS_KEY)
                              window.localStorage.setItem(ONBOARDED_KEY, '1')
                            } catch { /* Ignore unavailable storage. */ }
                            setSavedInterests([])
                            setRecommended([])
                            setRecommendationError('')
                            setRecommendationLoading(false)
                          }}
                          className="w-full rounded-xl border border-white/10 bg-transparent py-3 text-xs font-bold text-white/50 transition hover:text-white"
                        >
                          Clear genre interests
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {watchlist.length || recent.length ? (
                    <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-xl">
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E50914]">
                        Local data
                      </p>
                      <h4 className="mt-1 text-base font-bold text-white">Clear this browser</h4>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {watchlist.length ? (
                          <button
                            type="button"
                            onClick={() => setWatchlist([])}
                            className="rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-white/65 transition hover:text-white"
                          >
                            Clear My List
                          </button>
                        ) : null}
                        {recent.length ? (
                          <button
                            type="button"
                            onClick={() => setRecent([])}
                            className="rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-white/65 transition hover:text-white"
                          >
                            Clear recently watched
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : (
                <>
                  {activeTab === 'movies' && !selectedCategoryId ? (
                    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
                      <button
                        type="button"
                        onClick={handleClearCategory}
                        aria-pressed={!selectedCategoryId}
                        className="shrink-0 rounded-full border border-[#E50914] bg-[#E50914] px-4 py-2 text-xs font-bold text-white"
                      >
                        All
                      </button>
                      {CATEGORIES.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleCategorySelect(category.id)}
                          aria-pressed={String(selectedCategoryId) === String(category.id)}
                          className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
                            String(selectedCategoryId) === String(category.id)
                              ? 'border-[#E50914] bg-[#E50914] text-white'
                              : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {activeTab === 'movies' && selectedCategoryId ? (
                    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
                      <button
                        type="button"
                        onClick={handleClearCategory}
                        className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/65 transition hover:bg-white/10 hover:text-white"
                      >
                        All movies
                      </button>
                      {CATEGORIES.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleCategorySelect(category.id)}
                          aria-pressed={String(selectedCategoryId) === String(category.id)}
                          className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
                            String(selectedCategoryId) === String(category.id)
                              ? 'border-[#E50914] bg-[#E50914] text-white'
                              : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {selectedCategoryId ? (
                    <section className="space-y-6 pt-2">
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.4em] text-white/35">
                            {regionLabel}
                          </p>
                          <h3 className="mt-2 text-2xl font-black uppercase text-white">
                            {visibleRows[0]?.title}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearCategory}
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/65 transition hover:bg-white/10 hover:text-white"
                        >
                          Browse all
                        </button>
                      </div>

                      {categoryLoading && categoryMovies.length === 0 ? (
                        <MovieLoadingSkeleton mode="grid" count={12} />
                      ) : visibleRows[0]?.movies.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                          {visibleRows[0].movies.map((movie) => (
                            <MovieCard
                              key={titleKey(movie)}
                              movie={movie}
                              variant="grid"
                              onSelect={handleShowDetails}
                            />
                          ))}
                        </div>
                      ) : categoryError ? null : (
                        <p className="text-zinc-500">No movies found in this category.</p>
                      )}

                      {categoryError ? (
                        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                          <span>{categoryError}</span>
                          <button
                            type="button"
                            onClick={() =>
                              fetchCategoryPage(
                                selectedCategoryId,
                                categoryMovies.length ? categoryPage + 1 : 1,
                                categoryMovies.length === 0,
                              )
                            }
                            className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
                          >
                            Retry
                          </button>
                        </div>
                      ) : null}

                      {categoryLoading && categoryMovies.length > 0 ? (
                        <div
                          className="flex justify-center py-8"
                          role="status"
                          aria-label="Loading more movies"
                        >
                          <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/15 border-t-[#E50914]" />
                        </div>
                      ) : null}
                      <div ref={categoryLoaderRef} className="h-1" />
                    </section>
                  ) : (
                    <>
                      {activeTab === 'home' ? (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.4em] text-white/35">
                              {regionLabel}
                            </p>
                            <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">
                              Home
                            </h2>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowInterestEditor(true)}
                            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-zinc-300 transition hover:border-[#E50914]/60 hover:text-white"
                          >
                            {savedInterests.length ? 'Update recommendations' : 'Personalize'}
                          </button>
                        </div>
                      ) : null}

                      {activeTab === 'home' && recommendationLoading ? (
                        <MovieLoadingSkeleton title="Recommended For You" />
                      ) : null}
                      {activeTab === 'home' && recommendationError ? (
                        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                          <span>{recommendationError}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setRecommendationError('')
                              setRecommendationLoading(true)
                              setRecommendationRetryKey((key) => key + 1)
                            }}
                            className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
                          >
                            Retry
                          </button>
                        </div>
                      ) : null}

                      {activeTab === 'home' && !savedInterests.length ? (
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">
                          <Sparkles className="h-4 w-4 flex-none text-[#E50914]" />
                          <span>
                            Pick a few genres to add a personalized row to your home feed.
                          </span>
                        </div>
                      ) : null}

                      {homeRows.map((row) => (
                        <MovieRow
                          key={row.title}
                          title={row.title}
                          movies={row.movies}
                          onSelect={handleShowDetails}
                        />
                      ))}
                    </>
                  )}

                </>
              )}
            </div>

            <Footer
              regionLabel={regionLabel}
              watchlistCount={watchlist.length}
              recentCount={recent.length}
              onNavigate={handleNavigation}
              onCategorySelect={handleCategorySelect}
              onEditInterests={() => setShowInterestEditor(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <TitleDetailsModal
        movie={selectedTitle}
        genres={GENRES}
        region={watchRegion}
        isSaved={selectedTitleIsSaved}
        onClose={handleCloseDetails}
        onPlay={handlePlay}
        onToggleSave={toggleWatchlist}
      />

      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
    </main>
  )
}

export default App
