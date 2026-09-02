// =============================================================================
// Framework — math adapter for the JS tooling templates
//
// After copying Tooling/ into SlotFolder/math/games/<game_id>/tools/, either:
//   A. Prefer math-sdk: `make run GAME=<game_id>` + Rust optimizer. Then run
//      `node tools/jurisdiction.mjs --report=<lut or sim report>` only.
//   B. Point this adapter at your JS engine (playRound API below).
//
// Isolation: this file is copied into SlotFolder. Do not import /Framework.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadJurisdictionConfig } from './jurisdiction.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAME_MATH_PATH = path.join(ROOT, 'game-math.json');

const jurisdiction = loadJurisdictionConfig();

const fileMath = fs.existsSync(GAME_MATH_PATH)
  ? JSON.parse(fs.readFileSync(GAME_MATH_PATH, 'utf8').replace(/^\uFEFF/, ''))
  : {};

export const PAYOUT_SCALE = Number(fileMath.payoutScale || jurisdiction.math.payoutScale);
export const TARGET_RTP = Number(fileMath.targetRtpPercent || jurisdiction.math.targetRtpPercent) / 100;
export const MAX_WIN_X = Number(fileMath.maxWinX || jurisdiction.math.maxWinX);
export const MODE_COST = fileMath.modeCost || { base: 1 };
export const SIM_MODES = fileMath.simModes || Object.keys(MODE_COST);
export const ROWS = Number(fileMath.rows || 0);
export const COLS = Number(fileMath.cols || 0);
export const WAYS = Number(fileMath.ways || 0);

/**
 * Must return an object with playRound({ mode, amount }) =>
 * { payoutMultiplier, events, meta } where payoutMultiplier is integer ×100.
 */
export function createEngine(_options = {}) {
  throw new Error(
    'math-adapter: no JS engine wired. Official path is math-sdk `make run`. '
    + `Place game-math.json next to this tools/ folder (${GAME_MATH_PATH}) and implement createEngine(), `
    + 'or skip simulate/build and gate math with jurisdiction.mjs --report. See Tooling/README.md.',
  );
}
