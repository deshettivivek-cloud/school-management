const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
    
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    const html = await page.content();
    if (html.includes('Welcome Back') || html.includes('Sign in') || html.includes('Dashboard')) {
      console.log('✅ DOM Test Passed');
    } else {
      console.log('❌ DOM Test Failed');
    }
  } catch (error) {
    console.error('❌ Error during DOM test:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
