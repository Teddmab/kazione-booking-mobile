module.exports = {
  extends: 'universe/native',
  ignorePatterns: ['node_modules/', '.expo/', 'dist/'],
  rules: {
    'prettier/prettier': 'off',
    // Allow `void asyncFn()` to intentionally discard promises in sync contexts
    'no-void': 'off',
  },
};
