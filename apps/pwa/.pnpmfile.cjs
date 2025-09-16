module.exports = {
  hooks: {
    readPackage(pkg) {
      // Ensure proper dependency resolution
      if (pkg.dependencies) {
        // Fix any potential dependency issues
        if (pkg.dependencies['@types/node']) {
          pkg.dependencies['@types/node'] = pkg.dependencies['@types/node'].replace(/^\^/, '');
        }
      }
      return pkg;
    }
  }
};
