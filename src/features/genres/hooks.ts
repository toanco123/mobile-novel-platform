import { useQuery } from '@tanstack/react-query'
import * as api from './api'

// Cùng query key với web (src/features/genres/hooks.ts)
export const genreKeys = {
  all: ['genres'] as const,
}

export const useGenres = () => useQuery({ queryKey: genreKeys.all, queryFn: api.getGenres })
