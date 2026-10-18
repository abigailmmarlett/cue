// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
  {
    rules: {
      // New in SDK 58's config. The screens and sheets that load data in an effect get rewritten in
      // the cleanup phase, so this warns until then instead of failing the build.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
