import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import MovieCard from './components/movies/MovieCard'
import MovieRow from './components/movies/MovieRow'
import OnboardingModal from './components/OnboardingModal'
import VideoPlayer from './components/VideoPlayer'
import {
  getAsianSeries,
  getMoviesByCategory,
  getCustomFeaturedSeries,
  getFilipinoMovies,
  getMoreFilipinoMovies,
  getNowPlayingMovies,
  getPopularMovies,
  getMoviesByPersonalInterests,
  getOnTheAirTV,
  getTrending,
  getTrendingTV,
  searchMovies,
} from './services/tmdb'

const CATEGORIES = [
  { name: 'Pinoy', id: 'ph' },
  { name: 'Action', id: 28 },
  { name: 'Adventure', id: 12 },
  { name: 'Animation', id: 16 },
  { name: 'Comedy', id: 35 },
  { name: 'Crime', id: 80 },
  { name: 'Documentary', id: 99 },
  { name: 'Drama', id: 18 },
  { name: 'Family', id: 10751 },
  { name: 'Fantasy', id: 14 },
  { name: 'History', id: 36 },
  { name: 'Horror', id: 27 },
  { name: 'Music', id: 10402 },
  { name: 'Mystery', id: 9648 },
  { name: 'Romance', id: 10749 },
  { name: 'Sci-Fi', id: 878 },
  { name: 'Thriller', id: 53 },
  { name: 'War', id: 10752 },
]

function isRenderableTitle(title) {
  if (!title?.id) return false

  const hasName = Boolean(title.title || title.name)
  const hasArtwork = Boolean(title.poster_path || title.backdrop_path)

  return hasName && hasArtwork
}

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [trending, setTrending] = useState([])
  const [popularMovies, setPopularMovies] = useState([])
  const [nowPlayingMovies, setNowPlayingMovies] = useState([])
  const [filipinoMovies, setFilipinoMovies] = useState([])
  const [moreFilipinoMovies, setMoreFilipinoMovies] = useState([])
  const [trendingTV, setTrendingTV] = useState([])
  const [featuredSeries, setFeaturedSeries] = useState([])
  const [recommended, setRecommended] = useState([])
  const [onAirTV, setOnAirTV] = useState([])
  const [asianSeries, setAsianSeries] = useState([])
  const [categoryMovies, setCategoryMovies] = useState([])
  const [selected, setSelected] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false

    const interests = window.localStorage.getItem('dannaflix_interests')
    if (!interests) return true

    try {
      const parsed = JSON.parse(interests)
      return !(Array.isArray(parsed) && parsed.length > 0)
    } catch {
      return true
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      setLoading(true)
      setError('')

      try {
        const [
          trendingResponse,
          popularMoviesResponse,
          nowPlayingResponse,
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
          getFilipinoMovies(),
          getMoreFilipinoMovies(),
          getTrendingTV(),
          getCustomFeaturedSeries(),
          getOnTheAirTV(),
          getAsianSeries(),
        ])

        if (!mounted) return

        setTrending(trendingResponse?.results ?? [])
        setPopularMovies(popularMoviesResponse?.results ?? [])
        setNowPlayingMovies(nowPlayingResponse?.results ?? [])
        setFilipinoMovies(filipinoResponse?.results ?? [])
        setTrendingTV(trendingTVResponse?.results ?? [])
        setMoreFilipinoMovies(moreFilipinoResponse?.results ?? [])
        setFeaturedSeries(featuredSeriesResponse?.results ?? [])
        setOnAirTV(onAirTVResponse?.results ?? [])
        setAsianSeries(asianSeriesResponse?.results ?? [])

        if (typeof window !== 'undefined') {
          try {
            const savedInterests = window.localStorage.getItem('dannaflix_interests')

            if (savedInterests) {
              const parsedInterests = JSON.parse(savedInterests)
              const recommendationResponse = await getMoviesByPersonalInterests(parsedInterests)

              if (!mounted) return

              setRecommended(recommendationResponse?.results ?? [])
            } else if (mounted) {
              setRecommended([])
            }
          } catch {
            if (!mounted) return
            setRecommended([])
          }
        }
      } catch {
        if (!mounted) return
        setError('TMDB could not be reached right now.')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const controller = new AbortController()

    async function runSearch() {
      const query = searchQuery.trim()

      if (!query) {
        setSearchResults([])
        setSearchError('')
        setSearchLoading(false)
        return
      }

      setSearchLoading(true)
      setSearchError('')

      try {
        const response = await searchMovies(query, {
          signal: controller.signal,
        })

        if (!mounted) return

        setSearchResults(response?.results ?? [])
      } catch {
        if (!mounted) return
        setSearchError('Search results could not be loaded right now.')
        setSearchResults([])
      } finally {
        if (mounted) {
          setSearchLoading(false)
        }
      }
    }

    runSearch()

    return () => {
      mounted = false
      controller.abort()
    }
  }, [searchQuery])

  const handleSaveInterests = async (genreIds) => {
    setShowOnboarding(false)

    try {
      const recommendationResponse = await getMoviesByPersonalInterests(genreIds)
      setRecommended(recommendationResponse?.results ?? [])
    } catch {
      setRecommended([])
    }
  }
  

 const handleCategorySelect = async (id) => {
    setSelectedCategoryId(id);
    setActiveTab('movies');
    setSearchQuery('');
    
    try {
      let data;
      
      // If the ID is 'ph', use your existing Filipino movie service
      if (id === 'ph') {
        const response = await getFilipinoMovies();
        data = { results: response.results || [] };
      } 
      // Otherwise, use the genre-based fetcher
      else {
        data = await getMoviesByCategory(id);
      }
      
      setCategoryMovies(data.results || []);
    } catch (err) {
      console.error("Error fetching category:", err);
      setCategoryMovies([]);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const featuredMovie =
    trending[0] ?? popularMovies[0] ?? nowPlayingMovies[0] ?? filipinoMovies[0] ?? null

  const movieRows = useMemo(
    () => [
      { title: 'Trending Now', movies: trending.filter(isRenderableTitle) },
      { title: 'Popular Movies', movies: popularMovies.filter(isRenderableTitle) },
      { title: 'New Releases', movies: nowPlayingMovies.filter(isRenderableTitle) },
      { title: 'Pinoy Cinema', movies: filipinoMovies.filter(isRenderableTitle) },
      { title: 'More Filipino Hits', movies: moreFilipinoMovies.filter(isRenderableTitle) },
    ],
    [filipinoMovies, nowPlayingMovies, popularMovies, trending],
  )

  const featuredSeriesRow = useMemo(
    () => ({
      title: 'Sci-Fi & Action Favorites',
      movies: featuredSeries.filter(isRenderableTitle),
    }),
    [featuredSeries],
  )

  const tvRows = useMemo(
    () => [
      { title: 'Trending Series', movies: trendingTV.filter(isRenderableTitle) },
      featuredSeriesRow,
      { title: 'On The Air', movies: onAirTV.filter(isRenderableTitle) },
      { title: 'Asian Dramas', movies: asianSeries.filter(isRenderableTitle) },
    ],
    [asianSeries, featuredSeriesRow, onAirTV, trendingTV],
  )

 const allLibraryTitles = useMemo(
  () => {
    const combined = [...movieRows, ...tvRows].flatMap((row) => row.movies);
    const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
    
    return unique;
  },
  [movieRows, tvRows],
);

  const visibleRows = useMemo(() => {
   if (selectedCategoryId) {
  const categoryName = CATEGORIES.find(c => c.id === selectedCategoryId)?.name || 'Category'

  const localFiltered = allLibraryTitles.filter(m => m.genre_ids?.includes(selectedCategoryId));
      const combinedMovies = [...new Map([...localFiltered, ...categoryMovies].map(m => [m.id, m])).values()];
    
   return [{ 
        title: categoryName, 
        movies: combinedMovies
      }]
  }

  

  if (activeTab === 'movies') return [{ title: 'All Movies', movies: allLibraryTitles.filter(m => !m.first_air_date) }, ...movieRows]
  if (activeTab === 'series') return tvRows
  
  return [
      ...(recommended.length ? [{ title: 'Recommended For You', movies: recommended.filter(isRenderableTitle) }] : []),
      ...movieRows,
      ...tvRows,
    ]
  }, [activeTab, movieRows, recommended, tvRows, selectedCategoryId, allLibraryTitles])

  const homeRows = visibleRows

  const handleSearchChange = (value) => {
    setSearchQuery(value)
    setSelectedCategoryId(null)
    setActiveTab('search')
    setSelected(null)
  }

  const handlePlay = (movie) => {
    if (!movie) return

    const catalogMatch = allLibraryTitles.find((entry) => entry.id === movie.id)
    const playableMovie = {
      ...catalogMatch,
      ...movie,
    }

    setSelected(playableMovie)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-20 pt-16 text-white md:pb-0 md:pt-0">
     <Navbar
  activeTab={activeTab}
  setActiveTab={(tab) => {
    setSelectedCategoryId(null) // Reset category when clicking tabs
    setActiveTab(tab)
  }}
  searchQuery={searchQuery}
  onSearchChange={handleSearchChange}
  onCategorySelect={handleCategorySelect}
  onCategorySelect={(id) => {
    setSelectedCategoryId(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }}
  selectedCategoryId={selectedCategoryId}
/>

      {showOnboarding ? <OnboardingModal onSave={handleSaveInterests} /> : null}

      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div
            key={`${selected.id}-${selected.mediaType ?? (selected.first_air_date || selected.name ? 'tv' : 'movie')}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28 }}
          >
            <VideoPlayer movie={selected} onClose={() => setSelected(null)} />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28 }}
          >
            {activeTab === 'home' ? <Hero movie={featuredMovie} onPlay={handlePlay} /> : null}

            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
              {error ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 backdrop-blur">
                  {error}
                </div>
              ) : null}

              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-56 animate-pulse rounded-3xl border border-white/10 bg-white/5"
                    />
                  ))}
                </div>
              ) : null}

              {activeTab === 'search' ? (
                <section className="space-y-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em] text-white/35">
                        Search
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                        Results for "{searchQuery.trim()}"
                      </h3>
                    </div>
                  </div>

                  {searchQuery.trim() ? (
                    searchLoading ? (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <div
                            key={index}
                            className="h-56 animate-pulse rounded-3xl border border-white/10 bg-white/5"
                          />
                        ))}
                      </div>
                    ) : searchError ? (
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 backdrop-blur">
                        {searchError}
                      </div>
                    ) : searchResults.filter(isRenderableTitle).length ? (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                        {searchResults
                          .filter(isRenderableTitle)
                          .map((movie) => (
                            <MovieCard
                              key={movie.id}
                              movie={movie}
                              onSelect={handlePlay}
                            />
                          ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 backdrop-blur">
                        No titles found for this search.
                      </div>
                    )
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 backdrop-blur">
                      Type a title to start searching.
                    </div>
                  )}
                </section>
              ) : activeTab === 'profile' ? (
                <section className="mx-auto w-full max-w-md space-y-6 pt-6">
                  <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6 text-center shadow-xl">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/20 bg-[#E50914] text-xl font-black text-white">
                      D
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tight">
                      Active Guest Session
                    </h3>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Preferences saved locally inside your browser context
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        window.localStorage.removeItem('dannaflix_interests')
                        setRecommended([])
                        setShowOnboarding(true)
                      }}
                      className="mt-6 w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-white transition-all hover:border-[#E50914] hover:bg-[#E50914]/20"
                    >
                      Reset Genre Interests
                    </button>
                  </div>
                </section>
              ) : (
                <>
                {selectedCategoryId ? (
  <section className="space-y-6 pt-6">
    <h3 className="text-2xl font-black uppercase text-white">{visibleRows[0].title}</h3>
    {visibleRows[0].movies.length > 0 ? (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {visibleRows[0].movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} onSelect={handlePlay} />
        ))}
      </div>
    ) : (
      <p className="text-zinc-500">No movies found in this category.</p>
    )}
  </section>
) : (
  homeRows.map((row) => (
    <MovieRow
      key={row.title}
      title={row.title}
      movies={row.movies}
      onSelect={handlePlay}
    />
  ))
)}

                  <footer className="mt-6 border-t border-white/10 bg-white/[0.02] px-5 py-6 text-sm text-white/55 backdrop-blur-sm sm:px-6">
                    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3">
                      <p className="text-xs uppercase tracking-[0.45em] text-white/35">
                        Disclaimer
                      </p>
                      <p className="max-w-4xl leading-7">
                        DannaFlix is a fan-made streaming demo and does not claim ownership of
                        any movies, series, posters, logos, or trademarks displayed on this site.
                        All rights remain with the respective copyright holders and content
                        providers.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/30">
                        <span>Not affiliated with Netflix</span>
                        <span className="h-1 w-1 rounded-full bg-white/20" />
                        <span>Powered by TMDB metadata</span>
                        <span className="h-1 w-1 rounded-full bg-white/20" />
                        <span>No copyright claim intended</span>
                      </div>
                    </div>
                  </footer>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
    </main>
  )
}

export default App
