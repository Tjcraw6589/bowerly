# SubTally — build plan

Status legend: `[x]` done and verified, `[ ]` not started or in progress, `[-]` removed from scope (reason given).

## App

**SubTally: Subscription Tracker.** Track every recurring charge, see what it costs per month and per year, and get a reminder before each renewal and before each free trial ends. Fully offline, no account, no bank linking. Free with a small banner ad; a one-time Pro purchase removes ads and unlocks power features.

## Core feature set

| Area | Free | Pro (one-time purchase) |
|------|------|-------------------------|
| Subscriptions | Up to 10 active subscriptions with name, price, currency, billing cycle (weekly, monthly, quarterly, yearly, or custom every N days/weeks/months/years), first bill date, category, colour, emoji, notes | Unlimited active subscriptions |
| Renewal reminders | Local notification 0, 1, 3 or 7 days before each renewal, at a time you choose | Same |
| Free trials | Trial end date with a reminder before it converts to paid | Same |
| Upcoming | Renewals due in the next 7, 30 and 90 days with totals | Same |
| Insights | Monthly and yearly totals, active/paused/trial counts, most expensive | Spend by category chart and 12-month cost timeline |
| Categories | 10 built-in categories | Add, rename, recolour and delete custom categories |
| Data | Local only, delete-all | CSV export (share sheet) and CSV import |
| Ads | Anchored adaptive banner under list screens, never during onboarding or in forms | No ads |
| Appearance | Light, dark and system theme | Same |

Everything in the Free column is fully usable with no network connection and no store availability. Pro purchases go through RevenueCat (`react-native-purchases`), product `subtally_pro_lifetime`, entitlement `pro`, with a Restore Purchases button and a clear "store unavailable" state.

## Tech stack

- Expo SDK 58, React Native 0.88, React 19.3, TypeScript 6 in strict mode, Expo Router (typed routes), EAS Build.
- State: Zustand with AsyncStorage persistence (local storage only).
- Monetization: `react-native-google-mobile-ads` (UMP consent flow, ATT on iOS, adaptive banner) and `react-native-purchases` (RevenueCat).
- Reminders: `expo-notifications` local scheduled notifications.
- Rating prompt: `expo-store-review`, gated on a "good session".
- Tests: Jest 30 with `jest-expo`, React Native Testing Library 14, `expo-router/testing-library`; Playwright end-to-end smoke test against the exported web build.
- Lint: ESLint 9 flat config via `eslint-config-expo`.

## Checklist

### Phase 1 — Research
- [x] Compare at least five niches and record the decision in `RESEARCH.md`

### Phase 2 — Plan and scaffold
- [x] Expo SDK 58 TypeScript scaffold with all dependencies installed
- [x] `app.json` with identifiers, permissions, usage strings, config plugins, store metadata
- [x] Strict `tsconfig.json`, ESLint flat config, Jest config with native-module doubles
- [x] `PLAN.md` (this file)

### Phase 3 — Build
- [ ] Domain types, built-in categories, service presets, currency list
- [ ] Date and recurrence math (next bill date, upcoming dates, days until)
- [ ] Money math (normalise any cycle to monthly and yearly cost, formatting)
- [ ] Insights math (totals, by category, upcoming windows, most expensive, 12-month timeline)
- [ ] CSV export and import (RFC 4180 quoting, validation, duplicate handling)
- [ ] Review-prompt gate (good-session rules) and free-tier limits
- [ ] Notification plan (pure) and scheduler (expo-notifications, platform-guarded)
- [ ] Zustand store with AsyncStorage persistence, migrations and hydration flag
- [ ] Theme system (light/dark tokens, system follow) and base components
- [ ] Onboarding (3 steps, under 30 seconds, skippable, no ads)
- [ ] Subscriptions tab: totals header, sort, search, list, empty state, add button
- [ ] Add/edit subscription form with validation, presets, cycle picker, date picker, colour and emoji pickers
- [ ] Subscription detail: next renewals, paid to date, pause/resume, cancel, delete
- [ ] Upcoming tab: 7/30/90-day windows with totals
- [ ] Insights tab: totals, counts, most expensive, Pro category chart and timeline
- [ ] Settings tab: currency, theme, reminder time, notifications, Pro status, restore, export/import, categories, rate, legal, about, delete all data
- [ ] Pro screen: feature list, live price from store, buy, restore, unavailable state
- [ ] Categories manager (Pro)
- [ ] Legal screens in app, `PRIVACY.md`, `TERMS.md`, `legal/privacy.html`, `legal/terms.html`
- [ ] Ads service: consent, ATT, initialise, banner slot that never blocks content
- [ ] Purchases service: configure, offerings, purchase, restore, entitlement listener, unavailable state
- [ ] Rating prompt wired to good-session gate
- [ ] App icon, adaptive Android icon (foreground, background, monochrome), splash (light and dark), notification icon, favicon
- [ ] Unit tests for all business logic
- [ ] Router smoke test (onboarding → add subscription → list) in Jest
- [ ] Playwright end-to-end smoke test against the web export

### Phase 4 — Verify
- [ ] `tsc --noEmit` passes with zero errors
- [ ] `expo lint` passes with zero errors and zero warnings
- [ ] `jest --ci` passes
- [ ] Playwright smoke test passes
- [ ] Walk through every screen in the browser (web build) and fix what breaks
- [ ] Document exactly what could not be verified on this machine

### Phase 5 — Store ready
- [ ] `STORE_LISTING.md` (titles, subtitles, keywords, descriptions for both stores)
- [ ] Screenshot plan and generated screenshots at store sizes
- [ ] `eas.json` with development, preview and production profiles plus submit config
- [ ] Final `app.json` review

### Phase 6 — Handoff
- [ ] `HANDOFF.md` with every remaining manual step, exact commands and links
- [ ] Setup script that fills in AdMob and RevenueCat keys and runs the EAS commands
