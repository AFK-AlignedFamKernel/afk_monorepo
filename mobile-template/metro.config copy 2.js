const {getDefaultConfig} = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { FileStore } = require('metro-cache');

const path = require('path');

const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot, monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.join(projectRoot, 'node_modules'),
  path.join(monorepoRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = false;

config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (target, name) => {
      return path.join(projectRoot, `node_modules/${name}`);
    },
  },
);

config.cacheStores = [new FileStore({ root: path.join(projectRoot, 'node_modules/.cache/metro') })];

config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'cjs', 'mjs', 'json'];

config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['import', 'require', 'node', 'default'];

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

module.exports = withNativeWind(config, {
  input: './global.css',
  inlineRem: 16,
});

module.exports = config;


// /** @type {import('expo/metro-config').MetroConfig} */
// const { getDefaultConfig } = require('expo/metro-config');
// const path = require('path');
// const fs = require('fs');
// // const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
// const defaultConfig = getDefaultConfig(__dirname)


// const config = getDefaultConfig(__dirname);

// // config.resolver.resolveRequest = (context, moduleName, platform) => {
// //   // if (platform === 'web' && moduleName === 'lodash') {
// //   //   return {
// //   //     type: 'empty',
// //   //   };
// //   // }

// //   // Ensure you call the default resolver.
// //   return context.resolveRequest(context, moduleName, platform);
// // };

// // module.exports = config;
// module.exports = defaultConfig;


// const {getDefaultConfig} = require('expo/metro-config');
// const { withNativeWind } = require('nativewind/metro');

// const path = require('path');

// const workspaceRoot = path.resolve(__dirname, '../..');
// const projectRoot = __dirname;

// const config = getDefaultConfig(projectRoot);

// config.watchFolders = [workspaceRoot];
// config.resolver.nodeModulesPaths = [
//   path.resolve(projectRoot, 'node_modules'),
//   path.resolve(workspaceRoot, 'node_modules'),
// ];
// config.resolver.disableHierarchicalLookup = true;

// config.resolver = {
//   ...config.resolver,
//   resolveRequest: (context, moduleName, platform) => {
//     // Handle the starknetkit specific case
//     if (moduleName.startsWith('starknetkit/')) {
//       try {
//         const path = require.resolve(moduleName);
//         return {
//           filePath: path,
//           type: 'sourceFile',
//         };
//       } catch (e) {
//         // Fall back to default resolution
//         return context.resolveRequest(context, moduleName, platform);
//       }
//     }
//     // Default resolution for all other modules
//     return context.resolveRequest(context, moduleName, platform);
//   },
// };

// config.watchFolders = [workspaceRoot];
// config.server = {
//   ...config.server,
//   usePolling: true,
//   pollingInterval: 1000,
// };

// module.exports = withNativeWind(config, {
//   input: './global.css',
//   inlineRem: 16,
// });


