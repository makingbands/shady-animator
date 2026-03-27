#!/usr/bin/env node
/**
 * resource: scripts/ci-run-tests.js
 * goal: Run Playwright headless tests against the CI static server
 * channel: node-cli
 * handoff: epoch.mm.shady-animator.v1.1.ci.run-tests
 */

const { execSync } = require('child_process');

function run(cmd) {
  console.log(`[CI] ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

try {
  // Assumes Playwright tests are wired via npm script
  // e.g. "test:headless": "playwright test --config=playwright.config.ts"
  run('npm run test:headless');
  console.log('[CI] Headless tests completed successfully.');
} catch (err) {
  console.error('[CI] Headless tests failed.');
  process.exitCode = 1;
}