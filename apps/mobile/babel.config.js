module.exports = function (api) {
  // Get the platform that Expo CLI is transforming for.
  const platform = api.caller(caller => (caller ? caller.platform : 'ios'));

  // Detect if the bundling operation is for Hermes engine or not, e.g. `'hermes'` | `undefined`.
  const engine = api.caller(caller => (caller ? caller.engine : null));

  // Is bundling for a server environment, e.g. API Routes.
  const isServer = api.caller(caller => (caller ? caller.isServer : false));

  // Is bundling for development or production.
  const isDev = api.caller(caller =>
    caller
      ? caller.isDev
      : process.env.BABEL_ENV === 'development' || process.env.NODE_ENV === 'development'
  );
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
