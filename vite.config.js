import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './'  -> rutas relativas, para que la app funcione tanto en la raíz
// del dominio como en un subdirectorio (https://usuario.github.io/mi-billetera-lite/).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Nombres fijos (sin hash) para poder listar el App Shell
        // explícitamente dentro de public/sw.js.
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (info) => {
          const name = info.names?.[0] ?? info.name ?? '';
          if (name.endsWith('.css')) return 'assets/app.css';
          return 'assets/[name][extname]';
        },
      },
    },
  },
  server: { port: 5173, open: true },
});
