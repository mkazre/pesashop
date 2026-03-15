const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Exclude macOS resource fork files (._*) that appear on external volumes
config.resolver.blockList = [/\._[^/]+$/];

module.exports = config;
