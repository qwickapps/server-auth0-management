import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const mockIconsPath = new URL('./tests/__mocks__/mui-icons.ts', import.meta.url).pathname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // Mock MUI icons to prevent EMFILE errors from too many imports
      { find: /^@mui\/icons-material\/(.*)$/, replacement: mockIconsPath },
      { find: '@mui/icons-material', replacement: mockIconsPath },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'ui/**/*.test.tsx'],
    setupFiles: ['./tests/setup-ui.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'ui/**/*.tsx', 'ui/**/*.ts'],
      exclude: ['src/types/**/*.ts', 'ui/types.ts'],
    },
  },
});
