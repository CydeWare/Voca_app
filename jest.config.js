module.exports = {
  preset: '@react-native/jest-preset',
  // Jest resolves immer / react-redux to their ESM builds; point them at the CommonJS ones.
  moduleNameMapper: {
    '^immer$': '<rootDir>/node_modules/immer/dist/cjs/index.js',
    '^react-redux$': '<rootDir>/node_modules/react-redux/dist/cjs/index.js',
  },
};
