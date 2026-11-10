function MovieLoadingSkeleton({ title, mode = 'row', count = 6 }) {
  const posters = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={`aspect-[2/3] animate-pulse rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-white/[0.03] ${mode === 'row' ? 'w-36 flex-none sm:w-40 md:w-44 lg:w-48' : ''}`}
    />
  ))

  if (mode === 'grid') {
    return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">{posters}</div>
  }

  return (
    <section className="space-y-4" aria-label={`Loading ${title}`}>
      <div className="h-7 w-48 animate-pulse rounded bg-white/10" />
      <div className="flex gap-3 overflow-hidden">{posters}</div>
    </section>
  )
}

export default MovieLoadingSkeleton
