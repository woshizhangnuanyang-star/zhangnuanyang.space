import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths keep the build portable on GitHub Pages project sites.
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
