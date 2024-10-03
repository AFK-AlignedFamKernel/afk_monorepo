require('@uniswap/eslint-config/load');

module.exports = {
  extends: [
    'next/core-web-vitals',
    '@uniswap/eslint-config/node',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
      rules: {
        'import/no-unused-modules': 'off',
        'unused-imports/no-unused-imports': 'off',
        '@typescript-eslint/no-duplicate-enum-values': 'off',

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
