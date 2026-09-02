#!/usr/bin/env node
// =============================================================================
// Framework — Stake jurisdiction / approval gates
//
// Reference only. Copy this file + jurisdiction.config.json into SlotFolder
// (see README.md). Do not import from /Framework at runtime.
//
// Official: https://stake-engine.com/docs/approval-guidelines/jurisdiction-requirements
//
// Usage (after copy):
//   node tools/jurisdiction.mjs --self-test
//   node tools/jurisdiction.mjs --title="My Game"
//   node tools/jurisdiction.mjs --report=publish_files/configs/lut_optimization_report.json
//   node tools/jurisdiction.mjs --copy=apps/<game_id>/src/i18n/en.json --social
//   node tools/jurisdiction.mjs --thumbnail=public/thumbnail/background.webp
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(SCRIPT_DIR, 'jurisdiction.config.json');

export function loadJurisdictionConfig(configPath = CONFIG_PATH) {
  const resolved = path.resolve(configPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Jurisdiction config not found: ${resolved}`);
  }
  return JSON.parse(fs.readFileSync(resolved, 'utf8').replace(/^\uFEFF/, ''));
}

export function checkTitle(title, config = loadJurisdictionConfig()) {
  const findings = [];
  const text = String(title || '').trim();
  if (!text) {
    findings.push({ ok: false, id: 'empty-title', message: 'Game title is empty.' });
    return { ok: false, findings };
  }

  const lower = text.toLowerCase();
  for (const term of config.title?.bannedSubstrings || []) {
    if (lower.includes(String(term).toLowerCase())) {
      findings.push({
        ok: false,
        id: `banned-term:${term}`,
        message: `Title contains banned term "${term}". Titles must be unique and must not imply affiliation with established publishers or series.`,
      });
    }
  }

  for (const rule of config.title?.bannedPatterns || []) {
    const re = new RegExp(rule.pattern, 'i');
    if (re.test(text)) {
      findings.push({ ok: false, id: rule.id, message: rule.reason });
    }
  }

  return { ok: findings.length === 0, findings };
}

export function checkMathReport(report, config = loadJurisdictionConfig()) {
  const math = config.math || {};
  const findings = [];
  const modes = extractModeRows(report);

  if (modes.length === 0) {
    findings.push({ ok: false, id: 'no-modes', message: 'Report has no per-mode RTP rows.' });
    return { ok: false, findings, modes };
  }

  const rtps = [];
  for (const mode of modes) {
    const rtp = Number(mode.rtpPercent);
    if (!Number.isFinite(rtp)) {
      findings.push({ ok: false, id: `rtp-missing:${mode.mode}`, message: `Mode "${mode.mode}" has no rtpPercent.` });
      continue;
    }
    rtps.push({ mode: mode.mode, rtp });
    if (rtp < math.rtpMinPercent || rtp > math.rtpMaxPercent) {
      findings.push({
        ok: false,
        id: `rtp-band:${mode.mode}`,
        message: `Mode "${mode.mode}" RTP ${rtp.toFixed(3)}% is outside ${math.rtpMinPercent}%–${math.rtpMaxPercent}%.`,
      });
    }

    if (mode.mode === 'base' || mode.costMultiplier === 1) {
      const hitEvery = hitRateToEvery(mode.hitFrequencyPercent);
      if (hitEvery != null && hitEvery > math.baseHitRateMaxEvery) {
        findings.push({
          ok: false,
          id: `hit-rate:${mode.mode}`,
          message: `Mode "${mode.mode}" >0-win hit-rate is 1 in ${hitEvery.toFixed(1)} (need ≤ 1 in ${math.baseHitRateMaxEvery}; typical ${math.baseHitRateTypicalEvery.min}–${math.baseHitRateTypicalEvery.max}).`,
        });
      }
    }

    const maxEvery = mode.maxWinEvery ?? mode.optimized?.maxWinEvery ?? null;
    if (maxEvery != null && Number.isFinite(Number(maxEvery)) && Number(maxEvery) > math.maxWinMinHitEvery) {
      findings.push({
        ok: false,
        id: `max-win:${mode.mode}`,
        message: `Mode "${mode.mode}" advertised max win hit-rate is 1 in ${Math.round(maxEvery).toLocaleString()} (need 1 in ${math.maxWinMinHitEvery.toLocaleString()} or more frequent).`,
      });
    }
  }

  if (rtps.length >= 2) {
    const values = rtps.map((row) => row.rtp);
    const spread = Math.max(...values) - Math.min(...values);
    if (spread > math.modeRtpDeltaPercent) {
      findings.push({
        ok: false,
        id: 'rtp-mode-spread',
        message: `Mode RTP spread is ${spread.toFixed(3)}% (limit ${math.modeRtpDeltaPercent}%).`,
      });
    }
  }

  return { ok: findings.length === 0, findings, modes };
}

export function checkSocialCopy(text, config = loadJurisdictionConfig()) {
  const findings = [];
  const haystack = String(text || '');
  if (!haystack.trim()) {
    findings.push({ ok: false, id: 'empty-copy', message: 'No copy supplied for social audit.' });
    return { ok: false, findings };
  }

  const replacements = config.social?.restrictedReplacements || [];
  const lower = maskProtectedPhrases(haystack.toLowerCase());
  const seen = new Set();

  for (const rule of replacements) {
    const phrase = String(rule.phrase || '').toLowerCase();
    if (!phrase || seen.has(phrase)) continue;
    const re = wordBoundaryPattern(phrase);
    if (re.test(lower)) {
      seen.add(phrase);
      findings.push({
        ok: false,
        id: `restricted:${phrase}`,
        message: `Restricted social term "${rule.phrase}" — use "${rule.replacement}".`,
      });
    }
  }

  if (config.social?.forbidDollarPrefix && /\$\s*\d/.test(haystack)) {
    findings.push({
      ok: false,
      id: 'dollar-prefix',
      message: 'Social mode must display SC/GC values without a $ prefix.',
    });
  }

  return { ok: findings.length === 0, findings };
}

export async function checkThumbnailFile(filePath, config = loadJurisdictionConfig()) {
  const findings = [];
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    findings.push({ ok: false, id: 'missing-file', message: `Thumbnail file not found: ${resolved}` });
    return { ok: false, findings };
  }

  let sharp;
  try {
    ({ default: sharp } = await import('sharp'));
  } catch {
    findings.push({
      ok: true,
      id: 'sharp-missing',
      message: 'sharp is not installed; luminance check skipped. Manual: bright tile, no dark edges, no baked text/multipliers.',
    });
    return { ok: true, findings, skipped: true };
  }

  const thumb = config.thumbnail || {};
  const image = sharp(resolved);
  const { width, height } = await image.metadata();
  if (!width || !height) {
    findings.push({ ok: false, id: 'no-dimensions', message: 'Could not read image dimensions.' });
    return { ok: false, findings };
  }

  const stats = await image.clone().stats();
  const mean = channelMean(stats);
  if (mean < thumb.minMeanLuminance) {
    findings.push({
      ok: false,
      id: 'too-dark',
      message: `Mean luminance ${mean.toFixed(1)} < ${thumb.minMeanLuminance}. Tile must be generally bright and not clash with the Stake background.`,
    });
  }

  const strip = Math.max(1, Math.round(Math.min(width, height) * (thumb.edgeStripRatio || 0.08)));
  const edgeMean = await meanOfEdgeStrips(sharp, resolved, width, height, strip);
  if (edgeMean < thumb.minEdgeLuminance) {
    findings.push({
      ok: false,
      id: 'dark-edges',
      message: `Edge luminance ${edgeMean.toFixed(1)} < ${thumb.minEdgeLuminance}. Dark edges clash with Stake chrome.`,
    });
  }

  if (thumb.forbidBakedText || thumb.forbidBakedMultipliers) {
    findings.push({
      ok: true,
      id: 'manual-text',
      message: 'Manual: no wording or multipliers on background or foreground. Title is a Tile Editor layer, not baked art.',
    });
  }

  return {
    ok: findings.every((item) => item.ok !== false),
    findings,
    metrics: { width, height, meanLuminance: round1(mean), edgeLuminance: round1(edgeMean) },
  };
}

export function formatVerdict(label, result) {
  const lines = [`${result.ok ? 'PASS' : 'FAIL'}  ${label}`];
  for (const finding of result.findings || []) {
    const tag = finding.ok === false ? 'FAIL' : 'NOTE';
    lines.push(`  [${tag}] ${finding.message}`);
  }
  return lines.join('\n');
}

function extractModeRows(report) {
  if (!report || typeof report !== 'object') return [];
  if (Array.isArray(report.modes)) {
    return report.modes.map((mode) => normalizeModeRow(mode.mode || mode.name, mode));
  }
  if (report.reports && typeof report.reports === 'object') {
    return Object.entries(report.reports).map(([mode, row]) => normalizeModeRow(mode, row));
  }
  if (report.modes && typeof report.modes === 'object' && !Array.isArray(report.modes)) {
    return Object.entries(report.modes)
      .filter(([, row]) => row && !row.skipped)
      .map(([mode, row]) => {
      const optimized = row.optimized || {};
      return normalizeModeRow(mode, {
        ...row,
        rtpPercent: optimized.rtpPercent ?? row.raw?.rtpPercent ?? row.rtpPercent,
        hitFrequencyPercent: optimized.hitFrequencyPercent ?? row.raw?.hitFrequencyPercent ?? row.hitFrequencyPercent,
        maxWinEvery: optimized.maxWinEvery ?? row.optimizer?.actualMaxWinEvery,
        costMultiplier: row.costMultiplier ?? row.profile?.costMultiplier,
      });
    });
  }
  return [];
}

function normalizeModeRow(mode, row) {
  return {
    mode,
    rtpPercent: Number(row.rtpPercent),
    hitFrequencyPercent: Number(row.hitFrequencyPercent),
    maxWinEvery: row.maxWinEvery == null ? null : Number(row.maxWinEvery),
    costMultiplier: row.costMultiplier == null ? null : Number(row.costMultiplier),
    optimized: row.optimized,
  };
}

function hitRateToEvery(hitFrequencyPercent) {
  const pct = Number(hitFrequencyPercent);
  if (!Number.isFinite(pct) || pct <= 0) return null;
  return 100 / pct;
}

function maskProtectedPhrases(lower) {
  return lower.replace(/stake\s+engine/g, 'studio platform');
}

function wordBoundaryPattern(phrase) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
}

function channelMean(stats) {
  const channels = (stats.channels || []).slice(0, 3);
  if (channels.length === 0) return 0;
  return channels.reduce((sum, channel) => sum + Number(channel.mean || 0), 0) / channels.length;
}

async function meanOfEdgeStrips(sharp, filePath, width, height, strip) {
  const regions = [
    { left: 0, top: 0, width, height: strip },
    { left: 0, top: Math.max(0, height - strip), width, height: strip },
    { left: 0, top: 0, width: strip, height },
    { left: Math.max(0, width - strip), top: 0, width: strip, height },
  ];
  const means = [];
  for (const region of regions) {
    const stats = await sharp(filePath).extract(region).stats();
    means.push(channelMean(stats));
  }
  return means.reduce((sum, value) => sum + value, 0) / means.length;
}

function round1(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

function parseArgs(argv) {
  const parsed = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (match) parsed[match[1]] = match[2] ?? true;
  }
  return parsed;
}

function runSelfTest() {
  const config = loadJurisdictionConfig();
  const cases = [
    { name: 'clean title', fn: () => checkTitle('Amber Grid', config), expectOk: true },
    { name: 'megaways', fn: () => checkTitle('Candy Megaways', config), expectOk: false },
    { name: 'gates of', fn: () => checkTitle('Gates of Amber', config), expectOk: false },
    { name: 'bonanza', fn: () => checkTitle('Sugar Bonanza', config), expectOk: false },
    { name: 'boosted rtp', fn: () => checkTitle('Amber Boosted RTP', config), expectOk: false },
    {
      name: 'rtp band',
      fn: () => checkMathReport({ reports: { base: { rtpPercent: 96, hitFrequencyPercent: 20, costMultiplier: 1 } } }, config),
      expectOk: true,
    },
    {
      name: 'rtp too low',
      fn: () => checkMathReport({ reports: { base: { rtpPercent: 88, hitFrequencyPercent: 20, costMultiplier: 1 } } }, config),
      expectOk: false,
    },
    {
      name: 'mode spread',
      fn: () => checkMathReport({
        reports: {
          base: { rtpPercent: 97, hitFrequencyPercent: 20, costMultiplier: 1 },
          bonus_buy: { rtpPercent: 96.2, hitFrequencyPercent: 40, costMultiplier: 100 },
        },
      }, config),
      expectOk: false,
    },
    { name: 'social bet', fn: () => checkSocialCopy('Press BET to start', config), expectOk: false },
    { name: 'social play', fn: () => checkSocialCopy('Press Play to start', config), expectOk: true },
    { name: 'social disclaimer tm', fn: () => checkSocialCopy('TM and © Stake Engine.', config), expectOk: true },
  ];

  let failed = 0;
  for (const testCase of cases) {
    const result = testCase.fn();
    const passed = result.ok === testCase.expectOk;
    if (!passed) failed += 1;
    console.log(`${passed ? 'PASS' : 'FAIL'}  ${testCase.name}`);
  }
  return failed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = loadJurisdictionConfig(args.config);

  if (args['self-test'] === true || args.selfTest === true) {
    const failed = runSelfTest();
    process.exitCode = failed === 0 ? 0 : 1;
    return;
  }

  let failed = false;

  if (args.title) {
    const result = checkTitle(String(args.title), config);
    console.log(formatVerdict(`title "${args.title}"`, result));
    if (!result.ok) failed = true;
  }

  if (args.report) {
    const report = JSON.parse(fs.readFileSync(path.resolve(String(args.report)), 'utf8'));
    const result = checkMathReport(report, config);
    console.log(formatVerdict(`report ${args.report}`, result));
    if (!result.ok) failed = true;
  }

  if (args.copy) {
    const text = fs.readFileSync(path.resolve(String(args.copy)), 'utf8');
    if (args.social === true || args.social === 'true') {
      const result = checkSocialCopy(text, config);
      console.log(formatVerdict(`social copy ${args.copy}`, result));
      if (!result.ok) failed = true;
    } else {
      console.log('NOTE  Pass --social to audit copy against Stake.US restricted words.');
    }
  }

  if (args.thumbnail) {
    const result = await checkThumbnailFile(String(args.thumbnail), config);
    console.log(formatVerdict(`thumbnail ${args.thumbnail}`, result));
    if (result.metrics) {
      console.log(`  metrics: ${JSON.stringify(result.metrics)}`);
    }
    if (!result.ok) failed = true;
  }

  if (!args.title && !args.report && !args.copy && !args.thumbnail) {
    console.log('Usage: node jurisdiction.mjs --self-test | --title=... | --report=... | --copy=... --social | --thumbnail=...');
  }

  process.exitCode = failed ? 1 : 0;
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
