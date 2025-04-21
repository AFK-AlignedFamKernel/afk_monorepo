import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'apibara/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  runtimeConfig: {
    streamUrl: 'https://starknet-sepolia.preview.apibara.org',
    startingBlock: process.env.STARTING_BLOCK ? parseInt(process.env.STARTING_BLOCK) : 705340,
    // startingCursor: {
    //   orderKey: process.env.ORDER_KEY ? parseInt(process.env.ORDER_KEY) : 705340,
    //   // orderKey: 500000,
    //   // orderKey: 533390,
    // },
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
  // rollupConfig: {
  //   plugins: [typescript()],
  // },
});
