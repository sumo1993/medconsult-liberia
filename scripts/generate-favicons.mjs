/**
 * Rasterize public/medconsult-favicon.svg into PNG + favicon.ico for broad browser support.
 * Writes both public/ and app/favicon.ico — Next.js prefers app/favicon.ico over public/.
 * Run: node scripts/generate-favicons.mjs
 */
import { writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import toIco from 'png-to-ico';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const svgPath = path.join(root, 'public', 'medconsult-favicon.svg');
const publicDir = path.join(root, 'public');
const appDir = path.join(root, 'app');

async function main() {
  const buf16 = await sharp(svgPath).resize(16, 16).png({ compressionLevel: 9 }).toBuffer();
  const buf32 = await sharp(svgPath).resize(32, 32).png({ compressionLevel: 9 }).toBuffer();
  const buf48 = await sharp(svgPath).resize(48, 48).png({ compressionLevel: 9 }).toBuffer();
  const buf180 = await sharp(svgPath).resize(180, 180).png({ compressionLevel: 9 }).toBuffer();

  await writeFile(path.join(publicDir, 'favicon-16x16.png'), buf16);
  await writeFile(path.join(publicDir, 'favicon-32x32.png'), buf32);
  await writeFile(path.join(publicDir, 'favicon-48x48.png'), buf48);
  await writeFile(path.join(publicDir, 'apple-touch-icon.png'), buf180);

  const ico = await toIco([buf16, buf32, buf48]);
  await writeFile(path.join(publicDir, 'favicon.ico'), ico);
  await writeFile(path.join(appDir, 'favicon.ico'), ico);

  console.log(
    'Wrote app/favicon.ico, public/favicon.ico, favicon-16x16.png, favicon-32x32.png, favicon-48x48.png, apple-touch-icon.png'
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
