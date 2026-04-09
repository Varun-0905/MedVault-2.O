import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TEST_MESSAGE = process.env.TEST_MESSAGE || 'I feel lonely after moving to hostel and cannot focus.';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.addInitScript(() => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    localStorage.setItem('anonymousSessionToken', 'dom-smoke-token');
    localStorage.setItem('sessionExpiresAt', expiresAt);
  });

  await page.goto(`${BASE_URL}/consult`, { waitUntil: 'networkidle' });
  await page.waitForSelector('textarea[placeholder*="Type your message"]', { timeout: 20000 });

  await page.fill('textarea[placeholder*="Type your message"]', TEST_MESSAGE);
  await page.click('button:has-text("Send")');

  await page.waitForFunction(
    () => document.querySelectorAll('.flex.justify-start .text-sm.whitespace-pre-wrap').length >= 2,
    { timeout: 30000 }
  );

  const botMessages = await page.$$eval(
    '.flex.justify-start .text-sm.whitespace-pre-wrap',
    (nodes) => nodes.map((n) => (n.textContent || '').trim()).filter(Boolean)
  );

  const crisisAlertCount = await page.$$eval(
    '.flex.justify-start p',
    (nodes) => nodes.filter((n) => (n.textContent || '').toLowerCase().includes('priority safety alert')).length
  );

  const lastBotMessage = botMessages[botMessages.length - 1] || '';
  const result = {
    botMessageCount: botMessages.length,
    crisisAlertCount,
    lastBotMessageLength: lastBotMessage.length,
    lastBotMessage,
  };

  console.log(JSON.stringify(result, null, 2));

  await browser.close();

  if (lastBotMessage.length < 120) {
    process.exit(2);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
