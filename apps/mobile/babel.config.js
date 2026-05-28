// Reanimated 4 moves the Babel plugin to the react-native-worklets package.
// Using the old react-native-reanimated/plugin still works (it re-exports
// the plugin for backwards compatibility) but is deprecated and will be
// removed in a future Reanimated release. Use the canonical location instead.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};
