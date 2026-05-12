import { ChevronRight, Play } from 'lucide-react'
import { imageUrl } from '../services/tmdb'

function Hero({ movie, onPlay }) {
  const title = movie?.title ?? movie?.name ?? 'Featured this week'
  const overview =
    movie?.overview ??
    'A curated, cinematic launchpad for the hottest picks on the platform.'
  const backdrop = imageUrl(movie?.backdrop_path, 'original')
  const releaseYear = movie?.release_date ? movie.release_date.slice(0, 4) : '2026'
  const rating = movie?.vote_average ? movie.vote_average.toFixed(1) : '8.9'

  return (
    <section
      id="browse"
      className="relative isolate overflow-hidden border-b border-white/5"
    >
      <div className="absolute inset-0">
        {backdrop ? (
          <img
            src={backdrop}
            alt=""
            className="h-full w-full object-cover object-center opacity-35"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(229,9,20,0.25),_transparent_45%),linear-gradient(135deg,_#1a1a1a,_#090909_70%)]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.98)_0%,rgba(20,20,20,0.82)_42%,rgba(20,20,20,0.25)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#141414] to-transparent" />
      </div>

      <div className="relative mx-auto grid min-h-[78svh] max-w-[1600px] items-end gap-8 px-4 pb-10 pt-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:pb-16 lg:pt-14">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/75 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[#E50914]" />
            Streaming now
          </div>

          <h2 className="max-w-2xl text-4xl font-black uppercase tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
            {title}
          </h2>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
            {overview}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onPlay?.(movie)}
              className="inline-flex items-center gap-2 rounded-full bg-[#E50914] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f6121d] hover:shadow-[0_0_30px_rgba(229,9,20,0.35)]"
            >
              <Play className="h-4 w-4 fill-white" />
              Play
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
            >
              More info
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:max-w-xl lg:justify-self-end">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">
              Release
            </p>
            <p className="mt-3 text-2xl font-semibold">{releaseYear}</p>
            <p className="mt-2 text-sm text-white/60">
              Instant play with no login wall.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">
              Audience score
            </p>
            <p className="mt-3 text-2xl font-semibold">{rating}/10</p>
            <p className="mt-2 text-sm text-white/60">
              Curated from TMDB popularity data.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-[#0e0e0e]/70 p-5 backdrop-blur-xl sm:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">
              Bento view
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/5 p-3 text-center">
                <p className="text-lg font-semibold">4K</p>
                <p className="text-xs text-white/45">Ready</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-3 text-center">
                <p className="text-lg font-semibold">HD</p>
                <p className="text-xs text-white/45">Adaptive</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-3 text-center">
                <p className="text-lg font-semibold">2.4s</p>
                <p className="text-xs text-white/45">Launch</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
