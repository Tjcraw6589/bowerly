import { expect, test } from '@playwright/test';

/**
 * End-to-end smoke test against the exported web build (the same JavaScript that
 * ships in the native apps, rendered by React Native Web). It drives the app the
 * way a new user would: onboarding, first subscription, every tab, Pro screen,
 * dark mode, and persistence across a reload.
 */
test.describe('Billnest smoke', () => {
  test('first run through every screen', async ({ page }) => {
    await page.goto('/');

    // Onboarding: three steps, under thirty seconds.
    await expect(page.getByTestId('onboarding')).toBeVisible();
    await expect(page.getByText('Every subscription, one tally.')).toBeVisible();
    await page.getByTestId('onboarding-next').click();
    await expect(page.getByText('Which currency do you mostly pay in?')).toBeVisible();
    await page.getByTestId('currency-chip-EUR').click();
    await page.getByTestId('currency-chip-USD').click();
    await page.getByTestId('onboarding-next').click();
    await expect(page.getByText('Never miss a renewal')).toBeVisible();
    await page.getByTestId('hour-chip-20').click();
    await page.getByTestId('onboarding-finish').click();

    // Empty subscriptions list.
    await expect(page.getByTestId('subscriptions-screen')).toBeVisible();
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await page.getByTestId('empty-state-action').click();

    // Editor: preset suggestion, price, trial toggle, save.
    await expect(page.getByTestId('editor-screen')).toBeVisible();
    await page.getByTestId('name-field').fill('Net');
    await page.getByTestId('preset-Netflix').click();
    await expect(page.getByTestId('name-field')).toHaveValue('Netflix');
    await page.getByTestId('price-field').fill('15.49');
    await page.getByTestId('cycle-year').click();
    await expect(page.getByText('$15.49 yearly')).toBeVisible();
    await page.getByTestId('cycle-month').click();
    await page.getByTestId('editor-save').click();

    // List shows the subscription and the totals header.
    await expect(page.getByTestId('subscriptions-screen')).toBeVisible();
    await expect(page.getByText('Netflix')).toBeVisible();
    await expect(page.getByTestId('totals-amount')).toHaveText('$15.49');
    await page.getByTestId('period-year').click();
    await expect(page.getByTestId('totals-amount')).toHaveText('$185.88');

    // Detail screen with upcoming charges, then back.
    await page.getByText('Netflix').first().click();
    await expect(page.getByTestId('detail-screen')).toBeVisible();
    await expect(page.getByTestId('next-event-card')).toBeVisible();
    await expect(page.getByTestId('upcoming-charges')).toBeVisible();
    await page.getByTestId('header-dismiss').click();
    await expect(page.getByTestId('subscriptions-screen')).toBeVisible();

    // Upcoming tab.
    await page.getByRole('tab', { name: 'Upcoming' }).click();
    await expect(page.getByTestId('upcoming-screen')).toBeVisible();
    await expect(page.getByTestId('upcoming-total')).toBeVisible();
    await page.getByTestId('window-90').click();
    await expect(page.getByText('Due in the next 90 days')).toBeVisible();

    // Insights tab: free users see the totals and locked Pro cards.
    await page.getByRole('tab', { name: 'Insights' }).click();
    await expect(page.getByTestId('insights-screen')).toBeVisible();
    await expect(page.getByTestId('insight-monthly')).toContainText('$15.49');
    await expect(page.getByTestId('insight-yearly')).toContainText('$185.88');
    await expect(page.getByTestId('locked-card').first()).toBeVisible();

    // Settings tab: theme switch and legal pages.
    await page.getByRole('tab', { name: 'Settings' }).click();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    await page.getByTestId('theme-dark').click();
    await expect(page.getByTestId('settings-screen')).toHaveCSS('background-color', 'rgb(15, 18, 34)');
    await page.getByTestId('theme-light').click();
    await expect(page.getByTestId('settings-screen')).toHaveCSS('background-color', 'rgb(246, 247, 251)');
    await page.getByTestId('settings-privacy').click();
    await expect(page.getByTestId('legal-screen')).toBeVisible();
    await expect(page.getByText('Billnest has no accounts, no sign-in, no cloud sync', { exact: false })).toBeVisible();
    await page.getByTestId('header-dismiss').click();

    // Pro screen on the web reports that the store is unavailable and keeps the free app working.
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    await page.getByTestId('see-pro').click();
    await expect(page.getByTestId('pro-screen')).toBeVisible();
    await expect(page.getByTestId('store-unavailable')).toBeVisible();
    await expect(page.getByTestId('pro-buy')).toBeDisabled();
    await page.getByTestId('pro-not-now').click();

    // Pro-gated action from settings opens the Pro screen too.
    await page.getByTestId('settings-export').click();
    await expect(page.getByTestId('pro-screen')).toBeVisible();
    await expect(page.getByText('Take your data anywhere')).toBeVisible();
    await page.getByTestId('pro-not-now').click();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    await expect(page).toHaveURL(/\/settings$/);

    // Data persists across a full reload and onboarding is not shown again.
    await page.reload();
    await expect(page.getByTestId('onboarding')).toHaveCount(0);
    await page.getByRole('tab', { name: 'Subscriptions' }).click();
    await expect(page.getByText('Netflix')).toBeVisible();
    await expect(page.getByTestId('totals-amount')).toHaveText('$185.88');
  });

  test('the Pro screen opened directly can be dismissed', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('onboarding-skip').click();
    await expect(page.getByTestId('subscriptions-screen')).toBeVisible();
    await page.goto('/pro?reason=general');
    await expect(page.getByTestId('pro-screen')).toBeVisible();
    await page.getByTestId('pro-not-now').click();
    await expect(page.getByTestId('subscriptions-screen')).toBeVisible();
  });

  test('delete all data clears the list', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('onboarding-skip').click();
    await page.getByTestId('empty-state-action').click();
    await page.getByTestId('name-field').fill('Gym');
    await page.getByTestId('price-field').fill('40');
    await page.getByTestId('editor-save').click();
    await expect(page.getByText('Gym', { exact: true })).toBeVisible();

    await page.getByRole('tab', { name: 'Settings' }).click();
    await page.getByTestId('settings-reset').click();
    await expect(page.getByTestId('reset-sheet')).toBeVisible();
    await page.getByTestId('reset-sheet-confirm').click();
    await expect(page.getByTestId('settings-feedback')).toContainText('deleted');
    await page.getByRole('tab', { name: 'Subscriptions' }).click();
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });
});
