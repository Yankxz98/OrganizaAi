module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',
      ['@babel/plugin-transform-runtime', {
        regenerator: true,
        helpers: true,
        useESModules: true
      }],
      ['@babel/plugin-transform-modules-commonjs', {
        allowTopLevelThis: true
      }],
      ['@babel/plugin-transform-arrow-functions', {
        spec: true
      }],
      'react-native-reanimated/plugin',
      ['babel-plugin-transform-inline-environment-variables', {
        include: ['NODE_ENV', 'EXPO_PUBLIC_*']
      }],
      ['babel-plugin-transform-remove-console', {
        exclude: ['error', 'warn']
      }],
      'babel-plugin-transform-remove-debugger'
    ],
    env: {
      development: {
        plugins: [
          ['babel-plugin-transform-remove-console', {
            exclude: ['error', 'warn', 'info']
          }]
        ]
      },
      production: {
        plugins: [
          ['babel-plugin-transform-remove-console', {
            exclude: ['error']
          }],
          'babel-plugin-transform-remove-debugger'
        ]
      }
    }
  };
}; 