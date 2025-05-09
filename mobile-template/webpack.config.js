const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          // Add any problematic modules that need to be transpiled
        ],
      },
    },
    argv
  );
  
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