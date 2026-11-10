// src/services/tmdb.js

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BEARER_TOKEN = import.meta.env.VITE_TMDB_BEARER_TOKEN

const CACHE_TTL = 5 * 60 * 1000
const MAX_CACHE_ENTRIES = 250
const responseCache = new Map()
const providerIdCache = new Map()

const IMAGE_WIDTHS = {
  w92: 92,
  w154: 154,
  w185: 185,
  w300: 300,
  w342: 342,
  w500: 500,
  w780: 780,
  w1280: 1280,
  original: 1920,
}

function readCache(cacheKey) {
  const entry = responseCache.get(cacheKey)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    responseCache.delete(cacheKey)
    return null
  }
  return entry.data
}

function writeCache(cacheKey, data) {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value
    if (oldestKey) responseCache.delete(oldestKey)
  }
  responseCache.set(cacheKey, { data, timestamp: Date.now() })
}

async function request(path, options = {}) {
  const url = new URL(`${TMDB_BASE_URL}${path}`)

  if (TMDB_API_KEY) {
    url.searchParams.set('api_key', TMDB_API_KEY)
  }

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value)
      }
    })
  }

  const cacheKey = url.toString()
  const cached = readCache(cacheKey)
  if (cached) return cached

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(TMDB_BEARER_TOKEN
        ? { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` }
        : {}),
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `TMDB request failed: ${response.status}`)
  }

  const data = await response.json()
  writeCache(cacheKey, data)
  return data
}

async function getProviderId(providerName, mediaType, region = 'US') {
  const cacheKey = `${region}:${mediaType}:${providerName}`
  if (!providerIdCache.has(cacheKey)) {
    const lookup = request(`/watch/providers/${mediaType}`, {
      params: { language: 'en-US', watch_region: region },
    }).then((response) => {
      const target = providerName.toLowerCase()
      const provider = (response?.results ?? []).find((item) => {
        const name = item.provider_name.toLowerCase()
        return target === 'prime video'
          ? name.includes('prime video')
          : name === target
      })
      return provider?.provider_id ?? null
    })
    providerIdCache.set(cacheKey, lookup)
  }
  return providerIdCache.get(cacheKey)
}

async function getLatestOnProvider(providerName, mediaType, region = 'US') {
  try {
    const providerId = await getProviderId(providerName, mediaType, region)
    if (!providerId) return { results: [] }

    const today = new Date().toISOString().slice(0, 10)
    const isTV = mediaType === 'tv'
    return request(`/discover/${mediaType}`, {
      params: {
        language: 'en-US',
        watch_region: region,
        with_watch_providers: String(providerId),
        with_watch_monetization_types: 'flatrate',
        sort_by: isTV ? 'first_air_date.desc' : 'primary_release_date.desc',
        [isTV ? 'first_air_date.lte' : 'primary_release_date.lte']: today,
        page: '1',
      },
    })
  } catch {
    return { results: [] }
  }
}

export function getLatestNetflixMovies(region = 'US') {
  return getLatestOnProvider('Netflix', 'movie', region)
}

export function getLatestNetflixSeries(region = 'US') {
  return getLatestOnProvider('Netflix', 'tv', region)
}

export function getLatestPrimeMovies(region = 'US') {
  return getLatestOnProvider('Prime Video', 'movie', region)
}

export function getLatestPrimeSeries(region = 'US') {
  return getLatestOnProvider('Prime Video', 'tv', region)
}

export function getTrendingMovies() {
  return request('/trending/movie/week', {
    params: { language: 'en-US' },
  })
}

export function getPopularMovies() {
  return request('/discover/movie', {
    params: { language: 'en-US', sort_by: 'popularity.desc', page: '1' },
  })
}

export function getNowPlayingMovies() {
  const today = new Date().toISOString().slice(0, 10)
  const recentStart = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  return request('/discover/movie', {
    params: {
      language: 'en-US',
      sort_by: 'primary_release_date.desc',
      'primary_release_date.gte': recentStart,
      'primary_release_date.lte': today,
      page: '1',
    },
  })
}

export function searchMovies(query, options = {}) {
  return request('/search/movie', {
    ...options,
    params: {
      ...(options.params ?? {}),
      language: 'en-US',
      page: '1',
      include_adult: 'false',
      query,
    },
  })
}

export function searchTitles(query, options = {}) {
  return request('/search/multi', {
    ...options,
    params: {
      ...(options.params ?? {}),
      language: 'en-US',
      page: '1',
      include_adult: 'false',
      query,
    },
  }).then((response) => ({
    ...response,
    results: (response?.results ?? []).filter(
      (item) => item.media_type === 'movie' || item.media_type === 'tv',
    ),
  }))
}

export function getTrendingTV() {
  return request('/trending/tv/week', {
    params: { language: 'en-US' },
  })
}

export function getPopularTV() {
  return request('/discover/tv', {
    params: { language: 'en-US', sort_by: 'popularity.desc', page: '1' },
  })
}

export function getPopularSeries() {
  return request('/discover/tv', {
    params: { language: 'en-US', sort_by: 'popularity.desc', page: '1' },
  })
}

export async function getCustomFeaturedSeries() {
  const ids = [4607, 66732, 1399, 71446]

  try {
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          return await request(`/tv/${id}`, {
            params: { language: 'en-US' },
          })
        } catch {
          return null
        }
      }),
    )

    return { results: results.filter(Boolean) }
  } catch (error) {
    console.error('Error fetching featured series:', error)
    return { results: [] }
  }
}

export function getOnTheAirTV() {
  return request('/tv/on_the_air', {
    params: { language: 'en-US', page: '1' },
  })
}

export function getTVByGenre(genreId) {
  return request('/discover/tv', {
    params: {
      language: 'en-US',
      sort_by: 'popularity.desc',
      with_genres: genreId,
      page: '1',
      'vote_count.gte': '50',
    },
  })
}

export function getMoviesByGenre(genreId) {
  return request('/discover/movie', {
    params: {
      language: 'en-US',
      sort_by: 'popularity.desc',
      with_genres: genreId,
      page: '1',
      'vote_count.gte': '100',
    },
  })
}

export async function getMoviesByPersonalInterests(genreIds) {
  if (!genreIds) return Promise.resolve({ results: [] })

  const value = Array.isArray(genreIds)
    ? genreIds.map((id) => String(id).trim()).filter(Boolean).join(',')
    : String(genreIds)
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
        .join(',')

  if (!value) return Promise.resolve({ results: [] })

  const today = new Date().toISOString().slice(0, 10)
  const [genreResponse, recentResponse] = await Promise.all([
    request('/discover/movie', {
      params: {
        language: 'en-US',
        sort_by: 'primary_release_date.desc',
        with_genres: value,
        page: '1',
        'primary_release_date.lte': today,
      },
    }),
    request('/discover/movie', {
      params: {
        language: 'en-US',
        sort_by: 'primary_release_date.desc',
        page: '1',
        'primary_release_date.lte': today,
      },
    }),
  ])

  const genreMovies = genreResponse?.results ?? []
  const recentMovies = recentResponse?.results ?? []
  const combined = []
  const seen = new Set()
  const maxLength = Math.max(genreMovies.length, recentMovies.length)

  for (let index = 0; index < maxLength; index += 1) {
    for (const [movie, reason] of [[genreMovies[index], 'genre'], [recentMovies[index], 'recent']]) {
      if (movie && !seen.has(movie.id)) {
        seen.add(movie.id)
        combined.push({ ...movie, recommendationReason: reason })
      }
    }
  }

  return { ...genreResponse, results: combined }
}

export function getGenres() {
  return request('/genre/movie/list', {
    params: { language: 'en-US' },
  })
}

export function getMovieDetails(movieId, options = {}) {
  return request(`/movie/${movieId}`, {
    ...options,
    params: {
      ...(options.params ?? {}),
      language: 'en-US',
      append_to_response: 'videos',
    },
  })
}

export function getTVDetails(tvId, options = {}) {
  return request(`/tv/${tvId}`, {
    ...options,
    params: {
      ...(options.params ?? {}),
      language: 'en-US',
    },
  })
}

export function getTVSeasonDetails(tvId, seasonNumber, options = {}) {
  return request(`/tv/${tvId}/season/${seasonNumber}`, {
    ...options,
    params: {
      ...(options.params ?? {}),
      language: 'en-US',
    },
  })
}

export function getTitleDetails(id, mediaType, options = {}) {
  const { region = 'US', ...requestOptions } = options

  return request(`/${mediaType}/${id}`, {
    ...requestOptions,
    params: {
      ...(requestOptions.params ?? {}),
      language: 'en-US',
      append_to_response: 'videos,watch/providers',
    },
  }).then((response) => ({
    ...response,
    mediaType,
    watchProviders: response?.['watch/providers']?.results?.[region] ?? null,
  }))
}

export function getWatchProviders(id, mediaType, region = 'US', options = {}) {
  return request(`/${mediaType}/${id}/watch/providers`, options).then((response) => ({
    ...response,
    region: response?.results?.[region] ?? null,
    regionCode: region,
  }))
}

export function getMovieVideos(id, typeOrOptions = 'movie', maybeOptions = {}) {
  const type = typeof typeOrOptions === 'string' ? typeOrOptions : 'movie'
  const options = typeof typeOrOptions === 'string' ? maybeOptions : typeOrOptions

  return request(`/${type}/${id}/videos`, {
    ...options,
    params: {
      ...(options?.params ?? {}),
      language: 'en-US',
    },
  })
}

export function imageUrl(path, size = 'w500') {
  if (!path) return ''
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`
}

export function imageSrcSet(path, sizes = ['w342', 'w500', 'w780']) {
  if (!path) return undefined
  return sizes
    .map((size) => `${TMDB_IMAGE_BASE_URL}/${size}${path} ${IMAGE_WIDTHS[size] ?? 500}w`)
    .join(', ')
}

// Fetch Filipino Movies (Region: PH)
export function getFilipinoMovies(page = 1) {
  return request('/discover/movie', {
    params: {
      with_origin_country: 'PH',
      sort_by: 'popularity.desc',
      language: 'en-US',
      page: String(page),
    },
  })
}

export function getMoreFilipinoMovies() {
  return request('/discover/movie', {
    params: {
      with_origin_country: 'PH',
      sort_by: 'vote_average.desc',
      'vote_count.gte': '50',
      language: 'en-US',
      page: '1',
    },
  })
}

// Fetch Asian Series (KR, JP, CN, TH)
export function getAsianSeries() {
  return request('/discover/tv', {
    params: {
      with_origin_country: 'KR|JP|CN|TH',
      sort_by: 'popularity.desc',
      language: 'en-US',
      page: '1',
    },
  })
}

export function getTrending() {
  return getTrendingMovies()
}

export function getMoviesByCategory(genreId, page = 1) {
  return request('/discover/movie', {
    params: {
      language: 'en-US',
      sort_by: 'popularity.desc',
      with_genres: genreId,
      page: String(page),
      'vote_count.gte': '100',
    },
  })
}

export function getDiscoverMovies(genreId, page = 1) {
  return request('/discover/movie', {
    params: {
      language: 'en-US',
      with_genres: genreId,
      page: String(page),
    },
  })
}
