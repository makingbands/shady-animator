// tests/headless-runner.js
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const baseUrlArg = argv.find(a => a.startsWith('--baseUrl=')) || argv.find((_,i)=>argv[i-1]==='--baseUrl');
const baseUrl = baseUrlArg ? baseUrlArg.split('=')[1] : process.env.BASE_URL || 'http://127.0.0.1:8080';

const TEST_DIRS = ['tests', 'tests/integration'];

function collectTests() {
  const files = [];
  for (const d of TEST_DIRS) {
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) {
      if (f.endsWith('.html')) files.push(path.join(d, f));
    }
  }
  return files.sort();
}

function toUrl(file) {
  return baseUrl + '/' + file.replace(/\\/g, '/');
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const tests = collectTests();
  let overallFail = false;
  const junit = [];

  for (const t of tests) {
    const url = toUrl(t);
    console.log(`Running ${t} -> ${url}`);
    const logs = [];
    let failed = false;

    const onConsole = msg => {
      const text = msg.text();
      logs.push(text);
      if (text.includes('FAIL:')) failed = true;
      console.log(`[console] ${text}`);
    };

    page.on('console', onConsole);

    try {
      const start = Date.now();
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      // Allow tests to run; adjust timeouts here if needed
      await page.waitForTimeout(3000);
      const duration = (Date.now() - start) / 1000;
      const name = path.basename(t);
      const testcase = {
        name,
        time: duration,
        failure: failed ? logs.filter(l=>l.includes('FAIL:')).join('\n') : null,
        logs
      };
      junit.push(testcase);
      if (failed) {
        overallFail = true;
        console.error(`Test ${t} FAILED`);
      } else {
        console.log(`Test ${t} PASSED`);
      }
    } catch (err) {
      overallFail = true;
      console.error(`Error running ${t}:`, err);
      junit.push({ name: path.basename(t), time: 0, failure: String(err), logs });
    } finally {
      page.removeListener('console', onConsole);
    }
  }

  // write junit xml files per test
  for (const tc of junit) {
    const safeName = tc.name.replace(/[^a-z0-9_.-]/gi, '_');
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<testsuite name="${tc.name}" tests="1" failures="${tc.failure ? 1 : 0}" time="${tc.time}">`,
      `  <testcase classname="shady-animator" name="${tc.name}" time="${tc.time}">`,
      tc.failure ? `    <failure><![CDATA[${tc.failure}]]></failure>` : '',
      `    <system-out><![CDATA[${tc.logs.join('\n')}]]></system-out>`,
      '  </testcase>',
      '</testsuite>'
    ].join('\n');
    fs.writeFileSync(`tests/test-results-${safeName}.xml`, xml, 'utf8');
  }

  await browser.close();
  if (overallFail) {
    console.error('One or more tests failed.');
    process.exit(2);
  } else {
    console.log('All tests passed.');
    process.exit(0);
  }
})();