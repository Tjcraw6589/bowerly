import { expect, type Page, test } from '@playwright/test';

/**
 * Brand sweep: visits every screen, as a brand-new user and as a Pro user with data,
 * and fails if any visible text still uses the old name. Also checks the facts users
 * rely on (contact email, Pro price wording, legal page dates).
 */

const OLD_NAME = /sub\s*tally|bill\s*nest/i;

const categories = [
  ['cat_streaming', 'Streaming', '🎬', '#E53958'],
  ['cat_music', 'Music', '🎵', '#1DB954'],
  ['cat_software', 'Software', '💻', '#3D5AFE'],
  ['cat_cloud', 'Cloud & Storage', '☁️', '#0EA5E9'],
  ['cat_gaming', 'Gaming', '🎮', '#8B5CF6'],
  ['cat_fitness', 'Health & Fitness', '💪', '#F97316'],
  ['cat_news', 'News & Reading', '📰', '#64748B'],
  ['cat_utilities', 'Home & Utilities', '🏠', '#14B8A6'],
  ['cat_finance', 'Finance & Insurance', '💳', '#CA8A04'],
  ['cat_other', 'Other', '📦', '#9CA3AF'],
].map(([id, name, emoji, color]) => ({ id, name, emoji, color, builtIn: true }));

function seededState(isPro: boolean): string {
  const sub = (id: string, name: string, price: number, extra: Record<string, unknown> = {}) => ({
    id,
    name,
    price,
    currency: 'USD',
    cycle: { every: 1, unit: 'month' },
    firstBillDate: '2026-01-15',
    categoryId: 'cat_streaming',
    color: '#E50914',
    emoji: '🎬',
    notes: 'Family plan',
    reminderDaysBefore: 1,
    status: 'active',
    trialEndDate: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    cancelledAt: null,
    ...extra,
  });
  return JSON.stringify({
    state: {
      subscriptions: [
        sub('a', 'Netflix', 15.49),
        sub('b', 'Gym', 39, { categoryId: 'cat_fitness', status: 'paused' }),
        sub('c', 'Old app', 4.99, { status: 'cancelled', cancelledAt: '2026-05-01T00:00:00.000Z' }),
        // Saved as version 1 data, so this also exercises the upgrade; kind/autopay are kept.
        sub('d', 'Rent', 1200, { kind: 'bill', autopay: false, firstBillDate: '2026-01-01', categoryId: 'cat_housing', emoji: '🏠', createdAt: '2026-09-20T00:00:00.000Z' }),
        sub('e', 'Electricity', 85, { kind: 'bill', autopay: true, amountVaries: true, categoryId: 'cat_utilities', emoji: '💡' }),
      ],
      categories: [...categories, { id: 'custom1', name: 'Pets', emoji: '🐾', color: '#0EA5E9', builtIn: false }],
      settings: { currency: 'USD', theme: 'light', reminderHour: 9, notificationsEnabled: false, onboardingComplete: true, summaryPeriod: 'month', sortBy: 'nextBill' },
      meta: { installedAt: '2026-01-01T00:00:00.000Z', sessionCount: 5, lastReviewPromptAt: null, reviewPromptCount: 0, isPro },
    },
    version: 1,
  });
}

async function visibleText(page: Page): Promise<string> {
  await page.waitForTimeout(400);
  return page.evaluate(() => document.body.innerText);
}

async function expectNoOldName(page: Page, where: string): Promise<void> {
  const text = await visibleText(page);
  expect(text, `${where} still mentions the old name`).not.toMatch(OLD_NAME);
  expect(text.length, `${where} rendered no text`).toBeGreaterThan(20);
}

test.describe('Bowerly brand and facts', () => {
  test('fresh user: onboarding and empty screens', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('onboarding')).toBeVisible();
    await expectNoOldName(page, 'onboarding step 1');
    await page.getByTestId('onboarding-next').click();
    await expectNoOldName(page, 'onboarding step 2');
    await page.getByTestId('onboarding-next').click();
    await expectNoOldName(page, 'onboarding step 3');
    await page.getByTestId('onboarding-finish').click();
    for (const [path, id] of [
      ['/', 'subscriptions-screen'],
      ['/upcoming', 'upcoming-screen'],
      ['/insights', 'insights-screen'],
      ['/settings', 'settings-screen'],
      ['/editor', 'editor-screen'],
    ] as const) {
      await page.goto(path);
      await expect(page.getByTestId(id)).toBeVisible();
      await expectNoOldName(page, `fresh ${path}`);
    }
    expect(await page.title()).toBe('Bowerly');
  });

  test('Pro user with data: every screen', async ({ page }) => {
    await page.addInitScript((value) => window.localStorage.setItem('subtally-store', value), seededState(true));
    const routes: [string, string][] = [
      ['/', 'subscriptions-screen'],
      ['/upcoming', 'upcoming-screen'],
      ['/insights', 'insights-screen'],
      ['/settings', 'settings-screen'],
      ['/editor', 'editor-screen'],
      ['/editor?id=a', 'editor-screen'],
      ['/subscription/a', 'detail-screen'],
      ['/subscription/b', 'detail-screen'],
      ['/subscription/c', 'detail-screen'],
      ['/subscription/d', 'detail-screen'],
      ['/subscription/e', 'detail-screen'],
      ['/categories', 'categories-screen'],
      ['/pro?reason=general', 'pro-screen'],
      ['/legal/privacy', 'legal-screen'],
      ['/legal/terms', 'legal-screen'],
    ];
    for (const [path, id] of routes) {
      await page.goto(path);
      await expect(page.getByTestId(id)).toBeVisible();
      await expectNoOldName(page, path);
    }
    // The v1 data was upgraded: the rent is a hand-paid bill and shows as overdue.
    await page.goto('/');
    await expect(page.getByTestId('totals-split')).toBeVisible();
    await expect(page.getByTestId('totals-overdue')).toBeVisible();
    await expect(page.getByTestId('kind-filter')).toBeVisible();
    await page.goto('/upcoming');
    await expect(page.getByTestId('overdue-section')).toBeVisible();
    await page.goto('/settings');
    await expect(page.getByText('Pro is unlocked')).toBeVisible();
    await expect(page.getByText('tyjcraw@gmail.com')).toBeVisible();
  });

  test('free user: every Pro gate and reason', async ({ page }) => {
    await page.addInitScript((value) => window.localStorage.setItem('subtally-store', value), seededState(false));
    for (const reason of ['limit', 'export', 'import', 'categories', 'insights', 'general']) {
      await page.goto(`/pro?reason=${reason}`);
      await expect(page.getByTestId('pro-screen')).toBeVisible();
      await expectNoOldName(page, `pro reason=${reason}`);
      await expect(page.getByText('One-time purchase. Not a subscription.', { exact: false })).toBeVisible();
    }
    await page.goto('/categories');
    await expectNoOldName(page, 'categories gate');
    await expect(page.getByText('Custom categories are a Pro feature')).toBeVisible();
  });

  test('legal pages carry the current date and contact', async ({ page }) => {
    await page.addInitScript((value) => window.localStorage.setItem('subtally-store', value), seededState(false));
    for (const doc of ['privacy', 'terms']) {
      await page.goto(`/legal/${doc}`);
      await expect(page.getByText('Last updated 26 October 2026')).toBeVisible();
      await expect(page.getByText('tyjcraw@gmail.com', { exact: false }).first()).toBeVisible();
    }
  });
});
