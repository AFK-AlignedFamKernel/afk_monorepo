/**
 * Script to restart Metro bundler and clear its cache
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Clear Metro's cache directories
console.log('Clearing Metro cache...');
try {
  // Try to clear cache directory if it exists
  const cacheDir = path.resolve(__dirname, '../node_modules/.cache/metro');
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log('Metro cache cleared successfully');
  } else {
    console.log('No Metro cache directory found to clear');
  }
} catch (error) {
  console.error('Failed to clear Metro cache:', error);
}

// Kill any running Metro processes
console.log('Stopping any running Metro processes...');
try {
  if (process.platform === 'win32') {
    execSync('taskkill /F /IM node.exe /FI "WINDOWTITLE eq Metro"', { stdio: 'ignore' });
  } else {
    execSync("pkill -f 'node.*metro'", { stdio: 'ignore' });
  }
  console.log('Metro processes stopped successfully');
} catch (error) {
  console.log('No Metro processes found to stop');
}

console.log('Metro bundler has been reset. Please restart your development server with:');
console.log('npm run dev'); 