import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  findESLintConfigs,
  hasRulesOrOverrides,
  parseRawESLintConfig,
  parseRawOxlintRules,
  loadOxlintConfig,
  findSupportedRules,
  normalizeSeverity,
  isSupportedByOxlint,
  type ESLintRule,
} from "../src/utils/config-parser";

describe("config-parser", () => {
  const tempDir = path.join(__dirname, "temp-config-parser-test");

  beforeAll(() => {
    // Create temporary directory for tests
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("normalizeSeverity", () => {
    it("should convert numeric severities", () => {
      expect(normalizeSeverity(0)).toBe("off");
      expect(normalizeSeverity(1)).toBe("warn");
      expect(normalizeSeverity(2)).toBe("error");
    });

    it("should convert string severities", () => {
      expect(normalizeSeverity("off")).toBe("off");
      expect(normalizeSeverity("warn")).toBe("warn");
      expect(normalizeSeverity("error")).toBe("error");
    });

    it("should convert oxlint specific severities", () => {
      expect(normalizeSeverity("allow")).toBe("off");
      expect(normalizeSeverity("deny")).toBe("error");
    });

    it("should throw on invalid severities", () => {
      expect(() => normalizeSeverity(3)).toThrow("Unexpected severity: 3");
      expect(() => normalizeSeverity("invalid")).toThrow(
        "Unexpected severity: invalid"
      );
      expect(() => normalizeSeverity(null)).toThrow();
    });
  });

  describe("isSupportedByOxlint", () => {
    it("should return true for supported rules", () => {
      expect(isSupportedByOxlint("no-console")).toBe(true);
      expect(isSupportedByOxlint("no-unused-vars")).toBe(true);
      expect(isSupportedByOxlint("no-debugger")).toBe(true);
    });

    it("should return false for unsupported rules", () => {
      expect(isSupportedByOxlint("prefer-const")).toBe(false);
      expect(isSupportedByOxlint("some-unknown-rule")).toBe(false);
    });

    it("should handle typescript rules", () => {
      // These should be normalized internally
      expect(isSupportedByOxlint("typescript/no-unused-vars")).toBe(true);
    });
  });

  describe("findSupportedRules", () => {
    it("should separate supported and unsupported rules", () => {
      const rules: ESLintRule[] = [
        { name: "no-console", severity: "warn" },
        { name: "no-unused-vars", severity: "error" },
        { name: "no-debugger", severity: "error" },
        { name: "prefer-const", severity: "error" }, // not supported
        { name: "some-unknown-rule", severity: "warn" }, // not supported
      ];

      const { supported, unsupported } = findSupportedRules(rules);

      expect(supported).toHaveLength(3);
      expect(unsupported).toHaveLength(2);

      const supportedNames = supported.map((r) => r.name);
      expect(supportedNames).toContain("no-console");
      expect(supportedNames).toContain("no-unused-vars");
      expect(supportedNames).toContain("no-debugger");

      const unsupportedNames = unsupported.map((r) => r.name);
      expect(unsupportedNames).toContain("prefer-const");
      expect(unsupportedNames).toContain("some-unknown-rule");
    });

    it("should exclude disabled unsupported rules", () => {
      const rules: ESLintRule[] = [
        { name: "no-console", severity: "warn" },
        { name: "prefer-const", severity: "off" }, // disabled unsupported rule
        { name: "some-unknown-rule", severity: "error" }, // enabled unsupported rule
      ];

      const { supported, unsupported } = findSupportedRules(rules);

      expect(supported).toHaveLength(1);
      expect(unsupported).toHaveLength(1);
      expect(unsupported[0].name).toBe("some-unknown-rule");
    });
  });

  describe("findESLintConfigs", () => {
    it("should find .eslintrc.js files recursively", async () => {
      // Create test files
      const testConfig1 = path.join(tempDir, ".eslintrc.js");
      const subDir = path.join(tempDir, "sub");
      const testConfig2 = path.join(subDir, ".eslintrc.js");

      fs.mkdirSync(subDir, { recursive: true });
      fs.writeFileSync(testConfig1, "module.exports = { rules: {} };");
      fs.writeFileSync(testConfig2, "module.exports = { rules: {} };");

      const configs = await findESLintConfigs(tempDir);

      expect(configs).toHaveLength(2);
      expect(configs).toContain(testConfig1);
      expect(configs).toContain(testConfig2);
      expect(configs).toEqual(configs.sort()); // should be sorted
    });

    it("should skip node_modules and other excluded directories", async () => {
      const nodeModulesDir = path.join(tempDir, "node_modules");
      const gitDir = path.join(tempDir, ".git");
      const testConfig = path.join(nodeModulesDir, ".eslintrc.js");

      fs.mkdirSync(nodeModulesDir, { recursive: true });
      fs.mkdirSync(gitDir, { recursive: true });
      fs.writeFileSync(testConfig, "module.exports = { rules: {} };");

      const configs = await findESLintConfigs(tempDir);

      expect(configs).not.toContain(testConfig);
    });
  });

  describe("hasRulesOrOverrides", () => {
    it("should return true for configs with rules", () => {
      const configPath = path.join(tempDir, "with-rules.js");
      fs.writeFileSync(
        configPath,
        `
        module.exports = {
          rules: {
            'no-console': 'error'
          }
        };
      `
      );

      expect(hasRulesOrOverrides(configPath)).toBe(true);
    });

    it("should return true for configs with overrides containing rules", () => {
      const configPath = path.join(tempDir, "with-overrides.js");
      fs.writeFileSync(
        configPath,
        `
        module.exports = {
          overrides: [{
            files: ['**/*.test.js'],
            rules: {
              'no-console': 'off'
            }
          }]
        };
      `
      );

      expect(hasRulesOrOverrides(configPath)).toBe(true);
    });

    it("should return false for configs with only extends", () => {
      const configPath = path.join(tempDir, "only-extends.js");
      fs.writeFileSync(
        configPath,
        `
        module.exports = {
          extends: ['eslint:recommended']
        };
      `
      );

      expect(hasRulesOrOverrides(configPath)).toBe(false);
    });
  });

  describe("parseRawESLintConfig", () => {
    it("should parse basic eslint config", () => {
      const configPath = path.join(tempDir, "basic-config.js");
      fs.writeFileSync(
        configPath,
        `
        module.exports = {
          rules: {
            'no-console': 'error',
            'prefer-const': 'warn'
          },
          env: {
            node: true
          }
        };
      `
      );

      const result = parseRawESLintConfig(configPath);

      expect(result.config).toBeDefined();
      expect(result.config!.rules).toEqual({
        "no-console": "error",
        "prefer-const": "warn",
      });
      expect(result.extendsFrom).toBeUndefined();
    });

    it("should detect file-based extends", () => {
      const configPath = path.join(tempDir, "extending-config.js");
      fs.writeFileSync(
        configPath,
        `
        module.exports = {
          extends: './base-config.js',
          rules: {
            'no-console': 'off'
          }
        };
      `
      );

      const result = parseRawESLintConfig(configPath);

      expect(result.config).toBeDefined();
      expect(result.extendsFrom).toBe(path.join(tempDir, "base-config.js"));
    });

    it("should ignore package-based extends", () => {
      const configPath = path.join(tempDir, "package-extends.js");
      fs.writeFileSync(
        configPath,
        `
        module.exports = {
          extends: ['eslint:recommended', '@typescript-eslint/recommended']
        };
      `
      );

      const result = parseRawESLintConfig(configPath);

      expect(result.config).toBeDefined();
      expect(result.extendsFrom).toBeUndefined();
    });

    it("should throw for nonexistent files", () => {
      const nonexistentPath = path.join(tempDir, "nonexistent.js");
      expect(() => parseRawESLintConfig(nonexistentPath)).toThrow(
        "ESLint config not found"
      );
    });
  });

  describe("parseRawOxlintRules", () => {
    it("should parse basic oxlint config", () => {
      const configPath = path.join(tempDir, ".oxlintrc.json");
      fs.writeFileSync(
        configPath,
        JSON.stringify({
          rules: {
            "no-console": "warn",
            "prefer-const": ["error", { ignoreReadBeforeAssign: true }],
          },
        })
      );

      const rules = parseRawOxlintRules(configPath);

      expect(rules).toHaveLength(2);

      const consoleRule = rules.find((r) => r.name === "no-console");
      expect(consoleRule).toEqual({
        name: "no-console",
        severity: "warn",
      });

      const constRule = rules.find((r) => r.name === "prefer-const");
      expect(constRule).toEqual({
        name: "prefer-const",
        severity: "error",
        config: [{ ignoreReadBeforeAssign: true }],
      });
    });

    it("should handle empty config", () => {
      const configPath = path.join(tempDir, "empty.oxlintrc.json");
      fs.writeFileSync(configPath, JSON.stringify({}));

      const rules = parseRawOxlintRules(configPath);

      expect(rules).toHaveLength(0);
    });

    it("should handle nonexistent config", () => {
      const configPath = path.join(tempDir, "nonexistent.oxlintrc.json");

      const rules = parseRawOxlintRules(configPath);

      expect(rules).toHaveLength(0);
    });

    it("should parse overrides", () => {
      const configPath = path.join(tempDir, "with-overrides.oxlintrc.json");
      fs.writeFileSync(
        configPath,
        JSON.stringify({
          rules: {
            "no-console": "error",
          },
          overrides: [
            {
              files: ["**/*.test.js"],
              rules: {
                "no-console": "off",
                "prefer-const": "warn",
              },
            },
          ],
        })
      );

      const rules = parseRawOxlintRules(configPath);

      expect(rules).toHaveLength(3);

      const ruleNames = rules.map((r) => r.name).sort();
      expect(ruleNames).toEqual(["no-console", "no-console", "prefer-const"]);
    });
  });

  describe("loadOxlintConfig", () => {
    it("should load and merge oxlint configuration", () => {
      const configPath = path.join(tempDir, "test.oxlintrc.json");
      fs.writeFileSync(
        configPath,
        JSON.stringify({
          plugins: ["react"],
          rules: {
            "no-console": "error",
            "react/jsx-uses-react": "warn",
          },
          ignorePatterns: ["dist/"],
        })
      );

      const result = loadOxlintConfig(configPath);

      expect(result.oxlintConfig.plugins).toContain("react");
      expect(result.oxlintConfig.plugins).toContain("typescript"); // default
      expect(result.oxlintConfig.plugins).toContain("unicorn"); // default
      expect(result.oxlintConfig.plugins).toContain("oxc"); // default

      expect(result.oxlintConfig.rules).toEqual({
        "no-console": "error",
        "react/jsx-uses-react": "warn",
      });

      expect(result.oxlintConfig.ignorePatterns).toEqual(["dist/"]);
      expect(result.oxlintRules).toHaveLength(2);
    });

    it("should use defaults for nonexistent config", () => {
      const configPath = path.join(tempDir, "nonexistent.oxlintrc.json");

      const result = loadOxlintConfig(configPath);

      expect(result.oxlintConfig.plugins).toEqual([
        "typescript",
        "unicorn",
        "oxc",
      ]);
      expect(result.oxlintConfig.rules).toEqual({});
      expect(result.oxlintRules).toHaveLength(0);
      expect(result.parentOxlintConfig).toBeUndefined();
    });
  });
});
