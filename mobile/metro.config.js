// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for resolving src-mobile directory
config.resolver.sourceExts.push('tsx', 'ts', 'jsx', 'js');
config.watchFolders = [
  __dirname,
  path.resolve(__dirname, '../src-mobile'),
];

// Configure NativeWind
module.exports = withNativeWind(config, {
  input: path.resolve(__dirname, '../src-mobile/global.css'),
});
