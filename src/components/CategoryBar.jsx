const CATEGORY_LABELS = {
  all: 'All',
  movies: 'Movies',
  tv: 'Series',
  trending: 'Trending',
  new: 'New Releases',
  action: 'Action',
  comedy: 'Comedy',
  horror: 'Horror',
  romance: 'Romance',
  scifi: 'Sci-Fi',
}

function CategoryBar({ activeCategory, onSelectCategory }) {
  const categories = [
    'all',
    'movies',
    'tv',
    'trending',
    'new',
    'action',
    'comedy',
    'horror',
    'romance',
    'scifi',
  ]

  return (
    <div className="sticky top-[72px] z-30 border-b border-white/5 bg-[#141414]/80 backdrop-blur-xl sm:top-[88px]">
      <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => {
            const isActive = activeCategory === category

            return (
              <button
                key={category}
                type="button"
                onClick={() => onSelectCategory?.(category)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                  isActive
                    ? 'border-[#E50914] bg-[#E50914] text-white shadow-[0_0_20px_rgba(229,9,20,0.25)]'
                    : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white'
                }`}
              >
                {CATEGORY_LABELS[category] ?? category}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CategoryBar
