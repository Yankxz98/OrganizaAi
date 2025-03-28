const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  ...defaultConfig,
  maxWorkers: 4,
  transformer: {
    ...defaultConfig.transformer,
    babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
    assetPlugins: ['expo-asset/tools/hashAssetFiles'],
    minifierConfig: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    }
  },
  resolver: {
    ...defaultConfig.resolver,
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
    enableSymlinks: true,
    useWatchman: true
  },
  watchFolders: [__dirname]
};

module.exports = config; 