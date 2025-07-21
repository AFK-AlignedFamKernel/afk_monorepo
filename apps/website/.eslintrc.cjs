require('@uniswap/eslint-config/load');

module.exports = {
  extends: ['next/core-web-vitals', '@uniswap/eslint-config/node'],
  rules: {
    "@typescript-eslint/no-restricted-imports": "off",
    'import/no-unused-modules': 'off',
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
      rules: {
        "@typescript-eslint/no-restricted-imports": "off",
        'import/no-unused-modules': 'off',
        'prettier/prettier': [
          'error',
          {
            endOfLine: 'auto',
          },
        ],
      },
    },
  ],
};
