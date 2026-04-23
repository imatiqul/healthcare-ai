#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const resultsArg = process.argv[2] ?? 'test-results/results.json';
const manifestArg = process.argv[3] ?? 'e2e-cloud/platform-action-manifest.json';
const roleManifestArg = process.argv[4] ?? 'e2e-cloud/platform-action-role-manifest.json';

const resultsPath = path.resolve(process.cwd(), resultsArg);
const manifestPath = path.resolve(process.cwd(), manifestArg);
const roleManifestPath = path.resolve(process.cwd(), roleManifestArg);
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

function unique(values) {
  return [...new Set(values)];
}

if (!fs.existsSync(resultsPath)) {
  console.error(`[action-coverage] Missing Playwright results file: ${resultsPath}`);
  process.exit(1);
}

if (!fs.existsSync(manifestPath)) {
  console.error(`[action-coverage] Missing action manifest: ${manifestPath}`);
  process.exit(1);
}

if (!fs.existsSync(roleManifestPath)) {
  console.error(`[action-coverage] Missing role manifest: ${roleManifestPath}`);
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const roleManifest = JSON.parse(fs.readFileSync(roleManifestPath, 'utf8'));

if (!Array.isArray(manifest)) {
  console.error('[action-coverage] Action manifest must be a JSON array.');
  process.exit(1);
}

const missingIdEntries = manifest.filter((item) => typeof item?.id !== 'string' || item.id.trim() === '');
if (missingIdEntries.length > 0) {
  console.error('[action-coverage] Some action manifest entries are missing a valid id.');
  process.exit(1);
}

const manifestIds = (manifest ?? []).map((item) => item.id);
const uniqueManifestIds = unique(manifestIds);

if (manifestIds.length !== uniqueManifestIds.length) {
  const duplicates = manifestIds.filter((id, index) => manifestIds.indexOf(id) !== index);
  console.error(`[action-coverage] Duplicate action IDs in manifest: ${unique(duplicates).join(', ')}`);
  process.exit(1);
}

if (!Array.isArray(roleManifest?.roles) || roleManifest.roles.length === 0) {
  console.error('[action-coverage] Role manifest must contain a non-empty roles array.');
  process.exit(1);
}

const roleIdList = roleManifest.roles.map((role) => role?.id).filter((id) => typeof id === 'string');
const duplicateRoleIds = roleIdList.filter((id, index) => roleIdList.indexOf(id) !== index);
if (duplicateRoleIds.length > 0) {
  console.error(`[action-coverage] Duplicate role IDs in role manifest: ${unique(duplicateRoleIds).join(', ')}`);
  process.exit(1);
}

const roleDefinitions = roleManifest.roles.map((role) => {
  if (typeof role?.id !== 'string' || role.id.trim() === '') {
    console.error('[action-coverage] Each role must provide a non-empty id.');
    process.exit(1);
  }

  let requiredActionIds;
  if (role.allActions === true) {
    requiredActionIds = [...uniqueManifestIds];
  } else if (Array.isArray(role.requiredActionIds)) {
    requiredActionIds = unique(role.requiredActionIds);
  } else {
    console.error(`[action-coverage] Role ${role.id} must set allActions=true or provide requiredActionIds.`);
    process.exit(1);
  }

  if (requiredActionIds.length === 0) {
    console.error(`[action-coverage] Role ${role.id} has no required action IDs.`);
    process.exit(1);
  }

  const unknownRequiredIds = requiredActionIds.filter((id) => !uniqueManifestIds.includes(id));
  if (unknownRequiredIds.length > 0) {
    console.error(`[action-coverage] Role ${role.id} references unknown action IDs: ${unknownRequiredIds.join(', ')}`);
    process.exit(1);
  }

  return {
    id: role.id,
    name: typeof role.name === 'string' && role.name.trim() !== '' ? role.name : role.id,
    requiredActionIds,
  };
});

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

const roleCoverage = roleDefinitions.map((role) => {
  const coveredIds = role.requiredActionIds.filter((id) => coveredActionIds.has(id));
  const uncoveredIds = role.requiredActionIds.filter((id) => !coveredActionIds.has(id));
  const rolePercent = role.requiredActionIds.length === 0
    ? 0
    : Math.round((coveredIds.length / role.requiredActionIds.length) * 10000) / 100;

  return {
    roleId: role.id,
    roleName: role.name,
    requiredActions: role.requiredActionIds.length,
    coveredActions: coveredIds.length,
    coveragePercent: rolePercent,
    uncoveredActionIds: uncoveredIds,
  };
});

const roleFailures = roleCoverage.filter((role) => role.uncoveredActionIds.length > 0);

const report = {
  manifestActions: uniqueManifestIds.length,
  coveredActions: coveredActionIds.size,
  coveragePercent,
  uncoveredActionIds,
  unknownCoveredActionIds,
  roleCoverage,
  generatedAt: new Date().toISOString(),
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

const roleSummaryTable = [
  '| Role | Covered | Coverage | Status |',
  '|------|---------|----------|--------|',
  ...roleCoverage.map((role) => {
    const covered = `${role.coveredActions}/${role.requiredActions}`;
    const status = role.uncoveredActionIds.length === 0 ? '✅ Pass' : '❌ Fail';
    return `| ${role.roleName} | ${covered} | ${role.coveragePercent}% | ${status} |`;
  }),
].join('\n');

const roleFailureLines = roleFailures.map((role) =>
  `- ${role.roleName}: ${role.uncoveredActionIds.join(', ')}`,
);

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
  '## Platform Action Coverage by Role',
  '',
  roleSummaryTable,
  '',
  roleFailureLines.length > 0 ? '### Missing Role-Slice Actions' : '',
  ...roleFailureLines,
  roleFailureLines.length > 0 ? '' : '',
].join('\n');

appendSummary(markdown);

console.log(`[action-coverage] Covered ${coveredActionIds.size}/${uniqueManifestIds.length} actions (${coveragePercent}%).`);
for (const role of roleCoverage) {
  console.log(
    `[action-coverage] Role ${role.roleName}: ${role.coveredActions}/${role.requiredActions} (${role.coveragePercent}%).`,
  );
}

if (uncoveredActionIds.length > 0) {
  console.error(`[action-coverage] Missing actions: ${uncoveredActionIds.join(', ')}`);
  process.exit(1);
}

if (roleFailures.length > 0) {
  for (const role of roleFailures) {
    console.error(`[action-coverage] Role ${role.roleName} missing actions: ${role.uncoveredActionIds.join(', ')}`);
  }
  process.exit(1);
}
