const {getDefaultConfig} = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const path = require('path');

const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Handle the starknetkit specific case
    if (moduleName.startsWith('starknetkit/')) {
      try {
        const path = require.resolve(moduleName);
        return {
          filePath: path,
          type: 'sourceFile',
        };
      } catch (e) {
        // Fall back to default resolution
        return context.resolveRequest(context, moduleName, platform);
      }
    }
    // Default resolution for all other modules
    return context.resolveRequest(context, moduleName, platform);
  },
};

config.watchFolders = [workspaceRoot];
config.server = {
  ...config.server,
  usePolling: true,
  pollingInterval: 1000,
};

// module.exports = withNativeWind(config, {
//   input: './global.css',
//   inlineRem: 16,
// });

module.exports = config;


