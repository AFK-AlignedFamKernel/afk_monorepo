import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  format: ['cjs', 'esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs',
    };
  },
  target: ['es2020', 'node16'],
  platform: 'node',
  noExternal: ['@noble/secp256k1', '@noble/hashes', '@noble/curves', '@noble/ciphers'],
  esbuildOptions(options) {
    options.banner = {
      js: '"use strict";',
    };
    options.define = {
      ...options.define,
      global: 'globalThis',
    };
  },
  external: [
    'react',
    'react-dom',
    '@nostr-dev-kit/ndk',
    '@nostr-dev-kit/ndk-wallet',
    '@tanstack/react-query',
    'zustand'
  ],
}); 