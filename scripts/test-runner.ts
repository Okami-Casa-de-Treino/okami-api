#!/usr/bin/env bun

import { spawn } from "bun";
import { dbManager } from "../src/config/database.js";

interface TestOptions {
  category?: 'unit' | 'integration' | 'api' | 'all';
  watch?: boolean;
  coverage?: boolean;
  verbose?: boolean;
  file?: string;
}

class TestRunner {
  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      const isHealthy = await dbManager.healthCheck();
      if (isHealthy) {
        console.log("✅ Database connection verified");
        return true;
      } else {
        console.log("❌ Database health check failed");
        return false;
      }
    } catch (error) {
      console.log("❌ Database connection failed:", error);
      return false;
    }
  }

  private async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch("http://localhost:3000/health");
      if (response.ok) {
        console.log("✅ API server is running");
        return true;
      } else {
        console.log("❌ API server health check failed");
        return false;
      }
    } catch (error) {
      console.log("❌ API server is not running. Please start it with: bun run dev");
      return false;
    }
  }

  private async setupTestEnvironment(): Promise<boolean> {
    console.log("🔧 Setting up test environment...");
    
    // Check database
    const dbOk = await this.checkDatabaseConnection();
    if (!dbOk) {
      console.log("💡 Try running: bun run db:setup");
      return false;
    }

    // Check server for API tests
    const serverOk = await this.checkServerHealth();
    if (!serverOk) {
      console.log("💡 Start the server in another terminal: bun run dev");
      console.log("   Or run only unit tests: bun run test:unit");
    }

    return dbOk && serverOk;
  }

  private buildTestCommand(options: TestOptions): string[] {
    const cmd = ["bun", "test"];

    // Add test pattern based on category
    if (options.category && options.category !== 'all') {
      cmd.push("--testNamePattern", options.category === 'unit' ? 'Unit' : 
               options.category === 'integration' ? 'Integration' : 'API');
    }

    // Add specific file if provided
    if (options.file) {
      cmd.push(options.file);
    }

    // Add flags
    if (options.watch) {
      cmd.push("--watch");
    }

    if (options.coverage) {
      cmd.push("--coverage");
    }

    if (options.verbose) {
      cmd.push("--verbose");
    }

    return cmd;
  }

  async run(options: TestOptions = {}): Promise<void> {
    console.log("🧪 Okami API Test Runner");
    console.log("========================");

    // Setup environment for API tests
    if (!options.category || options.category === 'all' || options.category === 'api') {
      const envReady = await this.setupTestEnvironment();
      if (!envReady) {
        console.log("\n❌ Environment setup failed. Some tests may not run properly.");
        console.log("   You can still run unit tests with: bun run test:unit");
        
        if (options.category === 'api') {
          process.exit(1);
        }
      }
    }

    // Build and run test command
    const testCmd = this.buildTestCommand(options);
    
    console.log(`\n🚀 Running tests: ${testCmd.join(' ')}`);
    console.log("========================\n");

    try {
      const proc = spawn(testCmd, {
        stdio: ["inherit", "inherit", "inherit"],
      });

      const exitCode = await proc.exited;
      
      if (exitCode === 0) {
        console.log("\n✅ All tests passed!");
      } else {
        console.log("\n❌ Some tests failed.");
        process.exit(exitCode);
      }
    } catch (error) {
      console.error("❌ Test execution failed:", error);
      process.exit(1);
    }
  }
}

// Parse command line arguments
function parseArgs(): TestOptions {
  const args = process.argv.slice(2);
  const options: TestOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--unit':
        options.category = 'unit';
        break;
      case '--integration':
        options.category = 'integration';
        break;
      case '--api':
        options.category = 'api';
        break;
      case '--watch':
        options.watch = true;
        break;
      case '--coverage':
        options.coverage = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--file':
        options.file = args[++i];
        break;
      case '--help':
        showHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
🧪 Okami API Test Runner

Usage: bun run scripts/test-runner.ts [options]

Options:
  --unit         Run only unit tests
  --integration  Run only integration tests  
  --api          Run only API tests
  --watch        Run tests in watch mode
  --coverage     Generate coverage report
  --verbose      Verbose output
  --file <path>  Run specific test file
  --help         Show this help

Examples:
  bun run scripts/test-runner.ts                    # Run all tests
  bun run scripts/test-runner.ts --unit             # Unit tests only
  bun run scripts/test-runner.ts --api --watch      # API tests in watch mode
  bun run scripts/test-runner.ts --file tests/unit/auth.test.ts

Environment Requirements:
  - PostgreSQL database running on localhost:5432
  - API server running on localhost:3000 (for API tests)
  - Environment variables configured in .env file
`);
}

// Main execution
if (import.meta.main) {
  const options = parseArgs();
  const runner = new TestRunner();
  await runner.run(options);
} 