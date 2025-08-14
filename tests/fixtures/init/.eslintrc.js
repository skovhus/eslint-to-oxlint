module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'error',
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-debugger': 'error',
    'no-alert': 'warn',
  },
  overrides: [
    {
      files: ['*.test.js', '*.spec.js'],
      rules: {
        'no-console': 'off',
        'no-debugger': 'off',
      },
    },
    {
      files: ['src/**/*.js'],
      rules: {
        'no-unused-vars': 'warn',
      },
    },
  ],
};