# Billnest — build plan

Status legend: `[x]` done and verified, `[ ]` not started or in progress, `[-]` removed from scope (reason given).

## App

**Billnest: Subscription Tracker.** Track every recurring charge, see what it costs per month and per year, and get a reminder before each renewal and before each free trial ends. Fully offline, no account, no bank linking. Free with a small banner ad; a one-time Pro purchase removes ads and unlocks power features.

## Core feature set

| Area | Free | Pro (one-time purchase) |
|------|------|-------------------------|
| Subscriptions | Up to 10 active subscriptions with name, price, currency, billing cycle (weekly, monthly, quarterly, yearly, or custom every N days/weeks/months/years), first bill date, category, colour, emoji, notes | Unlimited active subscriptions |
| Renewal reminders | Local notification on the day, or 1, 3 or 7 days before each renewal, at a time you choose | Same |
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
- [x] Domain types, built-in categories, 47 service presets, 40 currencies
- [x] Date and recurrence math (anchored bill dates, next bill, upcoming, bills to date)
- [x] Money math (normalise any cycle to monthly and yearly cost, locale-aware price parsing, formatting)
- [x] Insights math (totals per currency, by category, upcoming windows, most expensive, 12-month timeline, paid to date)
- [x] CSV export and import (RFC 4180 parser, validation, unknown-category creation, row-level errors)
- [x] Review-prompt gate (good-session rules) and free-tier limits
- [x] Notification plan (pure) and scheduler (expo-notifications, platform-guarded, under the iOS 64 limit)
- [x] Zustand store with AsyncStorage persistence, versioning and hydration flag
- [x] Theme system (light/dark tokens, system follow) and 20 base components (sheets, calendar, pickers, charts)
- [x] Onboarding (3 steps, skippable, no ads; the smoke test completes it in three taps)
- [x] Subscriptions tab: totals header, sort, search, category filter, grouped list, empty state, add button, free-limit notice
- [x] Add/edit subscription form with validation, presets, cycle picker, calendar date picker, trial logic, colour and emoji pickers
- [x] Subscription detail: next event, paid to date, upcoming charges, pause/resume, cancel, delete
- [x] Upcoming tab: 7/30/90-day windows with totals and trial-end items
- [x] Insights tab: totals, counts, most expensive, Pro category chart and timeline (locked cards for free)
- [x] Settings tab: currency, theme, reminder time, notifications, Pro status, restore, export/import, categories, delete all data, rate, legal, support, version
- [x] Pro screen: reason-specific headline, feature list, live price from store, buy, restore, unavailable state
- [x] Categories manager (Pro, with Pro gate)
- [x] Legal screens in app, `legal/privacy.md`, `legal/terms.md`, hostable `docs/privacy.html`, `docs/terms.html`
- [x] Ads service: consent, ATT, initialise after onboarding only, banner slot that renders nothing until an ad loads
- [x] Purchases service: configure, offerings, purchase, restore, entitlement listener, unavailable state
- [x] Rating prompt wired to the good-session gate after saving a subscription
- [x] App icon, adaptive Android icon (foreground, background, monochrome), splash (light and dark), notification icon, favicon, Play feature graphic (`npm run assets`)
- [x] Unit tests for all business logic (70 tests across dates, money, stats, CSV, review gate, limits, notifications, validation, sorting, presets, store)
- [x] Router smoke tests in Jest (4 tests: onboarding → add → list; validation; Pro unavailable; insights with data)
- [x] Playwright end-to-end smoke test against the web export (2 tests covering every screen, theme switch, persistence, delete-all)

### Phase 4 — Verify (results from this machine, Windows 11, Node 24)
- [x] `npx tsc --noEmit`: zero errors (with generated typed routes)
- [x] `npx expo lint`: zero errors, zero warnings
- [x] `npx jest --ci`: 9 suites, 74 tests, all passing
- [x] `npx playwright test`: 2 passed against `dist/` served locally
- [x] Walked every screen in a browser at a phone viewport (onboarding, list, editor with presets/calendar/trial, detail, upcoming, insights, settings, Pro, categories gate, legal) and fixed what was found (tab bar label clipping, duplicated legal date)
- [x] Store screenshots generated at exact store sizes from the same build

- [x] Native builds compile on EAS (2026-10-23): Android `preview` APK and iOS `development-simulator` both FINISHED, confirming the config plugins for AdMob, RevenueCat, notifications, splash and icons produce a valid native project on each platform. Build pages: https://expo.dev/accounts/tjcraw6589s-team/projects/subtally/builds

**Could not be verified on this machine, and why**
- iOS simulator and Android emulator: this is a Windows PC with no Xcode and no Android SDK installed, so the native apps were not launched here. Everything native-only (AdMob banner, RevenueCat purchase, scheduled notifications, haptics, share sheet, store review prompt) is implemented against the current SDK 58 and library type definitions, is unit-tested where logic exists, and falls back cleanly where the capability is missing, but the native calls themselves ran only against test doubles. The first EAS development build (HANDOFF.md step 7) is where to confirm them.
- Real purchases and real ads need your AdMob and RevenueCat accounts (HANDOFF.md steps 5 and 6); until the keys are entered the app shows its "store unavailable" state and uses Google's test ad unit in development builds.

### Phase 5 — Store ready
- [x] `STORE_LISTING.md` (titles, subtitles, keywords, descriptions, privacy and data-safety answers, IAP review notes)
- [x] Screenshot plan and 40 generated screenshots (`store/screenshots/`) at iPhone 6.9", 6.5", iPad 13", Android phone and 10" tablet sizes, plus `store/feature-graphic.png`
- [x] `eas.json` with development, development-simulator, preview and production profiles plus submit config
- [x] `app.json` reviewed: identifiers, permissions, usage strings, privacy manifest, config plugins, typed routes

### Phase 6 — Handoff
- [x] `HANDOFF.md` with every remaining manual step, exact commands and links
- [x] `npm run setup` interactive script that validates and writes AdMob, RevenueCat, Apple and Google identifiers into `app.json` and `eas.json`

### Removed from scope
- [-] Bank or card linking, cloud sync, multi-device sync: deliberately excluded; they require a backend and are the weakness of the competition this app is positioned against.
- [-] Exchange-rate conversion between currencies: would need a third-party API; totals are shown per currency instead.
- [-] Home-screen widgets: need per-platform native extension code outside Expo's managed workflow; candidate for a later release.
