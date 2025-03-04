import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    // Configuración del servidor de desarrollo
    proxy: {
      // Proxy para redirigir peticiones API al backend
      '/resumen': 'http://localhost:8000',
      '/ask': 'http://localhost:8000',
    }
  }
})

