/* eslint-disable no-console, @typescript-eslint/no-var-requires, @typescript-eslint/no-shadow, @typescript-eslint/no-explicit-any */

/**
 * Script to compare ESLint rules with Oxlint rules and suggest changes.
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { isDeepStrictEqual } from "util";
import {
  findESLintConfigs,
  hasRulesOrOverrides,
  parseRawESLintConfig,
  loadESLintConfig,
  loadOxlintConfig,
  findSupportedRules,
  isSupportedByOxlint,
  type ESLintRule,
  type EslintConfig,
  type EslintOverride,
  type OxlintConfig,
  type ConfigRule,
  OXC_DEFAULT_ENABLED_PLUGINS,
  allDefaultEnabledOxlintRules,
} from "./utils/config-parser";

/**
 * Build dependency graph for ESLint configs (parent -> children)
 */
function buildDependencyGraph(configPaths: string[]): Map<string, string[]> {
  const dependents = new Map<string, string[]>();

  for (const configPath of configPaths) {
    const { extendsFrom } = parseRawESLintConfig(configPath);

    if (extendsFrom && configPaths.includes(extendsFrom)) {
      if (!dependents.has(extendsFrom)) {
        dependents.set(extendsFrom, []);
      }
      dependents.get(extendsFrom)!.push(configPath);
    }
  }

  return dependents;
}

/**
 * Sort configs in dependency order (parents first, then children)
 */
function sortByDependencies(configPaths: string[]): string[] {
  const dependents = buildDependencyGraph(configPaths);
  const processed = new Set<string>();
  const result: string[] = [];

  function processConfig(configPath: string) {
    if (processed.has(configPath)) {
      return;
    }

    processed.add(configPath);

    // First add this config
    result.push(configPath);

    // Then add its dependents (sorted for deterministic behavior)
    const children = (dependents.get(configPath) || []).sort();
    for (const child of children) {
      processConfig(child);
    }
  }

  // Start with configs that don't extend from other local configs (sorted for deterministic behavior)
  for (const configPath of [...configPaths].sort()) {
    const { extendsFrom } = parseRawESLintConfig(configPath);
    if (!extendsFrom || !configPaths.includes(extendsFrom)) {
      processConfig(configPath);
    }
  }

  return result;
}

/**
 * Generate suggested Oxlint configuration with grouped rules and comments
 */
function generateSuggestedConfig(props: {
  supportedRules: ESLintRule[];
  eslintResolvedConfig: EslintConfig;
  rawConfig: EslintConfig | null;
  parentOxlintConfig?: OxlintConfig;
  parentConfigPath?: string;
  currentConfigPath: string;
}): {
  suggestedConfig: OxlintConfig;
  groupedRules: { defaultDisabled: ESLintRule[]; otherRules: ESLintRule[] };
} {
  const {
    supportedRules,
    eslintResolvedConfig,
    rawConfig,
    parentOxlintConfig,
    parentConfigPath,
    currentConfigPath,
  } = props;

  function getOxPlugin(ruleName: string) {
    const plugin = ruleName.includes("/") ? ruleName.split("/")[0] : null;
    return plugin?.replace("react-hooks", "react");
  }

  const suggestedConfig: OxlintConfig = {
    plugins: parentOxlintConfig ? [] : [...OXC_DEFAULT_ENABLED_PLUGINS], // Start empty when extending
    rules: {},
    ignorePatterns: parentOxlintConfig
      ? []
      : eslintResolvedConfig.ignorePatterns, // Don't duplicate parent ignorePatterns
  };

  // Add extends if there's a parent config
  if (parentOxlintConfig && parentConfigPath) {
    const currentDir = path.dirname(currentConfigPath);
    const parentDir = path.dirname(parentConfigPath);
    const relativePath = path.relative(
      currentDir,
      path.join(parentDir, ".oxlintrc.json")
    );
    suggestedConfig.extends = relativePath.startsWith(".")
      ? relativePath
      : `./${relativePath}`;
  }

  // Separate rules into categories for better organization
  const defaultDisabledRules: ESLintRule[] = [];
  const otherRules: ESLintRule[] = [];

  // Create a map of parent rules for comparison
  const parentRulesMap = new Map<string, any>();
  if (parentOxlintConfig?.rules) {
    // Process parent rules in sorted order for deterministic behavior
    for (const name of Object.keys(parentOxlintConfig.rules).sort()) {
      const ruleConfig = parentOxlintConfig.rules[name];
      parentRulesMap.set(name, ruleConfig);
    }
  }

  // Add supported ESLint rules to Oxlint config (only if different from parent)
  const sortedRules = [...supportedRules].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  for (const rule of sortedRules) {
    // Convert rule config to the format we'd put in oxlint config
    let ruleValue: any;
    if (rule.config && Array.isArray(rule.config) && rule.config.length > 0) {
      ruleValue = [rule.severity, ...rule.config];
    } else if (
      rule.config &&
      typeof rule.config === "object" &&
      Object.keys(rule.config).length > 0
    ) {
      ruleValue = [rule.severity, rule.config];
    } else {
      ruleValue = rule.severity;
    }

    // Check if this rule differs from the parent config
    const parentRuleValue = parentRulesMap.get(rule.name);
    const isDifferentFromParent = parentOxlintConfig
      ? !isDeepStrictEqual(parentRuleValue, ruleValue)
      : true;

    if (isDifferentFromParent) {
      const plugin = getOxPlugin(rule.name);
      const parentPlugins = parentOxlintConfig?.plugins || [];
      if (
        plugin &&
        !suggestedConfig.plugins.includes(plugin) &&
        !parentPlugins.includes(plugin)
      ) {
        suggestedConfig.plugins.push(plugin);
      }

      // Check if this rule is enabled by default in oxlint
      const isDefaultEnabledInOxlint = allDefaultEnabledOxlintRules.includes(
        rule.name
      );

      // Skip rules that are turned off in ESLint but not enabled by default in oxlint
      // (these are redundant since oxlint wouldn't run them anyway)
      if (rule.severity === "off" && !isDefaultEnabledInOxlint) {
        continue; // Don't add this rule to the config
      }

      // Skip rules that are enabled by default in oxlint AND enabled in ESLint with the same severity and no custom config
      // (these are redundant since oxlint will run them with the same behavior anyway)
      // However, keep plugin rules (like jest/*) even if enabled by default to ensure plugins are loaded
      if (rule.severity !== "off" && isDefaultEnabledInOxlint) {
        const hasCustomConfig =
          rule.config && Array.isArray(rule.config) && rule.config.length > 0;
        const isDefaultSeverity = rule.severity === "error"; // oxlint defaults to error for correctness rules
        const isPluginRule = rule.name.includes("/"); // Plugin rules contain "/"

        if (!hasCustomConfig && isDefaultSeverity && !isPluginRule) {
          // Skip redundant core ESLint rules that match oxlint's default behavior exactly
          // But keep plugin rules to ensure plugins are properly loaded
          continue; // Don't add this rule to the config
        }
      }

      if (rule.severity === "off" && isDefaultEnabledInOxlint) {
        defaultDisabledRules.push(rule);
      } else {
        otherRules.push(rule);
      }

      suggestedConfig.rules[rule.name] = ruleValue;
    }
  }

  // Process overrides from raw config
  if (rawConfig?.overrides) {
    const oxlintOverrides: EslintOverride[] = [];

    for (const eslintOverride of rawConfig.overrides) {
      if (!eslintOverride.rules) {
        continue;
      }

      const overrideRules: ConfigRule = {};

      // Check each rule in the override to see if it's supported by Oxlint
      // Process rules in sorted order for deterministic behavior
      for (const _ruleName of Object.keys(eslintOverride.rules).sort()) {
        const ruleConfig = eslintOverride.rules[_ruleName];
        const ruleName = _ruleName.replace(
          /^@typescript-eslint\//,
          "typescript/"
        );

        if (isSupportedByOxlint(ruleName)) {
          const ruleValue =
            typeof ruleConfig === "string" ? ruleConfig : ruleConfig[0];

          // Always include override rules, even if they match defaults or are "off"
          // Overrides are meant to be specific to certain file patterns, so they should be preserved

          // Convert rule name for Oxlint
          // Check if this rule is already in top-level rules with the same config
          const topLevelRule = suggestedConfig.rules[ruleName];
          const isSameAsTopLevel =
            topLevelRule && isDeepStrictEqual(topLevelRule, ruleConfig);

          // Include in override even if it's same as top-level, since overrides are file-specific
          // The only exception is if the top-level rule is exactly the same and there's no custom config
          const shouldIncludeOverride =
            !isSameAsTopLevel ||
            (Array.isArray(ruleConfig) && ruleConfig.length > 1) ||
            ruleValue === "off"; // Always include "off" rules in overrides

          if (shouldIncludeOverride) {
            overrideRules[ruleName] = ruleConfig;

            // Add plugin if needed
            const plugin = getOxPlugin(ruleName);
            if (plugin && !suggestedConfig.plugins.includes(plugin)) {
              suggestedConfig.plugins.push(plugin);
            }
          }
        }
      }

      // Only add override if it has supported rules that will actually be included
      if (Object.keys(overrideRules).length > 0) {
        oxlintOverrides.push({
          files: eslintOverride.files,
          ...(eslintOverride.excludedFiles
            ? { excludedFiles: eslintOverride.excludedFiles }
            : {}),
          rules: overrideRules,
        });
      }
    }

    // Add overrides to config if any exist
    if (oxlintOverrides.length > 0) {
      suggestedConfig.overrides = oxlintOverrides;
    }
  }

  suggestedConfig.plugins.sort();

  return {
    suggestedConfig,
    groupedRules: { defaultDisabled: defaultDisabledRules, otherRules },
  };
}

/**
 * Extract only the rules that are directly defined in the raw config file (not inherited)
 */
function getDirectlyDefinedRules(
  rawConfig: EslintConfig,
  allEslintRules: ESLintRule[]
): ESLintRule[] {
  const directRuleNames = new Set<string>();

  // Add rules directly defined in this config
  if (rawConfig.rules && typeof rawConfig.rules === "object") {
    for (const ruleName of Object.keys(rawConfig.rules).sort()) {
      directRuleNames.add(
        ruleName.replace(/^@typescript-eslint\//, "typescript/")
      );
    }
  }

  // Add rules from overrides defined in this config
  if (rawConfig.overrides && Array.isArray(rawConfig.overrides)) {
    for (const override of rawConfig.overrides) {
      if (override.rules && typeof override.rules === "object") {
        for (const ruleName of Object.keys(override.rules).sort()) {
          directRuleNames.add(
            ruleName.replace(/^@typescript-eslint\//, "typescript/")
          );
        }
      }
    }
  }

  // Filter the eslint rules to only include directly defined ones
  return allEslintRules.filter((rule) => directRuleNames.has(rule.name));
}

/**
 * Check for conflicts between ESLint and Oxlint enabled rules
 */
function checkForConflicts(
  eslintRules: ESLintRule[],
  oxlintRules: ESLintRule[]
): {
  duplicates: { eslintRule: ESLintRule; oxlintRule: ESLintRule }[];
  conflicts: { eslintRule: ESLintRule; oxlintRule: ESLintRule }[];
} {
  const duplicates: { eslintRule: ESLintRule; oxlintRule: ESLintRule }[] = [];
  const conflicts: { eslintRule: ESLintRule; oxlintRule: ESLintRule }[] = [];

  // Create a map of Oxlint rules for quick lookup
  const oxlintRuleMap = new Map<string, ESLintRule>();
  for (const rule of oxlintRules) {
    oxlintRuleMap.set(rule.name, rule);
  }

  for (const eslintRule of eslintRules) {
    if (isSupportedByOxlint(eslintRule.name)) {
      const oxlintRule = oxlintRuleMap.get(eslintRule.name);

      if (eslintRule.severity === "off") {
        continue;
      }

      if (oxlintRule) {
        // Check if rule is enabled in both ESLint and Oxlint
        if (
          isDeepStrictEqual(eslintRule, oxlintRule) ||
          eslintRule.severity === oxlintRule.severity
        ) {
          // Config is carried over, so as long as the severity is the same, it's a duplicate
          duplicates.push({ eslintRule, oxlintRule });
        } else {
          conflicts.push({ eslintRule, oxlintRule });
        }
      }
    }
  }

  return { duplicates, conflicts };
}

/**
 * Compare two oxlint configurations to see if they are equivalent
 * Ignores formatting and comment differences, focuses on actual configuration values
 */
function areOxlintConfigsEqual(
  config1: OxlintConfig,
  config2: OxlintConfig
): boolean {
  // Compare plugins (order doesn't matter)
  const plugins1 = [...(config1.plugins || [])].sort();
  const plugins2 = [...(config2.plugins || [])].sort();
  if (!isDeepStrictEqual(plugins1, plugins2)) {
    return false;
  }

  // Compare rules
  if (!isDeepStrictEqual(config1.rules || {}, config2.rules || {})) {
    return false;
  }

  // Compare ignore patterns (order doesn't matter)
  const ignorePatterns1 = [...(config1.ignorePatterns || [])].sort();
  const ignorePatterns2 = [...(config2.ignorePatterns || [])].sort();
  if (!isDeepStrictEqual(ignorePatterns1, ignorePatterns2)) {
    return false;
  }

  // Compare overrides
  if (!isDeepStrictEqual(config1.overrides || [], config2.overrides || [])) {
    return false;
  }

  return true;
}

/**
 * Check if an oxlint config should be removed because it's empty and only extends from parent
 */
function shouldRemoveOxlintConfig(config: OxlintConfig): boolean {
  // Remove if rules is empty (no meaningful rules)
  return !config.rules || Object.keys(config.rules).length === 0;
}

/**
 * Write JSONC configuration file with comments and grouped rules
 */
function writeOxlintConfigWithComments(
  filePath: string,
  config: OxlintConfig,
  groupedRules: { defaultDisabled: ESLintRule[]; otherRules: ESLintRule[] }
): void {
  const { defaultDisabled, otherRules } = groupedRules;

  // Start building the JSONC content
  let content = "{\n";

  // Add extends if present (oxlint requires array format)
  if (config.extends) {
    const extendsValue = Array.isArray(config.extends)
      ? config.extends
      : [config.extends];
    content += '  "extends": [\n';
    extendsValue.forEach((ext, index) => {
      const comma = index < extendsValue.length - 1 ? "," : "";
      content += `    "${ext}"${comma}\n`;
    });
    content += "  ],\n";
  }

  // Add plugins only if there are any
  if (config.plugins.length > 0) {
    content += '  "plugins": [\n';
    config.plugins.forEach((plugin, index) => {
      const comma = index < config.plugins.length - 1 ? "," : "";
      content += `    "${plugin}"${comma}\n`;
    });
    content += "  ],\n";
  }

  // Add rules section
  content += '  "rules": {\n';

  // Add default-disabled rules with comment
  if (defaultDisabled.length > 0) {
    content +=
      "    // FIXME: Investigate how to enable these that are enabled by default in oxlint\n";
    defaultDisabled
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((rule, index) => {
        const ruleValue = config.rules[rule.name];
        const ruleStr =
          typeof ruleValue === "string"
            ? `"${ruleValue}"`
            : JSON.stringify(ruleValue);
        const comma =
          index < defaultDisabled.length - 1 || otherRules.length > 0
            ? ","
            : "";
        content += `    "${rule.name}": ${ruleStr}${comma}\n`;
      });

    // Add a separator comment if there are other rules
    if (otherRules.length > 0) {
      content += "\n    // General rules\n";
    }
  }

  // Add other rules
  if (otherRules.length > 0) {
    otherRules
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((rule, index) => {
        const ruleValue = config.rules[rule.name];
        const ruleStr =
          typeof ruleValue === "string"
            ? `"${ruleValue}"`
            : JSON.stringify(ruleValue);
        const comma = index < otherRules.length - 1 ? "," : "";
        content += `    "${rule.name}": ${ruleStr}${comma}\n`;
      });
  }

  content += "  }";

  // Add overrides if they exist
  if (config.overrides?.length) {
    content += ',\n  "overrides": [\n';
    config.overrides.forEach((override, overrideIndex) => {
      content += "    {\n";

      // Files
      const files = Array.isArray(override.files)
        ? override.files
        : [override.files];
      content += '      "files": [\n';
      files.forEach((file, fileIndex) => {
        const comma = fileIndex < files.length - 1 ? "," : "";
        content += `        "${file}"${comma}\n`;
      });
      content += "      ]";

      // Excluded files
      if (override.excludedFiles) {
        content += ',\n      "excludedFiles": ';
        const excludedFiles = Array.isArray(override.excludedFiles)
          ? override.excludedFiles
          : [override.excludedFiles];
        content += "[\n";
        excludedFiles.forEach((file, fileIndex) => {
          const comma = fileIndex < excludedFiles.length - 1 ? "," : "";
          content += `        "${file}"${comma}\n`;
        });
        content += "      ]";
      }

      // Rules
      if (override.rules && Object.keys(override.rules).length > 0) {
        content += ',\n      "rules": {\n';
        const ruleNames = Object.keys(override.rules).sort();
        ruleNames.forEach((ruleName, ruleIndex) => {
          const ruleValue = override.rules![ruleName];
          const ruleStr =
            typeof ruleValue === "string"
              ? `"${ruleValue}"`
              : JSON.stringify(ruleValue);
          const comma = ruleIndex < ruleNames.length - 1 ? "," : "";
          content += `        "${ruleName}": ${ruleStr}${comma}\n`;
        });
        content += "      }";
      }

      const comma =
        overrideIndex < (config.overrides?.length || 0) - 1 ? "," : "";
      content += `\n    }${comma}\n`;
    });
    content += "  ]";
  }

  // Add ignore patterns if they exist and are different from parent
  const ignorePatterns = config.ignorePatterns || [];
  if (ignorePatterns.length) {
    content += ',\n  "ignorePatterns": [\n';
    ignorePatterns.forEach((pattern, index) => {
      const comma = index < ignorePatterns.length - 1 ? "," : "";
      content += `    "${pattern}"${comma}\n`;
    });
    content += "  ]";
  }

  content += "\n}\n";

  fs.writeFileSync(filePath, content);
}

// Global variable to collect reports from all configs
const allReports: {
  configPath: string;
  duplicates: { eslintRule: ESLintRule; oxlintRule: ESLintRule }[];
  conflicts: { eslintRule: ESLintRule; oxlintRule: ESLintRule }[];
}[] = [];

/**
 * Add duplicate and conflict rules to the global report collection
 */
function collectAnalysisReport({
  duplicates,
  conflicts,
  eslintConfigPath,
}: {
  duplicates: { eslintRule: ESLintRule; oxlintRule: ESLintRule }[];
  conflicts: { eslintRule: ESLintRule; oxlintRule: ESLintRule }[];
  eslintConfigPath: string;
}): void {
  if (duplicates.length > 0 || conflicts.length > 0) {
    allReports.push({
      configPath: eslintConfigPath,
      duplicates,
      conflicts,
    });
  }
}

/**
 * Generate a consolidated markdown report file with duplicate and conflict rules from all configs
 */
function generateConsolidatedReport(reportPath: string, baseDirectory: string): void {
  if (allReports.length === 0) {
    return;
  }

  let content = `# ESLint to Oxlint Migration Report\n\n`;
  content += `**Generated:** ${new Date().toISOString()}\n\n`;
  content += `## Overview\n\n`;

  const totalDuplicates = allReports.reduce(
    (sum, report) => sum + report.duplicates.length,
    0
  );
  const totalConflicts = allReports.reduce(
    (sum, report) => sum + report.conflicts.length,
    0
  );
  const totalIssues = totalDuplicates + totalConflicts;

  content += `Found ${totalIssues} rule issues across ${allReports.length} configuration files:\n`;
  content += `- **${totalDuplicates} duplicate rules** that should be disabled in ESLint to avoid conflicts with Oxlint\n`;
  content += `- **${totalConflicts} conflicting rules** with different configurations between ESLint and Oxlint\n\n`;

  // Summary table
  content += `## Summary by Configuration\n\n`;
  content += `| Configuration | Duplicate Rules | Conflicting Rules | Total Issues |\n`;
  content += `|---------------|----------------|-------------------|---------------|\n`;

  for (const report of allReports) {
    const relativeConfigPath = path.relative(baseDirectory, report.configPath);
    const totalConfigIssues =
      report.duplicates.length + report.conflicts.length;
    content += `| \`${relativeConfigPath}\` | ${report.duplicates.length} | ${report.conflicts.length} | ${totalConfigIssues} |\n`;
  }
  content += `\n`;

  // Per-config sections
  for (const report of allReports) {
    const relativeConfigPath = path.relative(baseDirectory, report.configPath);
    content += `## ${relativeConfigPath}\n\n`;

    if (report.duplicates.length > 0) {
      content += `### Duplicate Rules (${report.duplicates.length})\n\n`;
      content += `Remove these rules from \`${relativeConfigPath}\` (they're now handled by Oxlint):\n\n`;

      const sortedDuplicates = [...report.duplicates].sort((a, b) =>
        a.eslintRule.name.localeCompare(b.eslintRule.name)
      );

      for (const { eslintRule } of sortedDuplicates) {
        const ruleName = eslintRule.name.replace(
          /^typescript\//,
          "@typescript-eslint/"
        );
        content += `- \`${ruleName}\`\n`;
      }
      content += `\n`;
    }

    if (report.conflicts.length > 0) {
      content += `### Conflicting Rules (${report.conflicts.length})\n\n`;
      content += `These rules have different configurations between ESLint and Oxlint:\n\n`;

      const sortedConflicts = [...report.conflicts].sort((a, b) =>
        a.eslintRule.name.localeCompare(b.eslintRule.name)
      );

      for (const { eslintRule, oxlintRule } of sortedConflicts) {
        const ruleName = eslintRule.name.replace(
          /^typescript\//,
          "@typescript-eslint/"
        );
        content += `#### \`${ruleName}\`\n\n`;
        content += `- **ESLint:** severity \`${eslintRule.severity}\``;
        if (eslintRule.config) {
          content += `, config: \`${JSON.stringify(eslintRule.config)}\``;
        }
        content += `\n`;
        content += `- **Oxlint:** severity \`${oxlintRule.severity}\``;
        if (oxlintRule.config) {
          content += `, config: \`${JSON.stringify(oxlintRule.config)}\``;
        }
        content += `\n\n`;
      }
    }
  }

  content += `## Next Steps\n\n`;
  content += `1. **Fix duplicates**: Remove duplicate rules from ESLint configurations as they're now handled by Oxlint\n`;
  content += `2. **Resolve conflicts**: Decide which configuration to keep for conflicting rules and update accordingly\n`;
  content += `3. **Test changes**: Verify that both ESLint and Oxlint work correctly after the changes\n`;
  content += `4. **Clean up**: Remove this report file once all issues are resolved\n\n`;
  content += `---\n`;
  content += `*This report was generated by the ESLint-to-Oxlint migration tool*\n`;

  fs.writeFileSync(reportPath, content);
}

/**
 * Generate oxlint config for a single ESLint config file (first pass - no duplicate detection)
 */
async function generateOxlintConfig(eslintConfigPath: string): Promise<void> {
  const configDir = path.dirname(eslintConfigPath);
  const oxlintConfigPath = path.join(configDir, ".oxlintrc.json");

  // Load configurations
  const { eslintRules, eslintResolvedConfig, rawConfig, extendsFrom } =
    loadESLintConfig(eslintConfigPath);
  const relevantEslintRules = eslintRules.filter(
    (rule) =>
      rule.severity !== "off" ||
      allDefaultEnabledOxlintRules.includes(rule.name)
  );
  const { oxlintConfig: existingOxlintConfig, parentOxlintConfig } =
    loadOxlintConfig(oxlintConfigPath, extendsFrom);

  console.log(`Analyzing ESLint config: ${eslintConfigPath}`);

  if (parentOxlintConfig && !extendsFrom) {
    throw new Error(
      `Parent Oxlint config found but no extendsFrom found for ${eslintConfigPath}`
    );
  }

  // Analyze rule support using all rules (including overrides)
  const { supported, unsupported } = findSupportedRules(eslintRules);

  // Display enabled ESLint rules (sorted alphabetically) with support indicators
  console.log(
    `📋 ${relevantEslintRules.length} ESLint rules found (${supported.length} supported, ${unsupported.length} not supported):`
  );
  const sortedRules = [...relevantEslintRules].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  for (const rule of sortedRules) {
    const supportIcon = isSupportedByOxlint(rule.name) ? "☑️" : "⚠️";
    const normalizedName = rule.name.replace(
      /^typescript\//,
      "@typescript-eslint/"
    );
    console.log(`   ${supportIcon}  ${normalizedName}`);
  }
  console.log();

  // When extending from a parent config, only include rules directly defined in this config
  const filteredSupportedRules =
    parentOxlintConfig && rawConfig
      ? getDirectlyDefinedRules(rawConfig, supported)
      : supported;

  const { suggestedConfig, groupedRules } = generateSuggestedConfig({
    supportedRules: filteredSupportedRules,
    eslintResolvedConfig,
    rawConfig,
    parentOxlintConfig,
    parentConfigPath: extendsFrom,
    currentConfigPath: eslintConfigPath,
  });

  // Summary of unsupported rules (only show enabled ones)
  const enabledUnsupported = unsupported
    .filter((rule) => rule.severity !== "off")
    .map((rule) => {
      const normalizedName = rule.name.replace(
        /^typescript\//,
        "@typescript-eslint/"
      );
      return { ...rule, name: normalizedName };
    });

  if (enabledUnsupported.length > 0) {
    console.log("\n📝 Enabled ESLint rules that are NOT supported by Oxlint:");
    const sortedEnabledUnsupported = [...enabledUnsupported].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    for (const rule of sortedEnabledUnsupported) {
      console.log(`   - ${rule.name} (${rule.severity})`);
    }
  }

  // Check if the config should be removed (empty rules)
  const shouldRemove = shouldRemoveOxlintConfig(suggestedConfig);

  if (shouldRemove) {
    // Remove the oxlint config if it exists
    if (fs.existsSync(oxlintConfigPath)) {
      fs.unlinkSync(oxlintConfigPath);
      console.log(
        `\n🗑️  Removed empty oxlint configuration: ${oxlintConfigPath}`
      );
      console.log(`   ℹ️  This config had no rules to add`);
    } else {
      console.log(`\n✅ No oxlint configuration needed - no rules to add`);
    }
  } else {
    // Only write the config if it differs from the existing one
    const configsEqual = areOxlintConfigsEqual(
      suggestedConfig,
      existingOxlintConfig
    );

    if (configsEqual) {
      console.log(`\n✅ Current oxlint configuration is already up-to-date!`);
      console.log(
        `   No changes needed - the configuration matches the existing .oxlintrc.json`
      );
    } else {
      writeOxlintConfigWithComments(
        oxlintConfigPath,
        suggestedConfig,
        groupedRules
      );
      console.log(`\n📄 Oxlint configuration written to: ${oxlintConfigPath}`);

      // Format the oxlint config with prettier
      execSync(`npx prettier --write "${oxlintConfigPath}"`, {
        stdio: "ignore",
      });
    }
  }
}

/**
 * Analyze duplicates for a single ESLint config file (second pass - after all configs generated)
 */
async function analyzeDuplicates(eslintConfigPath: string): Promise<void> {
  const configDir = path.dirname(eslintConfigPath);
  const oxlintConfigPath = path.join(configDir, ".oxlintrc.json");

  // Load configurations
  const { eslintRules, rawConfig, extendsFrom } =
    loadESLintConfig(eslintConfigPath);

  // Load the final generated oxlint config (should exist now from first pass)
  const { oxlintRules: finalOxlintRules } = loadOxlintConfig(
    oxlintConfigPath,
    extendsFrom
  );

  // Get only the rules directly defined in this config file (not inherited)
  const directlyDefinedRules = rawConfig
    ? getDirectlyDefinedRules(rawConfig, eslintRules)
    : eslintRules;

  // Check for conflicts and duplicates using only directly defined rules
  const { duplicates, conflicts } = checkForConflicts(
    directlyDefinedRules,
    finalOxlintRules
  );

  const totalOverlap = duplicates.length + conflicts.length;

  if (totalOverlap > 0) {
    collectAnalysisReport({ duplicates, conflicts, eslintConfigPath });
  }
}

/**
 * Main execution function
 */
async function main(directoryPath: string = process.cwd()): Promise<void> {
  console.log("🔍 Finding all ESLint configuration files...\n");

  // Find all ESLint configs
  const allConfigs = await findESLintConfigs(directoryPath);
  console.log(`Found ${allConfigs.length} ESLint config files`);

  // Filter to only those with rules/overrides
  const configsWithRules = allConfigs.filter(hasRulesOrOverrides);
  console.log(
    `${configsWithRules.length} configs have meaningful rules/overrides`
  );

  // Filter out configs without rules (like app-front/.eslintrc.js)
  const filteredConfigs = allConfigs.filter(
    (config) => !hasRulesOrOverrides(config)
  );
  if (filteredConfigs.length > 0) {
    console.log(
      `Skipping ${filteredConfigs.length} configs that only have extends/parserOptions:`
    );
    for (const config of filteredConfigs) {
      console.log(`   - ${config}`);
    }
  }

  if (configsWithRules.length === 0) {
    console.log("No ESLint configs with rules found to migrate.");
    return;
  }

  // Sort by dependencies (parents first)
  const sortedConfigs = sortByDependencies(configsWithRules);
  console.log(`\nProcessing configs in dependency order:\n`);

  // PASS 1: Generate all oxlint configs first
  console.log(`\n🔧 PASS 1: Generating oxlint configurations...`);
  for (let i = 0; i < sortedConfigs.length; i++) {
    const eslintConfigPath = sortedConfigs[i];
    console.log(`\n${"=".repeat(80)}`);
    console.log(
      `Processing ${i + 1}/${sortedConfigs.length}: ${eslintConfigPath}`
    );
    console.log(`${"=".repeat(80)}`);

    await generateOxlintConfig(eslintConfigPath);
  }

  // PASS 2: Analyze duplicates after all configs are generated
  console.log(`\n\n🔍 PASS 2: Analyzing duplicate rules...`);
  for (let i = 0; i < sortedConfigs.length; i++) {
    const eslintConfigPath = sortedConfigs[i];
    await analyzeDuplicates(eslintConfigPath);
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("✨ Migration analysis complete for all configs!");
  console.log(`${"=".repeat(80)}`);

  // Generate consolidated report
  if (allReports.length > 0) {
    const reportPath = path.join(directoryPath, "eslint-8-to-oxlint-report.md");
    generateConsolidatedReport(reportPath, directoryPath);
    console.log(
      `\n📋 ESLint to Oxlint migration report written to: ${reportPath}`
    );
    const totalDuplicates = allReports.reduce(
      (sum, report) => sum + report.duplicates.length,
      0
    );
    const totalConflicts = allReports.reduce(
      (sum, report) => sum + report.conflicts.length,
      0
    );
    const totalIssues = totalDuplicates + totalConflicts;
    console.log(
      `   Found ${totalIssues} total issues: ${totalDuplicates} duplicates, ${totalConflicts} conflicts across ${allReports.length} configs`
    );
  }
}

// Run the script
if (require.main === module) {
  const targetPath = process.argv[2] || process.cwd();
  main(targetPath).catch(console.error);
}
