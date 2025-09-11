import { describe, it, expect, beforeAll } from "vitest";
import * as path from "path";
import {
  analyzeDirectory,
  generateReport,
  type ReduceResult,
} from "../src/reduce";

describe("reduce functionality", () => {
  describe("simple-reduce fixtures", () => {
    const fixturesPath = path.join(__dirname, "fixtures", "simple-reduce");
    let results: ReduceResult[];

    beforeAll(async () => {
      results = await analyzeDirectory(fixturesPath);
    });

    describe("analyzeDirectory", () => {
      it("should find common rules that can be removed", () => {
        expect(results).toMatchInlineSnapshot(`
        [
          {
            "eslintConfigPath": "tests/fixtures/simple-reduce/.eslintrc.js",
            "oxlintConfigPath": "tests/fixtures/simple-reduce/.oxlintrc.json",
            "rulesToRemove": [
              "no-unused-vars",
              "no-console",
              "no-empty",
              "curly",
              "default-case",
            ],
            "summary": {
              "toRemove": 5,
              "totalEslintRules": 10,
            },
          },
          {
            "eslintConfigPath": "tests/fixtures/simple-reduce/client/.eslintrc.js",
            "oxlintConfigPath": "tests/fixtures/simple-reduce/client/.oxlintrc.json",
            "rulesToRemove": [
              "no-alert",
            ],
            "summary": {
              "toRemove": 1,
              "totalEslintRules": 2,
            },
          },
        ]
        `);
      });
    });

    describe("generateReport", () => {
      it("should generate a report", () => {
        const report = generateReport(results);
        expect(report).toMatchInlineSnapshot(`
          "# ESLint to Oxlint Reduction Analysis

          ## Summary

          - **Configurations analyzed**: 2
          - **Rules recommended for removal**: 6

          ## tests/fixtures/simple-reduce/.eslintrc.js

          **Oxlint config**: tests/fixtures/simple-reduce/.oxlintrc.json

          ### Rules to Remove (5)

          The following rules can be safely removed from ESLint as they are covered by Oxlint.

          Copy-paste this into your ESLint config to disable these rules:

          \`\`\`javascript
          {
            rules: {
              "curly": "off",
              "default-case": "off",
              "no-console": "off",
              "no-empty": "off",
              "no-unused-vars": "off",
            }
          }
          \`\`\`

          ## tests/fixtures/simple-reduce/client/.eslintrc.js

          **Oxlint config**: tests/fixtures/simple-reduce/client/.oxlintrc.json

          ### Rules to Remove (1)

          The following rules can be safely removed from ESLint as they are covered by Oxlint.

          Copy-paste this into your ESLint config to disable these rules:

          \`\`\`javascript
          {
            rules: {
              "no-alert": "off",
            }
          }
          \`\`\`

          "
        `);
      });
    });
  });

  describe("comprehensive reduce fixtures", () => {
    const fixturesPath = path.join(__dirname, "fixtures", "reduce");
    let results: ReduceResult[];

    beforeAll(async () => {
      results = await analyzeDirectory(fixturesPath);
    });

    describe("analyzeDirectory", () => {
      it("should find rules that can be removed", () => {
        expect(results).toMatchInlineSnapshot(`
          [
            {
              "eslintConfigPath": "tests/fixtures/reduce/.eslintrc.js",
              "oxlintConfigPath": "tests/fixtures/reduce/.oxlintrc.json",
              "rulesToRemove": [
                "curly",
                "default-case",
                "eqeqeq",
                "no-template-curly-in-string",
                "no-var",
                "no-caller",
                "no-console",
                "no-debugger",
                "no-duplicate-imports",
                "no-empty",
                "no-eval",
                "no-constant-condition",
                "@typescript-eslint/array-type",
                "@typescript-eslint/await-thenable",
                "@typescript-eslint/no-explicit-any",
                "@typescript-eslint/no-floating-promises",
                "@typescript-eslint/no-import-type-side-effects",
                "@typescript-eslint/consistent-type-imports",
                "@typescript-eslint/no-misused-new",
                "@typescript-eslint/restrict-template-expressions",
                "@typescript-eslint/no-duplicate-enum-values",
                "react/jsx-no-target-blank",
              ],
              "summary": {
                "toRemove": 22,
                "totalEslintRules": 88,
              },
            },
            {
              "eslintConfigPath": "tests/fixtures/reduce/api/.eslintrc.js",
              "oxlintConfigPath": "tests/fixtures/reduce/api/.oxlintrc.json",
              "rulesToRemove": [
                "jest/no-focused-tests",
                "jest/no-identical-title",
                "no-restricted-imports",
                "@typescript-eslint/no-explicit-any",
              ],
              "summary": {
                "toRemove": 4,
                "totalEslintRules": 22,
              },
            },
            {
              "eslintConfigPath": "tests/fixtures/reduce/client/.eslintrc.js",
              "oxlintConfigPath": "tests/fixtures/reduce/client/.oxlintrc.json",
              "rulesToRemove": [
                "no-restricted-globals",
                "no-restricted-imports",
                "@typescript-eslint/no-explicit-any",
              ],
              "summary": {
                "toRemove": 3,
                "totalEslintRules": 8,
              },
            },
          ]
        `);
      });
    });

    describe("generateReport", () => {
      it("should generate a comprehensive report", () => {
        const report = generateReport(results);
        expect(report).toMatchInlineSnapshot(`
          "# ESLint to Oxlint Reduction Analysis

          ## Summary

          - **Configurations analyzed**: 3
          - **Rules recommended for removal**: 29

          ## tests/fixtures/reduce/.eslintrc.js

          **Oxlint config**: tests/fixtures/reduce/.oxlintrc.json

          ### Rules to Remove (22)

          The following rules can be safely removed from ESLint as they are covered by Oxlint.

          Copy-paste this into your ESLint config to disable these rules:

          \`\`\`javascript
          {
            rules: {
              "@typescript-eslint/array-type": "off",
              "@typescript-eslint/await-thenable": "off",
              "@typescript-eslint/consistent-type-imports": "off",
              "@typescript-eslint/no-duplicate-enum-values": "off",
              "@typescript-eslint/no-explicit-any": "off",
              "@typescript-eslint/no-floating-promises": "off",
              "@typescript-eslint/no-import-type-side-effects": "off",
              "@typescript-eslint/no-misused-new": "off",
              "@typescript-eslint/restrict-template-expressions": "off",
              "curly": "off",
              "default-case": "off",
              "eqeqeq": "off",
              "no-caller": "off",
              "no-console": "off",
              "no-constant-condition": "off",
              "no-debugger": "off",
              "no-duplicate-imports": "off",
              "no-empty": "off",
              "no-eval": "off",
              "no-template-curly-in-string": "off",
              "no-var": "off",
              "react/jsx-no-target-blank": "off",
            }
          }
          \`\`\`

          ## tests/fixtures/reduce/api/.eslintrc.js

          **Oxlint config**: tests/fixtures/reduce/api/.oxlintrc.json

          ### Rules to Remove (4)

          The following rules can be safely removed from ESLint as they are covered by Oxlint.

          Copy-paste this into your ESLint config to disable these rules:

          \`\`\`javascript
          {
            rules: {
              "@typescript-eslint/no-explicit-any": "off",
              "jest/no-focused-tests": "off",
              "jest/no-identical-title": "off",
              "no-restricted-imports": "off",
            }
          }
          \`\`\`

          ## tests/fixtures/reduce/client/.eslintrc.js

          **Oxlint config**: tests/fixtures/reduce/client/.oxlintrc.json

          ### Rules to Remove (3)

          The following rules can be safely removed from ESLint as they are covered by Oxlint.

          Copy-paste this into your ESLint config to disable these rules:

          \`\`\`javascript
          {
            rules: {
              "@typescript-eslint/no-explicit-any": "off",
              "no-restricted-globals": "off",
              "no-restricted-imports": "off",
            }
          }
          \`\`\`

          "
        `);
      });
    });
  });
});
