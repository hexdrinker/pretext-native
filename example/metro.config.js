const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const monorepoRoot = path.resolve(__dirname, '..');

/**
 * Metro configuration for the monorepo example app.
 * Resolves pretext-native and @pretext-native/core from the workspace.
 */
const config = {
  watchFolders: [monorepoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
