require('@uniswap/eslint-config/load');

module.exports = {
  extends: ['next/core-web-vitals', '@uniswap/eslint-config/node'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
      rules: {
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
