/**
 * Babel helper for interopRequireDefault
 * This file provides the missing _interopRequireDefault function that's causing errors in Metro
 */

// Add the helper function to the global scope
if (typeof global._interopRequireDefault !== 'function') {
  global._interopRequireDefault = function(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  };
}

// Also add common babel helpers to avoid similar issues
if (typeof global._interopRequireWildcard !== 'function') {
  global._interopRequireWildcard = function(obj) {
    if (!obj) return {};
    
    var newObj = {};
    if (obj.__esModule) {
      return obj;
    }
    
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = obj[key];
      }
    }
    
    newObj.default = obj;
    return newObj;
  };
} 