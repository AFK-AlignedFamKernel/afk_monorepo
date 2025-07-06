const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Add .wasm to assetExts
const { assetExts } = config.resolver;
config.resolver.assetExts = [...assetExts, "wasm"];

// Ensure Metro follows symlinks (important for pnpm)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  return require("metro-resolver").resolve(context, moduleName, platform);
};

// config.resolver.unstable_enablePackageExports = false;

config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

// Alias '@' to the project root
config.resolver.extraNodeModules = {
  '@': projectRoot,
};

// (Optional, but helps in monorepos)
config.watchFolders = [projectRoot];

module.exports = config;