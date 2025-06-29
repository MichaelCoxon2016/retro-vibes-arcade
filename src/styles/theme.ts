export const theme = {
  colors: {
    primary: '#FF00FF',
    secondary: '#00FFFF',
    success: '#00FF00',
    danger: '#FF0000',
    warning: '#FFFF00',
    dark: '#0A0A0A',
    light: '#FFFFFF',
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    neon: {
      pink: '#FF10F0',
      blue: '#00D9FF',
      green: '#39FF14',
      yellow: '#FFFF00',
      orange: '#FF6600',
      purple: '#9D00FF',
    },
  },
  fonts: {
    arcade: '"Press Start 2P", monospace',
    mono: '"Courier New", monospace',
    sans: 'Arial, sans-serif',
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  shadows: {
    neon: '0 0 20px rgba(255, 0, 255, 0.5)',
    retro: '4px 4px 0px rgba(0, 0, 0, 0.8)',
    pixel: '2px 2px 0px rgba(0, 0, 0, 1)',
  },
  animations: {
    blink: 'blink 1s infinite',
    pulse: 'pulse 2s infinite',
    shake: 'shake 0.5s infinite',
    glitch: 'glitch 1s infinite',
  },
} as const

export type Theme = typeof theme