/* eslint-env node */
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/* The pose model is a binary the native build loads as an asset.
   Metro treats unknown extensions as source and fails to parse it. */
config.resolver.assetExts.push('tflite', 'task');

module.exports = config;
