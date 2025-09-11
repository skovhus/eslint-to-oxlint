import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  findESLintConfigs,
  hasRulesOrOverrides,
  parseRawESLintConfig,
  parseRawOxlintRules,
  loadOxlintConfig,
  normalizeSeverity,
  OXC_DEFAULT_ENABLED_PLUGINS,
  OxlintRulesRegistry,
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

  describe("OxlintRulesRegistry", () => {
    const registry = OxlintRulesRegistry.load(process.cwd());
    const rules = registry.getAllRules();

    it("should load all oxlint rules with correct structure", () => {
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
    });

    it("should correctly set isDefaultEnabled based on OXC_DEFAULT_ENABLED_PLUGINS", () => {
      const defaultEnabledRules = rules.filter((rule) => rule.isDefaultEnabled);
      const nonDefaultRules = rules.filter((rule) => !rule.isDefaultEnabled);

      expect(defaultEnabledRules.length).toBeGreaterThan(0);
      expect(nonDefaultRules.length).toBeGreaterThan(0);

      // All default enabled rules should have scopes in OXC_DEFAULT_ENABLED_PLUGINS
      defaultEnabledRules.forEach((rule) => {
        expect(OXC_DEFAULT_ENABLED_PLUGINS).toContain(rule.scope);
      });

      // All non-default rules should have scopes NOT in OXC_DEFAULT_ENABLED_PLUGINS
      nonDefaultRules.forEach((rule) => {
        expect(OXC_DEFAULT_ENABLED_PLUGINS).not.toContain(rule.scope);
      });
    });

    it("should include rules from multiple scopes", () => {
      const scopes = [...new Set(rules.map((rule) => rule.scope))];

      expect(scopes.length).toBeGreaterThan(3); // Should have multiple scopes

      // Should include some known scopes based on OXC_DEFAULT_ENABLED_PLUGINS
      expect(scopes).toContain("typescript");
      expect(scopes).toContain("unicorn");
      expect(scopes).toContain("oxc");
    });

    it("should include rules from different categories", () => {
      const categories = [...new Set(rules.map((rule) => rule.category))];

      expect(categories.length).toBeGreaterThan(1); // Should have multiple categories

      // Should include some known categories
      const knownCategories = [
        "correctness",
        "suspicious",
        "style",
        "pedantic",
        "restriction",
      ];
      const hasKnownCategories = knownCategories.some((cat) =>
        categories.includes(cat)
      );
      expect(hasKnownCategories).toBe(true);
    });

    describe("isSupportedByOxlint", () => {
      it("should return true for supported rules", () => {
        expect(registry.isSupportedByOxlint("no-console")).toBe(true);
        expect(registry.isSupportedByOxlint("no-unused-vars")).toBe(true);
        expect(registry.isSupportedByOxlint("no-debugger")).toBe(true);
      });

      it("should return false for unsupported rules", () => {
        expect(registry.isSupportedByOxlint("prefer-const")).toBe(false);
        expect(registry.isSupportedByOxlint("some-unknown-rule")).toBe(false);
      });

      it("should handle typescript rules", () => {
        // These should be normalized internally
        expect(registry.isSupportedByOxlint("typescript/no-unused-vars")).toBe(
          true
        );
        expect(
          registry.isSupportedByOxlint("@typescript-eslint/no-unused-vars")
        ).toBe(true);
      });
    });
  });
});
