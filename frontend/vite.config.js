import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), // Supporte JSX et TSX par défaut
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Cible du backend
        changeOrigin: true,
        secure: false, // Désactive la vérification SSL en dev (optionnel)
        rewrite: (path) => path.replace(/^\/api/, ''), // Réécrit l'URL si nécessaire
      },
    },
    port: 3000, // Port du frontend (optionnel)
    open: true, // Ouvre le navigateur automatiquement (optionnel)
  },
  resolve: {
    alias: {
      // Alias pour faciliter les imports (ex: `@/components/Button`)
      '@': '/src',
      '@frontoffice': '/src/frontoffice',
      '@backoffice': '/src/backoffice',
    },
  },
  // Optimisation pour TypeScript (sans configuration supplémentaire nécessaire)
  esbuild: {
    loader: 'tsx', // Force ESBuild à traiter les fichiers TSX
  },
});