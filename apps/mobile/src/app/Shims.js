// Polyfills for browser and React Native compatibility
import 'fast-text-encoding';
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

// Add import.meta polyfill for web platform
if (typeof global.import === 'undefined') {
  global.import = {};
}

if (typeof global.import.meta === 'undefined') {
  global.import.meta = {
    url: '',
    env: process.env,
  };
}

// Expose as a global in case it's used directly
if (typeof global.importMeta === 'undefined') {
  global.importMeta = global.import.meta;
} 