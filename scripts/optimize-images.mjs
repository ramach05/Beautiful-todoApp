import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

// sharp лежит в devDependencies apps/web — резолвим его оттуда, а не из корня монорепо
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
/** Качество подобрано по контрольному кропу: ниже — заметная потеря мелких огней; effort — полнота поиска кодировщика */
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

// LQIP: 32px webp, base64 из вывода вставляется в код как inline-плейсхолдер до загрузки фона
const lqip = await sharp(source, { failOn: 'none' })
  .rotate()
  .resize({ width: 32 })
  .webp({ quality: 45 })
  .toBuffer();
report(`${basename}-lqip (inline)`, lqip.byteLength, '32px');
console.log(`\nLQIP data URI:\ndata:image/webp;base64,${lqip.toString('base64')}`);

/** Строка отчета о весе результата */
function report(file, bytes, dims) {
  console.log(`${path.relative(process.cwd(), file)}: ${bytes} bytes (${dims})`);
}
