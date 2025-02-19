module.exports = {
  extends: ['react-app'],
  overrides: [
    {
      files: ['**/*.ts?(x)'],
      rules: {
        'no-console': 'warn',
        '@typescript-eslint/no-unused-vars': 'warn'
      }
    }
  ]
};