// eslint-disable-next-line no-undef
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:vue/essential',
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
  },
  plugins: [
    'vue',
  ],
  rules: {
    'vue/no-v-model-argument': 'off',
    'vue/no-v-for-template-key': 'off',
    'comma-dangle': ['error', 'always-multiline'],
  },
}
