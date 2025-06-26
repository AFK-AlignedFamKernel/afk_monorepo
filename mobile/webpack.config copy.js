const { createExpoWebpackConfigAsync } = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['nativewind']
      }
    },
    argv
  );
  
  // Add custom entry point
  config.entry = ['./index.web.js'];
  
  return config;
};
