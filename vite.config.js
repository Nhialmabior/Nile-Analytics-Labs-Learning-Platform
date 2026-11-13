import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // This repository is published from a project subpath on GitHub Pages.
  base: '/Nile-Analytics-Labs-Learning-Platform/',
  plugins: [react()]
})
