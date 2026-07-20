const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Collect all console logs and errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER_ERROR:', msg.text());
    } else {
      console.log('BROWSER_LOG:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE_ERROR:', err.message);
  });

  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login');
  
  console.log('Typing credentials...');
  await page.fill('input[type="email"]', 'admin@admin.com');
  await page.fill('input[type="password"]', 'password123');
  
  console.log('Clicking login...');
  await page.click('button[type="submit"]');
  
  console.log('Waiting for navigation...');
  await page.waitForTimeout(4000); // Wait 4 seconds for redirect and render
  
  console.log('Current URL:', page.url());
  
  await browser.close();
})();
