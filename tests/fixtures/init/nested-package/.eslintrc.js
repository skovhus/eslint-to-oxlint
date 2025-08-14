module.exports = {
  extends: ['../.eslintrc.js'],
  rules: {
    'no-debugger': 'warn', // Override parent (was 'error')
    'no-alert': 'error',   // Override parent (was 'warn') 
    'eqeqeq': 'error',     // Additional rule
  },
  overrides: [
    {
      files: ['*.test.js', '*.spec.js'],
      rules: {
        'no-alert': 'off',  // Allow alerts in tests
        'eqeqeq': 'warn',   // Relax for tests
      },
    },
  ],
};