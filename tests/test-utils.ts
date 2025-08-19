import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";

export interface TestResult {
  directorySnapshot: string;
  scriptResult: { success: boolean; error?: string };
}

export class TempTestDirectory {
  public readonly path: string;
  private readonly fixturesDir: string;

  constructor(fixturesSubdir: string) {
    this.path = fs.mkdtempSync(
      path.join(os.tmpdir(), "eslint-to-oxlint-test-")
    );
    this.fixturesDir = path.resolve(__dirname, "fixtures", fixturesSubdir);
  }

  /**
   * Copy all files from fixtures directory to temp directory
   */
  copyFixtures(): void {
    if (!fs.existsSync(this.fixturesDir)) {
      throw new Error(`Fixtures directory not found: ${this.fixturesDir}`);
    }

    const files = fs.readdirSync(this.fixturesDir);
    for (const file of files) {
      const srcPath = path.join(this.fixturesDir, file);
      const destPath = path.join(this.path, file);
      const stat = fs.statSync(srcPath);

      if (stat.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Run the init.ts script in the temp directory
   */
  runInitScript(): { success: boolean; error?: string } {
    const initPath = path.resolve(__dirname, "..", "src", "init.ts");
    execSync(`npx tsx "${initPath}" ${this.path}`, {
      cwd: this.path,
      stdio: "pipe",
      env: {
        ...process.env,
        NODE_ENV: "test",
        ESLINT_USE_FLAT_CONFIG: "false", // Enable legacy .eslintrc.js support in ESLint v9
      },
    });
    return { success: true };
  }

  /**
   * Read the results of running the init script
   */
  readResults(scriptResult: { success: boolean; error?: string }): TestResult {
    return {
      directorySnapshot: this.generateDirectorySnapshot(),
      scriptResult,
    };
  }

  /**
   * Generate a complete directory snapshot showing file structure and contents
   */
  generateDirectorySnapshot(): string {
    const snapshot: string[] = [];
    snapshot.push("=== DIRECTORY STRUCTURE ===");

    this.addDirectoryToSnapshot(this.path, "", snapshot);

    return snapshot.join("\n");
  }

  private addDirectoryToSnapshot(
    dirPath: string,
    indent: string,
    snapshot: string[]
  ): void {
    const entries = fs.readdirSync(dirPath).sort();

    for (const entry of entries) {
      // Skip irrelevant files/directories
      if (this.shouldExcludeFromSnapshot(entry)) {
        continue;
      }

      const fullPath = path.join(dirPath, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        snapshot.push(`${indent}📁 ${entry}/`);
        this.addDirectoryToSnapshot(fullPath, indent + "  ", snapshot);
      } else {
        snapshot.push(`${indent}📄 ${entry}`);

        // Add file content for generated/modified files
        if (this.shouldIncludeFileContent(entry)) {
          snapshot.push(`${indent}  │`);
          snapshot.push(`${indent}  └─ Content:`);
          let content = fs.readFileSync(fullPath, "utf8");

          // Normalize JSON formatting for consistent snapshots
          if (entry.endsWith(".json")) {
            try {
              const jsonObj = JSON.parse(content);
              content = JSON.stringify(jsonObj, null, 2);
            } catch (e) {
              // If not valid JSON, keep original content
            }
          }

          // Normalize timestamps in report files for consistent snapshots
          if (entry.includes("report.md")) {
            content = content.replace(
              /\*\*Generated:\*\* \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/,
              "**Generated:** [TIMESTAMP]"
            );
          }

          const contentLines = content.split("\n");
          for (const line of contentLines) {
            snapshot.push(`${indent}     ${line}`);
          }
          snapshot.push(`${indent}     `);
        } else {
          // For unchanged files, just note that they weren't modified
          snapshot.push(`${indent}  └─ No content changes`);
        }
      }
    }
  }

  private shouldExcludeFromSnapshot(filename: string): boolean {
    const excludedItems = ["node_modules", "package.json", "pnpm-lock.yaml"];
    return excludedItems.includes(filename);
  }

  private shouldIncludeFileContent(filename: string): boolean {
    // Only show content for files that are generated/modified by the script
    const generatedFiles = [".oxlintrc.json", "eslint-8-to-oxlint-report.md"];
    return generatedFiles.includes(filename);
  }

  /**
   * Clean up the temp directory
   */
  cleanup(): void {
    if (fs.existsSync(this.path)) {
      fs.rmSync(this.path, { recursive: true });
    }
  }

  private copyDirectory(src: string, dest: string): void {
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      const srcEntry = path.join(src, entry);
      const destEntry = path.join(dest, entry);
      const entryStat = fs.statSync(srcEntry);

      if (entryStat.isDirectory()) {
        fs.mkdirSync(destEntry, { recursive: true });
        this.copyDirectory(srcEntry, destEntry);
      } else {
        fs.copyFileSync(srcEntry, destEntry);
      }
    }
  }
}

/**
 * Helper function to run a complete test scenario
 */
export function runTestScenario(fixturesSubdir: string = "init"): TestResult {
  const testDir = new TempTestDirectory(fixturesSubdir);
  try {
    testDir.copyFixtures();
    const scriptResult = testDir.runInitScript();
    return testDir.readResults(scriptResult);
  } finally {
    testDir.cleanup();
  }
}
