import { expect, type Page, test } from '@playwright/test';

/**
 * Bug sweep: uses the app the way a new user would and with awkward data (month ends, leap days,
 * huge and zero amounts, other currencies, long names, years-old overdue bills), and fails on any
 * crash, console error, broken text (NaN, undefined, Invalid Date) or sideways scrolling.
 */

const BROKEN_TEXT = /\bNaN\b|\bundefined\b|Invalid Date|\[object Object\]|\bInfinity\b/;

function watch(page: Page): string[] {
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console error: ${m.text()}`);
  });
  return problems;
}

async function check(page: Page, problems: string[], where: string): Promise<void> {
  await page.waitForTimeout(250);
  const text = await page.evaluate(() => document.body.innerText);
  expect(text, `${where}: broken text`).not.toMatch(BROKEN_TEXT);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `${where}: page scrolls sideways`).toBeLessThanOrEqual(1);
  expect(problems, `${where}: errors`).toEqual([]);
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function edgeState(isPro: boolean): string {
  const today = new Date();
  const ago = (days: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);
  const base = {
    kind: 'subscription',
    autopay: true,
    amountVaries: false,
    paidThrough: null,
    currency: 'USD',
    cycle: { every: 1, unit: 'month' },
    categoryId: 'cat_other',
    color: '#1F7A5C',
    emoji: '📦',
    notes: '',
    reminderDaysBefore: 1,
    status: 'active',
    trialEndDate: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    cancelledAt: null,
  };
  const item = (id: string, name: string, price: number, extra: Record<string, unknown> = {}) => ({ ...base, id, name, price, firstBillDate: '2026-01-15', ...extra });
  return JSON.stringify({
    state: {
      subscriptions: [
        item('leap', 'Domain renewal', 12, { firstBillDate: '2024-02-29', cycle: { every: 1, unit: 'year' } }),
        item('end', 'Car loan', 389.5, { kind: 'bill', firstBillDate: '2026-01-31' }),
        item('weekly', 'Cleaner', 60, { kind: 'bill', autopay: false, cycle: { every: 1, unit: 'week' }, firstBillDate: '2024-01-01', createdAt: '2024-01-01T00:00:00.000Z' }),
        item('daily', 'Parking', 4, { cycle: { every: 1, unit: 'day' } }),
        item('huge', 'Mortgage with a very long lender name that goes on and on', 999999.99, { kind: 'bill', autopay: false, firstBillDate: iso(ago(3)), createdAt: ago(10).toISOString() }),
        item('zero', 'Free tier', 0),
        item('yen', 'Japanese app', 1200, { currency: 'JPY' }),
        item('eur', 'Strom', 85.5, { kind: 'bill', currency: 'EUR', amountVaries: true }),
        item('trial', 'Trial today', 9.99, { trialEndDate: iso(today), firstBillDate: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)) }),
        item('custom', 'Water', 120, { kind: 'bill', cycle: { every: 2, unit: 'month' } }),
        item('paused', 'Paused gym', 39, { status: 'paused' }),
        item('cancelled', 'Old app', 4.99, { status: 'cancelled', cancelledAt: '2026-05-01T00:00:00.000Z' }),
        item('future', 'Starts next year', 15, { firstBillDate: `${today.getFullYear() + 1}-03-01` }),
        item('emoji', '🎵🎵 Music 🎵🎵', 10.99, { emoji: '🎵' }),
      ],
      settings: { currency: 'USD', theme: 'light', reminderHour: 9, notificationsEnabled: false, onboardingComplete: true, summaryPeriod: 'month', sortBy: 'nextBill' },
      meta: { installedAt: '2025-01-01T00:00:00.000Z', sessionCount: 5, lastReviewPromptAt: null, reviewPromptCount: 0, isPro },
    },
    version: 2,
  });
}

test.describe('Bowerly bug sweep', () => {
  test('a new user adds bills and subscriptions every way the editor allows', async ({ page }) => {
    const problems = watch(page);
    await page.goto('/');
    await check(page, problems, 'onboarding');
    await page.getByTestId('onboarding-next').click();
    await page.getByTestId('onboarding-next').click();
    await page.getByTestId('onboarding-finish').click();
    await check(page, problems, 'empty list');

    // A hand-paid bill with thousands separators.
    await page.getByTestId('empty-state-action').click();
    await page.getByTestId('name-field').fill('Rent');
    await page.getByTestId('price-field').fill('1,250.50');
    await check(page, problems, 'editor with a bill');
    await page.getByTestId('editor-save').click();
    await expect(page.getByTestId('totals-amount')).toHaveText('$1,250.50');

    // A subscription with a free trial.
    await page.getByTestId('add-fab').click();
    await page.getByTestId('kind-subscription').click();
    await page.getByTestId('name-field').fill('Audible');
    await page.getByTestId('price-field').fill('14.95');
    await page.getByTestId('trial-row-switch').click();
    await expect(page.getByTestId('trial-date-row')).toBeVisible();
    await check(page, problems, 'editor with a trial');
    await page.getByTestId('editor-save').click();
    await expect(page.getByTestId('subscriptions-screen').getByText('Audible', { exact: true })).toBeVisible();

    // A bill every 2 months that changes each time.
    await page.getByTestId('add-fab').click();
    await page.getByTestId('name-field').fill('Water');
    await page.getByTestId('price-field').fill('120');
    await page.getByTestId('cycle-custom').click();
    await page.getByTestId('every-field').fill('2');
    await page.getByTestId('autopay-row-switch').click();
    await page.getByTestId('varies-row-switch').click();
    await check(page, problems, 'editor with a custom cycle');
    await page.getByTestId('editor-save').click();
    await expect(page.getByTestId('subscriptions-screen').getByText('Water', { exact: true })).toBeVisible();

    // Bad input is refused with a message, never saved.
    await page.getByTestId('add-fab').click();
    await page.getByTestId('price-field').fill('abc');
    await page.getByTestId('editor-save').click();
    await expect(page.getByText('Give this bill a name.')).toBeVisible();
    await expect(page.getByText('Enter a valid amount.')).toBeVisible();
    await page.getByTestId('cycle-custom').click();
    await page.getByTestId('every-field').fill('0');
    await page.getByTestId('name-field').fill('Broken');
    await page.getByTestId('price-field').fill('5');
    await page.getByTestId('editor-save').click();
    await expect(page.getByText('Repeat every 1 to 365 units.').first()).toBeVisible();
    await page.getByTestId('header-dismiss').click();

    // Editing keeps the price exactly.
    await page.getByTestId('subscriptions-screen').getByText('Rent', { exact: true }).click();
    await page.getByTestId('detail-edit').click();
    await expect(page.getByTestId('price-field')).toHaveValue('1250.50');
    await page.getByTestId('editor-save').click();
    await expect(page.getByTestId('detail-screen')).toBeVisible();
    await check(page, problems, 'rent detail');

    // Mark paid, undo, pause, resume, cancel, reactivate, delete.
    await page.getByTestId('action-mark-paid').click();
    await expect(page.getByTestId('paid-through-row')).not.toContainText('Not yet');
    await page.getByTestId('action-undo-paid').click();
    await expect(page.getByTestId('paid-through-row')).toContainText('Not yet');
    await page.getByTestId('action-pause').click();
    await expect(page.getByTestId('detail-screen').getByText('Paused', { exact: true })).toBeVisible();
    await check(page, problems, 'paused detail');
    await page.getByTestId('action-reactivate').click();
    await page.getByTestId('action-cancel').click();
    await page.getByTestId('cancel-sheet-confirm').click();
    await expect(page.getByTestId('detail-screen').getByText('Cancelled', { exact: true })).toBeVisible();
    await check(page, problems, 'cancelled detail');
    await page.getByTestId('action-reactivate').click();
    await page.getByTestId('action-delete').click();
    await page.getByTestId('delete-sheet-confirm').click();
    await expect(page.getByTestId('subscriptions-screen')).toBeVisible();
    await expect(page.getByTestId('subscriptions-screen').getByText('Rent', { exact: true })).toHaveCount(0);

    // Every tab, every filter and sort.
    for (const key of ['bill', 'subscription', 'all']) await page.getByTestId('kind-filter').getByText(key === 'all' ? 'All' : key === 'bill' ? '🧾 Bills' : '🔁 Subscriptions').click();
    for (const sort of ['name', 'priceDesc', 'priceAsc', 'nextBill']) {
      await page.getByTestId('sort-button').click();
      await page.getByTestId(`sort-sheet-option-${sort}`).click();
      await check(page, problems, `sort ${sort}`);
    }
    for (const tab of ['Upcoming', 'Insights', 'Settings', 'Bills']) {
      await page.getByRole('tab', { name: tab }).click();
      await check(page, problems, `${tab} tab`);
    }
  });

  for (const [label, pro, theme] of [
    ['free user, light', false, 'light'],
    ['Pro user, dark', true, 'dark'],
  ] as const) {
    test(`awkward data on every screen (${label})`, async ({ page }) => {
      const problems = watch(page);
      const state = edgeState(pro).replace('"theme":"light"', `"theme":"${theme}"`);
      await page.addInitScript((value) => window.localStorage.setItem('subtally-store', value), state);
      const ids = ['leap', 'end', 'weekly', 'daily', 'huge', 'zero', 'yen', 'eur', 'trial', 'custom', 'paused', 'cancelled', 'future', 'emoji'];
      const routes: [string, string][] = [
        ['/', 'subscriptions-screen'],
        ['/upcoming', 'upcoming-screen'],
        ['/insights', 'insights-screen'],
        ['/settings', 'settings-screen'],
        ...ids.map((id): [string, string] => [`/subscription/${id}`, 'detail-screen']),
        ...ids.map((id): [string, string] => [`/editor?id=${id}`, 'editor-screen']),
      ];
      for (const [path, id] of routes) {
        await page.goto(path);
        await expect(page.getByTestId(id).first(), `${path} did not open`).toBeVisible();
        await check(page, problems, path);
      }
      // Categories: Pro users get the manager, free users a clear Pro gate.
      await page.goto('/categories');
      if (pro) await expect(page.getByTestId('categories-screen')).toBeVisible();
      else await expect(page.getByText('Custom categories are a Pro feature')).toBeVisible();
      await check(page, problems, '/categories');
      // A link to something deleted says so instead of crashing.
      await page.goto('/subscription/missing');
      await expect(page.getByText('Not found')).toBeVisible();
      await check(page, problems, '/subscription/missing');
      for (const w of ['7', '30', '90']) {
        await page.goto('/upcoming');
        await page.getByTestId(`window-${w}`).click();
        await check(page, problems, `upcoming ${w} days`);
      }
      // Marking every overdue week of the years-old weekly bill paid one by one never breaks.
      await page.goto('/subscription/weekly');
      for (let i = 0; i < 30; i++) await page.getByTestId('action-mark-paid').click();
      await check(page, problems, 'weekly bill after 30 marks');
      await expect(page.getByTestId('paid-through-row')).not.toContainText('Not yet');
    });
  }

  test('a small phone (320 px wide) never scrolls sideways', async ({ page }) => {
    const problems = watch(page);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.addInitScript((value) => window.localStorage.setItem('subtally-store', value), edgeState(true));
    for (const path of ['/', '/upcoming', '/insights', '/settings', '/subscription/huge', '/editor?id=huge', '/pro?reason=general']) {
      await page.goto(path);
      await page.waitForTimeout(300);
      await check(page, problems, `320px ${path}`);
    }
  });
  test('a hidden filter never hides new items', async ({ page }) => {
    const problems = watch(page);
    await page.goto('/');
    await page.getByTestId('onboarding-skip').click();
    await page.getByTestId('empty-state-action').click();
    await page.getByTestId('name-field').fill('Rent');
    await page.getByTestId('price-field').fill('1200');
    await page.getByTestId('editor-save').click();
    await page.getByTestId('add-fab').click();
    await page.getByTestId('kind-subscription').click();
    await page.getByTestId('name-field').fill('Netflix');
    await page.getByTestId('price-field').fill('15.49');
    await page.getByTestId('editor-save').click();
    // Filter to subscriptions, then delete the only subscription: the chips disappear.
    await page.getByTestId('kind-filter').getByText('🔁 Subscriptions').click();
    await page.getByTestId('subscriptions-screen').getByText('Netflix', { exact: true }).click();
    await page.getByTestId('action-delete').click();
    await page.getByTestId('delete-sheet-confirm').click();
    await expect(page.getByTestId('kind-filter')).toHaveCount(0);
    // Everything left must still be listed, and a newly added bill must show up.
    await expect(page.getByTestId('subscriptions-screen').getByText('Rent', { exact: true })).toBeVisible();
    await page.getByTestId('add-fab').click();
    await page.getByTestId('name-field').fill('Water');
    await page.getByTestId('price-field').fill('40');
    await page.getByTestId('editor-save').click();
    await expect(page.getByTestId('subscriptions-screen').getByText('Water', { exact: true })).toBeVisible();
    await check(page, problems, 'after the filter hid');
  });
});
