// Polyfill for import.meta
if (typeof globalThis.import === 'undefined') {
  globalThis.import = {};
}

if (typeof globalThis.import.meta === 'undefined') {
  globalThis.import.meta = {
    url: '',
    env: process.env,
  };
}

// Expose as a global in case it's used directly
if (typeof globalThis.importMeta === 'undefined') {
  globalThis.importMeta = globalThis.import.meta;
}

// Import babel helpers
require('./utils/babelInteropHelper'); 