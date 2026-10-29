import { createRequire } from 'node:module';
import path from 'node:path';

// sharp lives in apps/web devDependencies — resolve it from there, not from the monorepo root
const requireFromWeb = createRequire(path.join(import.meta.dirname, '../apps/web/package.json'));
const sharp = requireFromWeb('sharp');

const [source = 'docs/screenshots/desktop/todo.png'] = process.argv.slice(2);

// 1200x630: the standard social embed ratio (og:image), cropped from the center; jpeg keeps it under ~250 KB
await sharp(path.resolve(import.meta.dirname, '..', source))
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 82 })
  .toFile(path.resolve(import.meta.dirname, '../apps/web/public/og-image.jpg'));
console.log('written apps/web/public/og-image.jpg');
