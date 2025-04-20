import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'apibara/config';

export default defineConfig({
  runtimeConfig: {
    streamUrl: 'https://starknet-sepolia.preview.apibara.org',
    startingCursor: {
      orderKey: 700_000,
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
  // rolldownConfig: {
  //   plugins: [typescript()],
  // },
  rollupConfig: {
    plugins: [typescript()],
  },
});
