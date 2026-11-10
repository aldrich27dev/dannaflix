import {
  ArrowUp,
  ArrowUpRight,
  Bookmark,
  Film,
  Globe2,
  History,
  Home,
  Search,
  Settings2,
  Sparkles,
  Tv,
} from 'lucide-react'
import { CATEGORIES } from '../constants'

const BROWSE_LINKS = [
  { label: 'Home', tab: 'home', icon: Home },
  { label: 'Movies', tab: 'movies', icon: Film },
  { label: 'Series', tab: 'series', icon: Tv },
  { label: 'Search', tab: 'search', icon: Search },
]

const FOOTER_GENRE_IDS = ['ph', 28, 35, 18, 878, 27]
const FOOTER_GENRES = CATEGORIES.filter((category) =>
  FOOTER_GENRE_IDS.some((id) => String(id) === String(category.id)),
)

function Footer({
  regionLabel,
  watchlistCount = 0,
  recentCount = 0,
  onNavigate,
  onCategorySelect,
  onEditInterests,
}) {
  return (
    <footer className="relative mt-6 overflow-hidden border-t border-white/10 bg-[#070708]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(229,9,20,0.16),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.04),transparent_30%)]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 right-0 select-none text-[clamp(5rem,15vw,13rem)] font-black italic leading-none tracking-tighter text-white/[0.02]"
      >
        DANNAFLIX
      </div>

      <div className="relative mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 lg:grid-cols-[1.4fr_0.7fr_0.7fr_1fr] lg:gap-12 lg:py-16">
          <div className="col-span-2 max-w-sm lg:col-span-1">
            <button
              type="button"
              onClick={() => onNavigate?.('home')}
              className="group inline-flex flex-col text-left"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.45em] text-white/35">
                Welcome to
              </span>
              <span className="mt-1 text-3xl font-black italic tracking-tighter text-[#E50914] transition group-hover:text-red-400">
                DANNAFLIX
              </span>
            </button>
            <p className="mt-4 text-sm leading-6 text-white/50">
              A fan-made shelf for movie nights in the Philippines and the US. Pick a title,
              press play, and skip the endless scrolling.
            </p>
            <button
              type="button"
              onClick={() => onNavigate?.('profile')}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <Globe2 size={15} className="text-[#E50914]" />
              <span>{regionLabel}</span>
              <span className="text-white/25">·</span>
              <span className="text-white/45">Change region</span>
              <ArrowUpRight size={13} className="text-white/35" />
            </button>
            <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
              <span className="rounded-full border border-white/10 px-2.5 py-1.5">No sign-in</span>
              <span className="rounded-full border border-white/10 px-2.5 py-1.5">
                Local-only list
              </span>
              <span className="rounded-full border border-white/10 px-2.5 py-1.5">PH + US</span>
            </div>
          </div>

          <nav aria-label="Browse">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">
              Browse
            </p>
            <div className="mt-4 space-y-1">
              {BROWSE_LINKS.map(({ label, tab, icon: Icon }) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onNavigate?.(tab)}
                  className="group flex w-full items-center gap-2.5 rounded-lg px-1 py-2 text-left text-sm font-medium text-white/60 transition hover:text-white"
                >
                  <Icon size={15} className="text-white/30 transition group-hover:text-[#E50914]" />
                  <span>{label}</span>
                  <ArrowUpRight
                    size={13}
                    className="ml-auto opacity-0 transition group-hover:opacity-60"
                  />
                </button>
              ))}
            </div>
          </nav>

          <nav aria-label="Genres">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">
              Genres
            </p>
            <div className="mt-4 space-y-1">
              {FOOTER_GENRES.map((genre) => (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => onCategorySelect?.(genre.id)}
                  className="group flex w-full items-center justify-between rounded-lg px-1 py-2 text-left text-sm font-medium text-white/60 transition hover:text-white"
                >
                  <span>{genre.name === 'Pinoy' ? 'Pinoy cinema' : genre.name}</span>
                  <ArrowUpRight
                    size={13}
                    className="opacity-0 transition group-hover:opacity-60"
                  />
                </button>
              ))}
            </div>
          </nav>

          <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm lg:col-span-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E50914]">
              Your space
            </p>
            <div className="mt-4 space-y-1">
              <button
                type="button"
                onClick={() => onNavigate?.('home')}
                className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-sm text-white/60 transition hover:text-white"
              >
                <span className="inline-flex items-center gap-2.5">
                  <Bookmark size={15} className="text-white/30" />
                  My List
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/55">
                  {watchlistCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('home')}
                className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-sm text-white/60 transition hover:text-white"
              >
                <span className="inline-flex items-center gap-2.5">
                  <History size={15} className="text-white/30" />
                  Recently watched
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/55">
                  {recentCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onEditInterests?.()}
                className="flex w-full items-center gap-2.5 rounded-lg px-1 py-2 text-sm text-white/60 transition hover:text-white"
              >
                <Sparkles size={15} className="text-white/30" />
                Genre interests
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('profile')}
                className="flex w-full items-center gap-2.5 rounded-lg px-1 py-2 text-sm text-white/60 transition hover:text-white"
              >
                <Settings2 size={15} className="text-white/30" />
                Preferences
              </button>
            </div>
            <p className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-5 text-white/30">
              Everything is saved in this browser. No account, no email, no tracking.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-white/10 py-6 text-[11px] leading-5 text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-3xl space-y-1.5">
            <p>
              DannaFlix is a fan-made streaming demo. Not affiliated with Netflix. All titles,
              artwork, and trademarks belong to their respective owners.
            </p>
            <p>
              Metadata by{' '}
              <a
                href="https://www.themoviedb.org/"
                target="_blank"
                rel="noreferrer"
                className="text-white/55 underline decoration-white/20 underline-offset-2 transition hover:text-white"
              >
                TMDB
              </a>{' '}
              · Official availability via{' '}
              <a
                href="https://www.justwatch.com/"
                target="_blank"
                rel="noreferrer"
                className="text-white/55 underline decoration-white/20 underline-offset-2 transition hover:text-white"
              >
                JustWatch
              </a>{' '}
              · Playback by third-party embeds
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group inline-flex flex-none items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 py-1.5 pl-4 pr-1.5 text-xs font-bold text-white/65 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:self-auto"
          >
            Back to top
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 transition group-hover:bg-[#E50914]">
              <ArrowUp size={14} />
            </span>
          </button>
        </div>
      </div>
    </footer>
  )
}

export default Footer
