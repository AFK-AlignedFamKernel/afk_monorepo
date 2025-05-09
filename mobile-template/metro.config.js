const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for transpiling node modules with import.meta
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  // babelTransformerPath: require.resolve('@react-native/metro-babel-transformer'),
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
};

// Set sourceExts to include all required extensions
config.resolver.sourceExts = [
  'js', 'jsx', 'ts', 'tsx', 'cjs', 'mjs', 'json'
];

// Add ES modules support
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['import', 'require', 'node', 'default'];

// Ensure polyfills are loaded before any other modules
config.serializer = {
  ...config.serializer,
  getPolyfills: () => [
    require.resolve('./polyfills')
  ]
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('afk_nostr_sdk')) {
    // Logic to resolve the module name to a file path...
    // NOTE: Throw an error if there is no resolution.
    return {
      filePath: '../packages/afk_nostr_sdk/src',
      type: 'sourceFile',
    };
  }
  if (moduleName.startsWith('common')) {
    // Logic to resolve the module name to a file path...
    // NOTE: Throw an error if there is no resolution.
    return {
      filePath: '../packages/common/src',
      type: 'sourceFile',
    };
  }

  // Ensure you call the default resolver.
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
