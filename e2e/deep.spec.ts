import { expect, type Page, test } from '@playwright/test';

/**
 * Deeper flows than the smoke test, run against the exported web build. Every test also
 * fails on any console error, warning about React keys, or uncaught page error.
 */

function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') problems.push(`console.error: ${text}`);
    else if (msg.type() === 'warning' && /key|act\(|deprecated|Cannot update|Maximum update/i.test(text)) problems.push(`console.warn: ${text}`);
  });
  return problems;
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** A date relative to today, `months` months back on the same day of the month (day clamped to 28). */
function monthsAgo(months: number, day = Math.min(new Date().getDate(), 28)): string {
  const now = new Date();
  return iso(new Date(now.getFullYear(), now.getMonth() - months, day));
}

function state(subscriptions: Record<string, unknown>[], extra: { isPro?: boolean; theme?: string } = {}): string {
  const created = new Date();
  created.setFullYear(created.getFullYear() - 1);
  const base = (id: string, name: string, price: number, more: Record<string, unknown> = {}) => ({
    id,
    name,
    kind: 'subscription',
    autopay: true,
    amountVaries: false,
    paidThrough: null,
    price,
    currency: 'USD',
    cycle: { every: 1, unit: 'month' },
    firstBillDate: monthsAgo(6),
    categoryId: 'cat_streaming',
    color: '#E50914',
    emoji: '🎬',
    notes: '',
    reminderDaysBefore: 1,
    status: 'active',
    trialEndDate: null,
    createdAt: created.toISOString(),
    updatedAt: created.toISOString(),
    cancelledAt: null,
    ...more,
  });
  return JSON.stringify({
    state: {
      subscriptions: subscriptions.map((s) => base(s.id as string, s.name as string, s.price as number, s)),
      settings: { currency: 'USD', theme: extra.theme ?? 'light', reminderHour: 9, notificationsEnabled: false, onboardingComplete: true, summaryPeriod: 'month', sortBy: 'nextBill' },
      meta: { installedAt: created.toISOString(), sessionCount: 3, lastReviewPromptAt: null, reviewPromptCount: 0, isPro: extra.isPro ?? false },
    },
    version: 2,
  });
}

async function seed(page: Page, value: string): Promise<void> {
  await page.addInitScript((v) => {
    if (!sessionStorage.getItem('seeded')) {
      window.localStorage.setItem('subtally-store', v);
      sessionStorage.setItem('seeded', '1');
    }
  }, value);
}

async function paidSoFar(page: Page): Promise<string> {
  const row = page.getByText('Paid so far').locator('..').locator('..');
  return (await row.innerText()).replace('Paid so far', '').trim();
}

test.describe('Bowerly deep flows', () => {
  test('pausing stops "paid so far", resuming leaves the paused months out', async ({ page }) => {
    const problems = watchConsole(page);
    await seed(page, state([{ id: 'n', name: 'Netflix', price: 10 }]));
    await page.goto('/subscription/n');
    await expect(page.getByTestId('detail-screen')).toBeVisible();
    const before = await paidSoFar(page);
    expect(before).toMatch(/\$\d+\.00/);
    await page.getByTestId('action-pause').click();
    await expect(page.getByText('Paused', { exact: true }).first()).toBeVisible();
    expect(await paidSoFar(page)).toBe(before);
    await page.getByTestId('action-reactivate').click();
    await expect(page.getByTestId('action-pause')).toBeVisible();
    expect(await paidSoFar(page)).toBe(before);
    // Cancel, and the amount is still the same.
    await page.getByTestId('action-cancel').click();
    await page.getByTestId('cancel-sheet-confirm').click();
    await expect(page.getByText('Cancelled', { exact: true }).first()).toBeVisible();
    expect(await paidSoFar(page)).toBe(before);
    // Survives a reload.
    await page.reload();
    await expect(page.getByTestId('detail-screen')).toBeVisible();
    expect(await paidSoFar(page)).toBe(before);
    expect(problems).toEqual([]);
  });

  test('a hand paid bill: mark paid, edit the due day, undo still works', async ({ page }) => {
    const problems = watchConsole(page);
    // Due three months ago and monthly since; tracked from four months ago, so three are overdue.
    const created = new Date();
    created.setMonth(created.getMonth() - 4);
    await seed(page, state([{ id: 'r', name: 'Rent', price: 1200, kind: 'bill', autopay: false, firstBillDate: monthsAgo(3, 5), createdAt: created.toISOString(), categoryId: 'cat_housing', emoji: '🏠' }]));
    await page.goto('/subscription/r');
    await expect(page.getByTestId('overdue-count')).toBeVisible();
    const overdueText = await page.getByTestId('overdue-count').innerText();
    await page.getByTestId('action-mark-paid').click();
    await expect(page.getByTestId('paid-through-row')).not.toContainText('Not yet');
    const paidOnce = await page.getByTestId('paid-through-row').innerText();
    // Move the due day from the 5th to the 20th.
    await page.getByTestId('detail-edit').click();
    await expect(page.getByTestId('editor-screen')).toBeVisible();
    await page.getByTestId('first-date-row').click();
    await page.getByTestId('first-date-sheet-day-20').click();
    await page.getByTestId('editor-save').click();
    await expect(page.getByTestId('detail-screen')).toBeVisible();
    // The month already paid stays paid: paid through moves to the 20th of the same month.
    const fmt = (d: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${d}T12:00:00`));
    await expect(page.getByTestId('paid-through-row')).toContainText(fmt(monthsAgo(3, 20)));
    expect(paidOnce).toContain(fmt(monthsAgo(3, 5)));
    await expect(page.getByTestId('overdue-count')).toHaveText('2 due dates unpaid');
    await page.getByTestId('action-undo-paid').click();
    await expect(page.getByTestId('paid-through-row')).toContainText('Not yet');
    await expect(page.getByTestId('overdue-count')).toHaveText('3 due dates unpaid');
    expect(overdueText).toBe('3 due dates unpaid');
    expect(problems).toEqual([]);
  });

  test('the editor refuses bad input and says why', async ({ page }) => {
    const problems = watchConsole(page);
    await seed(page, state([]));
    await page.goto('/editor');
    await page.getByTestId('editor-save').click();
    await expect(page.getByText('Give this bill a name.')).toBeVisible();
    await page.getByTestId('name-field').fill('Thing');
    await page.getByTestId('price-field').fill('abc');
    await page.getByTestId('editor-save').click();
    await expect(page.getByText('Enter a valid amount.')).toBeVisible();
    await page.getByTestId('price-field').fill('2000000');
    await page.getByTestId('editor-save').click();
    await expect(page.getByText('That amount looks too large.')).toBeVisible();
    await page.getByTestId('price-field').fill('9,99');
    await page.getByTestId('editor-save').click();
    await expect(page.getByTestId('subscriptions-screen')).toBeVisible();
    await expect(page.getByTestId('totals-amount')).toHaveText('$9.99');
    expect(problems).toEqual([]);
  });

  test('a free user reaching the limit is sent to Pro, and nothing is lost', async ({ page }) => {
    const problems = watchConsole(page);
    const ten = Array.from({ length: 10 }, (_, i) => ({ id: `s${i}`, name: `Service ${i}`, price: 1 }));
    await seed(page, state(ten));
    await page.goto('/editor');
    await page.getByTestId('name-field').fill('Eleventh');
    await page.getByTestId('price-field').fill('5');
    await page.getByTestId('editor-save').click();
    await expect(page.getByTestId('pro-screen')).toBeVisible();
    await page.getByTestId('pro-not-now').click();
    await expect(page.getByTestId('subscriptions-screen')).toBeVisible();
    await expect(page.getByTestId('subscriptions-screen').getByText('Eleventh')).toHaveCount(0);
    await expect(page.getByTestId('totals-amount')).toHaveText('$10.00');
    expect(problems).toEqual([]);
  });

  test('missing items and odd links show a friendly screen, not a crash', async ({ page }) => {
    const problems = watchConsole(page);
    await seed(page, state([{ id: 'n', name: 'Netflix', price: 10 }]));
    await page.goto('/subscription/does-not-exist');
    await expect(page.getByText('Not found')).toBeVisible();
    await page.goto('/editor?id=does-not-exist');
    await expect(page.getByTestId('editor-screen')).toBeVisible();
    await page.goto('/pro?reason=nonsense');
    await expect(page.getByTestId('pro-screen')).toBeVisible();
    await page.goto('/legal/nonsense');
    await expect(page.locator('body')).not.toBeEmpty();
    await page.goto('/no/such/page');
    await expect(page.getByText("That page doesn't exist")).toBeVisible();
    await page.getByText('Back to bills').click();
    await expect(page.getByTestId('subscriptions-screen')).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('dark mode on every tab, and deleting an item from its screen', async ({ page }) => {
    const problems = watchConsole(page);
    await seed(page, state([{ id: 'n', name: 'Netflix', price: 10 }, { id: 'g', name: 'Gym', price: 30, categoryId: 'cat_fitness' }], { theme: 'dark' }));
    for (const tab of ['/', '/upcoming', '/insights', '/settings']) {
      await page.goto(tab);
      await expect(page.locator('[data-testid$="-screen"]').first()).toBeVisible();
      const bg = await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid$="-screen"]') as Element).backgroundColor);
      expect(bg, tab).toBe('rgb(15, 22, 19)');
    }
    await page.goto('/subscription/g');
    await page.getByTestId('action-delete').click();
    await page.getByTestId('delete-sheet-confirm').click();
    await expect(page.getByTestId('subscriptions-screen')).toBeVisible();
    await expect(page.getByTestId('subscriptions-screen').getByText('Gym')).toHaveCount(0);
    await expect(page.getByTestId('totals-amount')).toHaveText('$10.00');
    expect(problems).toEqual([]);
  });
  test('a category filter whose chip disappears stops filtering', async ({ page }) => {
    const problems = watchConsole(page);
    await seed(
      page,
      state([
        { id: 'n', name: 'Netflix', price: 10 },
        { id: 'g', name: 'Gym', price: 30, categoryId: 'cat_fitness' },
      ]),
    );
    await page.goto('/');
    const list = page.getByTestId('subscriptions-screen');
    await list.getByText('Fitness', { exact: false }).first().click();
    await expect(list.getByText('Netflix', { exact: true })).toHaveCount(0);
    // Delete the only fitness item: one category is left, so the chips go away...
    await list.getByText('Gym', { exact: true }).click();
    await page.getByTestId('action-delete').click();
    await page.getByTestId('delete-sheet-confirm').click();
    // ...and the list must show everything again, including anything added next.
    await expect(list.getByText('Netflix', { exact: true })).toBeVisible();
    await page.getByTestId('add-fab').click();
    await page.getByTestId('name-field').fill('Water');
    await page.getByTestId('price-field').fill('40');
    await page.getByTestId('editor-save').click();
    await expect(list.getByText('Water', { exact: true })).toBeVisible();
    expect(problems).toEqual([]);
  });
});

