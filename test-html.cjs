const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5001', { waitUntil: 'networkidle2' });
  const html = await page.$eval('body', el => el.innerHTML);
  console.log("BODY HTML:", html);
  await browser.close();
})();
