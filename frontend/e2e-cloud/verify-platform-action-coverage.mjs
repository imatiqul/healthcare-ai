#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const resultsArg = process.argv[2] ?? 'test-results/results.json';
const manifestArg = process.argv[3] ?? 'e2e-cloud/platform-action-manifest.json';

const resultsPath = path.resolve(process.cwd(), resultsArg);
const manifestPath = path.resolve(process.cwd(), manifestArg);
const reportPath = path.resolve(process.cwd(), 'test-results/platform-action-coverage.json');

function appendSummary(markdown) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  fs.appendFileSync(summaryPath, markdown);
}

function collectTestsFromSuite(suite, parentTitles = []) {
  const titleChain = suite.title ? [...parentTitles, suite.title] : parentTitles;
  const collected = [];

  for (const spec of suite.specs ?? []) {
    const specPrefix = [...titleChain, spec.title].filter(Boolean).join(' > ');

    for (const test of spec.tests ?? []) {
      const statuses = (test.results ?? []).map((result) => result.status);
      const passed = statuses.includes('passed');
      const title = [specPrefix, test.title].filter(Boolean).join(' > ');

      collected.push({ title, passed });
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

if (!fs.existsSync(resultsPath)) {
  console.error(`[action-coverage] Missing Playwright results file: ${resultsPath}`);
  process.exit(1);
}

if (!fs.existsSync(manifestPath)) {
  console.error(`[action-coverage] Missing action manifest: ${manifestPath}`);
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const manifestIds = (manifest ?? []).map((item) => item.id);
const uniqueManifestIds = [...new Set(manifestIds)];

if (manifestIds.length !== uniqueManifestIds.length) {
  const duplicates = manifestIds.filter((id, index) => manifestIds.indexOf(id) !== index);
  console.error(`[action-coverage] Duplicate action IDs in manifest: ${[...new Set(duplicates)].join(', ')}`);
  process.exit(1);
}

const tests = collectTests(results);
const actionTagRegex = /\[action:([^\]]+)\]/g;
const coveredActionIds = new Set();

for (const test of tests) {
  for (const match of test.title.matchAll(actionTagRegex)) {
    const id = match[1];
    if (test.passed) coveredActionIds.add(id);
  }
}

const uncoveredActionIds = uniqueManifestIds.filter((id) => !coveredActionIds.has(id));
const unknownCoveredActionIds = [...coveredActionIds].filter((id) => !uniqueManifestIds.includes(id));

const coveragePercent = uniqueManifestIds.length === 0
  ? 0
  : Math.round((coveredActionIds.size / uniqueManifestIds.length) * 10000) / 100;

const report = {
  manifestActions: uniqueManifestIds.length,
  coveredActions: coveredActionIds.size,
  coveragePercent,
  uncoveredActionIds,
  unknownCoveredActionIds,
  generatedAt: new Date().toISOString(),
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

const markdown = [
  '\n## Platform Action Coverage',
  '',
  `- Covered actions: **${coveredActionIds.size}/${uniqueManifestIds.length}**`,
  `- Coverage: **${coveragePercent}%**`,
  '',
  uncoveredActionIds.length === 0
    ? '✅ 100% platform action coverage reached.'
    : `❌ Missing action coverage: ${uncoveredActionIds.join(', ')}`,
  unknownCoveredActionIds.length > 0
    ? `⚠️ Action tags not in manifest: ${unknownCoveredActionIds.join(', ')}`
    : '',
  '',
].join('\n');

appendSummary(markdown);

console.log(`[action-coverage] Covered ${coveredActionIds.size}/${uniqueManifestIds.length} actions (${coveragePercent}%).`);

if (uncoveredActionIds.length > 0) {
  console.error(`[action-coverage] Missing actions: ${uncoveredActionIds.join(', ')}`);
  process.exit(1);
}
