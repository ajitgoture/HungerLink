const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  try {
    await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle2' });
  } catch (e) {
    console.error('Navigation error:', e);
  }
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
}
run();
