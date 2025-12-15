/* eslint-disable no-console, @typescript-eslint/no-var-requires, @typescript-eslint/no-shadow, @typescript-eslint/no-explicit-any */

/**
 * Function to analyze oxlintrc and eslintrc files in a directory,
 * and return a structure of rules to remove from eslintrc (as they are covered by oxlintrc).
 */

import * as fs from "fs";
import * as path from "path";
import {
  findESLintConfigs,
  hasRulesOrOverrides,
  loadESLintConfig,
  ESLintRule,
  EslintConfig,
  OxlintRulesRegistry,
  loadOxlintConfigViaCommand,
} from "./utils/config-parser";

export interface ReduceResult {
  eslintConfigPath: string;
  oxlintConfigPath: string;
  rulesToRemove: string[]; // Directly defined rules to disable
  inheritedRulesToDisable: string[]; // Inherited rules (from extends) to disable
  redundantOffRules: string[]; // Rules set to "off" in overrides but already handled
  unsupportedRules: string[]; // Rules enabled in ESLint but not supported by Oxlint
  pluginsToDisable: string[]; // Plugins where ALL enabled rules can be removed
  summary: {
    totalEslintRules: number;
    toRemove: number;
    inheritedToDisable: number;
    redundantOff: number;
  };
}

export interface AnalysisResult {
  results: ReduceResult[];
  analyzedOxlintConfigs: string[];
  eslintConfigsWithoutOxlint: string[];
  unsupportedRulesNotInOxlint: string[]; // Combined deduplicated list of rules not supported by Oxlint
}

export interface AnalyzeOptions {
  typeAware?: boolean;
}

/**
 * Extract only the rules that are directly defined in the raw config file (not inherited)
 * Uses the severity from the raw config, not the resolved config
 */
function getDirectlyDefinedRules(rawConfig: EslintConfig): ESLintRule[] {
  const directRules = new Map<string, ESLintRule>();

  // Helper to normalize severity
  const getSeverity = (value: unknown): "error" | "warn" | "off" => {
    if (typeof value === "number") {
      if (value === 2) return "error";
      if (value === 1) return "warn";
      return "off";
    }
    if (typeof value === "string") {
      if (value === "error" || value === "2") return "error";
      if (value === "warn" || value === "1") return "warn";
      return "off";
    }
    if (Array.isArray(value) && value.length > 0) {
      return getSeverity(value[0]);
    }
    return "off";
  };

  // Add rules directly defined in this config (top-level rules take precedence)
  if (rawConfig.rules && typeof rawConfig.rules === "object") {
    for (const [ruleName, ruleValue] of Object.entries(rawConfig.rules)) {
      const normalizedName = ruleName.replace(
        /^@typescript-eslint\//,
        "typescript/"
      );
      const severity = getSeverity(ruleValue);
      directRules.set(normalizedName, {
        name: normalizedName,
        severity,
      });
    }
  }

  // Rules in overrides that are "off" should NOT be added as candidates for removal
  // Only add override rules if they're enabling something (not disabling)
  if (rawConfig.overrides && Array.isArray(rawConfig.overrides)) {
    for (const override of rawConfig.overrides) {
      if (override.rules && typeof override.rules === "object") {
        for (const [ruleName, ruleValue] of Object.entries(override.rules)) {
          const normalizedName = ruleName.replace(
            /^@typescript-eslint\//,
            "typescript/"
          );
          const severity = getSeverity(ruleValue);
          // Only add if not already defined at top level and severity is not "off"
          if (!directRules.has(normalizedName) && severity !== "off") {
            directRules.set(normalizedName, {
              name: normalizedName,
              severity,
            });
          }
        }
      }
    }
  }

  return Array.from(directRules.values());
}

/**
 * Extract rules that are explicitly set to "off" in OVERRIDES only
 * Top-level "off" rules are intentional (user disabled for ESLint)
 * Override "off" rules might be redundant if oxlint handles the rule
 */
function getOffRulesFromOverrides(rawConfig: EslintConfig): string[] {
  const offRules = new Set<string>();

  // Only check overrides - top-level "off" rules are intentional
  if (rawConfig.overrides && Array.isArray(rawConfig.overrides)) {
    for (const override of rawConfig.overrides) {
      if (override.rules && typeof override.rules === "object") {
        for (const [ruleName, ruleValue] of Object.entries(override.rules)) {
          const severity: unknown = Array.isArray(ruleValue)
            ? ruleValue[0]
            : ruleValue;
          if (severity === "off" || severity === "0" || severity === 0) {
            offRules.add(
              ruleName.replace(/^@typescript-eslint\//, "typescript/")
            );
          }
        }
      }
    }
  }

  return Array.from(offRules);
}

/**
 * Extract the plugin prefix from a rule name
 * e.g., "@typescript-eslint/no-unused-vars" -> "@typescript-eslint"
 *       "react/jsx-uses-react" -> "react"
 *       "no-console" -> null (core ESLint rule)
 */
function getPluginPrefix(ruleName: string): string | null {
  if (ruleName.startsWith("@")) {
    // Scoped plugin like @typescript-eslint/rule-name
    const match = ruleName.match(/^(@[^/]+\/[^/]+)\//);
    if (match) return match[1];
    // Could also be @scope/rule-name format
    const simpleMatch = ruleName.match(/^(@[^/]+)\//);
    if (simpleMatch) return simpleMatch[1];
  } else if (ruleName.includes("/")) {
    // Unscoped plugin like react/rule-name
    return ruleName.split("/")[0];
  }
  return null; // Core ESLint rule
}

/**
 * Analyze a single eslint config against its corresponding oxlint config
 */
function analyzeConfigPair(
  eslintConfigPath: string,
  oxlintConfigPath: string,
  ruleRegistry: OxlintRulesRegistry,
  options: AnalyzeOptions = {}
): ReduceResult {
  const { typeAware = true } = options;

  // Load eslint configuration (both raw and resolved)
  const { rawConfig, eslintRules: resolvedEslintRules } =
    loadESLintConfig(eslintConfigPath);

  // Get only directly defined rules (not inherited)
  const directEslintRules = rawConfig ? getDirectlyDefinedRules(rawConfig) : [];

  // Create a set of directly defined rule names for quick lookup
  const directRuleNames = new Set(directEslintRules.map((r) => r.name));

  // Load oxlint configuration using --print-config command
  const oxlintRules = loadOxlintConfigViaCommand(oxlintConfigPath);

  // Create a map of oxlint rules for quick lookup
  const oxlintRuleMap = new Map<string, ESLintRule>();
  for (const rule of oxlintRules) {
    oxlintRuleMap.set(rule.name, rule);
  }

  const rulesToRemove: string[] = [];
  const unsupportedRules: string[] = [];

  // Check each eslint rule to see if it can be removed
  for (const eslintRule of directEslintRules) {
    // Skip disabled rules
    if (eslintRule.severity === "off") {
      continue;
    }

    // Check if rule is supported by oxlint
    if (!ruleRegistry.isSupportedByOxlint(eslintRule.name)) {
      // Track enabled rules that oxlint doesn't support
      const eslintRuleName = eslintRule.name.replace(
        /^typescript\//,
        "@typescript-eslint/"
      );
      unsupportedRules.push(eslintRuleName);
      continue;
    }

    // Skip type-aware rules when not running with --type-aware
    if (!typeAware && ruleRegistry.isTypeAware(eslintRule.name)) {
      continue;
    }

    const oxlintRule = oxlintRuleMap.get(eslintRule.name);
    if (oxlintRule && oxlintRule.severity !== "off") {
      // Rule is removable if both ESLint and oxlint have it enabled (not "off")
      // We ignore severity differences since the goal is to avoid duplicate enforcement
      // Convert rule name back to eslint format for removal suggestions
      const eslintRuleName = eslintRule.name.replace(
        /^typescript\//,
        "@typescript-eslint/"
      );
      rulesToRemove.push(eslintRuleName);
    } else {
      // Rule is supported by Oxlint but disabled in Oxlint config
      // ESLint still needs this rule, so it's "unsupported" in practice
      const eslintRuleName = eslintRule.name.replace(
        /^typescript\//,
        "@typescript-eslint/"
      );
      unsupportedRules.push(eslintRuleName);
    }
  }

  // Find inherited rules (from extends) that should be disabled
  // These are in the resolved config but not directly defined
  const inheritedRulesToDisable: string[] = [];
  for (const eslintRule of resolvedEslintRules) {
    // Skip if directly defined (already handled above)
    if (directRuleNames.has(eslintRule.name)) {
      continue;
    }

    // Skip disabled rules
    if (eslintRule.severity === "off") {
      continue;
    }

    // Check if rule is supported by oxlint
    if (!ruleRegistry.isSupportedByOxlint(eslintRule.name)) {
      // Track inherited rules that oxlint doesn't support
      const eslintRuleName = eslintRule.name.replace(
        /^typescript\//,
        "@typescript-eslint/"
      );
      unsupportedRules.push(eslintRuleName);
      continue;
    }

    // Skip type-aware rules when not running with --type-aware
    if (!typeAware && ruleRegistry.isTypeAware(eslintRule.name)) {
      continue;
    }

    const oxlintRule = oxlintRuleMap.get(eslintRule.name);
    if (oxlintRule && oxlintRule.severity !== "off") {
      // Inherited rule is enabled in both ESLint and Oxlint - should be disabled
      const eslintRuleName = eslintRule.name.replace(
        /^typescript\//,
        "@typescript-eslint/"
      );
      inheritedRulesToDisable.push(eslintRuleName);
    } else {
      // Rule is supported by Oxlint but disabled in Oxlint config
      // ESLint still needs this rule, so it's "unsupported" in practice
      const eslintRuleName = eslintRule.name.replace(
        /^typescript\//,
        "@typescript-eslint/"
      );
      unsupportedRules.push(eslintRuleName);
    }
  }

  // Find redundant "off" rules in overrides - rules disabled for specific files
  // but oxlint handles them anyway, so the override is redundant
  const redundantOffRules: string[] = [];
  if (rawConfig) {
    const offRules = getOffRulesFromOverrides(rawConfig);
    for (const ruleName of offRules) {
      // Check if rule is supported by oxlint
      if (!ruleRegistry.isSupportedByOxlint(ruleName)) {
        continue;
      }

      // Skip type-aware rules when not running with --type-aware
      if (!typeAware && ruleRegistry.isTypeAware(ruleName)) {
        continue;
      }

      const oxlintRule = oxlintRuleMap.get(ruleName);
      if (oxlintRule && oxlintRule.severity !== "off") {
        // The ESLint "off" is redundant - oxlint handles this rule
        const eslintRuleName = ruleName.replace(
          /^typescript\//,
          "@typescript-eslint/"
        );
        redundantOffRules.push(eslintRuleName);
      }
    }
  }

  // Detect plugins where ALL enabled rules can be removed
  // Group all enabled ESLint rules by plugin
  const enabledRulesByPlugin = new Map<string, Set<string>>();
  const allEnabledRules = [
    ...directEslintRules.filter((r) => r.severity !== "off"),
    ...resolvedEslintRules.filter(
      (r) => r.severity !== "off" && !directRuleNames.has(r.name)
    ),
  ];

  for (const rule of allEnabledRules) {
    const eslintRuleName = rule.name.replace(
      /^typescript\//,
      "@typescript-eslint/"
    );
    const plugin = getPluginPrefix(eslintRuleName);
    if (plugin) {
      if (!enabledRulesByPlugin.has(plugin)) {
        enabledRulesByPlugin.set(plugin, new Set());
      }
      enabledRulesByPlugin.get(plugin)!.add(eslintRuleName);
    }
  }

  // Group all rules to remove by plugin
  const allRulesToRemove = [...rulesToRemove, ...inheritedRulesToDisable];
  const rulesToRemoveByPlugin = new Map<string, Set<string>>();
  for (const ruleName of allRulesToRemove) {
    const plugin = getPluginPrefix(ruleName);
    if (plugin) {
      if (!rulesToRemoveByPlugin.has(plugin)) {
        rulesToRemoveByPlugin.set(plugin, new Set());
      }
      rulesToRemoveByPlugin.get(plugin)!.add(ruleName);
    }
  }

  // Find plugins where all enabled rules can be removed
  const pluginsToDisable: string[] = [];
  for (const [plugin, enabledRules] of enabledRulesByPlugin) {
    const removableRules = rulesToRemoveByPlugin.get(plugin);
    if (removableRules && removableRules.size === enabledRules.size) {
      // All enabled rules from this plugin can be removed
      pluginsToDisable.push(plugin);
    }
  }

  return {
    eslintConfigPath: path.relative(process.cwd(), eslintConfigPath),
    oxlintConfigPath: path.relative(process.cwd(), oxlintConfigPath),
    rulesToRemove,
    inheritedRulesToDisable,
    redundantOffRules,
    unsupportedRules,
    pluginsToDisable,
    summary: {
      totalEslintRules: directEslintRules.length,
      toRemove: rulesToRemove.length,
      inheritedToDisable: inheritedRulesToDisable.length,
      redundantOff: redundantOffRules.length,
    },
  };
}

/**
 * Main function to analyze oxlintrc and eslintrc files in a directory
 * and return rules to remove from eslintrc (as they are covered by oxlintrc)
 */
export async function analyzeDirectory(
  directoryPath: string = process.cwd(),
  options: AnalyzeOptions = {}
): Promise<AnalysisResult> {
  const ruleRegistry = OxlintRulesRegistry.load(directoryPath);

  const results: ReduceResult[] = [];
  const analyzedOxlintConfigs: string[] = [];
  const eslintConfigsWithoutOxlint: string[] = [];

  // Find all eslint configs in the directory
  const eslintConfigs = await findESLintConfigs(directoryPath);

  // Filter to only those with meaningful rules
  const configsWithRules = eslintConfigs.filter(hasRulesOrOverrides);

  for (const eslintConfigPath of configsWithRules) {
    const configDir = path.dirname(eslintConfigPath);
    const oxlintConfigPath = path.join(configDir, ".oxlintrc.json");

    // Track if no corresponding oxlint config exists
    if (!fs.existsSync(oxlintConfigPath)) {
      eslintConfigsWithoutOxlint.push(
        path.relative(process.cwd(), eslintConfigPath)
      );
      continue;
    }

    analyzedOxlintConfigs.push(path.relative(process.cwd(), oxlintConfigPath));

    const result = analyzeConfigPair(
      eslintConfigPath,
      oxlintConfigPath,
      ruleRegistry,
      options
    );
    results.push(result);
  }

  // Collect and dedupe unsupported rules across all configs
  const unsupportedRulesSet = new Set<string>();
  for (const result of results) {
    for (const rule of result.unsupportedRules) {
      unsupportedRulesSet.add(rule);
    }
  }
  const unsupportedRulesNotInOxlint = Array.from(unsupportedRulesSet).sort();

  return {
    results,
    analyzedOxlintConfigs,
    eslintConfigsWithoutOxlint,
    unsupportedRulesNotInOxlint,
  };
}

/**
 * Generate a human-readable report from the analysis results
 */
export function generateReport(analysis: AnalysisResult): string {
  const { results } = analysis;

  if (results.length === 0) {
    return "No configurations analyzed.\n";
  }

  // Collect plugins that can be fully disabled (across all configs)
  const allPluginsToDisable = new Set<string>();
  for (const result of results) {
    for (const plugin of result.pluginsToDisable) {
      allPluginsToDisable.add(plugin);
    }
  }

  // Helper to check if a rule belongs to a plugin that can be disabled
  const isRuleFromDisabledPlugin = (ruleName: string): boolean => {
    const plugin = getPluginPrefix(ruleName);
    return plugin !== null && allPluginsToDisable.has(plugin);
  };

  // Filter rules to exclude those from plugins that can be fully disabled
  const getFilteredRules = (rules: string[]): string[] =>
    rules.filter((r) => !isRuleFromDisabledPlugin(r));

  // Sort results by path depth (parent configs first)
  // This ensures we process root configs before child configs
  const sortedResults = [...results].sort((a, b) => {
    const depthA = a.eslintConfigPath.split("/").length;
    const depthB = b.eslintConfigPath.split("/").length;
    return depthA - depthB;
  });

  // Track rules already suggested in parent configs
  // Map from directory path to set of rules suggested for that path and its ancestors
  const rulesSuggestedByPath = new Map<string, Set<string>>();

  // Helper to get parent directory
  const getParentDir = (configPath: string): string => {
    const parts = configPath.split("/");
    parts.pop(); // Remove filename
    return parts.join("/") || ".";
  };

  // Helper to get rules already suggested by ancestors
  const getRulesSuggestedByAncestors = (configPath: string): Set<string> => {
    const suggested = new Set<string>();
    const configDir = getParentDir(configPath);
    const parts = configDir.split("/");

    // Check all ancestor paths
    for (let i = 0; i <= parts.length; i++) {
      const ancestorPath = parts.slice(0, i).join("/") || ".";
      const ancestorRules = rulesSuggestedByPath.get(ancestorPath);
      if (ancestorRules) {
        for (const rule of ancestorRules) {
          suggested.add(rule);
        }
      }
    }
    return suggested;
  };

  // Calculate filtered results, excluding rules already suggested by parent configs
  const filteredResults = sortedResults.map((r) => {
    const ancestorRules = getRulesSuggestedByAncestors(r.eslintConfigPath);

    const filteredRulesToRemove = getFilteredRules(r.rulesToRemove).filter(
      (rule) => !ancestorRules.has(rule)
    );
    const filteredInheritedRulesToDisable = getFilteredRules(
      r.inheritedRulesToDisable
    ).filter((rule) => !ancestorRules.has(rule));

    // Record all rules suggested for this config's directory
    const configDir = getParentDir(r.eslintConfigPath);
    const allSuggestedRules = new Set([
      ...filteredRulesToRemove,
      ...filteredInheritedRulesToDisable,
      ...(rulesSuggestedByPath.get(configDir) || []),
    ]);
    // Also include ancestor rules so children don't repeat
    for (const rule of ancestorRules) {
      allSuggestedRules.add(rule);
    }
    rulesSuggestedByPath.set(configDir, allSuggestedRules);

    return {
      ...r,
      filteredRulesToRemove,
      filteredInheritedRulesToDisable,
    };
  });

  const resultsWithRulesToRemove = filteredResults.filter(
    (r) => r.filteredRulesToRemove.length > 0
  );
  const resultsWithInheritedToDisable = filteredResults.filter(
    (r) => r.filteredInheritedRulesToDisable.length > 0
  );
  const resultsWithRedundantOff = results.filter(
    (r) => r.summary.redundantOff > 0
  );

  const totalRulesToRemove = filteredResults.reduce(
    (sum, r) => sum + r.filteredRulesToRemove.length,
    0
  );
  const totalInheritedToDisable = filteredResults.reduce(
    (sum, r) => sum + r.filteredInheritedRulesToDisable.length,
    0
  );
  const totalRedundantOff = results.reduce(
    (sum, r) => sum + r.summary.redundantOff,
    0
  );

  const { unsupportedRulesNotInOxlint } = analysis;

  if (
    allPluginsToDisable.size === 0 &&
    totalRulesToRemove === 0 &&
    totalInheritedToDisable === 0 &&
    totalRedundantOff === 0 &&
    unsupportedRulesNotInOxlint.length === 0
  ) {
    return "✓ No ESLint rules to remove - nothing is duplicated with Oxlint.\n";
  }

  let report = "";

  // Report plugins that can be fully disabled
  if (allPluginsToDisable.size > 0) {
    report += `Plugins that can be fully disabled (all rules handled by Oxlint):\n`;
    for (const plugin of Array.from(allPluginsToDisable).sort()) {
      report += `  ${plugin}\n`;
    }
  }

  // Report directly defined rules to remove (excluding rules from disabled plugins)
  if (totalRulesToRemove > 0) {
    if (report.length > 0) {
      report += "\n";
    }
    report += `Found ${totalRulesToRemove} ESLint rule(s) to remove across ${resultsWithRulesToRemove.length} config(s):\n\n`;

    for (let i = 0; i < resultsWithRulesToRemove.length; i++) {
      const result = resultsWithRulesToRemove[i];
      report += `${result.eslintConfigPath}\n`;
      for (const ruleName of result.filteredRulesToRemove.sort()) {
        report += `  "${ruleName}": "off",\n`;
      }
      if (i < resultsWithRulesToRemove.length - 1) {
        report += "\n";
      }
    }
  }

  // Report inherited rules (from extends) that should be disabled
  if (totalInheritedToDisable > 0) {
    if (report.length > 0) {
      report += "\n\n";
    }
    report += `Found ${totalInheritedToDisable} inherited ESLint rule(s) to disable (from extends, now handled by Oxlint):\n\n`;

    for (let i = 0; i < resultsWithInheritedToDisable.length; i++) {
      const result = resultsWithInheritedToDisable[i];
      report += `${result.eslintConfigPath}\n`;
      for (const ruleName of result.filteredInheritedRulesToDisable.sort()) {
        report += `  "${ruleName}": "off",\n`;
      }
      if (i < resultsWithInheritedToDisable.length - 1) {
        report += "\n";
      }
    }
  }

  // Report redundant "off" rules (can be cleaned up)
  if (totalRedundantOff > 0) {
    if (report.length > 0) {
      report += "\n\n";
    }
    report += `Found ${totalRedundantOff} redundant "off" rule(s) that can be removed (already disabled by parent):\n\n`;

    for (let i = 0; i < resultsWithRedundantOff.length; i++) {
      const result = resultsWithRedundantOff[i];
      report += `${result.eslintConfigPath}\n`;
      for (const ruleName of result.redundantOffRules.sort()) {
        report += `  "${ruleName}": "off",  <- can be removed\n`;
      }
      if (i < resultsWithRedundantOff.length - 1) {
        report += "\n";
      }
    }
  }

  // Report enabled ESLint rules not covered by Oxlint (either unsupported or disabled in Oxlint config)
  if (unsupportedRulesNotInOxlint.length > 0) {
    if (report.length > 0) {
      report += "\n\n";
    }
    report += `ESLint rules still needed (not covered by current Oxlint config):\n`;
    for (const ruleName of unsupportedRulesNotInOxlint) {
      report += `  ${ruleName}\n`;
    }
  }

  return report;
}

// Run the script
if (require.main === module) {
  // Parse arguments
  const args = process.argv.slice(2);
  let targetPath = process.cwd();
  let typeAware: boolean | undefined;

  for (const arg of args) {
    if (arg === "--type-aware") {
      typeAware = true;
    } else if (arg.startsWith("--type-aware=")) {
      typeAware = arg.split("=")[1] === "true";
    } else if (!arg.startsWith("--")) {
      targetPath = arg;
    }
  }

  if (typeAware === undefined) {
    console.error(
      "Error: --type-aware flag is required.\n" +
        "Usage: npx tsx src/reduce.ts <path> --type-aware\n" +
        "       npx tsx src/reduce.ts <path> --type-aware=true\n" +
        "       npx tsx src/reduce.ts <path> --type-aware=false"
    );
    process.exit(1);
  }

  async function run() {
    const report = generateReport(
      await analyzeDirectory(targetPath, { typeAware: typeAware! })
    );
    console.log(report.trimEnd());
  }

  run().catch(console.error);
}
