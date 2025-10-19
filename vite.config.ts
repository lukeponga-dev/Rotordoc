import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

server: {
  port: 3000,
  host: '0.0.0.0',
  allowedHosts: ['https://rotordoc-1.onrender.com', 'localhost'], // ✅ Add this line
},
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'), // ✅ Simplifies imports
      },
    },
  };
});
