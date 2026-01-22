// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Force JSC (not Hermes) for web platform
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Override resolver for web platform and zustand CJS workaround
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: true,
  resolveRequest: (context, moduleName, platform) => {
    // Force zustand to use CommonJS version (ESM uses import.meta which Metro doesn't support)
    if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
      return {
        type: 'sourceFile',
        filePath: require.resolve(moduleName),
      };
    }

    // Use react-native-web for web platform
    if (platform === 'web' && moduleName === 'react-native') {
      return context.resolveRequest(context, 'react-native-web', platform);
    }

    // Stub out react-native-worklets on web (not supported)
    if (platform === 'web' && (moduleName === 'react-native-worklets' || moduleName.startsWith('react-native-worklets/'))) {
      return {
        type: 'empty',
      };
    }

    // Stub out react-native-video on web (depends on worklets)
    if (platform === 'web' && (moduleName === 'react-native-video' || moduleName.startsWith('react-native-video/'))) {
      return {
        type: 'empty',
      };
    }

    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
