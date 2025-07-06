module.exports = function (api) {
  // api.cache(true);
  api.cache(false);
  return {
    // resolver: {
    //   unstable_conditionNames: ['browser', 'require', 'react-native'],
    // },
    presets: [['babel-preset-expo', {
      // jsxImportSource: 'nativewind',
      unstable_transformImportMeta: true,
    }],],
    overrides: [
      {
        // test: './node_modules/react-native-reanimated/lib/typescript/reanimated2/jsc-profiling.d.ts',
        // sourceType: 'unambiguous',
        plugins: [
          // "babel-plugin-transform-import-meta",
          // "module:@react-native-reanimated/babel-plugin-react-native-reanimated",
        ],
      },
    ],

  };
};