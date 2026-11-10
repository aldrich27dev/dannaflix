import { searchTitles } from './tmdb'

const WIKI_SEARCH_URL = 'https://en.wikipedia.org/w/api.php'
const CACHE_TTL = 10 * 60 * 1000
const MAX_CACHE_ENTRIES = 80

const spellingCache = new Map()
const correctionCache = new Map()

function readCache(cache, key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function writeCache(cache, key, data) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value
    if (oldestKey) cache.delete(oldestKey)
  }
  cache.set(key, { data, timestamp: Date.now() })
}

function normalizeText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function candidateKey(value) {
  return normalizeText(value).toLowerCase()
}

function cleanCandidate(value) {
  return normalizeText(value)
    .replace(
      /\s*\([^)]*(?:film|movie|television|tv|series|miniseries|program|programme|disambiguation)[^)]*\)\s*$/i,
      '',
    )
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isUsefulCandidate(candidate, query) {
  const value = candidateKey(candidate)
  const original = candidateKey(query)

  if (!value || value === original) return false
  if (value.length < 3 || value.length > 60) return false
  if (!/[a-z]/i.test(value)) return false
  if (/^(list of|wikipedia:|category:|portal:|template:)/i.test(value)) return false

  return true
}

async function fetchWikiCandidates(query, options = {}) {
  const url = new URL(WIKI_SEARCH_URL)
  url.searchParams.set('action', 'query')
  url.searchParams.set('list', 'search')
  url.searchParams.set('srsearch', query)
  url.searchParams.set('srlimit', '6')
  url.searchParams.set('srinfo', 'suggestion')
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')

  const response = await fetch(url, {
    signal: options.signal,
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) return []

  const data = await response.json()
  const suggestion = cleanCandidate(data?.query?.searchinfo?.suggestion)
  const wikiResults = (data?.query?.search ?? [])
    .map((result) => cleanCandidate(result?.title))
    .filter(Boolean)

  const candidates = []
  const seen = new Set()

  for (const candidate of [suggestion, ...wikiResults]) {
    if (!isUsefulCandidate(candidate, query)) continue
    const key = candidateKey(candidate)
    if (seen.has(key)) continue
    seen.add(key)
    candidates.push(candidate)
  }

  return candidates.slice(0, 5)
}

export async function getSpellingSuggestions(query, options = {}) {
  const normalized = normalizeText(query)
  if (normalized.length < 3) return []

  const cacheKey = candidateKey(normalized)
  const cached = readCache(spellingCache, cacheKey)
  if (cached) return cached

  try {
    const candidates = await fetchWikiCandidates(normalized, options)
    if (!options.signal?.aborted) writeCache(spellingCache, cacheKey, candidates)
    return candidates
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    return []
  }
}

export async function getQuickSuggestions(query, options = {}) {
  const normalized = normalizeText(query)
  if (normalized.length < 2) return []

  try {
    const response = await searchTitles(normalized, options)
    return (response?.results ?? [])
      .filter((result) => result?.id && (result.title || result.name))
      .slice(0, 6)
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    return []
  }
}

export async function getSearchCorrections(query, options = {}) {
  const normalized = normalizeText(query)
  if (normalized.length < 3) return []

  const cacheKey = candidateKey(normalized)
  const cached = readCache(correctionCache, cacheKey)
  if (cached) return cached

  const candidates = await getSpellingSuggestions(normalized, options)
  if (!candidates.length) {
    if (!options.signal?.aborted) writeCache(correctionCache, cacheKey, [])
    return []
  }

  const validated = await Promise.all(
    candidates.slice(0, 4).map(async (candidate) => {
      try {
        const response = await searchTitles(candidate, { signal: options.signal })
        const results = (response?.results ?? [])
          .filter((result) => result?.id && (result.title || result.name))
          .slice(0, 4)

        return results.length ? { query: candidate, results } : null
      } catch (error) {
        if (error?.name === 'AbortError') throw error
        return null
      }
    }),
  )

  const corrections = validated.filter(Boolean).slice(0, 3)

  if (!options.signal?.aborted) {
    writeCache(correctionCache, cacheKey, corrections)
  }

  return corrections
}
