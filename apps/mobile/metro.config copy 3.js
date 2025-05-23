const { getDefaultConfig } = require('@expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const path = require('path');

const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Add workspace configuration
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

// Configure module resolution
config.resolver = {
  ...config.resolver,
  sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json', 'mjs', 'cjs', 'css', 'esm'],
  platforms: ['ios', 'android', 'web'],
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName.startsWith('starknetkit/')) {
      try {
        const path = require.resolve(moduleName);
        return {
          filePath: path,
          type: 'sourceFile',
        };
      } catch (e) {
        return context.resolveRequest(context, moduleName, platform);
      }
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

// Configure transformer
config.transformer = {
  ...config.transformer,
  unstable_disableModuleWrapping: true,
//   babelTransformerPath: require.resolve('react-native-web-babel-transformer'),
  minifierPath: require.resolve('metro-minify-terser'),
  minifierConfig: {
    ecma: 8,
    keep_classnames: true,
    keep_fnames: true,
    module: true,
    mangle: {
      module: true,
      keep_classnames: true,
      keep_fnames: true,
    },
  },
};

// Configure server
config.server = {
  ...config.server,
  usePolling: true,
  pollingInterval: 1000,
};

module.exports = withNativeWind(config, {
  input: './global.css',
  inlineRem: 16,
});


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


