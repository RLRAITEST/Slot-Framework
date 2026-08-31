#!/usr/bin/env node
// =============================================================================
// Framework — Stake Engine Math Publisher (template)
//
// Copy into SlotFolder/math/games/<game_id>/tools/ and wire createEngine() in
// math-adapter.mjs. Official math path remains math-sdk `make run`.
//
// Writes a Stake Engine-compatible math bundle under ./publish_files/.
// Lookup-table weights start uniform; run optimize-luts.mjs after this.
// RTP / hit-rate / max-win are checked against jurisdiction.config.json.
//
// Usage:
//   node tools/build-stake-engine-math.mjs                       # 2,000 spins/mode
//   node tools/build-stake-engine-math.mjs --spins=10000
//   node tools/build-stake-engine-math.mjs --mode=base,bonus_buy
//   node tools/build-stake-engine-math.mjs --compress            # also emit .jsonl.zst
//   node tools/build-stake-engine-math.mjs --out=publish_test
//   node tools/build-stake-engine-math.mjs --title="My Game"
//
// Output layout (upload the publish_files FOLDER to Stake Engine, not a zip):
//   publish_files/
//     index.json
//     configs/config.json
//     books/books_<mode>.jsonl[.zst]
//     lookup_tables/lookUpTable_<mode>.csv
//     lookup_tables/lookUpTableIdToCriteria_<mode>.csv
//
// index.json schema (stake-engine math v5 ingestion):
//   { "modes": [ { "name", "cost", "events", "weights" } ] }
//
// IMPORTANT: payoutMultiplier is INTEGER UNITS where 100 units = 1.00x bet.
// The lookUpTable payout column MUST equal the book's payoutMultiplier.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

import { createEngine, SIM_MODES, MODE_COST, PAYOUT_SCALE, MAX_WIN_X, TARGET_RTP, ROWS, COLS, WAYS } from './math-adapter.mjs';
import { checkMathReport, checkTitle, formatVerdict, loadJurisdictionConfig } from './jurisdiction.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = parseArgs(process.argv.slice(2));

const DEFAULT_SPINS = 2_000;
const defaultSpins = Number(args.spins || DEFAULT_SPINS);
const seed = Number(args.seed || 1337);
const bet = Number(args.bet || 100); // only affects round.payout (currency); units are bet-independent
const outDir = path.resolve(ROOT, String(args.out || 'library/publish_files'));
const selectedModes = selectModes(args.mode);
const spinsByMode = normalizeSpinsByMode(args.spinsByMode, defaultSpins);
const compress = args.compress === true || args.compress === 'true';
const progressEvery = Math.max(500, Math.floor(defaultSpins / 10));

// Stake Engine "criteria" categories, keyed in lookUpTableIdToCriteria_*.csv.
// The RGS can force-pick a round matching a criteria for guaranteed outcomes
// (zero round, base hit, big, super, mega, epic, max win) when testing.
const CRITERIA_BUCKETS = [
  { id: '0', min: 0, max: Number.EPSILON },
  { id: 'base', min: Number.EPSILON, max: 5 },
  { id: 'big', min: 5, max: 25 },
  { id: 'super', min: 25, max: 200 },
  { id: 'mega', min: 200, max: 2_000 },
  { id: 'epic', min: 2_000, max: MAX_WIN_X },
  { id: 'max', min: MAX_WIN_X, max: Infinity },
];

cleanOutputDirectory(outDir);
ensureDir(outDir);
ensureDir(path.join(outDir, 'configs'));
ensureDir(path.join(outDir, 'books'));
ensureDir(path.join(outDir, 'lookup_tables'));

const startedAt = Date.now();
const summaries = {};

console.error(`Math publisher -> ${path.relative(ROOT, outDir)}`);
console.error(
  `Default spins/mode: ${defaultSpins.toLocaleString()} | seed: ${seed} `
  + `| modes: ${selectedModes.join(', ')} | compress: ${compress ? 'yes (.zst)' : 'no'}`,
);
if (Object.keys(spinsByMode).length) {
  console.error(
    `Mode spin overrides: ${Object.entries(spinsByMode).map(([m, n]) => `${m}=${n.toLocaleString()}`).join(', ')}`,
  );
}
console.error('');

for (const [modeIndex, mode] of selectedModes.entries()) {
  const modeSpins = spinsByMode[mode] || defaultSpins;
  summaries[mode] = await buildModeBundle({
    mode,
    spins: modeSpins,
    seed: seed + modeIndex * 100_003,
    modeIndex: modeIndex + 1,
    totalModes: selectedModes.length,
  });
}

writeTopLevelConfig(summaries);
writeIndex(summaries);

const totalSeconds = (Date.now() - startedAt) / 1000;
console.error('');
console.error('| Mode | Spins | Cost | RTP % | Hit % | Max found (x) | Book |');
console.error('|---|---:|---:|---:|---:|---:|---:|');
for (const s of Object.values(summaries)) {
  console.error(
    `| ${s.mode} | ${s.spins.toLocaleString()} | ${s.costMultiplier} | `
    + `${s.rtpPercent.toFixed(2)} | ${s.hitFrequencyPercent.toFixed(2)} | `
    + `${s.maxWinFoundX.toFixed(2)} | ${formatBytes(s.bookBytes)} |`,
  );
}
console.error('');
console.error(`Wrote ${path.relative(ROOT, outDir)} in ${totalSeconds.toFixed(2)}s.`);
console.error('Upload the publish_files/ folder on the Stake Engine "Math" tab.');

{
  const config = loadJurisdictionConfig();
  const gameTitle = String(args.title || args.gameTitle || '');
  if (gameTitle) {
    const titleVerdict = checkTitle(gameTitle, config);
    console.error(formatVerdict(`title "${gameTitle}"`, titleVerdict));
    if (!titleVerdict.ok) process.exitCode = 1;
  }
  const mathVerdict = checkMathReport({ reports: summaries }, config);
  console.error(formatVerdict('jurisdiction math', mathVerdict));
  if (!mathVerdict.ok) process.exitCode = 1;
}

// =============================================================================
async function buildModeBundle({ mode, spins, seed: modeSeed, modeIndex, totalModes }) {
  const engine = createEngine({ seed: modeSeed });
  const costMultiplier = MODE_COST[mode] || 1;
  const costUnits = costMultiplier * PAYOUT_SCALE;

  // Always write plain .jsonl first; optionally compress to .jsonl.zst afterward.
  const booksPath = path.join(outDir, 'books', `books_${mode}.jsonl`);
  const lutPath = path.join(outDir, 'lookup_tables', `lookUpTable_${mode}.csv`);
  const criteriaPath = path.join(outDir, 'lookup_tables', `lookUpTableIdToCriteria_${mode}.csv`);

  // Sync fds (not WriteStream) so files are flushed before any downstream read.
  const booksFd = fs.openSync(booksPath, 'w');
  const lutFd = fs.openSync(lutPath, 'w');
  const criteriaFd = fs.openSync(criteriaPath, 'w');

  let totalUnits = 0;
  let hits = 0;
  let maxWinUnits = 0;
  let maxWinHits = 0;
  const criteriaCounts = Object.fromEntries(CRITERIA_BUCKETS.map((b) => [b.id, 0]));

  console.error(
    `[${mode}] start ${spins.toLocaleString()} rounds | mode ${modeIndex}/${totalModes} `
    + `| seed ${modeSeed} | cost ${costMultiplier}x`,
  );

  for (let i = 0; i < spins; i += 1) {
    const id = i + 1;
    const round = engine.playRound({ mode, amount: bet });
    const units = Number(round.payoutMultiplier || 0);
    const xBet = units / PAYOUT_SCALE;
    const criteria = classifyCriteria(xBet, Boolean(round.meta?.maxWinHit));

    totalUnits += units;
    if (units > 0) hits += 1;
    if (units > maxWinUnits) maxWinUnits = units;
    if (round.meta?.maxWinHit) maxWinHits += 1;
    criteriaCounts[criteria] += 1;

    // Full event objects (NOT compacted) - the frontend roundAdapter reads them
    // directly. Stake Engine treats `events` as opaque JSON and replays it back.
    const book = { id, payoutMultiplier: units, mode, events: round.events };
    fs.writeSync(booksFd, `${JSON.stringify(book)}\n`);
    fs.writeSync(lutFd, `${id},1,${units}\n`); // uniform weight: every book equally likely
    fs.writeSync(criteriaFd, `${id},${criteria}\n`);

    if (id === 1 || id === spins || id % progressEvery === 0) {
      const pct = ((id / spins) * 100).toFixed(1);
      console.error(`[${mode}] ${id.toLocaleString()}/${spins.toLocaleString()} (${pct}%)`);
    }
  }

  fs.closeSync(booksFd);
  fs.closeSync(lutFd);
  fs.closeSync(criteriaFd);

  let bookFile = path.posix.join('books', `books_${mode}.jsonl`);
  let bookBytes = fs.statSync(booksPath).size;
  if (compress) {
    // STREAM the compression - a 2M-round base/ante book is multiple GB, and
    // fs.readFileSync/zstdCompressSync cap at ~2 GiB (ERR_FS_FILE_TOO_LARGE). A
    // read -> zstd -> write pipeline handles any size with bounded memory.
    const zstPath = `${booksPath}.zst`;
    await pipeline(
      fs.createReadStream(booksPath),
      zlib.createZstdCompress(),
      fs.createWriteStream(zstPath),
    );
    fs.rmSync(booksPath, { force: true });
    bookFile = path.posix.join('books', `books_${mode}.jsonl.zst`);
    bookBytes = fs.statSync(zstPath).size;
  }

  const rtp = totalUnits / (spins * costUnits);
  const summary = {
    mode,
    label: modeLabel(mode),
    spins,
    seed: modeSeed,
    costMultiplier,
    rtpPercent: round4(rtp * 100),
    hitFrequencyPercent: round4((hits / spins) * 100),
    maxWinFoundX: round4(maxWinUnits / PAYOUT_SCALE),
    maxWinHits,
    criteriaCounts,
    bookBytes,
    files: {
      books: bookFile,
      lookUpTable: path.posix.join('lookup_tables', `lookUpTable_${mode}.csv`),
      criteria: path.posix.join('lookup_tables', `lookUpTableIdToCriteria_${mode}.csv`),
    },
  };

  console.error(
    `[${mode}] done | RTP ${(rtp * 100).toFixed(2)}% | hit ${((hits / spins) * 100).toFixed(2)}% `
    + `| max ${(maxWinUnits / PAYOUT_SCALE).toFixed(2)}x | book ${formatBytes(bookBytes)}`,
  );

  return summary;
}

function classifyCriteria(payoutX, maxWinHit) {
  if (maxWinHit) return 'max';
  for (const bucket of CRITERIA_BUCKETS) {
    if (payoutX >= bucket.min && payoutX < bucket.max) return bucket.id;
  }
  return CRITERIA_BUCKETS[CRITERIA_BUCKETS.length - 1].id;
}

function writeTopLevelConfig(allSummaries) {
  const config = {
    title: String(args.title || args.gameTitle || 'Untitled'),
    type: 'ways',
    grid: { rows: ROWS, cols: COLS },
    ways: WAYS,
    targetRtpPercent: TARGET_RTP * 100,
    maxWinX: MAX_WIN_X,
    payoutScale: PAYOUT_SCALE,
    note: 'Uniform lookup-table weights until optimize-luts.mjs (or math-sdk Rust optimizer) runs.',
    modes: Object.values(allSummaries).map((s) => ({
      mode: s.mode,
      label: s.label,
      costMultiplier: s.costMultiplier,
      spins: s.spins,
      rtpPercent: s.rtpPercent,
      hitFrequencyPercent: s.hitFrequencyPercent,
      maxWinFoundX: s.maxWinFoundX,
      maxWinHits: s.maxWinHits,
      criteriaCounts: s.criteriaCounts,
      files: s.files,
    })),
    criteria: CRITERIA_BUCKETS.map((bucket) => ({
      id: bucket.id,
      minPayoutX: bucket.min === Number.EPSILON ? 0.000001 : bucket.min,
      maxPayoutX: bucket.max === Infinity ? null : bucket.max,
    })),
  };
  fs.writeFileSync(
    path.join(outDir, 'configs', 'config.json'),
    `${JSON.stringify(config, null, 2)}\n`,
    'utf8',
  );
}

function writeIndex(allSummaries) {
  // Stake-engine math v5 schema: a top-level "modes" array; each entry names a
  // mode, its bet cost multiplier, and the relative paths to the events file
  // (books JSONL) and weights file (lookup table CSV).
  const index = {
    modes: Object.values(allSummaries).map((s) => ({
      name: s.mode,
      cost: s.costMultiplier,
      events: s.files.books,
      weights: s.files.lookUpTable,
    })),
  };
  fs.writeFileSync(
    path.join(outDir, 'index.json'),
    `${JSON.stringify(index, null, 2)}\n`,
    'utf8',
  );
}

// =============================================================================
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanOutputDirectory(dir) {
  const resolved = path.resolve(dir);
  const rootWithSep = `${ROOT}${path.sep}`;
  if (resolved !== ROOT && !resolved.startsWith(rootWithSep)) {
    throw new Error(`Refusing to clean output outside repo root: ${resolved}`);
  }
  for (const child of ['books', 'lookup_tables', 'configs']) {
    fs.rmSync(path.join(resolved, child), { recursive: true, force: true });
  }
  fs.rmSync(path.join(resolved, 'index.json'), { force: true });
}

function modeLabel(mode) {
  return {
    base: 'BASE',
    ante: 'ANTE BET',
    feature_spin: 'FEATURE SPIN',
    bonus_buy: 'FREE SPINS',
    super_bonus_buy: 'SUPER FREE SPINS',
    mystery_buy: 'MYSTERY BUY',
  }[mode] || mode.toUpperCase();
}

function selectModes(value) {
  if (!value || value === 'all') return [...SIM_MODES];
  const modes = String(value).split(',').map((item) => item.trim()).filter(Boolean);
  for (const mode of modes) {
    if (!SIM_MODES.includes(mode)) {
      throw new Error(`Unknown mode "${mode}". Expected one of: ${SIM_MODES.join(', ')}`);
    }
  }
  return modes;
}

function normalizeSpinsByMode(value, fallbackSpins) {
  if (!value) return {};
  const normalized = {};
  for (const item of String(value).split(',').map((entry) => entry.trim()).filter(Boolean)) {
    const [mode, count] = item.split(':');
    if (!SIM_MODES.includes(mode)) {
      throw new Error(`Unknown spinsByMode mode "${mode}". Expected one of: ${SIM_MODES.join(', ')}`);
    }
    const numeric = Math.floor(Number(count));
    if (!Number.isFinite(numeric) || numeric < 1) {
      throw new Error(`Invalid spinsByMode count for "${mode}": ${count}`);
    }
    if (numeric !== fallbackSpins) normalized[mode] = numeric;
  }
  return normalized;
}

function parseArgs(argv) {
  const parsed = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (!match) continue;
    parsed[match[1]] = match[2] ?? true;
  }
  return parsed;
}

function round4(value) {
  return Math.round(value * 10000) / 10000;
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(2)} GB`;
  if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(2)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
}
