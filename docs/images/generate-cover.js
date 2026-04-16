const puppeteer = require('C:/Users/islam/AppData/Roaming/npm/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1200, height: 628, deviceScaleFactor: 2 });
  
  const htmlPath = path.resolve(__dirname, 'cover.html');
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
  
  await page.screenshot({
    path: path.resolve(__dirname, 'cover.png'),
    type: 'png',
    clip: { x: 0, y: 0, width: 1200, height: 628 }
  });
  
  console.log('Cover image generated: cover.png');
  await browser.close();
})();
