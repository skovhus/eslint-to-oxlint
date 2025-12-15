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
                  "toRemove": 21,
                  "totalEslintRules": 87,
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
          "Found 28 ESLint rule(s) to remove across 3 config(s):

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
            "@typescript-eslint/no-explicit-any": "off",
            "jest/no-focused-tests": "off",
            "jest/no-identical-title": "off",
            "no-restricted-imports": "off",

          tests/fixtures/reduce/client/.eslintrc.js
            "@typescript-eslint/no-explicit-any": "off",
            "no-restricted-globals": "off",
            "no-restricted-imports": "off",
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
