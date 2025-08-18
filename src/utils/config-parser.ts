/* eslint-disable no-console, @typescript-eslint/no-var-requires, @typescript-eslint/no-shadow, @typescript-eslint/no-explicit-any */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as jsonc from "jsonc-parser";
import * as ruleByCategory from "eslint-plugin-oxlint/rules-by-category";

export const OXC_DEFAULT_ENABLED_PLUGINS = ["typescript", "unicorn", "oxc"];
export const allOxlintRules = Object.values(ruleByCategory).flatMap((rules) =>
  Object.keys(rules).map(normalizeOxlintRuleName)
);
export const allDefaultEnabledOxlintRules = Object.keys(
  ruleByCategory.correctnessRules
).map(normalizeOxlintRuleName);

export type Severity = "error" | "warn" | "off";

export interface ESLintRule {
  name: string;
  severity: Severity;
  config?: Record<string, unknown> | unknown[];
}

export type ConfigRule = Record<string, string | [string, ...unknown[]]>;

export interface EslintConfig {
  plugins: string[];
  rules: ConfigRule;
  ignorePatterns?: string[];
  overrides?: EslintOverride[];
}

export interface EslintOverride {
  files: string | string[];
  excludedFiles?: string | string[];
  rules?: ConfigRule;
  plugins?: string[];
}

export interface OxlintConfig extends EslintConfig {
  extends?: string | string[];
}

function normalizeOxlintRuleName(ruleName: string): string {
  return ruleName.replace(/^@typescript-eslint\//, "typescript/");
}

export function normalizeSeverity(severity: unknown): "error" | "warn" | "off" {
  if (typeof severity === "number") {
    if (severity === 0) {
      return "off";
    }
    if (severity === 1) {
      return "warn";
    }
    if (severity === 2) {
      return "error";
    }
    throw new Error(`Unexpected severity: ${severity}`);
  }

  if (severity === "deny") {
    return "error";
  }

  if (severity === "allow") {
    return "off";
  }

  if (
    typeof severity === "string" &&
    ["off", "warn", "error"].includes(severity)
  ) {
    return severity as Severity;
  }

  throw new Error(`Unexpected severity: ${severity}`);
}

export function isSupportedByOxlint(ruleName: string): boolean {
  return allOxlintRules.includes(ruleName);
}

/**
 * Find all ESLint config files recursively
 */
export async function findESLintConfigs(
  rootDir = process.cwd()
): Promise<string[]> {
  const configs: string[] = [];

  function findConfigsInDir(dir: string): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip common directories we don't want to search
          if (
            ![
              "node_modules",
              ".git",
              "dist",
              "build",
              ".next",
              "coverage",
            ].includes(entry.name)
          ) {
            findConfigsInDir(fullPath);
          }
        } else if (
          entry.name === ".eslintrc.js" ||
          entry.name === ".eslintrc.cjs"
        ) {
          configs.push(fullPath);
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }

  findConfigsInDir(rootDir);
  return configs.sort();
}

/**
 * Check if an ESLint config has meaningful rules or overrides (not just extends/parserOptions)
 */
export function hasRulesOrOverrides(configPath: string): boolean {
  const absolutePath = path.resolve(configPath);
  // Clear require cache to ensure fresh load
  delete require.cache[absolutePath];
  const config = require(absolutePath) as EslintConfig;

  // Check if it has rules or overrides with rules
  if (config.rules && Object.keys(config.rules).length > 0) {
    return true;
  }

  if (
    config.overrides &&
    config.overrides.some(
      (override) => override.rules && Object.keys(override.rules).length > 0
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Parse raw ESLint config file to extract overrides and detect inheritance
 */
export function parseRawESLintConfig(configPath: string): {
  config: EslintConfig | null;
  extendsFrom?: string;
} {
  if (!fs.existsSync(configPath)) {
    throw new Error(`ESLint config not found at ${configPath}`);
  }

  try {
    // Resolve to absolute path for require
    const absolutePath = path.resolve(configPath);
    // Clear require cache to ensure fresh load
    delete require.cache[absolutePath];
    const rawConfig = require(absolutePath) as EslintConfig & {
      extends?: string | string[];
    };

    let extendsFrom: string | undefined;
    if (rawConfig.extends) {
      // Handle the case where extends is a string or array
      const extendsValue = Array.isArray(rawConfig.extends)
        ? rawConfig.extends[0]
        : rawConfig.extends;
      // Only consider file-based extends, not package extends
      if (extendsValue.startsWith("./") || extendsValue.startsWith("../")) {
        const resolvedPath = path.resolve(
          path.dirname(configPath),
          extendsValue
        );
        // Add .js extension if not present
        extendsFrom = resolvedPath.endsWith(".js")
          ? resolvedPath
          : `${resolvedPath}.js`;
      }
    }

    return { config: rawConfig, extendsFrom };
  } catch (error) {
    throw new Error(`Failed to parse ESLint config at ${configPath}: ${error}`);
  }
}

/**
 * Load complete resolved ESLint configuration using --print-config
 */
export function loadESLintConfig(configPath: string): {
  eslintRules: ESLintRule[];
  eslintResolvedConfig: EslintConfig;
  rawConfig: EslintConfig | null;
  extendsFrom?: string;
} {
  if (!fs.existsSync(configPath)) {
    throw new Error(`ESLint config not found at ${configPath}`);
  }

  // Parse raw config to get overrides and inheritance info
  const { config: rawConfig, extendsFrom } = parseRawESLintConfig(configPath);

  // Use ESLint's --print-config to get the complete resolved configuration
  const result = execSync(
    `ESLINT_USE_FLAT_CONFIG=false npx eslint --print-config "${configPath}"`,
    {
      encoding: "utf8",
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    }
  );

  const eslintResolvedConfig = JSON.parse(result) as EslintConfig;
  const eslintRules: ESLintRule[] = [];

  if (
    !eslintResolvedConfig.rules ||
    typeof eslintResolvedConfig.rules !== "object"
  ) {
    throw new Error("Invalid ESLint config");
  }

  const allRules = new Set(Object.keys(eslintResolvedConfig.rules));
  const customRuleMapping = new Map<string, string>();
  const rulesToRemove = new Set<string>();

  // First pass: identify typescript rules that have oxlint support
  for (const ruleName of allRules) {
    const ruleWithoutPlugin = ruleName.replace(/^@typescript-eslint\//, "");
    if (
      ruleName.startsWith("@typescript-eslint/") &&
      isSupportedByOxlint(ruleWithoutPlugin)
    ) {
      customRuleMapping.set(ruleName, ruleWithoutPlugin);
      // If both the base rule and typescript rule exist, prefer the typescript version
      if (allRules.has(ruleWithoutPlugin)) {
        rulesToRemove.add(ruleWithoutPlugin);
      }
    }
  }

  // Remove base rules that have typescript equivalents
  for (const ruleToRemove of rulesToRemove) {
    allRules.delete(ruleToRemove);
  }

  for (const eslintRuleName of allRules) {
    const ruleConfig = eslintResolvedConfig.rules[eslintRuleName];

    const name = (
      customRuleMapping.get(eslintRuleName) || eslintRuleName
    ).replace(/^@typescript-eslint\//, "typescript/");

    if (Array.isArray(ruleConfig)) {
      const config = ruleConfig.slice(1);
      eslintRules.push({
        name,
        severity: normalizeSeverity(ruleConfig[0]),
        ...(config.length > 0 ? { config } : {}),
      });
    } else {
      eslintRules.push({
        name,
        severity: normalizeSeverity(ruleConfig),
      });
    }
  }

  return { eslintRules, eslintResolvedConfig, rawConfig, extendsFrom };
}

/**
 * Parse raw oxlint config and resolve rules manually
 */
export function parseRawOxlintRules(
  configPath: string,
  parentConfigPath?: string
): ESLintRule[] {
  const oxlintRules: ESLintRule[] = [];

  // Parse the raw config file
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, "utf8");
    const config = jsonc.parse(content) as OxlintConfig;

    // Add rules from this config
    if (config.rules) {
      for (const [ruleName, ruleConfig] of Object.entries(config.rules)) {
        if (Array.isArray(ruleConfig)) {
          const config = ruleConfig.slice(1);
          oxlintRules.push({
            name: ruleName,
            severity: normalizeSeverity(ruleConfig[0]),
            ...(config.length > 0 ? { config } : {}),
          });
        } else {
          oxlintRules.push({
            name: ruleName,
            severity: normalizeSeverity(ruleConfig),
          });
        }
      }
    }

    // Add rules from overrides
    if (config.overrides) {
      for (const override of config.overrides) {
        if (override.rules) {
          for (const [ruleName, ruleConfig] of Object.entries(override.rules)) {
            if (Array.isArray(ruleConfig)) {
              const config = ruleConfig.slice(1);
              oxlintRules.push({
                name: ruleName,
                severity: normalizeSeverity(ruleConfig[0]),
                ...(config.length > 0 ? { config } : {}),
              });
            } else {
              oxlintRules.push({
                name: ruleName,
                severity: normalizeSeverity(ruleConfig),
              });
            }
          }
        }
      }
    }
  }

  // If there's a parent config, add its rules too (if extending)
  if (parentConfigPath) {
    const parentOxlintConfigPath = path.join(
      path.dirname(parentConfigPath),
      ".oxlintrc.json"
    );
    if (fs.existsSync(parentOxlintConfigPath)) {
      const parentRules = parseRawOxlintRules(parentOxlintConfigPath);
      // Parent rules come first, child rules override
      const existingRuleNames = new Set(oxlintRules.map((r) => r.name));
      for (const parentRule of parentRules) {
        if (!existingRuleNames.has(parentRule.name)) {
          oxlintRules.push(parentRule);
        }
      }
    }
  }

  return oxlintRules;
}

/**
 * Load and parse Oxlint configuration, combining with default enabled rules
 */
export function loadOxlintConfig(
  configPath: string,
  parentConfigPath?: string
): {
  oxlintConfig: OxlintConfig;
  parentOxlintConfig?: OxlintConfig;
  oxlintRules: ESLintRule[];
} {
  let parentOxlintConfig: OxlintConfig | undefined;

  // Default Oxlint configuration structure
  const oxlintConfig: OxlintConfig = {
    plugins: [...OXC_DEFAULT_ENABLED_PLUGINS],
    rules: {},
  };

  // If there's a parent config path, try to load the parent oxlint config
  if (parentConfigPath) {
    const parentOxlintConfigPath = path.join(
      path.dirname(parentConfigPath),
      ".oxlintrc.json"
    );
    if (fs.existsSync(parentOxlintConfigPath)) {
      const content = fs.readFileSync(parentOxlintConfigPath, "utf8");
      parentOxlintConfig = jsonc.parse(content) as OxlintConfig;
    }
  }

  // If config file exists, parse it and override defaults
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, "utf8");
    const config = jsonc.parse(content) as OxlintConfig;

    // Merge configuration properties
    if (config.plugins) {
      oxlintConfig.plugins = [
        ...new Set([...oxlintConfig.plugins, ...config.plugins]),
      ].sort();
    }

    if (config.ignorePatterns) {
      oxlintConfig.ignorePatterns = config.ignorePatterns;
    }

    if (config.overrides) {
      oxlintConfig.overrides = config.overrides;
    }

    if (config.rules) {
      oxlintConfig.rules = { ...config.rules };
    }
  }

  // Use the raw parsing approach instead of oxlint --print-config for rules
  const oxlintRules = parseRawOxlintRules(configPath, parentConfigPath);

  return { oxlintConfig, parentOxlintConfig, oxlintRules };
}

/**
 * Find ESLint rules that are supported by Oxlint
 */
export function findSupportedRules(eslintRules: ESLintRule[]): {
  supported: ESLintRule[];
  unsupported: ESLintRule[];
} {
  const supported: ESLintRule[] = [];
  const unsupported: ESLintRule[] = [];

  for (const rule of eslintRules) {
    if (isSupportedByOxlint(rule.name)) {
      supported.push(rule);
    } else {
      if (rule.severity !== "off") {
        unsupported.push(rule);
      }
    }
  }

  return { supported, unsupported };
}
