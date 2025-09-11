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
  ruleRegistry: OxlintRulesRegistry
): ReduceResult {
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
  directoryPath: string = process.cwd()
): Promise<ReduceResult[]> {
  const ruleRegistry = OxlintRulesRegistry.load();

  const results: ReduceResult[] = [];

  // Find all eslint configs in the directory
  const eslintConfigs = await findESLintConfigs(directoryPath);

  // Filter to only those with meaningful rules
  const configsWithRules = eslintConfigs.filter(hasRulesOrOverrides);

  for (const eslintConfigPath of configsWithRules) {
    const configDir = path.dirname(eslintConfigPath);
    const oxlintConfigPath = path.join(configDir, ".oxlintrc.json");

    // Skip if no corresponding oxlint config exists
    if (!fs.existsSync(oxlintConfigPath)) {
      console.log(`No oxlint config found for ${eslintConfigPath}`);
      continue;
    }

    const result = analyzeConfigPair(
      eslintConfigPath,
      oxlintConfigPath,
      ruleRegistry
    );
    results.push(result);
  }

  return results;
}

/**
 * Generate a human-readable report from the analysis results
 */
export function generateReport(results: ReduceResult[]): string {
  let report = "# ESLint to Oxlint Reduction Analysis\n\n";

  if (results.length === 0) {
    report += "No configurations analyzed.\n";
    return report;
  }

  // Summary
  const totalConfigs = results.length;
  const totalRulesToRemove = results.reduce(
    (sum, r) => sum + r.summary.toRemove,
    0
  );

  report += `## Summary\n\n`;
  report += `- **Configurations analyzed**: ${totalConfigs}\n`;
  report += `- **Rules recommended for removal**: ${totalRulesToRemove}\n\n`;

  // Per-config details
  for (const result of results) {
    const relativeEslintPath = path.relative(
      process.cwd(),
      result.eslintConfigPath
    );
    const relativeOxlintPath = path.relative(
      process.cwd(),
      result.oxlintConfigPath
    );

    report += `## ${relativeEslintPath}\n\n`;
    report += `**Oxlint config**: ${relativeOxlintPath}\n\n`;

    if (result.summary.toRemove > 0) {
      report += `### Rules to Remove (${result.summary.toRemove})\n\n`;
      report += `The following rules can be safely removed from ESLint as they are covered by Oxlint.\n\n`;
      report += `Copy-paste this into your ESLint config to disable these rules:\n\n`;
      report += `\`\`\`javascript\n`;
      report += `{\n`;
      report += `  rules: {\n`;

      for (const ruleName of result.rulesToRemove.sort()) {
        report += `    "${ruleName}": "off",\n`;
      }

      report += `  }\n`;
      report += `}\n`;
      report += `\`\`\`\n\n`;
    } else {
      report += `### No Rules to Remove\n\n`;
      report += `No ESLint rules were found that are covered by Oxlint.\n\n`;
    }
  }

  return report;
}

// Run the script
if (require.main === module) {
  const targetPath = process.argv[2] || process.cwd();

  async function run() {
    const report = generateReport(await analyzeDirectory(targetPath));
    console.log(report);
  }

  run().catch(console.error);
}
