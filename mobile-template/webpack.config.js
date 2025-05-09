const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          '@nostr-dev-kit/ndk',
          '@nostr-dev-kit',
          'nostr-tools'
        ],
      },
    },
    argv
  );
  
  // Add polyfill
  if (!config.entry) {
    config.entry = [];
  } else if (!Array.isArray(config.entry)) {
    config.entry = [config.entry];
  }
  
  // Add polyfill as the first entry
  config.entry.unshift(path.resolve(__dirname, 'polyfills.js'));
  
  // Enable import.meta support
  if (!config.resolve.alias) {
    config.resolve.alias = {};
  }
  
  // Make sure experiments is defined
  if (!config.experiments) {
    config.experiments = {};
  }
  // Enable import.meta
  config.experiments.topLevelAwait = true;
  config.experiments.importMeta = true;
  
  return config;
}; 