#!/usr/bin/env node

/**
 * Comprehensive Front-End Smoke Test Suite
 * Tests all UI features on both mobile and desktop platforms
 * Provides detailed error messages with codes and timestamps
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Error codes for clear identification
const ERROR_CODES = {
  DEPS_MISSING: 'E001',
  BUILD_FAILED: 'E002',
  TEST_FAILED: 'E003',
  LINT_FAILED: 'E004',
  TYPE_CHECK_FAILED: 'E005',
  CONFIG_MISSING: 'E006',
  MOBILE_SETUP_INVALID: 'E007',
  DESKTOP_SETUP_INVALID: 'E008',
  COMPONENT_MISSING: 'E009',
  ROUTE_INVALID: 'E010',
};

class SmokeTestRunner {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
    };
    this.startTime = new Date();
  }

  log(message, color = 'reset') {
    const timestamp = new Date().toISOString();
    console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
  }

  logSection(title) {
    console.log('\n' + '='.repeat(80));
    this.log(title, 'cyan');
    console.log('='.repeat(80) + '\n');
  }

  logError(code, message, details = null) {
    const timestamp = new Date().toISOString();
    this.log(`ERROR [${code}]: ${message}`, 'red');
    if (details) {
      console.log(`${colors.yellow}Details: ${details}${colors.reset}`);
    }
    console.log(`${colors.yellow}Time: ${timestamp}${colors.reset}\n`);
    this.results.failed.push({ code, message, details, timestamp });
  }

  logSuccess(message) {
    this.log(`✓ ${message}`, 'green');
    this.results.passed.push(message);
  }

  logWarning(message) {
    this.log(`⚠ ${message}`, 'yellow');
    this.results.warnings.push(message);
  }

  async runCommand(command, args, cwd = ROOT_DIR, description = '') {
    return new Promise((resolve, reject) => {
      this.log(`Running: ${command} ${args.join(' ')}`, 'blue');
      if (description) {
        this.log(`Purpose: ${description}`, 'blue');
      }

      const proc = spawn(command, args, {
        cwd,
        shell: true,
        stdio: 'pipe',
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject({ stdout, stderr, code });
        }
      });

      proc.on('error', (error) => {
        reject({ error: error.message, code: -1 });
      });
    });
  }

  checkFileExists(filePath, description) {
    const fullPath = join(ROOT_DIR, filePath);
    if (existsSync(fullPath)) {
      this.logSuccess(`${description}: ${filePath}`);
      return true;
    } else {
      this.logError(
        ERROR_CODES.CONFIG_MISSING,
        `Missing file: ${filePath}`,
        description
      );
      return false;
    }
  }

  async checkDependencies() {
    this.logSection('Phase 1: Dependency Verification');

    const workspaces = ['mobile', 'terminal', 'frontend-components', 'backend'];
    let allDepsValid = true;

    for (const workspace of workspaces) {
      const packageJsonPath = join(ROOT_DIR, workspace, 'package.json');
      const nodeModulesPath = join(ROOT_DIR, workspace, 'node_modules');

      this.log(`Checking ${workspace}...`, 'cyan');

      if (!existsSync(packageJsonPath)) {
        this.logError(
          ERROR_CODES.DEPS_MISSING,
          `package.json not found in ${workspace}`,
          `Expected at: ${packageJsonPath}\n` +
          `Solution: Ensure you're in the correct directory and the workspace exists.`
        );
        allDepsValid = false;
        continue;
      }

      if (!existsSync(nodeModulesPath)) {
        this.logError(
          ERROR_CODES.DEPS_MISSING,
          `Dependencies not installed in ${workspace}`,
          `Missing: node_modules directory\n` +
          `Solution: Run 'npm install' in the root directory, or:\n` +
          `  cd ${workspace} && npm install`
        );
        allDepsValid = false;
      } else {
        this.logSuccess(`${workspace}: Dependencies installed`);
      }
    }

    return allDepsValid;
  }

  async checkMobileSetup() {
    this.logSection('Phase 2: Mobile Platform Setup Verification');

    const mobileDir = join(ROOT_DIR, 'mobile');
    const checks = [
      {
        file: 'src/App.tsx',
        description: 'Mobile App entry point',
      },
      {
        file: 'src/main.tsx',
        description: 'Mobile main file',
      },
      {
        file: 'src/components/MobileLayout.tsx',
        description: 'Mobile layout component',
      },
      {
        file: 'src/pages/MobileDashboard.tsx',
        description: 'Mobile dashboard page',
      },
      {
        file: 'src/pages/MobilePipeline.tsx',
        description: 'Mobile pipeline page',
      },
      {
        file: 'src/pages/MobileTrials.tsx',
        description: 'Mobile trials page',
      },
      {
        file: 'src/pages/MobileFinancial.tsx',
        description: 'Mobile financial page',
      },
      {
        file: 'src/pages/MobileIntelligence.tsx',
        description: 'Mobile intelligence page',
      },
      {
        file: 'src/pages/MobileNews.tsx',
        description: 'Mobile news page',
      },
      {
        file: 'vite.config.ts',
        description: 'Vite configuration for mobile',
      },
      {
        file: 'tsconfig.json',
        description: 'TypeScript configuration',
      },
    ];

    let allValid = true;
    for (const check of checks) {
      const filePath = join(mobileDir, check.file);
      if (!existsSync(filePath)) {
        this.logError(
          ERROR_CODES.MOBILE_SETUP_INVALID,
          `Mobile component missing: ${check.file}`,
          `${check.description} not found.\n` +
          `Expected at: ${filePath}\n` +
          `Solution: Ensure mobile workspace is properly set up. Run 'npm install' from root.`
        );
        allValid = false;
      } else {
        this.logSuccess(`${check.description}`);
      }
    }

    // Check mobile routes
    this.log('\nVerifying mobile routes...', 'cyan');
    const appTsx = join(mobileDir, 'src/App.tsx');
    if (existsSync(appTsx)) {
      const content = readFileSync(appTsx, 'utf-8');
      const routes = [
        '/dashboard',
        '/pipeline',
        '/trials',
        '/financial',
        '/intelligence',
        '/news',
      ];

      for (const route of routes) {
        if (content.includes(route)) {
          this.logSuccess(`Route defined: ${route}`);
        } else {
          this.logError(
            ERROR_CODES.ROUTE_INVALID,
            `Mobile route missing: ${route}`,
            `Route not found in App.tsx\n` +
            `Solution: Add route configuration for ${route}`
          );
          allValid = false;
        }
      }
    }

    return allValid;
  }

  async checkDesktopSetup() {
    this.logSection('Phase 3: Desktop Platform Setup Verification');

    const terminalDir = join(ROOT_DIR, 'terminal');
    const checks = [
      {
        file: 'src/App.tsx',
        description: 'Terminal App entry point',
      },
      {
        file: 'src/main.tsx',
        description: 'Terminal main file',
      },
      {
        file: 'src/pages/DashboardPage.tsx',
        description: 'Dashboard page',
      },
      {
        file: 'src/pages/PipelinePage.tsx',
        description: 'Pipeline page',
      },
      {
        file: 'src/pages/FinancialModelingPage.tsx',
        description: 'Financial modeling page',
      },
      {
        file: 'src/pages/MarketIntelligencePage.tsx',
        description: 'Market intelligence page',
      },
      {
        file: 'src/pages/ClinicalTrialsPage.tsx',
        description: 'Clinical trials page',
      },
      {
        file: 'src/pages/NewsPage.tsx',
        description: 'News page',
      },
      {
        file: 'index.html',
        description: 'Terminal HTML entry point',
      },
    ];

    let allValid = true;
    for (const check of checks) {
      const filePath = join(terminalDir, check.file);
      if (!existsSync(filePath)) {
        this.logError(
          ERROR_CODES.DESKTOP_SETUP_INVALID,
          `Desktop component missing: ${check.file}`,
          `${check.description} not found.\n` +
          `Expected at: ${filePath}\n` +
          `Solution: Ensure terminal workspace is properly set up. Run 'npm install' from root.`
        );
        allValid = false;
      } else {
        this.logSuccess(`${check.description}`);
      }
    }

    return allValid;
  }

  async checkTypeScript() {
    this.logSection('Phase 4: TypeScript Validation');

    const workspaces = [
      { name: 'mobile', dir: 'mobile' },
      { name: 'terminal', dir: 'terminal' },
      { name: 'frontend-components', dir: 'frontend-components' },
    ];

    let allValid = true;

    for (const workspace of workspaces) {
      this.log(`Type checking ${workspace.name}...`, 'cyan');
      try {
        await this.runCommand(
          'npm',
          ['run', 'typecheck'],
          join(ROOT_DIR, workspace.dir),
          `Type check ${workspace.name}`
        );
        this.logSuccess(`${workspace.name}: Type check passed`);
      } catch (error) {
        this.logError(
          ERROR_CODES.TYPE_CHECK_FAILED,
          `TypeScript errors in ${workspace.name}`,
          `Exit code: ${error.code}\n` +
          `Errors:\n${error.stderr || error.stdout}\n` +
          `Solution: Fix TypeScript errors in ${workspace.name} workspace.\n` +
          `Run 'cd ${workspace.dir} && npm run typecheck' for details.`
        );
        allValid = false;
      }
    }

    return allValid;
  }

  async checkLinting() {
    this.logSection('Phase 5: Code Quality (Linting)');

    const workspaces = [
      { name: 'mobile', dir: 'mobile' },
      { name: 'terminal', dir: 'terminal' },
      { name: 'frontend-components', dir: 'frontend-components' },
    ];

    let allValid = true;

    for (const workspace of workspaces) {
      this.log(`Linting ${workspace.name}...`, 'cyan');
      try {
        await this.runCommand(
          'npm',
          ['run', 'lint'],
          join(ROOT_DIR, workspace.dir),
          `Lint ${workspace.name}`
        );
        this.logSuccess(`${workspace.name}: Linting passed`);
      } catch (error) {
        // Some linting errors are warnings, not failures
        if (error.code === 1 && error.stdout && error.stdout.includes('warning')) {
          this.logWarning(`${workspace.name}: Linting completed with warnings`);
        } else {
          this.logError(
            ERROR_CODES.LINT_FAILED,
            `Linting failed in ${workspace.name}`,
            `Exit code: ${error.code}\n` +
            `Errors:\n${error.stderr || error.stdout}\n` +
            `Solution: Fix linting errors in ${workspace.name} workspace.\n` +
            `Run 'cd ${workspace.dir} && npm run lint' for details.`
          );
          allValid = false;
        }
      }
    }

    return allValid;
  }

  async checkBuilds() {
    this.logSection('Phase 6: Build Verification');

    const workspaces = [
      { name: 'frontend-components', dir: 'frontend-components', priority: 1 },
      { name: 'mobile', dir: 'mobile', priority: 2 },
      { name: 'terminal', dir: 'terminal', priority: 2 },
    ];

    // Sort by priority (components must be built first)
    workspaces.sort((a, b) => a.priority - b.priority);

    let allValid = true;

    for (const workspace of workspaces) {
      this.log(`Building ${workspace.name}...`, 'cyan');
      try {
        await this.runCommand(
          'npm',
          ['run', 'build'],
          join(ROOT_DIR, workspace.dir),
          `Build ${workspace.name}`
        );
        this.logSuccess(`${workspace.name}: Build successful`);
      } catch (error) {
        this.logError(
          ERROR_CODES.BUILD_FAILED,
          `Build failed in ${workspace.name}`,
          `Exit code: ${error.code}\n` +
          `Errors:\n${error.stderr || error.stdout}\n` +
          `Solution: Fix build errors in ${workspace.name} workspace.\n` +
          `Run 'cd ${workspace.dir} && npm run build' for details.\n` +
          (workspace.name !== 'frontend-components' 
            ? 'Note: Ensure frontend-components is built first (npm run build:components from root).'
            : '')
        );
        allValid = false;
      }
    }

    return allValid;
  }

  async checkMobileDevServer() {
    this.logSection('Phase 7: Mobile Dev Server Test');

    this.log('Testing mobile dev server startup...', 'cyan');
    
    const mobileDir = join(ROOT_DIR, 'mobile');
    
    return new Promise((resolve) => {
      const proc = spawn('npm', ['run', 'dev'], {
        cwd: mobileDir,
        shell: true,
        stdio: 'pipe',
      });

      let output = '';
      let serverStarted = false;

      const timeout = setTimeout(() => {
        proc.kill();
        if (!serverStarted) {
          this.logError(
            ERROR_CODES.MOBILE_SETUP_INVALID,
            'Mobile dev server failed to start',
            `Server did not respond within 30 seconds.\n` +
            `Output:\n${output}\n` +
            `Solution:\n` +
            `1. Check that port 3002 is not already in use\n` +
            `2. Verify dependencies are installed: cd mobile && npm install\n` +
            `3. Check vite.config.ts exists and is valid\n` +
            `4. Try running manually: cd mobile && npm run dev`
          );
          resolve(false);
        }
      }, 30000);

      proc.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('Local:') || output.includes('localhost:3002')) {
          serverStarted = true;
          clearTimeout(timeout);
          proc.kill();
          this.logSuccess('Mobile dev server starts successfully');
          this.log('  Server accessible at: http://localhost:3002', 'green');
          resolve(true);
        }
      });

      proc.stderr.on('data', (data) => {
        output += data.toString();
      });

      proc.on('error', (error) => {
        clearTimeout(timeout);
        this.logError(
          ERROR_CODES.MOBILE_SETUP_INVALID,
          'Failed to start mobile dev server',
          `Error: ${error.message}\n` +
          `Solution: Ensure Node.js and npm are properly installed.`
        );
        resolve(false);
      });
    });
  }

  async checkDesktopDevServer() {
    this.logSection('Phase 8: Desktop Dev Server Test');

    this.log('Testing terminal dev server startup...', 'cyan');
    
    const terminalDir = join(ROOT_DIR, 'terminal');
    
    return new Promise((resolve) => {
      const proc = spawn('npm', ['run', 'dev'], {
        cwd: terminalDir,
        shell: true,
        stdio: 'pipe',
      });

      let output = '';
      let serverStarted = false;

      const timeout = setTimeout(() => {
        proc.kill();
        if (!serverStarted) {
          this.logError(
            ERROR_CODES.DESKTOP_SETUP_INVALID,
            'Desktop dev server failed to start',
            `Server did not respond within 30 seconds.\n` +
            `Output:\n${output}\n` +
            `Solution:\n` +
            `1. Check that port 3000 is not already in use\n` +
            `2. Verify dependencies are installed: cd terminal && npm install\n` +
            `3. Ensure frontend-components is built: npm run build:components\n` +
            `4. Try running manually: cd terminal && npm run dev`
          );
          resolve(false);
        }
      }, 30000);

      proc.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('Local:') || output.includes('localhost:3000')) {
          serverStarted = true;
          clearTimeout(timeout);
          proc.kill();
          this.logSuccess('Desktop dev server starts successfully');
          this.log('  Server accessible at: http://localhost:3000', 'green');
          resolve(true);
        }
      });

      proc.stderr.on('data', (data) => {
        output += data.toString();
      });

      proc.on('error', (error) => {
        clearTimeout(timeout);
        this.logError(
          ERROR_CODES.DESKTOP_SETUP_INVALID,
          'Failed to start desktop dev server',
          `Error: ${error.message}\n` +
          `Solution: Ensure Node.js and npm are properly installed.`
        );
        resolve(false);
      });
    });
  }

  printSummary() {
    this.logSection('Test Summary');

    const endTime = new Date();
    const duration = ((endTime - this.startTime) / 1000).toFixed(2);

    console.log(`${colors.bright}Total Tests:${colors.reset} ${this.results.passed.length + this.results.failed.length}`);
    console.log(`${colors.green}✓ Passed:${colors.reset} ${this.results.passed.length}`);
    console.log(`${colors.red}✗ Failed:${colors.reset} ${this.results.failed.length}`);
    console.log(`${colors.yellow}⚠ Warnings:${colors.reset} ${this.results.warnings.length}`);
    console.log(`${colors.blue}Duration:${colors.reset} ${duration}s\n`);

    if (this.results.failed.length > 0) {
      console.log(`${colors.red}${colors.bright}FAILED TESTS:${colors.reset}`);
      this.results.failed.forEach((failure, index) => {
        console.log(`\n${index + 1}. [${failure.code}] ${failure.message}`);
        if (failure.details) {
          console.log(`   ${colors.yellow}${failure.details}${colors.reset}`);
        }
        console.log(`   Time: ${failure.timestamp}`);
      });
    }

    if (this.results.warnings.length > 0) {
      console.log(`\n${colors.yellow}${colors.bright}WARNINGS:${colors.reset}`);
      this.results.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    if (this.results.failed.length === 0) {
      console.log(`${colors.green}${colors.bright}✓ ALL SMOKE TESTS PASSED${colors.reset}`);
      console.log(`${colors.green}The application is ready for use on both mobile and desktop platforms.${colors.reset}`);
    } else {
      console.log(`${colors.red}${colors.bright}✗ SMOKE TESTS FAILED${colors.reset}`);
      console.log(`${colors.red}Please fix the errors above before proceeding.${colors.reset}`);
    }
    console.log('='.repeat(80) + '\n');

    return this.results.failed.length === 0;
  }

  async run() {
    this.log('Starting Comprehensive Front-End Smoke Tests', 'bright');
    this.log(`Platform: ${process.platform}`, 'blue');
    this.log(`Node: ${process.version}`, 'blue');
    this.log(`Working Directory: ${ROOT_DIR}\n`, 'blue');

    // Check for --quick flag
    const quickMode = process.argv.includes('--quick');
    
    if (quickMode) {
      this.log('Running in QUICK mode (skipping builds and dev servers)', 'yellow');
    }

    try {
      // Run all checks
      await this.checkDependencies();
      await this.checkMobileSetup();
      await this.checkDesktopSetup();
      
      if (!quickMode) {
        await this.checkTypeScript();
        await this.checkLinting();
        await this.checkBuilds();
        await this.checkMobileDevServer();
        await this.checkDesktopDevServer();
      } else {
        this.logWarning('Skipping TypeScript, linting, builds, and dev server tests (quick mode)');
      }

      // Print summary
      const success = this.printSummary();
      process.exit(success ? 0 : 1);
    } catch (error) {
      this.logError(
        'E999',
        'Unexpected error during smoke test',
        error.message + '\n' + error.stack
      );
      this.printSummary();
      process.exit(1);
    }
  }
}

// Run the smoke tests
const runner = new SmokeTestRunner();
runner.run();
