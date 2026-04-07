import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        voice: {
          type: 'module',
          name: 'voice',
          entry: process.env.VOICE_MFE_URL || 'http://localhost:3001/mf-manifest.json',
        },
        triage: {
          type: 'module',
          name: 'triage',
          entry: process.env.TRIAGE_MFE_URL || 'http://localhost:3002/mf-manifest.json',
        },
        scheduling: {
          type: 'module',
          name: 'scheduling',
          entry: process.env.SCHEDULING_MFE_URL || 'http://localhost:3003/mf-manifest.json',
        },
        pophealth: {
          type: 'module',
          name: 'pophealth',
          entry: process.env.POPHEALTH_MFE_URL || 'http://localhost:3004/mf-manifest.json',
        },
        revenue: {
          type: 'module',
          name: 'revenue',
          entry: process.env.REVENUE_MFE_URL || 'http://localhost:3005/mf-manifest.json',
        },
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        zustand: { singleton: true },
        '@microsoft/signalr': { singleton: true },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
  },
});
