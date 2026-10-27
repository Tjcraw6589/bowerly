// Generates store screenshots from the exported web build at exact store pixel sizes.
// Requires: `npm run export:web` first (dist/), Playwright Chromium installed.
// Output: store/screenshots/<device>/NN-<screen>.png
// The web build renders the same React Native code as the native apps via React Native Web;
// chrome such as the status bar is not included, which the stores allow.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4175;
const BASE = `http://127.0.0.1:${PORT}`;

const DEVICES = [
  { name: 'iphone-6.9', width: 440, height: 956, scale: 3, note: 'iPhone 6.9-inch 1320x2868' },
  { name: 'iphone-6.5', width: 428, height: 926, scale: 3, note: 'iPhone 6.5-inch 1284x2778' },
  { name: 'ipad-13', width: 1032, height: 1376, scale: 2, note: 'iPad 13-inch 2064x2752' },
  { name: 'android-phone', width: 360, height: 640, scale: 3, note: 'Android phone 1080x1920' },
  { name: 'android-tablet-10', width: 800, height: 1280, scale: 2, note: 'Android 10-inch tablet 1600x2560' },
];

const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const now = new Date();
const y = now.getFullYear();
const m = now.getMonth() + 1;
const d = now.getDate();

/** A date `offset` days from today, `monthsBack` months earlier (for anchoring monthly items). */
const shifted = (offset, monthsBack = 0) => {
  const t = new Date(y, m - 1 - monthsBack, d + offset);
  return iso(t.getFullYear(), t.getMonth() + 1, t.getDate());
};

function sub(id, name, price, cycle, firstBillDate, categoryId, color, emoji, extra = {}) {
  return {
    id,
    name,
    kind: 'subscription',
    autopay: true,
    amountVaries: false,
    paidThrough: null,
    price,
    currency: 'USD',
    cycle,
    firstBillDate,
    categoryId,
    color,
    emoji,
    notes: '',
    reminderDaysBefore: 1,
    status: 'active',
    trialEndDate: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    cancelledAt: null,
    ...extra,
  };
}

/** A bill. Hand-paid bills are marked paid through the due date before the one shown. */
function bill(id, name, price, cycle, dueOffset, categoryId, color, emoji, extra = {}) {
  const autopay = extra.autopay ?? true;
  return sub(id, name, price, cycle, shifted(dueOffset, 9), categoryId, color, emoji, {
    kind: 'bill',
    autopay,
    paidThrough: autopay ? null : shifted(dueOffset, 1),
    ...extra,
  });
}

const monthly = { every: 1, unit: 'month' };
const yearly = { every: 1, unit: 'year' };

const seededSubscriptions = [
  bill('b1', 'Rent', 1450, monthly, 4, 'cat_housing', '#64748B', '🏠', { autopay: false, notes: 'Pay via landlord portal', reminderDaysBefore: 3 }),
  bill('b2', 'Electricity', 96, monthly, -2, 'cat_utilities', '#F59E0B', '💡', { autopay: false, amountVaries: true }),
  bill('b3', 'Car insurance', 132, monthly, 6, 'cat_insurance', '#CA8A04', '🚗'),
  bill('b4', 'Phone plan', 65, monthly, 11, 'cat_phone', '#06B6D4', '📱'),
  bill('b5', 'Internet', 70, monthly, 15, 'cat_phone', '#0EA5E9', '🌐'),
  bill('b6', 'Student loan', 220, monthly, 19, 'cat_finance', '#B45309', '🎓'),
  bill('b7', 'Water', 48, { every: 3, unit: 'month' }, 23, 'cat_utilities', '#0284C7', '💧', { autopay: false, amountVaries: true }),
  sub('s1', 'Netflix', 15.49, monthly, shifted(2, 8), 'cat_streaming', '#E50914', '🎬'),
  sub('s2', 'Spotify', 10.99, monthly, shifted(5, 5), 'cat_music', '#1DB954', '🎧'),
  sub('s3', 'iCloud+', 2.99, monthly, shifted(9, 12), 'cat_cloud', '#3693F3', '☁️'),
  sub('s6', 'Gym membership', 39, monthly, shifted(-25, 10), 'cat_fitness', '#F97316', '🏋️'),
  sub('s8', 'Audible', 14.95, monthly, shifted(8), 'cat_news', '#F8991C', '🎙️', { trialEndDate: shifted(7), reminderDaysBefore: 3 }),
  sub('s5', 'Amazon Prime', 139, yearly, shifted(-60, 7), 'cat_other', '#FF9900', '🛒'),
  sub('s9', '1Password', 35.88, yearly, shifted(-140, 4), 'cat_software', '#0094F5', '🔒'),
  sub('s10', 'Headspace', 69.99, yearly, shifted(-20, 1), 'cat_fitness', '#F47D31', '🧘', { status: 'paused' }),
];

const builtInCategories = [
  ['cat_housing', 'Housing', '🏠', '#64748B'],
  ['cat_utilities', 'Utilities', '💡', '#14B8A6'],
  ['cat_phone', 'Phone & Internet', '📱', '#06B6D4'],
  ['cat_insurance', 'Insurance', '🛡️', '#CA8A04'],
  ['cat_finance', 'Loans & Credit', '💳', '#B45309'],
  ['cat_transport', 'Transport', '🚗', '#0F766E'],
  ['cat_taxes', 'Taxes & Fees', '🧾', '#9333EA'],
  ['cat_streaming', 'Streaming', '🎬', '#E53958'],
  ['cat_music', 'Music', '🎵', '#1DB954'],
  ['cat_software', 'Software', '💻', '#3D5AFE'],
  ['cat_cloud', 'Cloud & Storage', '☁️', '#0EA5E9'],
  ['cat_gaming', 'Gaming', '🎮', '#8B5CF6'],
  ['cat_fitness', 'Health & Fitness', '💪', '#F97316'],
  ['cat_news', 'News & Reading', '📰', '#64748B'],
  ['cat_other', 'Other', '📦', '#9CA3AF'],
].map(([id, name, emoji, color]) => ({ id, name, emoji, color, builtIn: true }));

function persistedState(theme, isPro) {
  return JSON.stringify({
    state: {
      subscriptions: seededSubscriptions,
      categories: builtInCategories,
      settings: { currency: 'USD', theme, reminderHour: 9, notificationsEnabled: true, onboardingComplete: true, summaryPeriod: 'month', sortBy: 'nextBill' },
      meta: { installedAt: '2026-01-01T00:00:00.000Z', sessionCount: 12, lastReviewPromptAt: null, reviewPromptCount: 0, isPro },
    },
    version: 2,
  });
}

const SHOTS = [
  { file: '01-bills', path: '/', theme: 'light', pro: true, wait: 'subscriptions-screen' },
  { file: '02-upcoming', path: '/upcoming', theme: 'light', pro: true, wait: 'upcoming-screen' },
  { file: '03-insights', path: '/insights', theme: 'light', pro: true, wait: 'insights-screen' },
  { file: '04-detail', path: '/subscription/b1', theme: 'light', pro: true, wait: 'detail-screen' },
  { file: '05-editor', path: '/editor?id=b2', theme: 'light', pro: true, wait: 'editor-screen' },
  { file: '06-dark-bills', path: '/', theme: 'dark', pro: true, wait: 'subscriptions-screen' },
  { file: '07-pro', path: '/pro?reason=general', theme: 'dark', pro: false, wait: 'pro-screen' },
  { file: '08-onboarding', path: '/', theme: 'light', pro: false, wait: 'onboarding', fresh: true },
];

async function waitForServer(url, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server did not start at ${url}`);
}

const server = spawn(process.execPath, [join(root, 'scripts', 'serve-dist.mjs'), String(PORT)], { stdio: 'inherit' });
try {
  await waitForServer(BASE);
  const browser = await chromium.launch();
  for (const device of DEVICES) {
    const dir = join(root, 'store', 'screenshots', device.name);
    mkdirSync(dir, { recursive: true });
    for (const shot of SHOTS) {
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        deviceScaleFactor: device.scale,
        isMobile: device.width < 700,
        hasTouch: true,
        colorScheme: shot.theme,
      });
      const page = await context.newPage();
      // Show the Pro screen as an iPhone user sees it (real App Store price), not the web-only notice.
      const store = device.name.startsWith('android') ? 'google' : 'apple';
      await page.addInitScript((s) => {
        window.__BOWERLY_STORE_PREVIEW__ = { priceString: '$4.99', store: s };
      }, store);
      if (!shot.fresh) {
        const state = persistedState(shot.theme, shot.pro);
        await page.addInitScript((value) => {
          window.localStorage.setItem('subtally-store', value);
        }, state);
      }
      await page.goto(`${BASE}${shot.path}`);
      await page.getByTestId(shot.wait).waitFor({ state: 'visible', timeout: 20_000 });
      await page.waitForTimeout(600);
      await page.screenshot({ path: join(dir, `${shot.file}.png`), fullPage: false });
      await context.close();
      console.log(`${device.name}/${shot.file}.png (${device.width * device.scale}x${device.height * device.scale})`);
    }
  }
  await browser.close();
  console.log('Screenshots written to store/screenshots/. Sizes:', DEVICES.map((x) => `${x.name}=${x.note}`).join('; '));
} finally {
  server.kill();
}
