import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/LEPARFUM_PF/', // <--- AGREGA ESTA LÍNEA EXACTAMENTE ASÍ
})
