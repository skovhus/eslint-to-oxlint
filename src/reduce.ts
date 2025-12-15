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
  rulesToRemove: string[];
  summary: {
    totalEslintRules: number;
    toRemove: number;
  };
}

export interface AnalysisResult {
  results: ReduceResult[];
  analyzedOxlintConfigs: string[];
  eslintConfigsWithoutOxlint: string[];
}

export interface AnalyzeOptions {
  typeAware?: boolean;
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
 * Analyze a single eslint config against its corresponding oxlint config
 */
function analyzeConfigPair(
  eslintConfigPath: string,
  oxlintConfigPath: string,
  ruleRegistry: OxlintRulesRegistry,
  options: AnalyzeOptions = {}
): ReduceResult {
  const { typeAware = true } = options;

  // Load eslint configuration
  const { eslintRules, rawConfig } = loadESLintConfig(eslintConfigPath);

  // Get only directly defined rules (not inherited)
  const directEslintRules = rawConfig
    ? getDirectlyDefinedRules(rawConfig, eslintRules)
    : eslintRules;

  // Load oxlint configuration using --print-config command
  const oxlintRules = loadOxlintConfigViaCommand(oxlintConfigPath);

  // Create a map of oxlint rules for quick lookup
  const oxlintRuleMap = new Map<string, ESLintRule>();
  for (const rule of oxlintRules) {
    oxlintRuleMap.set(rule.name, rule);
  }

  const rulesToRemove: string[] = [];

  // Check each eslint rule to see if it can be removed
  for (const eslintRule of directEslintRules) {
    // Skip disabled rules
    if (eslintRule.severity === "off") {
      continue;
    }

    // Check if rule is supported by oxlint
    if (!ruleRegistry.isSupportedByOxlint(eslintRule.name)) {
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
    }
  }

  return {
    eslintConfigPath: path.relative(process.cwd(), eslintConfigPath),
    oxlintConfigPath: path.relative(process.cwd(), oxlintConfigPath),
    rulesToRemove,
    summary: {
      totalEslintRules: directEslintRules.length,
      toRemove: rulesToRemove.length,
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

  return { results, analyzedOxlintConfigs, eslintConfigsWithoutOxlint };
}

/**
 * Generate a human-readable report from the analysis results
 */
export function generateReport(analysis: AnalysisResult): string {
  const { results } = analysis;

  if (results.length === 0) {
    return "No configurations analyzed.\n";
  }

  const resultsWithRules = results.filter((r) => r.summary.toRemove > 0);
  const totalRulesToRemove = results.reduce(
    (sum, r) => sum + r.summary.toRemove,
    0
  );

  if (totalRulesToRemove === 0) {
    return "✓ No ESLint rules to remove - nothing is duplicated with Oxlint.\n";
  }

  let report = `Found ${totalRulesToRemove} ESLint rule(s) to remove across ${resultsWithRules.length} config(s):\n\n`;

  for (let i = 0; i < resultsWithRules.length; i++) {
    const result = resultsWithRules[i];
    report += `${result.eslintConfigPath}\n`;
    for (const ruleName of result.rulesToRemove.sort()) {
      report += `  "${ruleName}": "off",\n`;
    }
    if (i < resultsWithRules.length - 1) {
      report += "\n";
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
