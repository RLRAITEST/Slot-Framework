#!/usr/bin/env node
// =============================================================================
// Framework — Lookup-table RTP optimizer (power-law weighting)
//
// Copy into SlotFolder/math/games/<game_id>/tools/. Official math path remains
// math-sdk `make run` + Rust optimizer. Use this only if you publish JS LUTs.
//
// It does NOT touch reel strips, paytables or feature probabilities. It takes a
// pre-generated book pool (from build-stake-engine-math.mjs) and re-weights each
// round in the lookup table so the WEIGHTED distribution hits the target RTP,
// dead-rate, max-win frequency and per-band win shape.
//
// After write, RTP / hit-rate / max-win are checked against
// jurisdiction.config.json. See 13-jurisdiction-requirements.md.
//
// How it works (per mode):
//   1. Stream lookUpTable_<mode>.csv and partition every round by its payout:
//        dead      (payout == 0)
//        max-win   (payout >= maxWinX)
//        regular   (everything else, dropped into the configured payout buckets)
//   2. Pin the dead-rate and max-win frequency directly: all dead rows SHARE the
//      target dead probability, all max rows SHARE 1/targetMaxWinEvery.
//   3. Fix the SHAPE from `bucketShares` (mass per payout band among regular wins)
//      and BINARY-SEARCH a single power exponent `p` such that weighting each
//      regular round by payoutX^p yields the target average payout => target RTP.
//   4. (Optional) a second exponential search on a feature-scale multiplier hits a
//      target feature-trigger rate - used by ante/buy modes, not base.
//   5. Write the optimized weights back to the LUT (id,weight,payoutUnits).
//
// Usage:
//   node tools/optimize-luts.mjs
//   node tools/optimize-luts.mjs --config=math/optimizer.config.json
//   node tools/optimize-luts.mjs --mode=base
//   node tools/optimize-luts.mjs --out=publish_files --dryRun=true
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { createZstdDecompress } from 'node:zlib';

import {
  MAX_WIN_X,
  PAYOUT_SCALE,
  TARGET_RTP,
  MODE_COST,
} from './math-adapter.mjs';
import { checkMathReport, formatVerdict, loadJurisdictionConfig } from './jurisdiction.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_WEIGHT_SCALE = 1_000_000_000;
const DEFAULT_MINIMUM_WEIGHT = 1;
const DEFAULT_POWER_SEARCH = { min: -12, max: 12, iterations: 44 };
const DEFAULT_OUT_DIR = 'library/publish_files';
const DEFAULT_CONFIG_PATH = 'optimizer.config.json';

// Mode cost multipliers come from math-adapter / game-math.json.
// The optimizer only needs each mode's cost multiplier, so derive a profile map.
const MODE_PROFILES = Object.fromEntries(
  Object.entries(MODE_COST).map(([mode, costMultiplier]) => [mode, { costMultiplier }]),
);

export async function optimizePublishedLookupTables({
  outDir,
  summaries = {},
  profiles = MODE_PROFILES,
  config = {},
  modes = null,
  progress = true,
  dryRun = false,
} = {}) {
  const optimizerConfig = normalizeOptimizerConfig(config);
  if (!optimizerConfig.enabled && !dryRun) return { enabled: false, modes: {} };

  const resolvedOutDir = path.resolve(ROOT, outDir || DEFAULT_OUT_DIR);
  const selectedModes = normalizeModes(modes, optimizerConfig);
  const results = {};

  if (progress) {
    console.error('');
    console.error(
      `LUT optimizer: ${dryRun ? 'dry run' : 'enabled'} | scale ${optimizerConfig.weightScale.toLocaleString()} `
      + `| modes ${selectedModes.join(', ')}`,
    );
  }

  for (const mode of selectedModes) {
    const profile = profiles[mode];
    const target = optimizerConfig.modes[mode];
    if (!profile || !target || target.enabled === false) continue;

    const lutPath = path.join(resolvedOutDir, 'lookup_tables', `lookUpTable_${mode}.csv`);
    if (!fs.existsSync(lutPath)) {
      results[mode] = { mode, skipped: true, reason: `Missing LUT: ${toRepoPath(lutPath)}` };
      if (progress) console.error(`[${mode}] LUT optimizer skipped: missing ${toRepoPath(lutPath)}`);
      continue;
    }

    results[mode] = await optimizeModeTable({
      mode,
      profile,
      lutPath,
      bookPath: resolveBookPath(resolvedOutDir, mode),
      sourceSummary: summaries[mode] || null,
      optimizerConfig,
      target,
      progress,
      dryRun,
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    source: 'stake-style post-generation LUT weighting (power-law)',
    dryRun,
    weightScale: optimizerConfig.weightScale,
    minimumWeight: optimizerConfig.minimumWeight,
    targetRtpPercent: optimizerConfig.targetRtpPercent,
    reportPath: optimizerConfig.reportPath || null,
    modes: results,
  };

  if (!dryRun && optimizerConfig.reportPath) {
    const reportPath = path.resolve(ROOT, optimizerConfig.reportPath);
    report.reportPath = toRepoPath(reportPath);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }

  const mathVerdict = checkMathReport(report, loadJurisdictionConfig());
  report.jurisdiction = { ok: mathVerdict.ok, findings: mathVerdict.findings };
  if (progress) console.error(formatVerdict('jurisdiction math', mathVerdict));
  if (!mathVerdict.ok && !dryRun) process.exitCode = 1;

  return report;
}

async function optimizeModeTable({
  mode, profile, lutPath, bookPath, sourceSummary, optimizerConfig, target, progress, dryRun,
}) {
  const rawPath = rawBackupPath(lutPath);
  const readPath = lutPath;
  const buckets = buildBuckets(target.bucketShares || {});

  if (progress) console.error(`[${mode}] LUT optimizer reading ${toRepoPath(readPath)}...`);
  const featureRows = hasFeatureRateTarget(target) || mode === 'base' || mode === 'ante'
    ? await collectTriggeredFeatureRows(bookPath)
    : new Set();

  const stats = await collectStats({
    filePath: readPath,
    buckets,
    maxWinUnits: optimizerConfig.maxWinX * PAYOUT_SCALE,
    costUnits: profile.costMultiplier * PAYOUT_SCALE,
    featureRows,
  });

  const plan = buildWeightPlan({ mode, profile, buckets, stats, target, optimizerConfig });

  const output = await writeOptimizedTable({
    mode, readPath, lutPath, rawPath, stats, plan, buckets, optimizerConfig, featureRows, dryRun,
  });

  const result = {
    mode,
    sourceTable: toRepoPath(readPath),
    outputTable: toRepoPath(lutPath),
    rawBackupTable: optimizerConfig.backupRawTables ? toRepoPath(rawPath) : null,
    raw: {
      rows: stats.rows,
      rtpPercent: round4(stats.rawRtpPercent),
      hitFrequencyPercent: round4(stats.rawHitPercent),
      deadRatePercent: round4(stats.rawDeadPercent),
      maxWinRows: stats.maxRows,
      maxWinFoundX: round4(stats.maxWinFoundX),
      featureRows: stats.featureRows,
      featureRatePercent: round6(stats.rawFeaturePercent),
    },
    target: {
      rtpPercent: plan.targetRtpPercent,
      deadRatePercent: plan.deadProb * 100,
      hitFrequencyPercent: (1 - plan.deadProb) * 100,
      maxWinEvery: plan.requestedMaxWinEvery,
      regularAveragePayoutX: round4(plan.targetRegularAverageX),
      featureRatePercent: plan.featureConstraint.enabled
        ? round6(plan.featureConstraint.targetFeatureProb * 100)
        : null,
    },
    optimized: output.optimized,
    optimizer: {
      power: round6(plan.power),
      requestedMaxWinEvery: plan.requestedMaxWinEvery,
      actualMaxWinEvery: output.optimized.maxWinEvery,
      backupRawTables: optimizerConfig.backupRawTables,
      dryRun,
      rtpWithinTolerance: Math.abs(output.optimized.rtpPercent - plan.targetRtpPercent)
        <= optimizerConfig.rtpTolerancePercent,
      featureRateWithinTolerance: !plan.featureConstraint.enabled
        || Math.abs(
          output.optimized.featureRatePercent - (plan.featureConstraint.targetFeatureProb * 100),
        ) <= plan.featureConstraint.tolerancePercent,
      warnings: plan.warnings,
    },
    buckets: output.bucketReport,
  };

  if (sourceSummary) {
    result.raw.publisherSummary = {
      rtpPercent: sourceSummary.rtpPercent,
      hitFrequencyPercent: sourceSummary.hitFrequencyPercent,
      maxWinHits: sourceSummary.maxWinHits,
    };
  }

  if (progress) {
    const maxEvery = Number.isFinite(output.optimized.maxWinEvery)
      ? `1:${Math.round(output.optimized.maxWinEvery).toLocaleString()}`
      : 'none';
    console.error(
      `[${mode}] LUT optimized | raw RTP ${stats.rawRtpPercent.toFixed(3)}% -> `
      + `${output.optimized.rtpPercent.toFixed(3)}% | dead ${output.optimized.deadRatePercent.toFixed(2)}% `
      + `| hit ${output.optimized.hitFrequencyPercent.toFixed(2)}% | max ${maxEvery}`
      + (plan.featureConstraint.enabled ? ` | feature ${output.optimized.featureRatePercent.toFixed(3)}%` : ''),
    );
    for (const warning of plan.warnings) console.error(`[${mode}] optimizer warning: ${warning}`);
  }

  return result;
}

async function collectStats({ filePath, buckets, maxWinUnits, costUnits, featureRows }) {
  const stats = {
    rows: 0,
    totalUnits: 0,
    hitRows: 0,
    deadRows: 0,
    featureRows: 0,
    featureDeadRows: 0,
    featureMaxRows: 0,
    maxRows: 0,
    maxUnitsTotal: 0,
    maxWinFoundX: 0,
    regularRows: 0,
    buckets: buckets.map(() => ({
      rows: 0, minPayoutX: Infinity, maxPayoutX: 0, featurePayouts: [], nonFeaturePayouts: [],
    })),
  };

  await forEachCsvRow(filePath, (row) => {
    const isFeature = featureRows.has(row.id);
    stats.rows += 1;
    stats.totalUnits += row.payoutUnits;
    if (isFeature) stats.featureRows += 1;
    if (row.payoutUnits > 0) stats.hitRows += 1;

    if (row.payoutUnits <= 0) {
      stats.deadRows += 1;
      if (isFeature) stats.featureDeadRows += 1;
      return;
    }

    const payoutX = row.payoutUnits / PAYOUT_SCALE;
    stats.maxWinFoundX = Math.max(stats.maxWinFoundX, payoutX);
    if (row.payoutUnits >= maxWinUnits) {
      stats.maxRows += 1;
      stats.maxUnitsTotal += row.payoutUnits;
      if (isFeature) stats.featureMaxRows += 1;
      return;
    }

    const bucketIndex = findBucketIndex(buckets, payoutX);
    if (bucketIndex < 0) return;

    const bucket = stats.buckets[bucketIndex];
    bucket.rows += 1;
    if (isFeature) bucket.featurePayouts.push(payoutX);
    else bucket.nonFeaturePayouts.push(payoutX);
    bucket.minPayoutX = Math.min(bucket.minPayoutX, payoutX);
    bucket.maxPayoutX = Math.max(bucket.maxPayoutX, payoutX);
    stats.regularRows += 1;
  });

  stats.rawRtpPercent = stats.rows > 0 ? (stats.totalUnits / (stats.rows * costUnits)) * 100 : 0;
  stats.rawHitPercent = stats.rows > 0 ? (stats.hitRows / stats.rows) * 100 : 0;
  stats.rawDeadPercent = stats.rows > 0 ? (stats.deadRows / stats.rows) * 100 : 0;
  stats.rawFeaturePercent = stats.rows > 0 ? (stats.featureRows / stats.rows) * 100 : 0;

  return stats;
}

function buildWeightPlan({ mode, profile, buckets, stats, target, optimizerConfig }) {
  const warnings = [];
  const targetRtpPercent = Number(target.targetRtpPercent || optimizerConfig.targetRtpPercent);
  const targetAveragePayoutX = profile.costMultiplier * (targetRtpPercent / 100);
  const requestedDeadProb = percentToProbability(target.targetDeadRatePercent ?? 0);
  const deadProb = stats.deadRows > 0 ? requestedDeadProb : 0;
  if (requestedDeadProb > 0 && stats.deadRows === 0) {
    warnings.push(`Target dead rate ${(requestedDeadProb * 100).toFixed(2)}% ignored because the LUT has no dead rows.`);
  }

  const requestedMaxWinEvery = Number(target.targetMaxWinEvery || 0);
  const requestedMaxProb = requestedMaxWinEvery > 0 ? 1 / requestedMaxWinEvery : 0;
  const maxProb = stats.maxRows > 0 ? requestedMaxProb : 0;
  if (requestedMaxProb > 0 && stats.maxRows === 0) {
    warnings.push(`Target max frequency 1:${requestedMaxWinEvery.toLocaleString()} ignored because the LUT has no max rows.`);
  }

  const regularProb = Math.max(0, 1 - deadProb - maxProb);
  if (regularProb <= 0) {
    throw new Error(`[${mode}] LUT optimizer target leaves no probability for positive non-max rows.`);
  }
  if (stats.regularRows <= 0) {
    throw new Error(`[${mode}] LUT optimizer found no positive non-max rows to weight.`);
  }

  const averageMaxPayoutX = stats.maxRows > 0 ? (stats.maxUnitsTotal / stats.maxRows) / PAYOUT_SCALE : 0;
  const targetRegularAverageX = Math.max(
    0,
    (targetAveragePayoutX - (maxProb * averageMaxPayoutX)) / regularProb,
  );
  const bucketShares = buildAvailableBucketShares(buckets, stats, warnings);
  const featureConstraint = buildFeatureConstraint({
    target, stats, bucketShares, deadProb, maxProb, regularProb, warnings,
  });
  const powerSearch = { ...DEFAULT_POWER_SEARCH, ...(target.powerSearch || {}) };
  const evaluate = (candidatePower) => evaluateRegularDistribution(
    candidatePower, bucketShares, stats, featureConstraint, regularProb,
  );
  const lowEval = evaluate(powerSearch.min);
  const highEval = evaluate(powerSearch.max);
  let low = powerSearch.min;
  let high = powerSearch.max;
  let power = 0;

  if (targetRegularAverageX <= lowEval.averageX) {
    power = low;
    warnings.push(`RTP target needs regular avg ${targetRegularAverageX.toFixed(4)}x, below available ${lowEval.averageX.toFixed(4)}x; using minimum power.`);
  } else if (targetRegularAverageX >= highEval.averageX) {
    power = high;
    warnings.push(`RTP target needs regular avg ${targetRegularAverageX.toFixed(4)}x, above available ${highEval.averageX.toFixed(4)}x; using maximum power.`);
  } else {
    for (let i = 0; i < powerSearch.iterations; i += 1) {
      const mid = (low + high) / 2;
      const evaluated = evaluate(mid);
      if (evaluated.averageX < targetRegularAverageX) low = mid;
      else high = mid;
    }
    power = (low + high) / 2;
  }

  const finalEvaluation = evaluate(power);
  featureConstraint.featureScale = finalEvaluation.featureScale;
  featureConstraint.regularFeatureProb = finalEvaluation.featureProb;
  featureConstraint.targetFeatureProb = featureConstraint.fixedFeatureProb + finalEvaluation.featureProb;
  const bucketPlans = bucketShares.map((share) => {
    const bucketStats = stats.buckets[share.index];
    const featurePower = summarizePoweredPayouts(bucketStats.featurePayouts, power);
    const nonFeaturePower = summarizePoweredPayouts(bucketStats.nonFeaturePayouts, power);
    const sumPower = nonFeaturePower.sumWeight + (featureConstraint.featureScale * featurePower.sumWeight);
    return {
      ...share,
      probability: regularProb * share.normalizedShare,
      sumPower,
      featureSumPower: featurePower.sumWeight,
      nonFeatureSumPower: nonFeaturePower.sumWeight,
    };
  });

  return {
    targetRtpPercent,
    costUnits: profile.costMultiplier * PAYOUT_SCALE,
    targetAveragePayoutX,
    requestedMaxWinEvery,
    deadProb,
    maxProb,
    regularProb,
    targetRegularAverageX,
    power,
    bucketPlans,
    featureConstraint,
    warnings,
  };
}

function buildFeatureConstraint({ target, stats, bucketShares, deadProb, maxProb, regularProb, warnings }) {
  if (!hasFeatureRateTarget(target)) {
    return {
      enabled: false,
      requestedFeatureProb: null,
      targetFeatureProb: null,
      fixedFeatureProb: 0,
      regularFeatureProb: null,
      featureScale: 1,
      tolerancePercent: 0,
    };
  }

  if (stats.featureRows <= 0) {
    throw new Error('LUT optimizer has a feature-rate target, but the event book contains no triggeredFeature rows.');
  }

  const requestedFeatureProb = percentToProbability(target.targetFeatureRatePercent);
  const deadFeatureProb = stats.deadRows > 0 ? deadProb * (stats.featureDeadRows / stats.deadRows) : 0;
  const maxFeatureProb = stats.maxRows > 0 ? maxProb * (stats.featureMaxRows / stats.maxRows) : 0;
  const fixedFeatureProb = deadFeatureProb + maxFeatureProb;
  const bounds = getRegularFeatureProbabilityBounds(bucketShares, stats, regularProb);
  const requestedRegularFeatureProb = requestedFeatureProb - fixedFeatureProb;
  const targetRegularFeatureProb = Math.min(bounds.max, Math.max(bounds.min, requestedRegularFeatureProb));

  if (Math.abs(targetRegularFeatureProb - requestedRegularFeatureProb) > 1e-12) {
    warnings.push(
      `Feature target ${(requestedFeatureProb * 100).toFixed(4)}% was clamped to `
      + `${((fixedFeatureProb + targetRegularFeatureProb) * 100).toFixed(4)}% by available payout buckets.`,
    );
  }

  return {
    enabled: true,
    requestedFeatureProb,
    targetFeatureProb: fixedFeatureProb + targetRegularFeatureProb,
    fixedFeatureProb,
    targetRegularFeatureProb,
    regularFeatureProb: null,
    minRegularFeatureProb: bounds.min,
    maxRegularFeatureProb: bounds.max,
    featureScale: 1,
    tolerancePercent: Math.max(0.001, Number(target.featureRateTolerancePercent ?? 0.02)),
  };
}

function getRegularFeatureProbabilityBounds(bucketShares, stats, regularProb) {
  let min = 0;
  let max = 0;
  for (const share of bucketShares) {
    const bucket = stats.buckets[share.index];
    const probability = regularProb * share.normalizedShare;
    const hasFeature = bucket.featurePayouts.length > 0;
    const hasNonFeature = bucket.nonFeaturePayouts.length > 0;
    if (hasFeature && !hasNonFeature) min += probability;
    if (hasFeature) max += probability;
  }
  return { min, max };
}

function buildAvailableBucketShares(buckets, stats, warnings) {
  const available = [];
  let availableShareTotal = 0;

  for (const [index, bucket] of buckets.entries()) {
    const share = Number(bucket.share || 0);
    const rows = stats.buckets[index].rows;
    if (share > 0 && rows > 0) {
      available.push({ index, label: bucket.label, share, rows });
      availableShareTotal += share;
    } else if (share > 0 && rows === 0) {
      warnings.push(`Bucket ${bucket.label} target share ${share}% has no rows and was redistributed.`);
    }
  }

  if (availableShareTotal <= 0) {
    for (const [index, bucket] of buckets.entries()) {
      const rows = stats.buckets[index].rows;
      if (rows <= 0) continue;
      available.push({ index, label: bucket.label, share: rows, rows });
      availableShareTotal += rows;
    }
    warnings.push('No configured positive bucket had rows; optimizer fell back to row-count bucket shares.');
  }

  return available.map((entry) => ({ ...entry, normalizedShare: entry.share / availableShareTotal }));
}

async function writeOptimizedTable({
  mode, readPath, lutPath, rawPath, stats, plan, buckets, optimizerConfig, featureRows, dryRun,
}) {
  const minWeight = optimizerConfig.minimumWeight;
  const scale = optimizerConfig.weightScale;
  const bucketPlanByIndex = new Map(plan.bucketPlans.map((bucket) => [bucket.index, bucket]));
  const optimized = createOptimizedAccumulator();
  const bucketAccumulators = buckets.map((bucket, index) => ({
    label: bucket.label,
    targetSharePercent: Number(bucket.share || 0),
    rowCount: stats.buckets[index].rows,
    featureRowCount: stats.buckets[index].featurePayouts.length,
    nonFeatureRowCount: stats.buckets[index].nonFeaturePayouts.length,
    weight: 0,
    weightedPayoutUnits: 0,
  }));

  if (!dryRun && optimizerConfig.backupRawTables) fs.copyFileSync(lutPath, rawPath);

  const tempPath = `${lutPath}.tmp-${process.pid}`;
  const output = dryRun ? null : fs.createWriteStream(tempPath, { encoding: 'utf8' });

  try {
    await forEachCsvRow(readPath, async (row) => {
      const isFeature = featureRows.has(row.id);
      const assignment = assignWeight({
        row, isFeature, plan, stats, buckets, bucketPlanByIndex, minWeight, scale,
        maxWinUnits: optimizerConfig.maxWinX * PAYOUT_SCALE,
      });

      applyOptimizedAccumulator(optimized, row, assignment.weight, optimizerConfig.maxWinX * PAYOUT_SCALE, isFeature);
      if (assignment.bucketIndex >= 0) {
        const bucket = bucketAccumulators[assignment.bucketIndex];
        bucket.weight += assignment.weight;
        bucket.weightedPayoutUnits += assignment.weight * row.payoutUnits;
      }

      if (!dryRun) {
        const line = `${row.id},${assignment.weight},${row.payoutUnits}\n`;
        if (!output.write(line)) await once(output, 'drain');
      }
    });

    if (output) {
      output.end();
      await once(output, 'finish');
    }
  } catch (error) {
    if (output && !output.destroyed) output.destroy();
    if (!dryRun) fs.rmSync(tempPath, { force: true });
    throw error;
  }

  if (!dryRun) fs.renameSync(tempPath, lutPath);

  const weightedSummary = summarizeOptimizedAccumulator(optimized, { costUnits: plan.costUnits });
  const bucketReport = bucketAccumulators.map((bucket) => ({
    label: bucket.label,
    targetSharePercent: bucket.targetSharePercent,
    rows: bucket.rowCount,
    featureRows: bucket.featureRowCount,
    nonFeatureRows: bucket.nonFeatureRowCount,
    optimizedWeightSharePercent: optimized.totalWeight > 0
      ? round4((bucket.weight / optimized.totalWeight) * 100)
      : 0,
    optimizedAveragePayoutX: bucket.weight > 0
      ? round4((bucket.weightedPayoutUnits / bucket.weight) / PAYOUT_SCALE)
      : 0,
  }));

  return { optimized: weightedSummary, bucketReport };
}

function assignWeight({ row, isFeature, plan, stats, buckets, bucketPlanByIndex, minWeight, scale, maxWinUnits }) {
  let probability = 0;
  let bucketIndex = -1;

  if (row.payoutUnits <= 0) {
    probability = stats.deadRows > 0 ? plan.deadProb / stats.deadRows : 0;
  } else if (row.payoutUnits >= maxWinUnits) {
    probability = stats.maxRows > 0 ? plan.maxProb / stats.maxRows : 0;
  } else {
    const payoutX = row.payoutUnits / PAYOUT_SCALE;
    bucketIndex = findBucketIndex(buckets, payoutX);
    const bucketPlan = bucketPlanByIndex.get(bucketIndex);
    if (bucketPlan && bucketPlan.sumPower > 0) {
      const featureFactor = isFeature ? plan.featureConstraint.featureScale : 1;
      probability = bucketPlan.probability
        * ((featureFactor * Math.pow(payoutX, plan.power)) / bucketPlan.sumPower);
    }
  }

  return {
    bucketIndex,
    weight: probability > 0 ? Math.max(minWeight, Math.round(probability * scale)) : minWeight,
  };
}

function createOptimizedAccumulator() {
  return {
    totalWeight: 0, payoutWeight: 0, hitWeight: 0, deadWeight: 0, maxWeight: 0,
    featureWeight: 0, featurePayoutWeight: 0, maxWinFoundX: 0,
  };
}

function applyOptimizedAccumulator(accumulator, row, weight, maxWinUnits, isFeature) {
  accumulator.totalWeight += weight;
  accumulator.payoutWeight += weight * row.payoutUnits;
  if (row.payoutUnits > 0) accumulator.hitWeight += weight;
  else accumulator.deadWeight += weight;
  if (row.payoutUnits >= maxWinUnits) accumulator.maxWeight += weight;
  if (isFeature) {
    accumulator.featureWeight += weight;
    accumulator.featurePayoutWeight += weight * row.payoutUnits;
  }
  accumulator.maxWinFoundX = Math.max(accumulator.maxWinFoundX, row.payoutUnits / PAYOUT_SCALE);
}

function summarizeOptimizedAccumulator(accumulator, { costUnits }) {
  const totalWeight = Math.max(1, accumulator.totalWeight);
  const maxWinEvery = accumulator.maxWeight > 0 ? totalWeight / accumulator.maxWeight : null;
  const featureEvery = accumulator.featureWeight > 0 ? totalWeight / accumulator.featureWeight : null;
  return {
    totalWeight: Math.round(accumulator.totalWeight),
    rtpPercent: round4((accumulator.payoutWeight / totalWeight / costUnits) * 100),
    hitFrequencyPercent: round4((accumulator.hitWeight / totalWeight) * 100),
    deadRatePercent: round4((accumulator.deadWeight / totalWeight) * 100),
    maxWinHitFrequencyPercent: round6((accumulator.maxWeight / totalWeight) * 100),
    maxWinEvery: maxWinEvery ? round4(maxWinEvery) : null,
    maxWinFoundX: round4(accumulator.maxWinFoundX),
    featureRatePercent: round6((accumulator.featureWeight / totalWeight) * 100),
    featureEvery: featureEvery ? round4(featureEvery) : null,
    featureAveragePayoutX: accumulator.featureWeight > 0
      ? round4((accumulator.featurePayoutWeight / accumulator.featureWeight) / PAYOUT_SCALE)
      : null,
  };
}

function evaluateRegularDistribution(power, bucketShares, stats, featureConstraint, regularProb) {
  const poweredBuckets = bucketShares.map((share) => {
    const bucket = stats.buckets[share.index];
    return {
      share,
      feature: summarizePoweredPayouts(bucket.featurePayouts, power),
      nonFeature: summarizePoweredPayouts(bucket.nonFeaturePayouts, power),
    };
  });
  const featureScale = featureConstraint.enabled
    ? solveFeatureScale(poweredBuckets, featureConstraint.targetRegularFeatureProb, regularProb)
    : 1;
  let averageX = 0;
  let featureProb = 0;

  for (const bucket of poweredBuckets) {
    const featureWeight = featureScale * bucket.feature.sumWeight;
    const totalWeight = bucket.nonFeature.sumWeight + featureWeight;
    if (totalWeight <= 0) continue;
    const weightedPayout = bucket.nonFeature.sumPayout + (featureScale * bucket.feature.sumPayout);
    const bucketProbability = regularProb * bucket.share.normalizedShare;
    averageX += bucket.share.normalizedShare * (weightedPayout / totalWeight);
    featureProb += bucketProbability * (featureWeight / totalWeight);
  }

  return { power, averageX, featureScale, featureProb };
}

function solveFeatureScale(poweredBuckets, targetFeatureProb, regularProb) {
  if (targetFeatureProb === null) return 1;
  const featureProbabilityAt = (scale) => {
    let probability = 0;
    for (const bucket of poweredBuckets) {
      const featureWeight = scale * bucket.feature.sumWeight;
      const totalWeight = bucket.nonFeature.sumWeight + featureWeight;
      if (totalWeight <= 0) continue;
      probability += regularProb * bucket.share.normalizedShare * (featureWeight / totalWeight);
    }
    return probability;
  };

  let low = -30;
  let high = 30;
  if (targetFeatureProb <= featureProbabilityAt(Math.exp(low))) return Math.exp(low);
  if (targetFeatureProb >= featureProbabilityAt(Math.exp(high))) return Math.exp(high);

  for (let iteration = 0; iteration < 60; iteration += 1) {
    const mid = (low + high) / 2;
    if (featureProbabilityAt(Math.exp(mid)) < targetFeatureProb) low = mid;
    else high = mid;
  }
  return Math.exp((low + high) / 2);
}

function summarizePoweredPayouts(payouts, power) {
  let sumWeight = 0;
  let sumPayout = 0;
  for (const payoutX of payouts) {
    const weight = Math.pow(payoutX, power);
    sumWeight += weight;
    sumPayout += weight * payoutX;
  }
  return { sumWeight, sumPayout };
}

function buildBuckets(bucketShares) {
  return Object.entries(bucketShares).map(([label, share]) => ({
    label,
    share: Number(share || 0),
    ...parseBucketLabel(label),
  }));
}

function parseBucketLabel(label) {
  const match = String(label).match(/^([[(])\s*([0-9.]+)\s*,\s*([0-9.]+)\s*([\])])$/);
  if (!match) throw new Error(`Invalid LUT optimizer bucket label: ${label}`);
  return {
    min: Number(match[2]),
    max: Number(match[3]),
    includeMin: match[1] === '[',
    includeMax: match[4] === ']',
  };
}

function findBucketIndex(buckets, payoutX) {
  return buckets.findIndex((bucket) => {
    const aboveMin = bucket.includeMin ? payoutX >= bucket.min : payoutX > bucket.min;
    const belowMax = bucket.includeMax ? payoutX <= bucket.max : payoutX < bucket.max;
    return aboveMin && belowMax;
  });
}

function hasFeatureRateTarget(target) {
  return target?.targetFeatureRatePercent !== undefined
    && target?.targetFeatureRatePercent !== null
    && Number.isFinite(Number(target.targetFeatureRatePercent));
}

function resolveBookPath(outDir, mode) {
  const rawPath = path.join(outDir, 'books', `books_${mode}.jsonl`);
  if (fs.existsSync(rawPath)) return rawPath;
  const compressedPath = `${rawPath}.zst`;
  if (fs.existsSync(compressedPath)) return compressedPath;
  return rawPath;
}

async function collectTriggeredFeatureRows(filePath) {
  // A book "triggered a feature" if it has an explicit triggeredFeature field OR its
  // events contain a freeSpinTrigger (natural bonus entry). Deriving it from events
  // keeps the published book schema unchanged. Base mode has no feature-rate target so
  // an empty set is harmless; ante/buy modes (a later pass) use this.
  if (!fs.existsSync(filePath)) return new Set();
  const rows = new Set();
  await forEachJsonLine(filePath, (book) => {
    const id = Number(book?.id);
    if (!Number.isFinite(id)) return;
    const triggered = book?.triggeredFeature
      || (Array.isArray(book?.events) && book.events.some((event) => event?.type === 'freeSpinTrigger'));
    if (triggered) rows.add(id);
  });
  return rows;
}

async function forEachJsonLine(filePath, onRow) {
  const source = fs.createReadStream(filePath, { highWaterMark: 1024 * 1024 });
  const input = filePath.endsWith('.zst') ? source.pipe(createZstdDecompress()) : source;
  input.setEncoding('utf8');
  let pending = '';

  for await (const chunk of input) {
    pending += chunk;
    let lineStart = 0;
    let newlineIndex = pending.indexOf('\n', lineStart);
    while (newlineIndex >= 0) {
      const line = trimCarriageReturn(pending.slice(lineStart, newlineIndex));
      if (line.trim()) await onRow(JSON.parse(line));
      lineStart = newlineIndex + 1;
      newlineIndex = pending.indexOf('\n', lineStart);
    }
    pending = pending.slice(lineStart);
  }
  if (pending.trim()) await onRow(JSON.parse(trimCarriageReturn(pending)));
}

async function forEachCsvRow(filePath, onRow) {
  const input = fs.createReadStream(filePath, { encoding: 'utf8', highWaterMark: 1024 * 1024 });
  let pending = '';
  let lineNumber = 0;

  for await (const chunk of input) {
    pending += chunk;
    let lineStart = 0;
    let newlineIndex = pending.indexOf('\n', lineStart);
    while (newlineIndex >= 0) {
      const line = trimCarriageReturn(pending.slice(lineStart, newlineIndex));
      lineNumber += 1;
      if (line.trim()) await onRow(parseLutRow(line, lineNumber, filePath));
      lineStart = newlineIndex + 1;
      newlineIndex = pending.indexOf('\n', lineStart);
    }
    pending = pending.slice(lineStart);
  }
  if (pending.length > 0) {
    const line = trimCarriageReturn(pending);
    lineNumber += 1;
    if (line.trim()) await onRow(parseLutRow(line, lineNumber, filePath));
  }
}

function trimCarriageReturn(line) {
  return line.endsWith('\r') ? line.slice(0, -1) : line;
}

function parseLutRow(line, lineNumber, filePath) {
  const parts = line.split(',');
  if (parts.length < 3) throw new Error(`${toRepoPath(filePath)}:${lineNumber} invalid LUT row "${line}"`);
  const id = Number(parts[0]);
  const payoutUnits = Number(parts[2]);
  if (!Number.isFinite(id) || !Number.isFinite(payoutUnits)) {
    throw new Error(`${toRepoPath(filePath)}:${lineNumber} invalid numeric LUT row "${line}"`);
  }
  return { id, payoutUnits: Math.max(0, Math.round(payoutUnits)) };
}

function normalizeOptimizerConfig(config) {
  const jurisdiction = loadJurisdictionConfig();
  return {
    enabled: Boolean(config?.enabled),
    targetRtpPercent: Number(config?.targetRtpPercent || TARGET_RTP * 100),
    rtpTolerancePercent: Number(config?.rtpTolerancePercent || jurisdiction.math.rtpTolerancePercent || 0.5),
    maxWinX: Number(config?.maxWinX || MAX_WIN_X),
    weightScale: Number(config?.weightScale || DEFAULT_WEIGHT_SCALE),
    minimumWeight: Math.max(0, Number(config?.minimumWeight ?? DEFAULT_MINIMUM_WEIGHT)),
    backupRawTables: config?.backupRawTables !== false,
    reportPath: config?.reportPath || 'publish_files/configs/lut_optimization_report.json',
    modes: config?.modes || {},
  };
}

function normalizeModes(modes, optimizerConfig) {
  if (Array.isArray(modes) && modes.length > 0) return modes;
  return Object.keys(optimizerConfig.modes || {});
}

function percentToProbability(value) {
  return Math.min(1, Math.max(0, Number(value || 0) / 100));
}

function rawBackupPath(lutPath) {
  return lutPath.replace(/\.csv$/i, '.raw.csv');
}

function parseArgs(argv) {
  const parsed = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (match) parsed[match[1]] = match[2] ?? true;
  }
  return parsed;
}

function loadConfig(configPath) {
  const resolved = path.resolve(ROOT, String(configPath || DEFAULT_CONFIG_PATH));
  if (!fs.existsSync(resolved)) throw new Error(`Optimizer config not found: ${toRepoPath(resolved)}`);
  return JSON.parse(fs.readFileSync(resolved, 'utf8').replace(/^﻿/, ''));
}

function toRepoPath(filePath) {
  return path.relative(ROOT, filePath).replaceAll(path.sep, '/');
}

function round4(value) {
  return Math.round(Number(value || 0) * 10000) / 10000;
}

function round6(value) {
  return Math.round(Number(value || 0) * 1000000) / 1000000;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const fileConfig = loadConfig(args.config);
  const outDir = args.out || fileConfig.outputDirectory || DEFAULT_OUT_DIR;
  const modeArg = args.mode
    ? String(args.mode).split(',').map((mode) => mode.trim()).filter(Boolean)
    : null;
  const report = await optimizePublishedLookupTables({
    outDir,
    config: { ...fileConfig, enabled: true },
    modes: modeArg,
    progress: args.quiet !== true && args.quiet !== 'true',
    dryRun: args.dryRun === true || args.dryRun === 'true',
  });
  console.log(JSON.stringify(report, null, 2));
}

if (path.resolve(process.argv[1] || '') === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
