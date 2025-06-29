import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GameSettings {
  soundEnabled: boolean
  musicEnabled: boolean
  theme: 'retro' | 'neon' | 'pixel'
}

interface GameStore {
  settings: GameSettings
  currentGame: string | null
  highScores: Record<string, number>
  updateSettings: (settings: Partial<GameSettings>) => void
  setCurrentGame: (game: string | null) => void
  updateHighScore: (game: string, score: number) => void
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      settings: {
        soundEnabled: true,
        musicEnabled: true,
        theme: 'retro',
      },
      currentGame: null,
      highScores: {},
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      setCurrentGame: (game) => set({ currentGame: game }),
      updateHighScore: (game, score) =>
        set((state) => {
          const currentHighScore = state.highScores[game] || 0
          if (score > currentHighScore) {
            return {
              highScores: { ...state.highScores, [game]: score },
            }
          }
          return state
        }),
    }),
    {
      name: 'vibe-arcade-storage',
    }
  )
)