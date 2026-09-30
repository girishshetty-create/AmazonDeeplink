import { test, expect } from '@playwright/test';

test('Verify all Amazon product links', async ({ page }) => {
  // Overall test timeout — must be bigger than (nav timeout + assertion timeout) x number of links,
  // otherwise the test gets killed before individual page.goto calls can finish.
  test.setTimeout(180000); // 3 minutes total

  const links = [
    'https://www.amazon.in/Miko-Robot-STEAM-Learning-Games/dp/B0G24YSQDK',
    'https://www.amazon.in/Miko-Mini-Years-Free-Conversational/dp/B0G24Z7SQH/',
    'https://www.amazon.com/dp/B0GV37M678?th='
  ];

  const failures: string[] = [];

  for (const url of links) {

    console.log(`Checking: ${url}`);

    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      console.log(`Current URL: ${page.url()}`);

      await expect(page).toHaveTitle(/Amazon/i);

      await expect(page.locator('span#productTitle')).toBeVisible({
        timeout: 30000
      });

      console.log(`PASS: ${url}`);
    } catch (err) {
      const reason = (err as Error).message.split('\n')[0];
      console.log(`FAIL: ${url} — ${reason}`);
      failures.push(`${url}: ${reason}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`${failures.length}/${links.length} link(s) failed:\n` + failures.join('\n'));
  }
});
