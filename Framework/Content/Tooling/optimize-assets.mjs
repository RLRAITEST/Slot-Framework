// =============================================================================
// Framework — asset optimisation + thumbnail jurisdiction gate
//
// Copy into SlotFolder (web app tools or games/<id>/tools/). Idempotent.
// Requires the `sharp` dev dependency for encode + luminance checks.
//
//   1. Spine atlas pages  -> WebP
//   2. Flat reel symbols  -> WebP (capped at 512px)
//   3. Win-presentation coins -> WebP
//   4. Minify Spine skeleton JSON
//   5. Thumbnail luminance vs jurisdiction.config.json (bright tile, no dark edges)
//
// Baked wording / multipliers on background or foreground is a MANUAL gate
// (Tile Editor title layer only). See 13-jurisdiction-requirements.md.
//
// Usage: node tools/optimize-assets.mjs
//        node tools/optimize-assets.mjs --thumbnail-only
// =============================================================================

import { readdir, readFile, writeFile, rm, stat, access } from 'node:fs/promises';
import path from 'node:path';
import { checkThumbnailFile, formatVerdict, loadJurisdictionConfig } from './jurisdiction.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUB = path.join(ROOT, 'public');
const THUMB_CANDIDATES = [
  path.join(PUB, 'thumbnail', 'background.webp'),
  path.join(PUB, 'thumbnail', 'background.png'),
  path.join(PUB, 'thumbnail', 'foreground.webp'),
  path.join(PUB, 'thumbnail', 'foreground.png'),
  path.join(PUB, 'tile-background.webp'),
  path.join(PUB, 'tile-background.png'),
];

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
async function sizeOf(p) { try { return (await stat(p)).size; } catch { return 0; } }
async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    throw new Error('optimize-assets.mjs requires the sharp package. Install it in the SlotFolder web app, not in Framework.');
  }
}

async function convertSpinePages(sharp) {
  const spineDir = path.join(PUB, 'symbols', 'spine');
  if (!(await exists(spineDir))) return;
  const names = await readdir(spineDir);
  let before = 0;
  let after = 0;
  for (const name of names) {
    const dir = path.join(spineDir, name);
    const png = path.join(dir, `${name}.png`);
    const webp = path.join(dir, `${name}.webp`);
    const atlas = path.join(dir, `${name}.atlas`);
    if (!(await sizeOf(png))) continue;
    before += await sizeOf(png);
    await sharp(png).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(webp);
    after += await sizeOf(webp);
    if (await exists(atlas)) {
      const atlasText = await readFile(atlas, 'utf8');
      await writeFile(atlas, atlasText.replace(`${name}.png`, `${name}.webp`));
    }
    await rm(png);
    console.log(`  spine/${name}/${name}.png ${kb(await sizeOf(webp))}`);
  }
  console.log(`Spine pages: ${kb(before)} PNG -> ${kb(after)} WebP\n`);
}

const FLAT_MAX = 512;
async function convertFlatSymbols(sharp) {
  const flatDir = path.join(PUB, 'symbols', 'flat');
  if (!(await exists(flatDir))) return;
  const files = (await readdir(flatDir)).filter((f) => f.endsWith('.png'));
  let before = 0;
  let after = 0;
  for (const file of files) {
    const png = path.join(flatDir, file);
    const webp = path.join(flatDir, file.replace(/\.png$/, '.webp'));
    before += await sizeOf(png);
    await sharp(png)
      .resize(FLAT_MAX, FLAT_MAX, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, alphaQuality: 100, effort: 6 })
      .toFile(webp);
    after += await sizeOf(webp);
    await rm(png);
  }
  console.log(`Flat symbols: ${kb(before)} PNG -> ${kb(after)} WebP (${files.length} files)\n`);
}

async function convertCoins(sharp) {
  const coinDir = path.join(PUB, 'win-presentation', 'coins');
  if (!(await exists(coinDir))) return;
  const files = (await readdir(coinDir)).filter((f) => f.endsWith('.png'));
  let before = 0;
  let after = 0;
  for (const file of files) {
    const png = path.join(coinDir, file);
    const webp = path.join(coinDir, file.replace(/\.png$/, '.webp'));
    before += await sizeOf(png);
    await sharp(png).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toFile(webp);
    after += await sizeOf(webp);
    await rm(png);
  }
  console.log(`Coins: ${kb(before)} PNG -> ${kb(after)} WebP (${files.length} files)\n`);
}

async function minifySpineJson() {
  const spineDir = path.join(PUB, 'symbols', 'spine');
  if (!(await exists(spineDir))) return;
  const names = await readdir(spineDir);
  let before = 0;
  let after = 0;
  for (const name of names) {
    const file = path.join(spineDir, name, `${name}.json`);
    if (!(await sizeOf(file))) continue;
    before += await sizeOf(file);
    const minified = JSON.stringify(JSON.parse(await readFile(file, 'utf8')));
    await writeFile(file, minified);
    after += await sizeOf(file);
  }
  console.log(`Spine JSON: ${kb(before)} -> ${kb(after)} (minified)\n`);
}

async function checkThumbnails() {
  const config = loadJurisdictionConfig();
  const found = [];
  for (const candidate of THUMB_CANDIDATES) {
    if (await exists(candidate)) found.push(candidate);
  }
  if (found.length === 0) {
    console.log('Thumbnail: no public/thumbnail/{background,foreground} image found.');
    console.log('  Manual: bright tile, no dark edges, no baked wording/multipliers, title inside inner guides.');
    return true;
  }
  let ok = true;
  for (const file of found) {
    const result = await checkThumbnailFile(file, config);
    console.log(formatVerdict(path.relative(ROOT, file).replaceAll(path.sep, '/'), result));
    if (result.metrics) console.log(`  metrics: ${JSON.stringify(result.metrics)}`);
    if (!result.ok) ok = false;
  }
  return ok;
}

const thumbnailOnly = process.argv.includes('--thumbnail-only');
if (!thumbnailOnly) {
  const sharp = await loadSharp();
  await convertSpinePages(sharp);
  await convertFlatSymbols(sharp);
  await convertCoins(sharp);
  await minifySpineJson();
}
const thumbsOk = await checkThumbnails();
if (!thumbsOk) process.exitCode = 1;
console.log('Done.');
