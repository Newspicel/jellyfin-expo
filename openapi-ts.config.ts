import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './jellyfin-openapi-stable.json',
  output: {
    path: './api/generated',
    format: 'prettier',
  },
  plugins: [
    '@hey-api/typescript',
    {
      name: '@hey-api/client-fetch',
    },
    {
      name: '@tanstack/react-query',
    },
  ],
});
