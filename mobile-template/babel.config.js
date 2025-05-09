module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            'pixel_component': '../../packages/pixel_component/src',
            'afk_nostr_sdk': '../../packages/afk_nostr_sdk/src',
            'common': '../../packages/common/src',
            'pixel_ui': '../../packages/pixel_ui/src',
          },
          extensions: [
            '.ios.ts',
            '.android.ts',
            '.ts',
            '.ios.tsx',
            '.android.tsx',
            '.tsx',
            '.jsx',
            '.js',
            '.json',
          ],
        },
      ],
      'react-native-reanimated/plugin',
      "@babel/plugin-proposal-export-namespace-from",
    ],
  };
};