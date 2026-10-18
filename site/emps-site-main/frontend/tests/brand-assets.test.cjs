const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');
const sharp = require('sharp');
const root = path.resolve(__dirname, '../../../..');
const { brandAssets } = require(path.join(root, 'scripts/build-brand-assets.cjs'));

test('todos os derivados da marca preservam tamanho e formato previstos', async () => {
  for (const asset of brandAssets) {
    const metadata = await sharp(path.join(root, asset.file)).metadata();
    assert.equal(metadata.width, asset.width, asset.file);
    assert.equal(metadata.height, asset.height, asset.file);
    assert.equal(metadata.format, 'png');
    assert.equal(metadata.hasAlpha, asset.kind !== 'app', asset.file);
  }
});

test('site e aplicativo recebem exatamente a mesma logo e simbolo', async () => {
  for (const file of ['emps-logo-red.png', 'emps-icon-silver.png']) {
    const [app, site] = await Promise.all([
      fs.readFile(path.join(root, 'app/emps-charge/assets/images', file)),
      fs.readFile(path.join(root, 'site/emps-site-main/frontend/public', file)),
    ]);
    assert.deepEqual(app, site);
  }
  for (const file of ['emps-logo.svg', 'emps-symbol.svg']) {
    assert.deepEqual(await fs.readFile(path.join(root, 'assets/brand', file)),
      await fs.readFile(path.join(root, 'site/emps-site-main/frontend/public', file)));
  }
});

test('logo vermelha nao contem residuos pretos, brancos ou cinza nos pixels visiveis', async () => {
  const { data } = await sharp(path.join(root, 'app/emps-charge/assets/images/emps-logo-red.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let transparent = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) { transparent++; continue; }
    // Low-alpha unpremultiplication can round a channel by a few units.
    if (data[i + 3] < 32) continue;
    assert.ok(data[i] > 140 && data[i] > data[i + 1] * 2 && data[i] > data[i + 2] * 2);
  }
  assert.ok(transparent > data.length / 8, 'O fundo e os vazados devem permanecer transparentes.');
});

test('insignia prateada e recorte monocromatico limpo com vazados transparentes', async () => {
  const { data, info } = await sharp(path.join(root, 'app/emps-charge/assets/images/emps-icon-silver.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let visible = 0;
  let transparent = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) transparent++;
    if (data[i + 3] < 32) continue;
    visible++;
    assert.ok(Math.abs(data[i] - 175) < 8 && Math.abs(data[i + 1] - 182) < 8 && Math.abs(data[i + 2] - 189) < 8);
  }
  assert.ok(visible > info.width * info.height * 0.2);
  assert.ok(transparent > info.width * info.height * 0.4);
  const monochrome = await sharp(path.join(root, 'app/emps-charge/assets/images/emps-monochrome.png')).ensureAlpha().raw().toBuffer();
  for (let i = 0; i < monochrome.length; i += 4) {
    if (monochrome[i + 3] >= 32) assert.ok(monochrome[i] > 245 && monochrome[i + 1] > 245 && monochrome[i + 2] > 245);
  }
});

test('consumidores apontam a marca corrigida sem substituir a marca GoodWe', async () => {
  const frontend = path.join(root, 'site/emps-site-main/frontend');
  const shell = await fs.readFile(path.join(frontend, 'components/shell/AppShell.tsx'), 'utf8');
  const charge = await fs.readFile(path.join(frontend, 'components/charge/WebCharge.tsx'), 'utf8');
  const css = await fs.readFile(path.join(frontend, 'styles/shell.css'), 'utf8');
  assert.match(shell, /src="\/emps-logo\.svg"/);
  assert.match(charge, /src="\/emps-logo\.svg"/);
  assert.match(css, /mask: url\("\/emps-symbol\.svg"\)/);
  const app = JSON.parse(await fs.readFile(path.join(root, 'app/emps-charge/app.json'), 'utf8'));
  assert.equal(app.expo.android.adaptiveIcon.monochromeImage, './assets/images/emps-monochrome.png');
  const login = await fs.readFile(path.join(frontend, 'app/login/page.tsx'), 'utf8');
  assert.match(login, /goodwe_logo/);
});
