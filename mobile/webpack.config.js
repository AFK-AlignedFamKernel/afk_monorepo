const { createExpoWebpackConfigAsync } = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          'nativewind',
          '@nostr-dev-kit/ndk',
          'react-native-css-interop',
          'react-native-reanimated',
          '@react-navigation/elements'
        ]
      }
    },
    argv
  );
  
  // Add custom entry point with polyfills
  config.entry = ['./applyGlobalPolyfills.ts', './index.js'];
  
  // Enable import.meta support
  if (!config.experiments) {
    config.experiments = {};
  }
  config.experiments.topLevelAwait = true;
  
  return config;
};
