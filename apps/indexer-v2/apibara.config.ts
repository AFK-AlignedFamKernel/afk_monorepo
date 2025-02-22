import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'apibara/config';

export default defineConfig({
  runtimeConfig: {
    streamUrl: 'https://starknet-sepolia.preview.apibara.org',
    startingCursor: {
      orderKey: 500_000,
    },
    pgLiteDBPath: 'memory://persistence',
  },
  presets: {
    dev: {
      runtimeConfig: {
        pgLiteDBPath: './.persistence',
      },
    },
  },
  rollupConfig: {
    plugins: [typescript()],
  },
});
