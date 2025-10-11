import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This allows the server to be accessible from your network
    host: '127.0.0.1', 
    
    // This explicitly tells Vite to trust requests from your Render preview URL
    allowedHosts: [
      'rotordoc-1.onrender.com',
      '.onrender.com' // Allows any preview URL from Render
    ],
  },
});
