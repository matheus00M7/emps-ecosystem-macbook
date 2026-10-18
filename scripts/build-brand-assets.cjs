const fs = require('node:fs/promises');
const path = require('node:path');
const { createRequire } = require('node:module');

const root = path.resolve(__dirname, '..');
const requireFrontend = createRequire(path.join(root, 'site/emps-site-main/frontend/package.json'));
const sharp = requireFrontend('sharp');
const appImages = 'app/emps-charge/assets/images';
const publicImages = 'site/emps-site-main/frontend/public';

const brandAssets = [
  { file: `${appImages}/emps-logo-red.png`, kind: 'logo', width: 2522, height: 856 },
  { file: `${publicImages}/emps-logo-red.png`, kind: 'logo', width: 2522, height: 856 },
  { file: `${appImages}/emps-icon-silver.png`, kind: 'silver', width: 338, height: 572 },
  { file: `${publicImages}/emps-icon-silver.png`, kind: 'silver', width: 338, height: 572 },
  { file: `${appImages}/emps-app-icon.png`, kind: 'app', width: 1024, height: 1024 },
  { file: `${appImages}/emps-favicon.png`, kind: 'app', width: 256, height: 256 },
  { file: `${appImages}/emps-splash-icon.png`, kind: 'splash', width: 600, height: 600 },
  { file: `${appImages}/emps-adaptive-foreground.png`, kind: 'adaptive', width: 1024, height: 1024 },
  { file: `${appImages}/emps-monochrome.png`, kind: 'monochrome', width: 1024, height: 1024 },
];

async function solidSymbol(symbol, color, width, height) {
  const alpha = await sharp(symbol, { density: 288 }).trim({ background: '#00000000' })
    .resize(width, height, { fit: 'contain', background: '#00000000' })
    .ensureAlpha().extractChannel('alpha').raw().toBuffer();
  return sharp({ create: { width, height, channels: 3, background: color } })
    .joinChannel(alpha, { raw: { width, height, channels: 1 } }).png().toBuffer();
}

async function generateBrandAssets() {
  const logo = await fs.readFile(path.join(root, 'assets/brand/emps-logo.svg'));
  const symbol = await fs.readFile(path.join(root, 'assets/brand/emps-symbol.svg'));
  const circle = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><defs><linearGradient id="red" x2="1" y2="1"><stop stop-color="#FF323A"/><stop offset="1" stop-color="#B3122D"/></linearGradient></defs><circle cx="512" cy="512" r="380" fill="url(#red)"/></svg>');
  const mark = await solidSymbol(symbol, '#AFB6BD', 280, 490);
  const badge = await sharp(circle).composite([{ input: mark, left: 372, top: 267 }]).png().toBuffer();
  const appIcon = await sharp(badge).flatten({ background: '#0B0C0F' }).png().toBuffer();
  for (const asset of brandAssets) {
    let bytes;
    if (asset.kind === 'logo') bytes = await sharp(logo, { density: 144 }).resize(asset.width, asset.height).png().toBuffer();
    else if (asset.kind === 'silver') bytes = await solidSymbol(symbol, '#AFB6BD', asset.width, asset.height);
    else if (asset.kind === 'monochrome') {
      const foreground = await solidSymbol(symbol, '#FFFFFF', 280, 490);
      bytes = await sharp(foreground).extend({ top: 267, bottom: 267, left: 372, right: 372, background: '#00000000' }).png().toBuffer();
    } else {
      const input = asset.kind === 'app' ? appIcon : badge;
      const inner = asset.kind === 'splash' ? 480 : asset.kind === 'adaptive' ? 824 : asset.width;
      bytes = await sharp(input).resize(inner, inner).extend({
        top: (asset.height - inner) / 2, bottom: (asset.height - inner) / 2,
        left: (asset.width - inner) / 2, right: (asset.width - inner) / 2,
        background: '#00000000',
      }).png().toBuffer();
      if (asset.kind === 'app') bytes = await sharp(bytes).removeAlpha().png().toBuffer();
    }
    await fs.writeFile(path.join(root, asset.file), bytes);
  }
  await fs.writeFile(path.join(root, publicImages, 'emps-logo.svg'), logo);
  await fs.writeFile(path.join(root, publicImages, 'emps-symbol.svg'), symbol);
  const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#0B0C0F"/><image href="data:image/svg+xml;base64,${symbol.toString('base64')}" x="12" y="4" width="24" height="40"/></svg>\n`;
  await fs.writeFile(path.join(root, publicImages, 'icon.svg'), favicon);
  console.log(`Generated ${brandAssets.length} PNG assets and 3 website SVG assets from assets/brand.`);
}

if (require.main === module) generateBrandAssets().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { brandAssets, generateBrandAssets };
