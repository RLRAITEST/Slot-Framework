#!/usr/bin/env node
// =============================================================================
// Framework — Math Simulator (template)
//
// Copy into SlotFolder/math/games/<game_id>/tools/ and wire createEngine() in
// math-adapter.mjs. Official math path remains math-sdk `make run`.
//
// After each run, RTP / hit-rate / max-win are checked against
// jurisdiction.config.json (Stake 90–98% RTP, 0.5% mode spread, max-win
// 1-in-20M or more frequent). See 13-jurisdiction-requirements.md.
//
// Usage:
//   node tools/simulate.mjs                 # 20,000 spins per mode
//   node tools/simulate.mjs --spins=50000
//   node tools/simulate.mjs --mode=base,bonus_buy --json
//   node tools/simulate.mjs --title="My Game"
// =============================================================================

import { createEngine, SIM_MODES, MODE_COST, PAYOUT_SCALE, MAX_WIN_X, TARGET_RTP } from './math-adapter.mjs';
import { checkMathReport, checkTitle, formatVerdict, loadJurisdictionConfig } from './jurisdiction.mjs';

const args = parseArgs(process.argv.slice(2));
const DEFAULT_SPINS = 20_000;
const BET = Number(args.bet || 100);
const spins = Number(args.spins || DEFAULT_SPINS);
const seed = Number(args.seed || 12345);
const modes = selectModes(args.mode);

const startedAt = Date.now();
const reports = {};
for (const [modeIndex, mode] of modes.entries()) {
  reports[mode] = simulateMode({ mode, spins, seed: seed + modeIndex * 100_003 });
}

const report = {
  title: args.gameTitle || args.title || 'Math Simulation',
  generatedAt: new Date().toISOString(),
  bet: BET,
  seed,
  spinsPerMode: spins,
  targetRtpPercent: TARGET_RTP * 100,
  maxWinX: MAX_WIN_X,
  elapsedSeconds: round((Date.now() - startedAt) / 1000, 3),
  reports,
};

if (args.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  printConsoleReport(report);
}

const config = loadJurisdictionConfig();
if (report.title && report.title !== 'Math Simulation') {
  const titleVerdict = checkTitle(report.title, config);
  console.error(formatVerdict(`title "${report.title}"`, titleVerdict));
  if (!titleVerdict.ok) process.exitCode = 1;
}
const mathVerdict = checkMathReport(report, config);
console.error(formatVerdict('jurisdiction math', mathVerdict));
if (!mathVerdict.ok) process.exitCode = 1;

// =============================================================================
function simulateMode({ mode, spins, seed }) {
  const engine = createEngine({ seed });
  const costUnits = (MODE_COST[mode] || 1) * PAYOUT_SCALE;
  const buckets = createBuckets();

  let totalUnits = 0;
  let totalReturnXSq = 0;
  let hits = 0;
  let maxWinUnits = 0;
  let jackSpins = 0;
  let totalJackWilds = 0;
  let featureTriggers = 0;
  const featureByType = new Map();

  for (let spinIndex = 0; spinIndex < spins; spinIndex += 1) {
    const round = engine.playRound({ mode, amount: BET });
    const units = Number(round.payoutMultiplier || 0);
    const returnX = units / costUnits;

    totalUnits += units;
    totalReturnXSq += returnX * returnX;
    if (units > 0) hits += 1;
    if (units > maxWinUnits) maxWinUnits = units;
    incrementBucket(buckets, units / PAYOUT_SCALE);

    if (round.meta?.triggeredFeature) {
      featureTriggers += 1;
      addMap(featureByType, round.meta.triggeredFeature, 1);
    }

    let jackThisSpin = false;
    for (const event of round.events || []) {
      if (event.type === 'jackAttack') {
        jackThisSpin = true;
        totalJackWilds += Number(event.wildCount || 0);
      }
    }
    if (jackThisSpin) jackSpins += 1;
  }

  const meanReturnX = totalUnits / (spins * costUnits);
  const variance = Math.max(0, totalReturnXSq / spins - meanReturnX * meanReturnX);
  const stdDevX = Math.sqrt(variance);
  const rtp = meanReturnX * 100;
  const ci = 1.96 * (stdDevX / Math.sqrt(spins));

  return {
    mode,
    spins,
    costMultiplier: MODE_COST[mode] || 1,
    rtpPercent: round(rtp, 3),
    rtpConfidence95: { low: round((meanReturnX - ci) * 100, 3), high: round((meanReturnX + ci) * 100, 3) },
    hitFrequencyPercent: round((hits / spins) * 100, 3),
    volatilityStdDevX: round(stdDevX, 3),
    maxWinFoundX: round(maxWinUnits / PAYOUT_SCALE, 2),
    jackAttackFrequencyPercent: round((jackSpins / spins) * 100, 3),
    averageWildsPerJack: jackSpins ? round(totalJackWilds / jackSpins, 2) : 0,
    featureTriggerFrequencyPercent: round((featureTriggers / spins) * 100, 4),
    featureByType: Object.fromEntries(
      [...featureByType.entries()].map(([type, count]) => [type, round((count / spins) * 100, 4)]),
    ),
    winDistribution: buckets.map((bucket) => ({
      label: bucket.label,
      count: bucket.count,
      percent: round((bucket.count / spins) * 100, 4),
    })),
  };
}

function createBuckets() {
  return [
    { label: '0x', min: 0, max: Number.EPSILON, count: 0 },
    { label: '<1x', min: Number.EPSILON, max: 1, count: 0 },
    { label: '1-5x', min: 1, max: 5, count: 0 },
    { label: '5-25x', min: 5, max: 25, count: 0 },
    { label: '25-100x', min: 25, max: 100, count: 0 },
    { label: '100-500x', min: 100, max: 500, count: 0 },
    { label: '500-2,000x', min: 500, max: 2_000, count: 0 },
    { label: '2,000x+', min: 2_000, max: Infinity, count: 0 },
  ];
}

function incrementBucket(buckets, winX) {
  for (const bucket of buckets) {
    if (winX >= bucket.min && winX < bucket.max) { bucket.count += 1; return; }
  }
}

function printConsoleReport(report) {
  console.log('');
  console.log(report.title);
  console.log(`Bet ${report.bet} | seed ${report.seed} | spins/mode ${report.spinsPerMode.toLocaleString()} | max win ${report.maxWinX.toLocaleString()}x`);
  console.log('');
  console.log('| Mode | Cost | RTP % (95% CI) | Hit % | Volatility | Jack % | Feature % | Max found |');
  console.log('|---|---:|---:|---:|---:|---:|---:|---:|');
  for (const r of Object.values(report.reports)) {
    console.log(
      `| ${r.mode} | ${r.costMultiplier}x | `
      + `${r.rtpPercent.toFixed(2)} (${r.rtpConfidence95.low.toFixed(2)}-${r.rtpConfidence95.high.toFixed(2)}) | `
      + `${r.hitFrequencyPercent.toFixed(2)} | ${r.volatilityStdDevX.toFixed(2)}x | `
      + `${r.jackAttackFrequencyPercent.toFixed(1)} | ${r.featureTriggerFrequencyPercent.toFixed(3)} | `
      + `${r.maxWinFoundX.toFixed(1)}x |`,
    );
  }
  for (const r of Object.values(report.reports)) {
    console.log('');
    console.log(`--- ${r.mode} --- (avg ${r.averageWildsPerJack} wilds/Jack)`);
    for (const bucket of r.winDistribution) {
      console.log(`  ${bucket.label.padEnd(12)} ${String(bucket.count).padStart(8)} ${bucket.percent.toFixed(3).padStart(8)}%`);
    }
  }
  console.log('');
  console.log(`Elapsed: ${report.elapsedSeconds}s`);
}

function selectModes(value) {
  if (!value || value === 'all') return [...SIM_MODES];
  const list = String(value).split(',').map((m) => m.trim()).filter(Boolean);
  for (const m of list) {
    if (!SIM_MODES.includes(m)) throw new Error(`Unknown mode "${m}". Expected: ${SIM_MODES.join(', ')}`);
  }
  return list;
}

function parseArgs(argv) {
  const parsed = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (match) parsed[match[1]] = match[2] ?? true;
  }
  return parsed;
}

function addMap(map, key, value) {
  map.set(key, (map.get(key) || 0) + value);
}

function round(value, places = 3) {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
}
