module.exports = {
  extends: [
    'alloy'
  ],
  globals: {
    window: false,
    define: true
  },
  rules: {
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
        flatTernaryExpressions: true
      }
    ],
    semi: 0,
    complexity: [
      'error',
      {
        max: 30
      }
    ]
  }
};
