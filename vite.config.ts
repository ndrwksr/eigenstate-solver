import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh';

// https://vitejs.dev/config/
export default defineConfig({
  esbuild: {
    define: {
      global: 'window'
    },
    treeShaking: true
  },
  plugins: [reactRefresh()]
})
