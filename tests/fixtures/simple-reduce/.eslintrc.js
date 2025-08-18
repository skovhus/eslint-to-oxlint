module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  rules: {
    // These rules should be removable as they're covered by oxlint
    "no-unused-vars": "error",
    "no-console": "warn",
    "prefer-const": "error",
    "no-empty": "error",
    "no-duplicate-imports": "error",
    curly: "error",
    "default-case": "error", // style
    eqeqeq: ["error", "always"], // pedantic

    // This rule has different config than oxlint (conflict)
    "no-undef": "warn",

    // This rule is not supported by oxlint
    "no-magic-numbers": "error",
  },
};
