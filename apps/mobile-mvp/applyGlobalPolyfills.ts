import { Buffer } from 'buffer';
const TextEncodingPolyfill = require('text-encoding');
// import 'react-native-url-polyfill/auto';
// import 'react-native-get-random-values';

// If not already present in applyGlobalPolyfills.ts, add:
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

const applyGlobalPolyfills = () => {
  Object.assign(global, {
    TextEncoder: TextEncodingPolyfill.TextEncoder,
    TextDecoder: TextEncodingPolyfill.TextDecoder,
    Buffer: Buffer,
  });

  // // Add import.meta polyfill for web platform
  // if (typeof global.import === 'undefined') {
  //   global.import = {};
  // }

  // if (typeof global.import.meta === 'undefined') {
  //   global.import.meta = {
  //     url: '',
  //     env: process.env,
  //   };
  // }

  // // Expose as a global in case it's used directly
  // if (typeof global.importMeta === 'undefined') {
  //   global.importMeta = global.import.meta;
  // }
};

applyGlobalPolyfills();
