import 'expo-sqlite/localStorage/install'
import { Uniwind } from 'uniwind'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Theme = 'dark' | 'light'

type ThemeState = {
  theme: Theme
  toggleTheme: () => void
}

// Như web: mặc định giao diện tối, lưu ở key 'theme'. localStorage của expo-sqlite đọc đồng bộ nên
// theme đã lưu có ngay lúc mở app (không nháy màu).
export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'theme', storage: createJSONStorage(() => localStorage) },
  ),
)

// Uniwind đổi bộ màu (@variant light/dark trong global.css) và báo cho các thành phần native
Uniwind.setTheme(useTheme.getState().theme)
useTheme.subscribe(({ theme }) => Uniwind.setTheme(theme))
