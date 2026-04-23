#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const resultsArg = process.argv[2] ?? 'test-results/results.json';
const manifestArg = process.argv[3] ?? 'e2e-cloud/platform-feature-manifest.json';
const appArg = process.argv[4] ?? 'apps/shell/src/App.tsx';

const resultsPath = path.resolve(process.cwd(), resultsArg);
const manifestPath = path.resolve(process.cwd(), manifestArg);
const appPath = path.resolve(process.cwd(), appArg);
const reportPath = path.resolve(process.cwd(), 'test-results/platform-feature-coverage.json');

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function extractAppRoutes(appSource) {
  const routeRegex = /<Route\s+path="([^"]+)"/g;
  const routes = [];
  for (const match of appSource.matchAll(routeRegex)) {
    const route = match[1];
    if (route && route !== '*') routes.push(route);
  }
  return uniqueSorted(routes);
}

function collectTestsFromSuite(suite, parentTitles = []) {
  const titleChain = suite.title ? [...parentTitles, suite.title] : parentTitles;
  const collected = [];

  for (const spec of suite.specs ?? []) {
    const specPrefix = [...titleChain, spec.title].filter(Boolean).join(' > ');

    for (const test of spec.tests ?? []) {
      const statuses = (test.results ?? []).map((result) => result.status);
      const passed = statuses.includes('passed');
      const skippedOnly = statuses.length > 0 && statuses.every((status) => status === 'skipped');
      const title = [specPrefix, test.title].filter(Boolean).join(' > ');

      collected.push({
        title,
        passed,
        skippedOnly,
      });
    }
  }

  for (const childSuite of suite.suites ?? []) {
    collected.push(...collectTestsFromSuite(childSuite, titleChain));
  }

  return collected;
}

function collectTests(results) {
  const all = [];
  for (const suite of results.suites ?? []) {
    all.push(...collectTestsFromSuite(suite, []));
  }
  return all;
}

function appendSummary(markdown) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  fs.appendFileSync(summaryPath, markdown);
}

if (!fs.existsSync(resultsPath)) {
  console.error(`[coverage] Missing Playwright results file: ${resultsPath}`);
  process.exit(1);
}

if (!fs.existsSync(manifestPath)) {
  console.error(`[coverage] Missing feature manifest: ${manifestPath}`);
  process.exit(1);
}

if (!fs.existsSync(appPath)) {
  console.error(`[coverage] Missing app route source file: ${appPath}`);
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const appSource = fs.readFileSync(appPath, 'utf8');

const manifestRoutes = uniqueSorted((manifest ?? []).map((item) => item.route));
const appRoutes = extractAppRoutes(appSource);

const missingInManifest = appRoutes.filter((route) => !manifestRoutes.includes(route));
const extraInManifest = manifestRoutes.filter((route) => !appRoutes.includes(route));

if (missingInManifest.length > 0 || extraInManifest.length > 0) {
  const mismatch = {
    message: 'Route manifest is out of sync with apps/shell/src/App.tsx',
    missingInManifest,
    extraInManifest,
  };

  console.error('[coverage] Manifest mismatch:', JSON.stringify(mismatch, null, 2));
  appendSummary(
    `\n## Platform Feature Coverage\n` +
      `❌ Route manifest mismatch with shell app routes.\n` +
      `${missingInManifest.length > 0 ? `- Missing in manifest: ${missingInManifest.join(', ')}\n` : ''}` +
      `${extraInManifest.length > 0 ? `- Extra in manifest: ${extraInManifest.join(', ')}\n` : ''}`,
  );
  process.exit(1);
}

const tests = collectTests(results);
const routeTagRegex = /\[route:([^\]]+)\]/g;
const coveredRoutes = new Set();

for (const test of tests) {
  for (const match of test.title.matchAll(routeTagRegex)) {
    const route = match[1];
    if (test.passed) coveredRoutes.add(route);
  }
}

const uncoveredRoutes = manifestRoutes.filter((route) => !coveredRoutes.has(route));
const coveragePercent = manifestRoutes.length === 0
  ? 0
  : Math.round((coveredRoutes.size / manifestRoutes.length) * 10000) / 100;

const report = {
  manifestRoutes: manifestRoutes.length,
  coveredRoutes: coveredRoutes.size,
  coveragePercent,
  uncoveredRoutes,
  generatedAt: new Date().toISOString(),
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

const markdown = [
  '\n## Platform Feature Coverage',
  '',
  `- Covered routes: **${coveredRoutes.size}/${manifestRoutes.length}**`,
  `- Coverage: **${coveragePercent}%**`,
  '',
  uncoveredRoutes.length === 0
    ? '✅ 100% platform feature route coverage reached.'
    : `❌ Missing route coverage: ${uncoveredRoutes.join(', ')}`,
  '',
].join('\n');

appendSummary(markdown);

console.log(`[coverage] Covered ${coveredRoutes.size}/${manifestRoutes.length} routes (${coveragePercent}%).`);

if (uncoveredRoutes.length > 0) {
  console.error(`[coverage] Missing routes: ${uncoveredRoutes.join(', ')}`);
  process.exit(1);
}
