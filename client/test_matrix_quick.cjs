const puppeteer = require('puppeteer');

const routes = {
  Home: '/',
  Food: '/food',
  Clothes: '/cloth',
  Dashboard: '/dashboard',
  Profile: '/profile',
  Notifications: '/notifications'
};

const langs = ['en', 'kn', 'hi'];

async function runTest() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  console.log('Starting Test Matrix...');
  
  // Login first to access protected routes
  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
  } catch (e) {
    // ignore
  }

  const matrix = {};

  for (const [routeName, url] of Object.entries(routes)) {
    matrix[routeName] = {};
    try {
      await page.goto(`http://localhost:5173${url}`, { waitUntil: 'networkidle0' });
      
      // Test switching through all languages sequentially without reload
      for (const lang of langs) {
        // Find dropdown using title
        await page.evaluate(() => {
          const btn = document.querySelector('button[title*="Language"], button[title*="title_changeLanguage"]');
          if(btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 200));
        
        // Click language
        await page.evaluate((l) => {
          const btns = Array.from(document.querySelectorAll('button'));
          // In LanguageSelector we map LANGUAGES which has `lang.native` and `lang.label`
          const lCodes = { 'en': 'English', 'kn': 'Kannada', 'hi': 'Hindi', 'ml': 'Malayalam', 'mr': 'Marathi', 'ta': 'Tamil', 'te': 'Telugu' };
          const btn = btns.find(b => b.innerText.includes(lCodes[l]));
          if(btn) btn.click();
        }, lang);

        await new Promise(r => setTimeout(r, 500));

        const text = await page.evaluate(() => document.body.innerText);
        
        let passed = true;
        if (lang !== 'en') {
           // We check for hardcoded english strings
           if (text.includes('Connecting food & clothes donors') || text.includes('Sign Up Free')) {
             if (routeName === 'Home') passed = false;
           }
           if (text.includes('Donate Surplus Food')) {
             if (routeName === 'Food') passed = false;
           }
        }
        
        matrix[routeName][lang] = passed ? 'PASS' : 'FAIL';
      }
    } catch (e) {
      langs.forEach(l => matrix[routeName][l] = 'ERR');
    }
  }

  await browser.close();

  // Print matrix
  console.log('\n==================================================');
  console.log('AUTOMATED LANGUAGE MATRIX');
  console.log('==================================================\n');
  
  const header = ['Route'.padEnd(15), ...langs.map(l => l.toUpperCase().padEnd(4))].join('  ');
  console.log(header);
  console.log('-'.repeat(header.length));
  
  for (const [routeName, results] of Object.entries(matrix)) {
    let row = routeName.padEnd(15) + '  ';
    for (const lang of langs) {
      const icon = results[lang] === 'PASS' ? 'âœ“' : 'x';
      row += icon.padEnd(4) + '  ';
    }
    console.log(row);
  }
}

runTest().catch(console.error);
