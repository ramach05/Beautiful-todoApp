import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

// sharp lives in apps/web devDependencies — resolve it from there, not from the monorepo root
const requireFromWeb = createRequire(path.join(import.meta.dirname, '../apps/web/package.json'));
const sharp = requireFromWeb('sharp');

const USAGE = 'usage: node scripts/optimize-images.mjs <source-image> [basename]';
const [source, basename = 'city'] = process.argv.slice(2);
if (!source) {
  console.error(USAGE);
  process.exit(1);
}

const outDir = path.resolve(import.meta.dirname, '../apps/web/src/shared/ui/assets/images');
const WIDTHS = [1920, 2560];
/** Quality tuned against a control crop: lower loses small lights visibly; effort — how thoroughly the encoder searches */
const FORMATS = [
  { ext: 'avif', quality: 48, effort: 8 },
  { ext: 'webp', quality: 70, effort: 6 },
];

await mkdir(outDir, { recursive: true });

for (const { ext, quality, effort } of FORMATS) {
  for (const width of WIDTHS) {
    const file = path.join(outDir, `${basename}-${width}.${ext}`);
    const info = await sharp(source, { failOn: 'none' })
      .rotate()
      .resize({ width })
      .toFormat(ext, { quality, effort })
      .toFile(file);
    report(file, info.size, `${info.width}x${info.height}`);
  }
}

// LQIP: 32px webp, its base64 output goes into the code as an inline placeholder until the background loads
const lqip = await sharp(source, { failOn: 'none' })
  .rotate()
  .resize({ width: 32 })
  .webp({ quality: 45 })
  .toBuffer();
report(`${basename}-lqip (inline)`, lqip.byteLength, '32px');
console.log(`\nLQIP data URI:\ndata:image/webp;base64,${lqip.toString('base64')}`);

/** Report line with the resulting file size */
function report(file, bytes, dims) {
  console.log(`${path.relative(process.cwd(), file)}: ${bytes} bytes (${dims})`);
}
