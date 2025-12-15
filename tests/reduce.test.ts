import { describe, it, expect, beforeAll } from "vitest";
import * as path from "path";
import {
  analyzeDirectory,
  generateReport,
  type AnalysisResult,
} from "../src/reduce";

describe("reduce functionality", () => {
  describe("simple-reduce fixtures", () => {
    const fixturesPath = path.join(__dirname, "fixtures", "simple-reduce");

    describe("with typeAware: true", () => {
      let results: AnalysisResult;

      beforeAll(async () => {
        results = await analyzeDirectory(fixturesPath, { typeAware: true });
      });

      it("should find common rules that can be removed", () => {
        expect(results).toMatchInlineSnapshot(`
          {
            "analyzedOxlintConfigs": [
              "tests/fixtures/simple-reduce/.oxlintrc.json",
              "tests/fixtures/simple-reduce/client/.oxlintrc.json",
            ],
            "eslintConfigsWithoutOxlint": [],
            "results": [
              {
                "eslintConfigPath": "tests/fixtures/simple-reduce/.eslintrc.js",
                "inheritedRulesToDisable": [
                  "constructor-super",
                  "for-direction",
                  "no-async-promise-executor",
                  "no-class-assign",
                  "no-compare-neg-zero",
                  "no-cond-assign",
                  "no-const-assign",
                  "no-constant-condition",
                  "no-control-regex",
                  "no-debugger",
                  "no-delete-var",
                  "no-dupe-class-members",
                  "no-dupe-else-if",
                  "no-dupe-keys",
                  "no-duplicate-case",
                  "no-empty-character-class",
                  "no-empty-pattern",
                  "no-ex-assign",
                  "no-extra-boolean-cast",
                  "no-func-assign",
                  "no-global-assign",
                  "no-import-assign",
                  "no-invalid-regexp",
                  "no-irregular-whitespace",
                  "no-loss-of-precision",
                  "no-nonoctal-decimal-escape",
                  "no-obj-calls",
                  "no-regex-spaces",
                  "no-self-assign",
                  "no-setter-return",
                  "no-shadow-restricted-names",
                  "no-sparse-arrays",
                  "no-this-before-super",
                  "no-unsafe-finally",
                  "no-unsafe-negation",
                  "no-unsafe-optional-chaining",
                  "no-unused-labels",
                  "no-useless-backreference",
                  "no-useless-catch",
                  "no-useless-escape",
                  "no-with",
                  "require-yield",
                  "use-isnan",
                  "valid-typeof",
                ],
                "oxlintConfigPath": "tests/fixtures/simple-reduce/.oxlintrc.json",
                "pluginsToDisable": [],
                "redundantOffRules": [],
                "rulesToRemove": [
                  "no-unused-vars",
                  "no-console",
                  "no-empty",
                  "curly",
                  "default-case",
                ],
                "summary": {
                  "inheritedToDisable": 44,
                  "redundantOff": 0,
                  "toRemove": 5,
                  "totalEslintRules": 10,
                },
                "unsupportedRules": [
                  "prefer-const",
                  "no-duplicate-imports",
                  "eqeqeq",
                  "no-undef",
                  "no-magic-numbers",
                  "getter-return",
                  "no-case-declarations",
                  "no-dupe-args",
                  "no-extra-semi",
                  "no-fallthrough",
                  "no-inner-declarations",
                  "no-misleading-character-class",
                  "no-mixed-spaces-and-tabs",
                  "no-new-symbol",
                  "no-octal",
                  "no-prototype-builtins",
                  "no-redeclare",
                  "no-unexpected-multiline",
                  "no-unreachable",
                ],
              },
              {
                "eslintConfigPath": "tests/fixtures/simple-reduce/client/.eslintrc.js",
                "inheritedRulesToDisable": [
                  "no-unused-vars",
                  "no-empty",
                  "curly",
                  "default-case",
                  "constructor-super",
                  "for-direction",
                  "no-async-promise-executor",
                  "no-class-assign",
                  "no-compare-neg-zero",
                  "no-cond-assign",
                  "no-const-assign",
                  "no-constant-condition",
                  "no-control-regex",
                  "no-debugger",
                  "no-delete-var",
                  "no-dupe-class-members",
                  "no-dupe-else-if",
                  "no-dupe-keys",
                  "no-duplicate-case",
                  "no-empty-character-class",
                  "no-empty-pattern",
                  "no-ex-assign",
                  "no-extra-boolean-cast",
                  "no-func-assign",
                  "no-global-assign",
                  "no-import-assign",
                  "no-invalid-regexp",
                  "no-irregular-whitespace",
                  "no-loss-of-precision",
                  "no-nonoctal-decimal-escape",
                  "no-obj-calls",
                  "no-regex-spaces",
                  "no-self-assign",
                  "no-setter-return",
                  "no-shadow-restricted-names",
                  "no-sparse-arrays",
                  "no-this-before-super",
                  "no-unsafe-finally",
                  "no-unsafe-negation",
                  "no-unsafe-optional-chaining",
                  "no-unused-labels",
                  "no-useless-backreference",
                  "no-useless-catch",
                  "no-useless-escape",
                  "no-with",
                  "require-yield",
                  "use-isnan",
                  "valid-typeof",
                ],
                "oxlintConfigPath": "tests/fixtures/simple-reduce/client/.oxlintrc.json",
                "pluginsToDisable": [],
                "redundantOffRules": [],
                "rulesToRemove": [
                  "no-alert",
                ],
                "summary": {
                  "inheritedToDisable": 48,
                  "redundantOff": 0,
                  "toRemove": 1,
                  "totalEslintRules": 2,
                },
                "unsupportedRules": [
                  "prefer-const",
                  "no-duplicate-imports",
                  "eqeqeq",
                  "no-undef",
                  "no-magic-numbers",
                  "getter-return",
                  "no-case-declarations",
                  "no-dupe-args",
                  "no-extra-semi",
                  "no-fallthrough",
                  "no-inner-declarations",
                  "no-misleading-character-class",
                  "no-mixed-spaces-and-tabs",
                  "no-new-symbol",
                  "no-octal",
                  "no-prototype-builtins",
                  "no-redeclare",
                  "no-unexpected-multiline",
                  "no-unreachable",
                ],
              },
            ],
            "unsupportedRulesNotInOxlint": [
              "eqeqeq",
              "getter-return",
              "no-case-declarations",
              "no-dupe-args",
              "no-duplicate-imports",
              "no-extra-semi",
              "no-fallthrough",
              "no-inner-declarations",
              "no-magic-numbers",
              "no-misleading-character-class",
              "no-mixed-spaces-and-tabs",
              "no-new-symbol",
              "no-octal",
              "no-prototype-builtins",
              "no-redeclare",
              "no-undef",
              "no-unexpected-multiline",
              "no-unreachable",
              "prefer-const",
            ],
          }
        `);
      });

      it("should generate a report", () => {
        const report = generateReport(results);
        expect(report).toMatchInlineSnapshot(`
          "Found 6 ESLint rule(s) to remove across 2 config(s):

          tests/fixtures/simple-reduce/.eslintrc.js
            "curly": "off",
            "default-case": "off",
            "no-console": "off",
            "no-empty": "off",
            "no-unused-vars": "off",

          tests/fixtures/simple-reduce/client/.eslintrc.js
            "no-alert": "off",


          Found 44 inherited ESLint rule(s) to disable (from extends, now handled by Oxlint):

          tests/fixtures/simple-reduce/.eslintrc.js
            "constructor-super": "off",
            "for-direction": "off",
            "no-async-promise-executor": "off",
            "no-class-assign": "off",
            "no-compare-neg-zero": "off",
            "no-cond-assign": "off",
            "no-const-assign": "off",
            "no-constant-condition": "off",
            "no-control-regex": "off",
            "no-debugger": "off",
            "no-delete-var": "off",
            "no-dupe-class-members": "off",
            "no-dupe-else-if": "off",
            "no-dupe-keys": "off",
            "no-duplicate-case": "off",
            "no-empty-character-class": "off",
            "no-empty-pattern": "off",
            "no-ex-assign": "off",
            "no-extra-boolean-cast": "off",
            "no-func-assign": "off",
            "no-global-assign": "off",
            "no-import-assign": "off",
            "no-invalid-regexp": "off",
            "no-irregular-whitespace": "off",
            "no-loss-of-precision": "off",
            "no-nonoctal-decimal-escape": "off",
            "no-obj-calls": "off",
            "no-regex-spaces": "off",
            "no-self-assign": "off",
            "no-setter-return": "off",
            "no-shadow-restricted-names": "off",
            "no-sparse-arrays": "off",
            "no-this-before-super": "off",
            "no-unsafe-finally": "off",
            "no-unsafe-negation": "off",
            "no-unsafe-optional-chaining": "off",
            "no-unused-labels": "off",
            "no-useless-backreference": "off",
            "no-useless-catch": "off",
            "no-useless-escape": "off",
            "no-with": "off",
            "require-yield": "off",
            "use-isnan": "off",
            "valid-typeof": "off",


          ESLint rules still needed (not covered by current Oxlint config):
            eqeqeq
            getter-return
            no-case-declarations
            no-dupe-args
            no-duplicate-imports
            no-extra-semi
            no-fallthrough
            no-inner-declarations
            no-magic-numbers
            no-misleading-character-class
            no-mixed-spaces-and-tabs
            no-new-symbol
            no-octal
            no-prototype-builtins
            no-redeclare
            no-undef
            no-unexpected-multiline
            no-unreachable
            prefer-const
          "
        `);
      });
    });

    describe("with typeAware: false", () => {
      let results: AnalysisResult;

      beforeAll(async () => {
        results = await analyzeDirectory(fixturesPath, { typeAware: false });
      });

      it("should find the same rules (no type-aware rules in simple fixtures)", () => {
        // Simple fixtures don't have type-aware rules, so results should be the same
        expect(results.results[0].rulesToRemove).toEqual([
          "no-unused-vars",
          "no-console",
          "no-empty",
          "curly",
          "default-case",
        ]);
      });
    });
  });

  describe("comprehensive reduce fixtures", () => {
    const fixturesPath = path.join(__dirname, "fixtures", "reduce");

    describe("with typeAware: true", () => {
      let results: AnalysisResult;

      beforeAll(async () => {
        results = await analyzeDirectory(fixturesPath, { typeAware: true });
      });

      it("should find rules that can be removed including type-aware rules", () => {
        expect(results).toMatchInlineSnapshot(`
          {
            "analyzedOxlintConfigs": [
              "tests/fixtures/reduce/.oxlintrc.json",
              "tests/fixtures/reduce/api/.oxlintrc.json",
              "tests/fixtures/reduce/client/.oxlintrc.json",
            ],
            "eslintConfigsWithoutOxlint": [],
            "results": [
              {
                "eslintConfigPath": "tests/fixtures/reduce/.eslintrc.js",
                "inheritedRulesToDisable": [
                  "@typescript-eslint/no-extra-non-null-assertion",
                  "@typescript-eslint/no-non-null-asserted-optional-chain",
                  "@typescript-eslint/no-this-alias",
                  "@typescript-eslint/no-unnecessary-type-constraint",
                  "@typescript-eslint/no-unsafe-declaration-merging",
                  "@typescript-eslint/prefer-as-const",
                  "@typescript-eslint/triple-slash-reference",
                  "for-direction",
                  "no-async-promise-executor",
                  "no-class-assign",
                  "no-compare-neg-zero",
                  "no-cond-assign",
                  "no-const-assign",
                  "no-delete-var",
                  "no-dupe-class-members",
                  "no-dupe-else-if",
                  "no-dupe-keys",
                  "no-duplicate-case",
                  "no-empty-character-class",
                  "no-empty-pattern",
                  "no-ex-assign",
                  "no-fallthrough",
                  "no-func-assign",
                  "no-global-assign",
                  "no-import-assign",
                  "no-invalid-regexp",
                  "no-irregular-whitespace",
                  "no-nonoctal-decimal-escape",
                  "no-obj-calls",
                  "no-regex-spaces",
                  "no-self-assign",
                  "no-setter-return",
                  "no-shadow-restricted-names",
                  "no-sparse-arrays",
                  "no-this-before-super",
                  "no-unsafe-finally",
                  "no-unsafe-negation",
                  "no-unsafe-optional-chaining",
                  "no-useless-backreference",
                  "no-useless-catch",
                  "no-with",
                  "require-yield",
                  "use-isnan",
                  "valid-typeof",
                ],
                "oxlintConfigPath": "tests/fixtures/reduce/.oxlintrc.json",
                "pluginsToDisable": [],
                "redundantOffRules": [
                  "@typescript-eslint/no-explicit-any",
                ],
                "rulesToRemove": [
                  "@typescript-eslint/array-type",
                  "@typescript-eslint/no-explicit-any",
                  "@typescript-eslint/no-floating-promises",
                  "@typescript-eslint/no-import-type-side-effects",
                  "@typescript-eslint/consistent-type-imports",
                  "@typescript-eslint/no-misused-new",
                  "@typescript-eslint/restrict-template-expressions",
                  "@typescript-eslint/no-duplicate-enum-values",
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
                  "react/jsx-no-target-blank",
                ],
                "summary": {
                  "inheritedToDisable": 44,
                  "redundantOff": 1,
                  "toRemove": 21,
                  "totalEslintRules": 87,
                },
                "unsupportedRules": [
                  "@typescript-eslint/dot-notation",
                  "@typescript-eslint/explicit-member-accessibility",
                  "@typescript-eslint/no-empty-function",
                  "@typescript-eslint/no-misused-promises",
                  "@typescript-eslint/consistent-type-exports",
                  "@typescript-eslint/no-var-requires",
                  "@typescript-eslint/unified-signatures",
                  "unused-imports/no-unused-vars",
                  "@typescript-eslint/no-shadow",
                  "@typescript-eslint/tslint/config",
                  "constructor-super",
                  "id-denylist",
                  "id-match",
                  "no-undef-init",
                  "object-shorthand",
                  "no-sequences",
                  "import/no-restricted-paths",
                  "jsdoc/require-jsdoc",
                  "react/jsx-uses-vars",
                  "react/jsx-uses-react",
                  "react-hooks/rules-of-hooks",
                  "no-restricted-imports",
                  "import/no-cycle",
                  "lodash/import-scope",
                  "import/order",
                  "node/no-process-env",
                  "@tanstack/query/exhaustive-deps",
                  "@tanstack/query/no-rest-destructuring",
                  "@tanstack/query/stable-query-client",
                  "@tanstack/query/no-unstable-deps",
                  "@typescript-eslint/no-array-constructor",
                  "@typescript-eslint/no-loss-of-precision",
                  "getter-return",
                  "no-dupe-args",
                  "no-misleading-character-class",
                  "no-new-symbol",
                  "no-octal",
                  "no-undef",
                  "no-unreachable",
                ],
              },
              {
                "eslintConfigPath": "tests/fixtures/reduce/api/.eslintrc.js",
                "inheritedRulesToDisable": [
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
                  "@typescript-eslint/no-explicit-any",
                  "@typescript-eslint/no-floating-promises",
                  "@typescript-eslint/no-misused-new",
                  "@typescript-eslint/restrict-template-expressions",
                  "@typescript-eslint/no-duplicate-enum-values",
                  "react/jsx-no-target-blank",
                  "@typescript-eslint/no-extra-non-null-assertion",
                  "@typescript-eslint/no-non-null-asserted-optional-chain",
                  "@typescript-eslint/no-unnecessary-type-constraint",
                  "@typescript-eslint/no-unsafe-declaration-merging",
                  "@typescript-eslint/prefer-as-const",
                  "@typescript-eslint/triple-slash-reference",
                  "for-direction",
                  "no-async-promise-executor",
                  "no-class-assign",
                  "no-compare-neg-zero",
                  "no-cond-assign",
                  "no-const-assign",
                  "no-delete-var",
                  "no-dupe-class-members",
                  "no-dupe-else-if",
                  "no-dupe-keys",
                  "no-duplicate-case",
                  "no-empty-character-class",
                  "no-empty-pattern",
                  "no-ex-assign",
                  "no-fallthrough",
                  "no-func-assign",
                  "no-global-assign",
                  "no-import-assign",
                  "no-invalid-regexp",
                  "no-irregular-whitespace",
                  "no-nonoctal-decimal-escape",
                  "no-obj-calls",
                  "no-regex-spaces",
                  "no-self-assign",
                  "no-setter-return",
                  "no-shadow-restricted-names",
                  "no-sparse-arrays",
                  "no-this-before-super",
                  "no-unsafe-finally",
                  "no-unsafe-negation",
                  "no-useless-backreference",
                  "no-useless-catch",
                  "no-with",
                  "require-yield",
                  "use-isnan",
                  "valid-typeof",
                ],
                "oxlintConfigPath": "tests/fixtures/reduce/api/.oxlintrc.json",
                "pluginsToDisable": [
                  "jest",
                ],
                "redundantOffRules": [
                  "@typescript-eslint/no-explicit-any",
                ],
                "rulesToRemove": [
                  "jest/no-focused-tests",
                  "jest/no-identical-title",
                  "no-restricted-imports",
                ],
                "summary": {
                  "inheritedToDisable": 61,
                  "redundantOff": 1,
                  "toRemove": 3,
                  "totalEslintRules": 19,
                },
                "unsupportedRules": [
                  "linear-app/no-native-fetch",
                  "linear-app/no-voiding-entity-save",
                  "linear-app/ensure-column-field-property-match",
                  "linear-app/check-gql-context",
                  "linear-app/ensure-batch-loader-on-relations",
                  "linear-app/no-many-to-one-access",
                  "linear-app/no-outer-context",
                  "no-restricted-syntax",
                  "linear-app/no-batch-loader",
                  "@typescript-eslint/tslint/config",
                  "constructor-super",
                  "id-denylist",
                  "id-match",
                  "no-undef-init",
                  "object-shorthand",
                  "no-sequences",
                  "import/no-restricted-paths",
                  "jsdoc/require-jsdoc",
                  "@typescript-eslint/dot-notation",
                  "@typescript-eslint/explicit-member-accessibility",
                  "@typescript-eslint/no-empty-function",
                  "@typescript-eslint/no-misused-promises",
                  "@typescript-eslint/unified-signatures",
                  "unused-imports/no-unused-vars",
                  "@typescript-eslint/no-shadow",
                  "react/jsx-uses-vars",
                  "react/jsx-uses-react",
                  "import/no-cycle",
                  "lodash/import-scope",
                  "import/order",
                  "@tanstack/query/exhaustive-deps",
                  "@tanstack/query/no-rest-destructuring",
                  "@tanstack/query/stable-query-client",
                  "@tanstack/query/no-unstable-deps",
                  "@typescript-eslint/no-array-constructor",
                  "@typescript-eslint/no-loss-of-precision",
                  "@typescript-eslint/no-this-alias",
                  "getter-return",
                  "no-dupe-args",
                  "no-misleading-character-class",
                  "no-new-symbol",
                  "no-octal",
                  "no-undef",
                  "no-unreachable",
                  "no-unsafe-optional-chaining",
                ],
              },
              {
                "eslintConfigPath": "tests/fixtures/reduce/client/.eslintrc.js",
                "inheritedRulesToDisable": [
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
                  "@typescript-eslint/no-explicit-any",
                  "@typescript-eslint/no-floating-promises",
                  "@typescript-eslint/no-import-type-side-effects",
                  "@typescript-eslint/consistent-type-imports",
                  "@typescript-eslint/no-misused-new",
                  "@typescript-eslint/restrict-template-expressions",
                  "@typescript-eslint/no-duplicate-enum-values",
                  "react/jsx-no-target-blank",
                  "@typescript-eslint/no-extra-non-null-assertion",
                  "@typescript-eslint/no-non-null-asserted-optional-chain",
                  "@typescript-eslint/no-unnecessary-type-constraint",
                  "@typescript-eslint/no-unsafe-declaration-merging",
                  "@typescript-eslint/prefer-as-const",
                  "@typescript-eslint/triple-slash-reference",
                  "for-direction",
                  "no-async-promise-executor",
                  "no-class-assign",
                  "no-compare-neg-zero",
                  "no-cond-assign",
                  "no-const-assign",
                  "no-delete-var",
                  "no-dupe-class-members",
                  "no-dupe-else-if",
                  "no-dupe-keys",
                  "no-duplicate-case",
                  "no-empty-character-class",
                  "no-empty-pattern",
                  "no-ex-assign",
                  "no-fallthrough",
                  "no-func-assign",
                  "no-global-assign",
                  "no-import-assign",
                  "no-invalid-regexp",
                  "no-irregular-whitespace",
                  "no-nonoctal-decimal-escape",
                  "no-obj-calls",
                  "no-regex-spaces",
                  "no-self-assign",
                  "no-setter-return",
                  "no-shadow-restricted-names",
                  "no-sparse-arrays",
                  "no-this-before-super",
                  "no-unsafe-finally",
                  "no-unsafe-negation",
                  "no-unsafe-optional-chaining",
                  "no-useless-backreference",
                  "no-useless-catch",
                  "no-with",
                  "require-yield",
                  "use-isnan",
                  "valid-typeof",
                ],
                "oxlintConfigPath": "tests/fixtures/reduce/client/.oxlintrc.json",
                "pluginsToDisable": [],
                "redundantOffRules": [
                  "@typescript-eslint/no-explicit-any",
                ],
                "rulesToRemove": [
                  "no-restricted-globals",
                  "no-restricted-imports",
                ],
                "summary": {
                  "inheritedToDisable": 64,
                  "redundantOff": 1,
                  "toRemove": 2,
                  "totalEslintRules": 7,
                },
                "unsupportedRules": [
                  "no-restricted-syntax",
                  "linear-app/no-three-dots",
                  "linear-app/no-anonymous-observer",
                  "linear-app/check-property-decorator",
                  "linear-app/svg-jsx-camel-case-attributes",
                  "constructor-super",
                  "id-denylist",
                  "id-match",
                  "no-undef-init",
                  "object-shorthand",
                  "no-sequences",
                  "import/no-restricted-paths",
                  "jsdoc/require-jsdoc",
                  "@typescript-eslint/dot-notation",
                  "@typescript-eslint/explicit-member-accessibility",
                  "@typescript-eslint/no-empty-function",
                  "@typescript-eslint/no-misused-promises",
                  "@typescript-eslint/consistent-type-exports",
                  "@typescript-eslint/unified-signatures",
                  "unused-imports/no-unused-vars",
                  "@typescript-eslint/no-shadow",
                  "@typescript-eslint/tslint/config",
                  "react/jsx-uses-vars",
                  "react/jsx-uses-react",
                  "react-hooks/rules-of-hooks",
                  "import/no-cycle",
                  "lodash/import-scope",
                  "import/order",
                  "@tanstack/query/exhaustive-deps",
                  "@tanstack/query/no-rest-destructuring",
                  "@tanstack/query/stable-query-client",
                  "@tanstack/query/no-unstable-deps",
                  "@typescript-eslint/no-array-constructor",
                  "@typescript-eslint/no-loss-of-precision",
                  "@typescript-eslint/no-this-alias",
                  "getter-return",
                  "no-dupe-args",
                  "no-misleading-character-class",
                  "no-new-symbol",
                  "no-octal",
                  "no-undef",
                  "no-unreachable",
                ],
              },
            ],
            "unsupportedRulesNotInOxlint": [
              "@tanstack/query/exhaustive-deps",
              "@tanstack/query/no-rest-destructuring",
              "@tanstack/query/no-unstable-deps",
              "@tanstack/query/stable-query-client",
              "@typescript-eslint/consistent-type-exports",
              "@typescript-eslint/dot-notation",
              "@typescript-eslint/explicit-member-accessibility",
              "@typescript-eslint/no-array-constructor",
              "@typescript-eslint/no-empty-function",
              "@typescript-eslint/no-loss-of-precision",
              "@typescript-eslint/no-misused-promises",
              "@typescript-eslint/no-shadow",
              "@typescript-eslint/no-this-alias",
              "@typescript-eslint/no-var-requires",
              "@typescript-eslint/tslint/config",
              "@typescript-eslint/unified-signatures",
              "constructor-super",
              "getter-return",
              "id-denylist",
              "id-match",
              "import/no-cycle",
              "import/no-restricted-paths",
              "import/order",
              "jsdoc/require-jsdoc",
              "linear-app/check-gql-context",
              "linear-app/check-property-decorator",
              "linear-app/ensure-batch-loader-on-relations",
              "linear-app/ensure-column-field-property-match",
              "linear-app/no-anonymous-observer",
              "linear-app/no-batch-loader",
              "linear-app/no-many-to-one-access",
              "linear-app/no-native-fetch",
              "linear-app/no-outer-context",
              "linear-app/no-three-dots",
              "linear-app/no-voiding-entity-save",
              "linear-app/svg-jsx-camel-case-attributes",
              "lodash/import-scope",
              "no-dupe-args",
              "no-misleading-character-class",
              "no-new-symbol",
              "no-octal",
              "no-restricted-imports",
              "no-restricted-syntax",
              "no-sequences",
              "no-undef",
              "no-undef-init",
              "no-unreachable",
              "no-unsafe-optional-chaining",
              "node/no-process-env",
              "object-shorthand",
              "react-hooks/rules-of-hooks",
              "react/jsx-uses-react",
              "react/jsx-uses-vars",
              "unused-imports/no-unused-vars",
            ],
          }
        `);
      });

      it("should include type-aware rule no-floating-promises", () => {
        const mainResult = results.results[0];
        expect(mainResult.rulesToRemove).toContain(
          "@typescript-eslint/no-floating-promises"
        );
      });

      it("should generate a comprehensive report", () => {
        const report = generateReport(results);
        expect(report).toMatchInlineSnapshot(`
          "Plugins that can be fully disabled (all rules handled by Oxlint):
            jest

          Found 24 ESLint rule(s) to remove across 3 config(s):

          tests/fixtures/reduce/.eslintrc.js
            "@typescript-eslint/array-type": "off",
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

          tests/fixtures/reduce/api/.eslintrc.js
            "no-restricted-imports": "off",

          tests/fixtures/reduce/client/.eslintrc.js
            "no-restricted-globals": "off",
            "no-restricted-imports": "off",


          Found 44 inherited ESLint rule(s) to disable (from extends, now handled by Oxlint):

          tests/fixtures/reduce/.eslintrc.js
            "@typescript-eslint/no-extra-non-null-assertion": "off",
            "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
            "@typescript-eslint/no-this-alias": "off",
            "@typescript-eslint/no-unnecessary-type-constraint": "off",
            "@typescript-eslint/no-unsafe-declaration-merging": "off",
            "@typescript-eslint/prefer-as-const": "off",
            "@typescript-eslint/triple-slash-reference": "off",
            "for-direction": "off",
            "no-async-promise-executor": "off",
            "no-class-assign": "off",
            "no-compare-neg-zero": "off",
            "no-cond-assign": "off",
            "no-const-assign": "off",
            "no-delete-var": "off",
            "no-dupe-class-members": "off",
            "no-dupe-else-if": "off",
            "no-dupe-keys": "off",
            "no-duplicate-case": "off",
            "no-empty-character-class": "off",
            "no-empty-pattern": "off",
            "no-ex-assign": "off",
            "no-fallthrough": "off",
            "no-func-assign": "off",
            "no-global-assign": "off",
            "no-import-assign": "off",
            "no-invalid-regexp": "off",
            "no-irregular-whitespace": "off",
            "no-nonoctal-decimal-escape": "off",
            "no-obj-calls": "off",
            "no-regex-spaces": "off",
            "no-self-assign": "off",
            "no-setter-return": "off",
            "no-shadow-restricted-names": "off",
            "no-sparse-arrays": "off",
            "no-this-before-super": "off",
            "no-unsafe-finally": "off",
            "no-unsafe-negation": "off",
            "no-unsafe-optional-chaining": "off",
            "no-useless-backreference": "off",
            "no-useless-catch": "off",
            "no-with": "off",
            "require-yield": "off",
            "use-isnan": "off",
            "valid-typeof": "off",


          Found 3 redundant "off" rule(s) that can be removed (already disabled by parent):

          tests/fixtures/reduce/.eslintrc.js
            "@typescript-eslint/no-explicit-any": "off",  <- can be removed

          tests/fixtures/reduce/api/.eslintrc.js
            "@typescript-eslint/no-explicit-any": "off",  <- can be removed

          tests/fixtures/reduce/client/.eslintrc.js
            "@typescript-eslint/no-explicit-any": "off",  <- can be removed


          ESLint rules still needed (not covered by current Oxlint config):
            @tanstack/query/exhaustive-deps
            @tanstack/query/no-rest-destructuring
            @tanstack/query/no-unstable-deps
            @tanstack/query/stable-query-client
            @typescript-eslint/consistent-type-exports
            @typescript-eslint/dot-notation
            @typescript-eslint/explicit-member-accessibility
            @typescript-eslint/no-array-constructor
            @typescript-eslint/no-empty-function
            @typescript-eslint/no-loss-of-precision
            @typescript-eslint/no-misused-promises
            @typescript-eslint/no-shadow
            @typescript-eslint/no-this-alias
            @typescript-eslint/no-var-requires
            @typescript-eslint/tslint/config
            @typescript-eslint/unified-signatures
            constructor-super
            getter-return
            id-denylist
            id-match
            import/no-cycle
            import/no-restricted-paths
            import/order
            jsdoc/require-jsdoc
            linear-app/check-gql-context
            linear-app/check-property-decorator
            linear-app/ensure-batch-loader-on-relations
            linear-app/ensure-column-field-property-match
            linear-app/no-anonymous-observer
            linear-app/no-batch-loader
            linear-app/no-many-to-one-access
            linear-app/no-native-fetch
            linear-app/no-outer-context
            linear-app/no-three-dots
            linear-app/no-voiding-entity-save
            linear-app/svg-jsx-camel-case-attributes
            lodash/import-scope
            no-dupe-args
            no-misleading-character-class
            no-new-symbol
            no-octal
            no-restricted-imports
            no-restricted-syntax
            no-sequences
            no-undef
            no-undef-init
            no-unreachable
            no-unsafe-optional-chaining
            node/no-process-env
            object-shorthand
            react-hooks/rules-of-hooks
            react/jsx-uses-react
            react/jsx-uses-vars
            unused-imports/no-unused-vars
          "
        `);
      });
    });

    describe("with typeAware: false", () => {
      let results: AnalysisResult;

      beforeAll(async () => {
        results = await analyzeDirectory(fixturesPath, { typeAware: false });
      });

      it("should exclude type-aware rules from removal suggestions", () => {
        const mainResult = results.results[0];
        // no-floating-promises is a type-aware rule and should be excluded
        expect(mainResult.rulesToRemove).not.toContain(
          "@typescript-eslint/no-floating-promises"
        );
        // restrict-template-expressions is also type-aware
        expect(mainResult.rulesToRemove).not.toContain(
          "@typescript-eslint/restrict-template-expressions"
        );
      });

      it("should still include non-type-aware rules", () => {
        const mainResult = results.results[0];
        // These are not type-aware rules
        expect(mainResult.rulesToRemove).toContain("curly");
        expect(mainResult.rulesToRemove).toContain("no-console");
        expect(mainResult.rulesToRemove).toContain(
          "@typescript-eslint/array-type"
        );
      });

      it("should have fewer rules to remove than typeAware: true", async () => {
        const typeAwareResults = await analyzeDirectory(fixturesPath, {
          typeAware: true,
        });
        const mainResultWithTypeAware = typeAwareResults.results[0];
        const mainResultWithoutTypeAware = results.results[0];

        expect(mainResultWithoutTypeAware.rulesToRemove.length).toBeLessThan(
          mainResultWithTypeAware.rulesToRemove.length
        );
      });
    });
  });
});
