// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const bufferPolyfillPath = path.resolve(__dirname, 'src/utils/bufferPolyfill.js');

// Intercept Node standard library "buffer" imports from third-party libraries (e.g. react-native-svg)
// and map them directly to our self-contained buffer polyfill
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'buffer' || moduleName === 'node:buffer') {
    return {
      filePath: bufferPolyfillPath,
      type: 'sourceFile',
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
