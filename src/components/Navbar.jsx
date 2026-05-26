import { useEffect, useState } from 'react'
import { Home, Film, Tv, Search, User, X, ChevronDown } from 'lucide-react'

const CATEGORIES = [
  // { name: 'Pinoy', id: 'ph' },
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

function Navbar({
  activeTab = 'home',
  setActiveTab,
  searchQuery = '',
  onSearchChange,
  onCategorySelect,
  selectedCategoryId,
}) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [inputValue, setInputValue] = useState(searchQuery)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setInputValue(searchQuery)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [searchQuery])

  const handleSearch = (value) => {
    setInputValue(value)
    onSearchChange?.(value)
    if (value.trim()) setActiveTab?.('search')
  }

  const openSearch = () => {
    setMobileSearchOpen(true)
    setActiveTab?.('search')
  }

  const goHome = () => {
    onSearchChange?.('')
    setActiveTab?.('home')
  }

  const buttonClasses = (section) =>
    activeTab === section
      ? 'text-white'
      : 'text-zinc-400 transition-colors hover:text-white'

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="fixed inset-x-0 top-0 z-[95] border-b border-white/10 bg-black/75 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <button type="button" onClick={goHome} className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.45em] text-white/40">Welcome to</span>
            <span className="block text-lg font-black italic tracking-tighter text-[#E50914]">DannaFlix</span>
          </button>
          <button
            type="button"
            onClick={openSearch}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Desktop Navbar */}
      <nav className="fixed left-1/2 top-6 z-[90] hidden -translate-x-1/2 items-center gap-8 rounded-full border border-white/10 bg-black/60 px-8 py-3 shadow-2xl backdrop-blur-xl md:flex">
        <button type="button" onClick={goHome} className="mr-4 text-xl font-black italic tracking-tighter text-[#E50914]">
          DANNAFLIX
        </button>
        
        <div className="flex gap-6 text-xs font-bold uppercase tracking-widest text-zinc-400">
          <button onClick={goHome} className={buttonClasses('home')}>Home</button>
          <button onClick={() => setActiveTab?.('movies')} className={buttonClasses('movies')}>Movies</button>
          <button onClick={() => setActiveTab?.('series')} className={buttonClasses('series')}>Series</button>
          
          <div className="relative">
            <button 
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              className={`flex items-center gap-1 transition-colors ${isCategoriesOpen ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Categories <ChevronDown size={14} />
            </button>
            
            {/* Dropdown container */}
            <div className={`absolute top-full left-0 pt-2 transition-opacity duration-200 ${isCategoriesOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="w-48 max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-black/95 p-2 shadow-2xl backdrop-blur-xl">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveTab?.('movies'); onCategorySelect?.(cat.id); setIsCategoriesOpen(false); }}
                    className={`block w-full px-4 py-2 text-left text-xs font-medium rounded-lg transition ${selectedCategoryId === cat.id ? 'bg-[#E50914] text-white' : 'text-zinc-300 hover:bg-white/10 hover:text-white'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="ml-4 flex items-center gap-4">
          <div className="relative w-60">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={inputValue}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#E50914]/60"
            />
          </div>
          <div className="h-8 w-8 rounded-full border border-white/20 bg-[#E50914]" />
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-[90] flex items-center justify-between border-t border-white/10 bg-black/80 px-6 py-4 backdrop-blur-lg md:hidden">
        <button onClick={goHome}><Home size={24} className={activeTab === 'home' ? 'text-[#E50914]' : 'text-zinc-400'} /></button>
        <button onClick={() => setActiveTab?.('movies')}><Film size={24} className={activeTab === 'movies' ? 'text-[#E50914]' : 'text-zinc-400'} /></button>
        <button onClick={openSearch}><Search size={24} className={activeTab === 'search' ? 'text-[#E50914]' : 'text-zinc-400'} /></button>
        <button onClick={() => setActiveTab?.('series')}><Tv size={24} className={activeTab === 'series' ? 'text-[#E50914]' : 'text-zinc-400'} /></button>
        <button onClick={() => setActiveTab?.('profile')}><User size={24} className={activeTab === 'profile' ? 'text-[#E50914]' : 'text-zinc-400'} /></button>
      </nav>
      
      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-x-0 top-0 z-[95] bg-black/80 px-4 pt-4 backdrop-blur-xl md:hidden">
          <div className="relative mx-auto max-w-[1600px] pb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <input
              type="search"
              value={inputValue}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search movies"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white outline-none"
              autoFocus
            />
            {inputValue && <button onClick={() => handleSearch('')} className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/5"><X className="h-4 w-4" /></button>}
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar