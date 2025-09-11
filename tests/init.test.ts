import { describe, it, expect } from "vitest";
import { runTestScenario } from "./test-utils";

describe("init.ts", () => {
  it("should convert .eslintrc.js files with overrides and nested packages", () => {
    const result = runTestScenario();

    // Test the complete directory structure and file contents (should be unchanged)
    expect(result.directorySnapshot).toMatchInlineSnapshot(`
      "=== DIRECTORY STRUCTURE ===
      📄 .eslintrc.js
        └─ No content changes
      📄 .oxlintrc.json
        │
        └─ Content:
      {
        "plugins": [
          "oxc",
          "typescript",
          "unicorn"
        ],
        "rules": {
          "for-direction": "error",
          "getter-return": "error",
          "no-alert": "warn",
          "no-async-promise-executor": "error",
          "no-case-declarations": "error",
          "no-class-assign": "error",
          "no-compare-neg-zero": "error",
          "no-cond-assign": "error",
          "no-console": "warn",
          "no-const-assign": "error",
          "no-constant-binary-expression": "error",
          "no-constant-condition": "error",
          "no-control-regex": "error",
          "no-debugger": "error",
          "no-delete-var": "error",
          "no-dupe-class-members": "error",
          "no-dupe-else-if": "error",
          "no-dupe-keys": "error",
          "no-duplicate-case": "error",
          "no-empty": "error",
          "no-empty-character-class": "error",
          "no-empty-pattern": "error",
          "no-empty-static-block": "error",
          "no-ex-assign": "error",
          "no-extra-boolean-cast": "error",
          "no-fallthrough": "error",
          "no-func-assign": "error",
          "no-global-assign": "error",
          "no-import-assign": "error",
          "no-invalid-regexp": "error",
          "no-irregular-whitespace": "error",
          "no-loss-of-precision": "error",
          "no-new-native-nonconstructor": "error",
          "no-nonoctal-decimal-escape": "error",
          "no-obj-calls": "error",
          "no-prototype-builtins": "error",
          "no-redeclare": "error",
          "no-regex-spaces": "error",
          "no-self-assign": "error",
          "no-setter-return": "error",
          "no-shadow-restricted-names": "error",
          "no-sparse-arrays": "error",
          "no-this-before-super": "error",
          "no-undef": "error",
          "no-unexpected-multiline": "error",
          "no-unreachable": "error",
          "no-unsafe-finally": "error",
          "no-unsafe-negation": "error",
          "no-unsafe-optional-chaining": "error",
          "no-unused-labels": "error",
          "no-unused-private-class-members": "error",
          "no-unused-vars": "error",
          "no-useless-backreference": "error",
          "no-useless-catch": "error",
          "no-useless-escape": "error",
          "no-var": "error",
          "no-with": "error",
          "require-yield": "error",
          "use-isnan": "error",
          "valid-typeof": "error"
        },
        "overrides": [
          {
            "files": [
              "*.test.js",
              "*.spec.js"
            ],
            "rules": {
              "no-console": "off",
              "no-debugger": "off"
            }
          },
          {
            "files": [
              "src/**/*.js"
            ],
            "rules": {
              "no-unused-vars": "warn"
            }
          }
        ]
      }

      📄 eslint-8-to-oxlint-report.md
        │
        └─ Content:
      # ESLint to Oxlint Migration Report

      **Generated:** [TIMESTAMP]

      ## Overview

      Found 8 rule issues across 2 configuration files:
      - **3 duplicate rules** that should be disabled in ESLint to avoid conflicts with Oxlint
      - **5 conflicting rules** with different configurations between ESLint and Oxlint

      ## Summary by Configuration

      | Configuration | Duplicate Rules | Conflicting Rules | Total Issues |
      |---------------|----------------|-------------------|---------------|
      | \`.eslintrc.js\` | 2 | 3 | 5 |
      | \`nested-package/.eslintrc.js\` | 1 | 2 | 3 |

      ## .eslintrc.js

      ### Duplicate Rules (2)

      Remove these rules from \`.eslintrc.js\` (they're now handled by Oxlint):

      - \`no-alert\`
      - \`no-var\`

      ### Conflicting Rules (3)

      These rules have different configurations between ESLint and Oxlint:

      #### \`no-console\`

      - **ESLint:** severity \`warn\`
      - **Oxlint:** severity \`off\`

      #### \`no-debugger\`

      - **ESLint:** severity \`error\`
      - **Oxlint:** severity \`off\`

      #### \`no-unused-vars\`

      - **ESLint:** severity \`error\`
      - **Oxlint:** severity \`warn\`

      ## nested-package/.eslintrc.js

      ### Duplicate Rules (1)

      Remove these rules from \`nested-package/.eslintrc.js\` (they're now handled by Oxlint):

      - \`no-debugger\`

      ### Conflicting Rules (2)

      These rules have different configurations between ESLint and Oxlint:

      #### \`eqeqeq\`

      - **ESLint:** severity \`error\`
      - **Oxlint:** severity \`warn\`

      #### \`no-alert\`

      - **ESLint:** severity \`error\`
      - **Oxlint:** severity \`off\`

      ## Next Steps

      1. **Fix duplicates**: Remove duplicate rules from ESLint configurations as they're now handled by Oxlint
      2. **Resolve conflicts**: Decide which configuration to keep for conflicting rules and update accordingly
      3. **Test changes**: Verify that both ESLint and Oxlint work correctly after the changes
      4. **Clean up**: Remove this report file once all issues are resolved

      ---
      *This report was generated by the ESLint-to-Oxlint migration tool*


      📁 nested-package/
        📄 .eslintrc.js
          └─ No content changes
        📄 .oxlintrc.json
          │
          └─ Content:
        {
          "extends": [
            "../.oxlintrc.json"
          ],
          "rules": {
            "eqeqeq": "error",
            "no-alert": "error",
            "no-debugger": "warn"
          },
          "overrides": [
            {
              "files": [
                "*.test.js",
                "*.spec.js"
              ],
              "rules": {
                "eqeqeq": "warn",
                "no-alert": "off"
              }
            }
          ]
        }
        "
    `);
  });
});
