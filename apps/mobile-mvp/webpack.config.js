const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Add alias for @ to point to the project root
  config.resolve.alias['@'] = path.resolve(__dirname);

  // If you want to add more aliases, do it here
  config.resolve.alias['afk_nostr_sdk'] = path.resolve(__dirname, '../../packages/afk_nostr_sdk/src');
  config.resolve.alias['common'] = path.resolve(__dirname, '../../packages/common/src');

  return config;
};
