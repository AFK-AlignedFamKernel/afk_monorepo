const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add .wasm to assetExts
const { assetExts } = config.resolver;
config.resolver.assetExts = [...assetExts, "wasm"];

// Ensure Metro follows symlinks (important for pnpm)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  return require("metro-resolver").resolve(context, moduleName, platform);
};

// config.resolver.unstable_enablePackageExports = false;

config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

module.exports = config;