import { createRequire } from 'node:module';
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

// sharp lives in apps/web devDependencies — resolve it from there, not from the monorepo root
const requireFromWeb = createRequire(path.join(import.meta.dirname, '../apps/web/package.json'));
const sharp = requireFromWeb('sharp');

const shotsRoot = path.resolve(import.meta.dirname, '../docs/screenshots');
/** README grid shows each cell ~330 CSS px wide; thumbs keep the page from loading full-size originals */
const WIDTHS = { desktop: 640, mobile: 300 };

for (const [dir, width] of Object.entries(WIDTHS)) {
  const from = path.join(shotsRoot, dir);
  const to = path.join(shotsRoot, 'thumbs', dir);
  await mkdir(to, { recursive: true });
  const files = (await readdir(from)).filter((f) => f.endsWith('.png'));
  for (const file of files) {
    // palette png is about 3x smaller than the full-color version, text stays crisp at grid size
    const info = await sharp(path.join(from, file))
      .resize({ width })
      .png({ palette: true, quality: 80, compressionLevel: 9 })
      .toFile(path.join(to, file));
    console.log(`thumbs/${dir}/${file} — ${Math.round(info.size / 1024)} KB`);
  }
}
