import { defineConfig } from 'vite'
import importmap from 'vite-plugin-importmap'

const mark = 'v2' // v1, v2, v3, v4
export default defineConfig({
  plugins: [importmap(mark)]
})