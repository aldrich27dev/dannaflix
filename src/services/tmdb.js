// src/services/tmdb.js

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BEARER_TOKEN = import.meta.env.VITE_TMDB_BEARER_TOKEN

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TMDB_BEARER_TOKEN}`
})


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

  return response.json()
}

export function getTrendingMovies() {
  return request('/trending/movie/week', {
    params: { language: 'en-US' },
  })
}

export function getPopularMovies() {
  return request('/movie/popular', {
    params: { language: 'en-US', page: '1' },
  })
}

export function getNowPlayingMovies() {
  return request('/movie/now_playing', {
    params: { language: 'en-US', page: '1' },
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

export function getTrendingTV() {
  return request('/trending/tv/week', {
    params: { language: 'en-US' },
  })
}

export function getPopularTV() {
  return request('/tv/popular', {
    params: { language: 'en-US', page: '1' },
  })
}

export function getPopularSeries() {
  return request('/tv/popular', {
    params: { language: 'en-US', page: '1' },
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
    console.error('Error fetching hardcoded sci-fi series:', error)
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

export function getMoviesByPersonalInterests(genreIds) {
  if (!genreIds) return Promise.resolve({ results: [] })

  const value = Array.isArray(genreIds)
    ? genreIds.map((id) => String(id).trim()).filter(Boolean).join(',')
    : String(genreIds)
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
        .join(',')

  if (!value) return Promise.resolve({ results: [] })

  return request('/discover/movie', {
    params: {
      language: 'en-US',
      sort_by: 'popularity.desc',
      with_genres: value,
      page: '1',
    },
  })
}

export function getGenres() {
  return request('/genre/movie/list', {
    params: { language: 'en-US' },
  })
}

export function getMovieDetails(movieId) {
  return request(`/movie/${movieId}`, {
    params: { language: 'en-US', append_to_response: 'videos' },
  })
}

export function getTVDetails(tvId, options = {}) {
  return request(`/tv/${tvId}`, {
    ...options,
    params: { language: 'en-US' },
  })
}

export function getTVSeasonDetails(tvId, seasonNumber, options = {}) {
  return request(`/tv/${tvId}/season/${seasonNumber}`, {
    ...options,
    params: { language: 'en-US' },
  })
}

// Fetch media trailers/clips from TMDB
export function getMovieVideos(id, typeOrOptions = 'movie', maybeOptions = {}) {
  const type =
    typeof typeOrOptions === 'string' ? typeOrOptions : 'movie'
  const options =
    typeof typeOrOptions === 'string' ? maybeOptions : typeOrOptions

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

// Fetch Filipino Movies (Region: PH)
export function getFilipinoMovies() {
  return request('/discover/movie', {
    params: {
      with_origin_country: 'PH',
      sort_by: 'popularity.desc',
      language: 'en-US',
      page: '1',
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

// Replace your manual fetch versions with these, 
// which use your central 'request' helper:

export function getMoviesByCategory(genreId, page = 1) {
  return request('/discover/movie', {
    params: {
      language: 'en-US',
      sort_by: 'popularity.desc',
      with_genres: genreId,
      page: String(page),
      'vote_count.gte': '100', // Keeps consistency with your other genre calls
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
