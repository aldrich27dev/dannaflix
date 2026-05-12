import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import MovieCard from './components/movies/MovieCard'
import MovieRow from './components/movies/MovieRow'
import VideoPlayer from './components/VideoPlayer'
import {
  getAsianSeries,
  getFilipinoMovies,
  getNowPlayingMovies,
  getPopularMovies,
  getPopularTV,
  getOnTheAirTV,
  getTrending,
  getTrendingTV,
  searchMovies,
} from './services/tmdb'

function isRenderableTitle(title) {
  if (!title?.id) return false

  const hasName = Boolean(title.title || title.name)
  const hasArtwork = Boolean(title.poster_path || title.backdrop_path)

  return hasName && hasArtwork
}

function App() {
  const [activeSection, setActiveSection] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [trending, setTrending] = useState([])
  const [popularMovies, setPopularMovies] = useState([])
  const [nowPlayingMovies, setNowPlayingMovies] = useState([])
  const [filipinoMovies, setFilipinoMovies] = useState([])
  const [trendingTV, setTrendingTV] = useState([])
  const [popularTV, setPopularTV] = useState([])
  const [onAirTV, setOnAirTV] = useState([])
  const [asianSeries, setAsianSeries] = useState([])
  const [selected, setSelected] = useState(null)
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
          trendingTVResponse,
          popularTVResponse,
          onAirTVResponse,
          asianSeriesResponse,
        ] = await Promise.all([
          getTrending(),
          getPopularMovies(),
          getNowPlayingMovies(),
          getFilipinoMovies(),
          getTrendingTV(),
          getPopularTV(),
          getOnTheAirTV(),
          getAsianSeries(),
        ])

        if (!mounted) return

        setTrending(trendingResponse?.results ?? [])
        setPopularMovies(popularMoviesResponse?.results ?? [])
        setNowPlayingMovies(nowPlayingResponse?.results ?? [])
        setFilipinoMovies(filipinoResponse?.results ?? [])
        setTrendingTV(trendingTVResponse?.results ?? [])
        setPopularTV(popularTVResponse?.results ?? [])
        setOnAirTV(onAirTVResponse?.results ?? [])
        setAsianSeries(asianSeriesResponse?.results ?? [])
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

  const featuredMovie =
    trending[0] ?? popularMovies[0] ?? nowPlayingMovies[0] ?? filipinoMovies[0] ?? null
  const hasSearchQuery = searchQuery.trim().length > 0

  const movieRows = useMemo(
    () => [
      { title: 'Trending Now', movies: trending.filter(isRenderableTitle) },
      { title: 'Popular Movies', movies: popularMovies.filter(isRenderableTitle) },
      { title: 'New Releases', movies: nowPlayingMovies.filter(isRenderableTitle) },
      { title: 'Pinoy Cinema', movies: filipinoMovies.filter(isRenderableTitle) },
    ],
    [filipinoMovies, nowPlayingMovies, popularMovies, trending],
  )

  const tvRows = useMemo(
    () => [
      { title: 'Trending Series', movies: trendingTV.filter(isRenderableTitle) },
      { title: 'Popular Series', movies: popularTV.filter(isRenderableTitle) },
      { title: 'On The Air', movies: onAirTV.filter(isRenderableTitle) },
      { title: 'Asian Dramas', movies: asianSeries.filter(isRenderableTitle) },
    ],
    [asianSeries, onAirTV, popularTV, trendingTV],
  )

  const visibleRows = useMemo(() => {
    if (activeSection === 'movies') return movieRows
    if (activeSection === 'series') return tvRows
    return [...movieRows, ...tvRows]
  }, [activeSection, movieRows, tvRows])

  const handleSelectSection = (section) => {
    setActiveSection(section)
    setSearchQuery('')
    setSearchResults([])
    setSearchError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearchChange = (value) => {
    setSearchQuery(value)
    setActiveSection('home')
    setSelected(null)
  }

  const handleNavigateHome = () => {
    setActiveSection('home')
    setSearchQuery('')
    setSearchResults([])
    setSearchError('')
    setSelected(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePlay = (movie) => {
    if (!movie) return
    setSelected(movie)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-20 pt-16 text-white md:pb-0 md:pt-0">
      <Navbar
        activeSection={activeSection}
        searchQuery={searchQuery}
        onNavigateHome={handleNavigateHome}
        onSelectMovies={() => handleSelectSection('movies')}
        onSelectTV={() => handleSelectSection('series')}
        onSearchChange={handleSearchChange}
        onSearchClick={() => setActiveSection('home')}
      />

      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div
            key="player"
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
            {!hasSearchQuery ? <Hero movie={featuredMovie} onPlay={handlePlay} /> : null}

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

              {hasSearchQuery ? (
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

                  {searchLoading ? (
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
                  )}
                </section>
              ) : (
                <>
                  {visibleRows.map((row) => (
                    <MovieRow
                      key={row.title}
                      title={row.title}
                      movies={row.movies}
                      onSelect={handlePlay}
                    />
                  ))}

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
