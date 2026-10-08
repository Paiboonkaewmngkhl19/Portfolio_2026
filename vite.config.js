import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/Portfolio_2026/',
  plugins: [react()],
  // Support older phones (iOS 14+ / Android Chrome 87+), not just recent browsers.
  build: {
    target: ['es2020', 'safari14', 'chrome87'],
  },
})
