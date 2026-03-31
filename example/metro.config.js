const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const monorepoRoot = path.resolve(__dirname, '..');

/**
 * Metro configuration for the monorepo example app.
 * Resolves pretext-native and @pretext-native/core from the workspace.
 * Forces single instances of react/react-native to avoid duplicate hook errors.
 */
const config = {
  watchFolders: [monorepoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    // Force single instances — prevents "Cannot read property 'useMemo' of null"
    extraNodeModules: {
      react: path.resolve(monorepoRoot, 'node_modules/react'),
      'react-native': path.resolve(monorepoRoot, 'node_modules/react-native'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
