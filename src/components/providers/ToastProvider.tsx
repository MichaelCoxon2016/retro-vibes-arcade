'use client'

import { Toaster } from 'react-hot-toast'

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '2px solid var(--neon-pink)',
          fontFamily: "'Courier New', monospace",
          boxShadow: '0 0 20px rgba(255, 16, 240, 0.5)',
        },
        success: {
          iconTheme: {
            primary: 'var(--neon-green)',
            secondary: 'var(--bg-primary)',
          },
          style: {
            border: '2px solid var(--neon-green)',
            boxShadow: '0 0 20px rgba(57, 255, 20, 0.5)',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--neon-orange)',
            secondary: 'var(--bg-primary)',
          },
          style: {
            border: '2px solid var(--neon-orange)',
            boxShadow: '0 0 20px rgba(255, 102, 0, 0.5)',
          },
        },
      }}
    />
  )
}