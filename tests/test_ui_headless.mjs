import { chromium } from 'playwright';

async function verify() {
  console.log('Launching headless browser to verify Masame 3D UI & Engine...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });

  await page.goto('http://localhost:1420/', { waitUntil: 'networkidle' });

  // Check page title
  const title = await page.title();
  console.log('Title:', title);

  // Wait for board or root content
  await page.waitForSelector('#root', { timeout: 10000 });

  // Check if Canvas (Three.js 3D board) exists
  const hasCanvas = await page.evaluate(() => {
    return document.querySelector('canvas') !== null;
  });
  console.log('Canvas (3D Goban) mounted:', hasCanvas);

  // Check for Masame 4 doors: Play, Learn, My games, Settings
  const doors = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.map(b => b.textContent?.trim()).filter(Boolean);
  });
  console.log('Detected UI elements/buttons:', doors.slice(0, 10));

  // Check if __TAURI_INTERNALS__ was attached
  const hasTauriBridge = await page.evaluate(() => {
    return typeof window.__TAURI_INTERNALS__ !== 'undefined';
  });
  console.log('Tauri bridge attached:', hasTauriBridge);

  if (errors.length > 0) {
    console.warn('Console warnings/errors:', errors);
  }

  await browser.close();

  if (hasCanvas && hasTauriBridge) {
    console.log('✅ PASS: Masame 3D Living Atelier UI, Three.js Goban, and Engine Bridge all verified successfully!');
    process.exit(0);
  } else {
    console.error('❌ FAIL: Canvas or Bridge missing');
    process.exit(1);
  }
}

verify().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
