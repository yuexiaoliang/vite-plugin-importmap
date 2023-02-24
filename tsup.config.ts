import { defineConfig } from 'tsup'

export default defineConfig({
  entryPoints: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: false,
  shims: true,
  splitting: false,
  minify: true,
  external: ['vite'],
})
