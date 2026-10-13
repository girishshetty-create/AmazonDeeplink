import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Use full Chromium (the headless shell crashed on this machine). Override with PW_CHANNEL=chrome|msedge.
test.use({ channel: (process.env.PW_CHANNEL as any) || 'chromium' });

const BASE = 'https://web.davinci.tv/show?partner=miko&sID=';
const SESSION_IDS = [
  'seas_f11671438bfd432b99a0ee47b887293e',
  'seas_15dab24e0d3244d3a8defb2b6c1c5702',
  'seas_f22c452d4e1343bca55509ea01e4c41e',
  '01HT0CHZBB3FSQCT3ZYPNGA2WJ',
  'seas_0e95eae9e39844df851defd4ed1cb24e',
  'seas_970f4f6ad01d4b76b3a938bbc856a8eb',
  'seas_3e3dd4a3840546b89892595340d7c75f',
  'seas_74522168da944bff8d6617a587e0c2f0',
  'seas_635c096e6472482b8fdfec9c0013baec',
  'seas_73c403c4a74547fbb7bfe2712f076f9c',
  'seas_cb3a8560ecd646f3a32f7ebf7eac202b',
];

// Visible text that signals a broken/expired link. Edit to match what the site shows.
const ERROR_PATTERNS = [/not found/i, /404/, /something went wrong/i, /unavailable/i, /expired/i, /invalid/i];

type Row = {
  n: number;
  url: string;
  accessible: boolean;
  httpStatus: number | string;
  loadMs: number;
  title: string;
  hasVideo: boolean;
  reasons: string[];
  screenshotB64: string;
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function buildHtml(rows: Row[], when: string): string {
  const ok = rows.filter((r) => r.accessible).length;
  const bad = rows.length - ok;
  const trs = rows
    .map(
      (r) => `
    <tr class="${r.accessible ? 'pass' : 'fail'}">
      <td>${r.n}</td>
      <td><span class="badge ${r.accessible ? 'b-pass' : 'b-fail'}">${r.accessible ? 'ACCESSIBLE' : 'NOT ACCESSIBLE'}</span></td>
      <td>${r.httpStatus}</td>
      <td>${r.loadMs} ms</td>
      <td>${r.hasVideo ? 'Yes' : 'No'}</td>
      <td class="url"><a href="${esc(r.url)}">${esc(r.url)}</a><div class="title">${esc(r.title)}</div></td>
      <td>${r.reasons.length ? esc(r.reasons.join('; ')) : '-'}</td>
      <td>${r.screenshotB64 ? `<img src="data:image/png;base64,${r.screenshotB64}" />` : ''}</td>
    </tr>`
    )
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>Davinci Deeplink Report</title>
<style>
  body{font-family:Segoe UI,Arial,sans-serif;margin:24px;color:#222}
  h1{margin:0 0 4px} .meta{color:#666;margin-bottom:16px}
  .summary{display:flex;gap:12px;margin-bottom:20px}
  .card{padding:12px 20px;border-radius:8px;color:#fff;font-size:18px}
  .c-total{background:#475569}.c-pass{background:#16a34a}.c-fail{background:#dc2626}
  table{border-collapse:collapse;width:100%;font-size:13px}
  th,td{border:1px solid #ddd;padding:8px;vertical-align:top;text-align:left}
  th{background:#f1f5f9} tr.fail{background:#fef2f2}
  .badge{padding:2px 8px;border-radius:10px;font-weight:600;font-size:12px;white-space:nowrap}
  .b-pass{background:#dcfce7;color:#166534}.b-fail{background:#fee2e2;color:#991b1b}
  .url{max-width:420px;word-break:break-all} .title{color:#666;margin-top:4px}
  img{width:160px;border:1px solid #ccc}
</style></head><body>
<h1>Davinci Deeplink Accessibility Report</h1>
<div class="meta">Partner: miko &middot; Generated: ${esc(when)}</div>
<div class="summary">
  <div class="card c-total">Total: ${rows.length}</div>
  <div class="card c-pass">Accessible: ${ok}</div>
  <div class="card c-fail">Not accessible: ${bad}</div>
</div>
<table>
  <tr><th>#</th><th>Result</th><th>HTTP</th><th>Load time</th><th>Video</th><th>Link</th><th>Reason</th><th>Screenshot</th></tr>
  ${trs}
</table></body></html>`;
}

test('Davinci deeplinks - accessibility report', async ({ page }) => {
  test.setTimeout(SESSION_IDS.length * 60_000);
  const rows: Row[] = [];

  for (let i = 0; i < SESSION_IDS.length; i++) {
    const url = BASE + SESSION_IDS[i];
    const reasons: string[] = [];
    const failedCalls: string[] = [];
    let httpStatus: number | string = 'n/a';
    let title = '';
    let hasVideo = false;
    let screenshotB64 = '';
    const start = Date.now();

    const onFail = (r: any) => failedCalls.push(`${r.url()} (${r.failure()?.errorText})`);
    const onResp = (r: any) => {
      if (r.status() >= 400 && ['xhr', 'fetch', 'media'].includes(r.request().resourceType())) {
        failedCalls.push(`${r.status()} ${r.url()}`);
      }
    };
    page.on('requestfailed', onFail);
    page.on('response', onResp);

    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      httpStatus = response ? response.status() : 'n/a';
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      await page.waitForTimeout(3000); // let the player / SPA render

      title = await page.title();
      const bodyText = (await page.locator('body').innerText().catch(() => '')).trim();
      hasVideo = (await page.locator('video').count()) > 0;

      if (typeof httpStatus === 'number' && httpStatus >= 400) reasons.push(`HTTP ${httpStatus}`);
      if (!bodyText) reasons.push('Page is blank');
      for (const re of ERROR_PATTERNS) if (re.test(bodyText)) reasons.push(`Page text matches ${re}`);
      if (failedCalls.length) reasons.push(`Failed calls: ${failedCalls.slice(0, 2).join(' | ')}`);

      const shot = await page.screenshot({ fullPage: false });
      screenshotB64 = shot.toString('base64');
    } catch (e: any) {
      reasons.push(`Could not open: ${String(e.message).split('\n')[0]}`);
    }

    page.off('requestfailed', onFail);
    page.off('response', onResp);

    rows.push({
      n: i + 1,
      url,
      accessible: reasons.length === 0,
      httpStatus,
      loadMs: Date.now() - start,
      title,
      hasVideo,
      reasons,
      screenshotB64,
    });
    console.log(`${reasons.length === 0 ? 'PASS' : 'FAIL'} [${httpStatus}] ${url}`);
  }

  // ---- Write shareable report files ----
  const outDir = path.join(process.cwd(), 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
  const htmlPath = path.join(outDir, `davinci-deeplink-report-${stamp}.html`);
  const csvPath = path.join(outDir, `davinci-deeplink-report-${stamp}.csv`);

  fs.writeFileSync(htmlPath, buildHtml(rows, new Date().toLocaleString('en-IN')));
  const csv = ['#,result,http_status,load_ms,video_found,url,reasons']
    .concat(
      rows.map((r) =>
        [r.n, r.accessible ? 'ACCESSIBLE' : 'NOT ACCESSIBLE', r.httpStatus, r.loadMs, r.hasVideo, r.url, `"${r.reasons.join('; ').replace(/"/g, '""')}"`].join(',')
      )
    )
    .join('\n');
  fs.writeFileSync(csvPath, csv);

  await test.info().attach('deeplink-report.html', { path: htmlPath, contentType: 'text/html' });
  await test.info().attach('deeplink-report.csv', { path: csvPath, contentType: 'text/csv' });
  console.log(`\nReport: ${htmlPath}\nCSV:    ${csvPath}`);

  // Fail the test run if any link is not accessible (report is still written above)
  const broken = rows.filter((r) => !r.accessible).map((r) => r.url);
  expect(broken, `Not accessible:\n${broken.join('\n')}`).toHaveLength(0);
});
