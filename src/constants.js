export const CATEGORIES = [
  { name: 'Pinoy', id: 'ph' },
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

export const GENRES = CATEGORIES.filter((category) => category.id !== 'ph')

export const QUICK_BROWSE_GENRE_IDS = ['ph', 28, 35, 18, 27, 878]

export const QUICK_BROWSE_GENRES = CATEGORIES.filter((category) =>
  QUICK_BROWSE_GENRE_IDS.some((id) => String(id) === String(category.id)),
)

export const REGIONS = [
  { code: 'PH', label: 'Philippines' },
  { code: 'US', label: 'United States' },
]

export const DEFAULT_REGION = 'PH'

export const ONBOARDING_GENRE_IDS = [28, 27, 878, 35, 10749, 53, 14, 18]
