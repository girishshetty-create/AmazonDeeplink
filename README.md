# Amazon Product Links Test

Automated check that Miko's 3 Amazon product listing pages load correctly.

## What it checks

For each of these 3 links:
- https://www.amazon.in/Miko-Robot-STEAM-Learning-Games/dp/B0G24YSQDK
- https://www.amazon.in/Miko-Mini-Years-Free-Conversational/dp/B0G24Z7SQH/
- https://www.amazon.com/dp/B0GV37M678?th=

The test:
1. Opens the link
2. Confirms the page title contains "Amazon" (i.e. it didn't redirect to an error page)
3. Confirms the product title element (`span#productTitle`) is visible on the page
4. Marks the link PASS if both checks succeed, otherwise FAIL

It runs against 3 browser engines — Chromium, Firefox, and WebKit — so each link is effectively checked 3 times, once per browser.

---

## One-time setup

You need **Node.js** installed first (download from [nodejs.org](https://nodejs.org) if you don't have it — the LTS version is fine).

Then, from the project folder (`C:\MikoTeam\Deeplink\New folder`), open a terminal and run:

```
npm install
npx playwright install
```

- `npm install` — installs the packages listed in `package.json` (including Playwright)
- `npx playwright install` — downloads the actual browser engines (Chromium, Firefox, WebKit) that the test drives

You only need to do this setup once (or again later if you delete `node_modules`).

---

## How to run the test

**Option 1 — double-click (easiest):**
Double-click `run-amazon-test.bat` in the project folder. It opens a terminal, runs the test, and automatically opens the report when done.

**Option 2 — manually from terminal:**
From the project folder, run:

```
npx playwright test tests/amazoninks.spec.ts --headed
```

- `--headed` opens visible browser windows so you can watch it check each link (recommended, since Amazon sometimes shows a bot-check page that's easier to spot visually)
- Drop `--headed` to run invisibly in the background (faster, good for automated/scheduled runs)

---

## Where to check the report

After the run finishes, view the results with:

```
npx playwright show-report
```

This opens an HTML report in your browser showing:
- Which links passed / failed, per browser
- Screenshots and traces for any failures
- The exact error (e.g. timeout, missing element) if something didn't load correctly

The report is also saved on disk at:

```
playwright-report\index.html
```

You can open that file directly in a browser at any time to see the last run's results, without re-running the test.

---

## If a link fails

- **Timeout error** — the page took too long to load. Could be a slow network, or Amazon showing a CAPTCHA/bot-check page instead of the real product page. Run with `--headed` to watch it happen live.
- **`productTitle` not visible** — the page loaded, but the layout may have changed, or the listing may have been taken down/changed URL.
