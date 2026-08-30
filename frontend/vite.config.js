import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { terminalLoggerPlugin } from './vite-terminal-logger.js';

export default defineConfig({
  plugins: [react(), terminalLoggerPlugin()],
  server: { port: 5173 },
});
