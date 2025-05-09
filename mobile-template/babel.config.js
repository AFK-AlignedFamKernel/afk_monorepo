module.exports = function (api) {
  // Get the platform that Expo CLI is transforming for.
  const platform = api.caller(caller => (caller ? caller.platform : 'ios'));

  // Detect if the bundling operation is for Hermes engine or not, e.g. `'hermes'` | `undefined`.
  const engine = api.caller(caller => (caller ? caller.engine : null));

  // Is bundling for a server environment, e.g. API Routes.
  const isServer = api.caller(caller => (caller ? caller.isServer : false));

  // api.cache(true);
  // Ensure the config is not cached otherwise the platform will not be updated.
  api.cache(false);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      '@babel/plugin-proposal-export-namespace-from',
      '@babel/plugin-syntax-import-meta',
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            'afk_nostr_sdk': '../packages/afk_nostr_sdk/src',
            'common': '../packages/common/src',
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
    ],
  };
};