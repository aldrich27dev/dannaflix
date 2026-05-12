import { useEffect, useState } from 'react'
import { Home, Film, Tv, Search, User, X } from 'lucide-react'

function Navbar({
  activeSection = 'home',
  searchQuery = '',
  onNavigateHome,
  onSelectMovies,
  onSelectTV,
  onSearchChange,
  onSearchClick,
}) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [inputValue, setInputValue] = useState(searchQuery)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setInputValue(searchQuery)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [searchQuery])

  const handleSearch = (value) => {
    setInputValue(value)
    onSearchChange?.(value)
  }

  const openSearch = () => {
    setMobileSearchOpen(true)
    onSearchClick?.()
  }

  const buttonClasses = (section) =>
    activeSection === section
      ? 'text-white'
      : 'text-zinc-400 transition-colors hover:text-white'

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[95] border-b border-white/10 bg-black/75 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="min-w-0"
          >
            <span className="block text-[10px] font-semibold uppercase tracking-[0.45em] text-white/40">
              Welcome to
            </span>
            <span className="block text-lg font-black italic tracking-tighter text-[#E50914]">
              DannaFlix
            </span>
          </button>

          <button
            type="button"
            onClick={openSearch}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      <nav className="fixed left-1/2 top-6 z-[90] hidden -translate-x-1/2 items-center gap-8 rounded-full border border-white/10 bg-black/60 px-8 py-3 shadow-2xl backdrop-blur-xl md:flex">
        <button
          type="button"
          onClick={onNavigateHome}
          className="mr-4 text-xl font-black italic tracking-tighter text-[#E50914]"
        >
          DANNAFLIX
        </button>
        <div className="flex gap-6 text-xs font-bold uppercase tracking-widest text-zinc-400">
          <button
            type="button"
            onClick={onNavigateHome}
            className={buttonClasses('home')}
          >
            Home
          </button>
          <button
            type="button"
            onClick={onSelectMovies}
            className={buttonClasses('movies')}
          >
            Movies
          </button>
          <button
            type="button"
            onClick={onSelectTV}
            className={buttonClasses('series')}
          >
            Series
          </button>
        </div>
        <div className="ml-4 flex items-center gap-4">
          <div className="relative w-72">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="search"
              value={inputValue}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Search movies"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#E50914]/60 focus:bg-white/8"
            />
            {inputValue ? (
              <button
                type="button"
                onClick={() => handleSearch('')}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="h-8 w-8 rounded-full border border-white/20 bg-[#E50914]" />
        </div>
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-[90] flex items-center justify-between border-t border-white/10 bg-black/80 px-6 py-4 backdrop-blur-lg md:hidden">
        <button type="button" onClick={onNavigateHome} aria-label="Home">
          <Home
            size={24}
            className={activeSection === 'home' ? 'text-[#E50914]' : 'text-zinc-400'}
          />
        </button>
        <button type="button" onClick={onSelectMovies} aria-label="Movies">
          <Film
            size={24}
            className={activeSection === 'movies' ? 'text-[#E50914]' : 'text-zinc-400'}
          />
        </button>
        <button type="button" onClick={openSearch} aria-label="Search">
          <Search size={24} className="text-zinc-400" />
        </button>
        <button type="button" onClick={onSelectTV} aria-label="Series">
          <Tv
            size={24}
            className={activeSection === 'series' ? 'text-[#E50914]' : 'text-zinc-400'}
          />
        </button>
        <button type="button" aria-label="Profile">
          <User size={24} className="text-zinc-400" />
        </button>
      </nav>

      {mobileSearchOpen ? (
        <div className="fixed inset-x-0 top-0 z-[95] bg-black/80 px-4 pt-4 backdrop-blur-xl md:hidden">
          <div className="relative mx-auto max-w-[1600px] pb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <input
              type="search"
              value={inputValue}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Search movies"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#E50914]/60 focus:bg-white/8"
              autoFocus
            />
            {inputValue ? (
              <button
                type="button"
                onClick={() => handleSearch('')}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}

export default Navbar
