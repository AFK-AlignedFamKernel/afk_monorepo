module.exports = {
  '*.{js,ts,tsx,json,md,mdx,html,css,scss,yml}': 'prettier --write',
  '*.sol': 'prettier --write --plugin=prettier-plugin-solidity',
  '*.cairo': 'scarb fmt',
  '*.prisma': (stagedFiles) => stagedFiles.map((schema) => `prisma format --schema ${schema}`),
  '*.go': 'go fmt',
};
