import { Buffer as BufferPolyfill } from 'buffer';
const TextEncodingPolyfill = require('text-encoding');
// import 'react-native-url-polyfill/auto';
// import 'react-native-get-random-values';

// If not already present in applyGlobalPolyfills.ts, add:
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = BufferPolyfill;
} else {
  // Patch for legacy 'new Buffer' usage
  // @ts-ignore
  globalThis.Buffer = Object.assign(BufferPolyfill, { 
    // @ts-ignore
    from: BufferPolyfill.from, 
    // @ts-ignore
    alloc: BufferPolyfill.alloc, 
    // @ts-ignore
    allocUnsafe: BufferPolyfill.allocUnsafe, 
    // @ts-ignore
    isBuffer: BufferPolyfill.isBuffer 
  });
}

// Patch global.Buffer for older libraries
if (typeof global !== 'undefined') {
  // @ts-ignore
  global.Buffer = globalThis.Buffer;
}

const applyGlobalPolyfills = () => {
  Object.assign(global, {
    TextEncoder: TextEncodingPolyfill.TextEncoder,
    TextDecoder: TextEncodingPolyfill.TextDecoder,
    Buffer: globalThis.Buffer,
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
