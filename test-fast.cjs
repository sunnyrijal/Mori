const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5001', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));
  const html = await page.$eval('body', el => el.innerHTML);
  console.log("FAST BODY HTML:", html);
  await browser.close();
})();
