import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MovieCard from './MovieCard'

function titleKey(movie) {
  const isTV =
    movie?.media_type === 'tv' ||
    movie?.first_air_date !== undefined ||
    (movie?.name !== undefined && movie?.title === undefined)
  return `${isTV ? 'tv' : 'movie'}-${movie?.id}`
}

function MovieRow({ title, movies = [], onSelect }) {
  const scrollerRef = useRef(null)
  const [scrollState, setScrollState] = useState({ left: false, right: false })
  const [direction, setDirection] = useState('next')

  const updateScrollState = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
    const nextState = {
      left: scroller.scrollLeft > 4,
      right: scroller.scrollLeft < maxScrollLeft - 4,
    }

    setScrollState((current) =>
      current.left === nextState.left && current.right === nextState.right
        ? current
        : nextState,
    )

    // Flip the single pager at either end: right until the end, left until the start.
    if (!nextState.right) {
      setDirection('prev')
    } else if (!nextState.left) {
      setDirection('next')
    }
  }, [])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return undefined

    const frame = window.requestAnimationFrame(updateScrollState)
    const observer = new ResizeObserver(updateScrollState)

    scroller.addEventListener('scroll', updateScrollState, { passive: true })
    observer.observe(scroller)

    return () => {
      window.cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', updateScrollState)
      observer.disconnect()
    }
  }, [movies.length, updateScrollState])

  if (!movies.length) return null

  const canScroll = scrollState.left || scrollState.right
  const isNext = direction === 'next'

  const pagerLabel = isNext ? `Show more ${title}` : `Show previous ${title}`

  const handlePagerClick = () => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const distance = Math.round(scroller.clientWidth * 0.85)
    scroller.scrollBy({
      left: isNext ? distance : -distance,
      behavior: 'smooth',
    })
  }

  return (
    <section className="space-y-4" aria-label={title}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/35">Collection</p>
          <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">{title}</h3>
        </div>
        {canScroll ? (
          <button
            type="button"
            onClick={handlePagerClick}
            className="group hidden h-10 w-10 flex-none place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:border-[#E50914]/50 hover:bg-[#E50914]/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914] sm:grid"
            aria-label={pagerLabel}
          >
            {isNext ? (
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            ) : (
              <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            )}
          </button>
        ) : null}
      </div>

      <div className="relative">
        <div
          ref={scrollerRef}
          className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 py-3 scroll-smooth overscroll-x-contain"
        >
          {movies.map((movie) => (
            <MovieCard
              key={titleKey(movie)}
              movie={movie}
              onSelect={onSelect}
            />
          ))}
        </div>
        {scrollState.left ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
        ) : null}
        {scrollState.right ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
        ) : null}
      </div>
    </section>
  )
}

export default MovieRow
