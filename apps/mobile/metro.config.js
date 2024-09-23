// // Learn more https://docs.expo.io/guides/customizing-metro
// metro.config.js

// const { getDefaultConfig } = require('metro-config');
// const path = require("path");
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the workspace root, this can be replaced with `find-yarn-workspace-root`
const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];
// 2. Let Metro know where to resolve packages, and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules')
];
// 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

module.exports = config;

// module.exports = (async () => {
//   const {
//     resolver: { sourceExts, assetExts }
//   } = await getDefaultConfig();

//   return {
//     transformer: {
//       getTransformOptions: async () => ({
//         transform: {
//           experimentalImportSupport: false,
//           inlineRequires: false,
//         },
//       }),
//     },
//     resolver: {
//       assetExts: [...assetExts, 'svg', 'png', 'jpg', 'gif', 'ttf'],
//       sourceExts: [...sourceExts, 'js', 'jsx', 'ts', 'tsx'],  // Ensure js is listed
//     },
//   };
// })();


// module.exports = (async () => {
//   const {
//     resolver: { sourceExts, assetExts }
//   } = await getDefaultConfig();

//   return {
//     transformer: {
//       getTransformOptions: async () => ({
//         transform: {
//           experimentalImportSupport: false,
//           inlineRequires: true,
//         },
//       }),
//     },
//     resolver: {
//       assetExts: assetExts.filter(ext => ext),
//       sourceExts: [...sourceExts, 'svg','ttf'],
//       extraNodeModules: new Proxy({}, {
//         get: (target, name) => {
//           return path.join(process.cwd(), `node_modules/${name}`);
//         },
//       }),
//     },
//   };
// })();



// const { getDefaultConfig } = require("expo/metro-config");
// const path = require("path");

// // Find the workspace root, this can be replaced with `find-yarn-workspace-root`
// const workspaceRoot = path.resolve(__dirname, "../..");
// const projectRoot = __dirname;

// const config = getDefaultConfig(projectRoot);

// // 1. Watch all files within the monorepo
// config.watchFolders = [workspaceRoot];
// // 2. Let Metro know where to resolve packages, and in what order
// config.resolver.nodeModulesPaths = [
//   path.resolve(projectRoot, "node_modules"),
//   path.resolve(workspaceRoot, "node_modules"),
// ];
// // 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
// config.resolver.disableHierarchicalLookup = true;

// module.exports = config;

// TEST
// const path = require('path');

// module.exports = {
//   ...config,
//   watchFolders: [
//     path.resolve(__dirname, '../../node_modules'),
//   ],
//   resolver: {
    
//     extraNodeModules: new Proxy({}, {
//       get: (target, name) => path.join(process.cwd(), `node_modules/${name}`),
//     }),
//   },
// };

// const {assetExts} = getDefaultConfig();
// module.exports = {
//   // ...config,
//   watchFolders: [
//     path.resolve(__dirname, '../../node_modules'),
//   ],
//   resolver: {
//     // assetExts: assetExts.filter(ext => ext),
//     // sourceExts: [...sourceExts, 'svg','ttf'],
//     // sourceExts: ["png","jpg", 'svg','ttf'],
//     extraNodeModules: new Proxy({}, {
//       get: (target, name) => path.join(process.cwd(), `node_modules/${name}`),
//     }),
//   },
// };