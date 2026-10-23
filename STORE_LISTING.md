# SubTally — store listing copy and assets

Everything below is written to each store's field limits (counts are given per field). Paste as-is.

## Identity

| Field | Value |
|-------|-------|
| App name | SubTally |
| iOS bundle identifier | `com.tyjcraw.subtally` |
| Android package | `com.tyjcraw.subtally` |
| Version | 1.0.0 |
| Primary category | Finance |
| Secondary category (App Store) | Productivity |
| Price | Free, with one in-app purchase (`subtally_pro_lifetime`, non-consumable) |
| Contains ads | Yes (banner only, free tier) |
| Age rating | 4+ / Everyone |
| Privacy policy URL | the hosted copy of `docs/privacy.html` (set with `npm run setup`) |
| Support URL | the hosted copy of `docs/index.html` |
| Support email | tyjcraw@gmail.com |

## Apple App Store

**Name** (30 max, 30 used)
```
SubTally: Subscription Tracker
```

**Subtitle** (30 max, 29 used)
```
Private. Offline. No account.
```

**Promotional text** (170 max, 165 used)
```
Track every subscription and catch every renewal before it hits your card. No bank link, no account, works offline. Pro is a one-time purchase, never a subscription.
```

**Keywords** (100 max, 98 used; comma-separated, no spaces, do not repeat words from the name)
```
renewal,reminder,recurring,bills,budget,trial,expenses,manager,spending,money,cancel,billing,plans
```

**Description** (4000 max)
```
SubTally is the simple way to see every subscription you pay for, what they really cost per month and per year, and when each one renews next. It works entirely on your phone: no account, no bank connection, no cloud.

WHY PEOPLE SWITCH TO SUBTALLY
• It never asks for your bank login. You type in what you pay and SubTally does the maths.
• Pro is a one-time purchase. A subscription tracker should not be another subscription.
• Works offline, anywhere. Your data stays on your device unless you export it.
• Free-trial reminders. Add the trial end date and get a nudge before it turns into a charge.

WHAT YOU GET
• A clear tally of monthly and yearly spend, even when your plans bill weekly, quarterly or every few months.
• Renewal reminders on the day, or 1, 3 or 7 days before, at the time you choose.
• Upcoming view: everything due in the next 7, 30 or 90 days with totals.
• Insights: active, paused and trial counts and your most expensive subscriptions.
• Quick add with presets for popular services, plus any custom service with its own emoji and colour.
• Pause, resume, cancel or delete, and see what you have paid so far.
• Light and dark mode.
• Any currency. Subscriptions in other currencies are shown separately; SubTally never guesses exchange rates.

SUBTALLY PRO (ONE-TIME PURCHASE)
• No ads.
• Unlimited active subscriptions (free tracks up to 10).
• Spend by category and a 12-month projection of what will leave your account.
• Custom categories.
• CSV export and import.
• Restore on any device signed in to the same App Store account.

PRIVACY
SubTally has no servers and no accounts. Subscription data never leaves your phone. The free version shows a small banner advert through Google AdMob; buying Pro removes it completely. Full policy inside the app and at the privacy policy link.

Made by one independent developer. Questions and ideas: tyjcraw@gmail.com
```

**What's New (1.0.0)**
```
First release. Track subscriptions, see monthly and yearly totals, and get reminders before renewals and trial ends. Private, offline and no account required.
```

**App Privacy (nutrition labels)**

Answer "Yes, we collect data from this app", then:

| Data type | Linked to user | Used for tracking | Purpose | Source |
|-----------|----------------|-------------------|---------|--------|
| Identifiers → Device ID | No | Yes | Third-Party Advertising | Google AdMob SDK (free tier only) |
| Location → Coarse Location | No | No | Third-Party Advertising | AdMob (derived from IP) |
| Usage Data → Advertising Data | No | No | Third-Party Advertising | AdMob |
| Diagnostics → Performance Data | No | No | App Functionality | AdMob SDK telemetry |
| Purchases → Purchase History | No | No | App Functionality | RevenueCat (unlocks Pro) |

Not collected: contact info, financial info (the app never sees card or bank data), user content, browsing or search history, contacts, health, photos. Subscription data entered by the user stays on device and is not collected.

**In-app purchase**

| Field | Value |
|-------|-------|
| Type | Non-Consumable |
| Reference name | SubTally Pro |
| Product ID | `subtally_pro_lifetime` |
| Price tier | Tier matching about USD 6.99 (your call; nothing in the app assumes a price) |
| Display name | SubTally Pro |
| Description (45) | Remove ads, unlimited subscriptions, export |
| Review notes | One-time unlock. Open Settings → "See Pro" → "Unlock Pro" with a sandbox account. After purchase the banner disappears, the Insights tab shows the category and timeline charts, and Settings → Export/Import/Manage categories open instead of showing the Pro screen. |

## Google Play

**App name** (30 max, 30 used)
```
SubTally: Subscription Tracker
```

**Short description** (80 max, 76 used)
```
Track subscriptions and renewals offline. Private, no account. One-time Pro.
```

**Full description** (4000 max)
```
SubTally shows every subscription you pay for, what they really cost per month and per year, and when each one renews next. Everything stays on your phone: no account, no bank connection, no cloud.

<b>Why people switch to SubTally</b>
• No bank login, ever. Type in what you pay and SubTally does the maths.
• Pro is a one-time purchase. A subscription tracker should not be another subscription.
• Works offline. Your data never leaves your device unless you export it.
• Free-trial reminders. Add the trial end date and get a nudge before it becomes a charge.

<b>What you get</b>
• A clear tally of monthly and yearly spend, even for weekly, quarterly or custom billing cycles.
• Renewal reminders on the day, or 1, 3 or 7 days before, at the time you choose.
• Upcoming view: everything due in the next 7, 30 or 90 days, with totals.
• Insights: active, paused and trial counts and your most expensive subscriptions.
• Quick add with presets for popular services, or any custom service with its own emoji and colour.
• Pause, resume, cancel or delete, and see what you have paid so far.
• Light and dark theme, Material You friendly monochrome icon.
• Any currency. Other currencies are shown separately; SubTally never guesses exchange rates.

<b>SubTally Pro (one-time purchase)</b>
• No ads.
• Unlimited active subscriptions (free tracks up to 10).
• Spend by category and a 12-month projection of what will leave your account.
• Custom categories.
• CSV export and import.
• Restore on any device signed in to the same Google account.

<b>Privacy</b>
SubTally has no servers and no accounts. Subscription data never leaves your phone. The free version shows a small banner ad through Google AdMob; Pro removes it completely. The full policy is inside the app and at the privacy policy link.

Made by one independent developer. Questions and ideas: tyjcraw@gmail.com
```

**Store settings**

| Field | Value |
|-------|-------|
| App category | Finance |
| Tags | Budgeting, Personal finance, Productivity |
| Contains ads | Yes |
| In-app products | Yes: `subtally_pro_lifetime` (one-time, "SubTally Pro") |
| Content rating (IARC) | Answer "No" to every content question; result Everyone / PEGI 3 |
| Target audience | 18 and over (simplest; the app is not designed for children) |
| News app | No |
| COVID-19 app | No |
| Data safety | see below |
| Government app | No |
| Financial features | None (it does not move money or offer loans; answer "My app doesn't provide any financial features") |

**Data safety form**

Does your app collect or share any of the required user data types? **Yes** (because of the AdMob SDK and RevenueCat).

| Data type | Collected | Shared | Ephemeral | Required | Purposes |
|-----------|-----------|--------|-----------|----------|----------|
| Device or other IDs | Yes | Yes | No | Yes (free tier) | Advertising or marketing |
| Location → Approximate location | Yes | Yes | Yes | Yes (free tier) | Advertising or marketing |
| App activity → App interactions | Yes | Yes | No | Yes (free tier) | Advertising or marketing |
| App info and performance → Diagnostics | Yes | Yes | No | Yes | Analytics (SDK telemetry) |
| Financial info → Purchase history | Yes | Yes | No | Yes | App functionality |

Security practices: data is encrypted in transit: **Yes**. Users can request deletion: **Yes** (describe: "All subscription data is stored on the device and deleted with 'Delete all data' or by uninstalling. Advertising data is handled by Google; see Google's privacy controls."). Independent security review: No. Committed to Play Families Policy: No.

**Feature graphic**: `store/feature-graphic.png` (1024x500, generated by `npm run assets`).

## Screenshot plan

Generated by `npm run screenshots` from the web build at exact store sizes into `store/screenshots/<device>/`. They show the real app UI rendered by React Native Web; the stores accept screenshots without a status bar. If you prefer native captures, take them on a device or simulator with the same seeded data and keep the same order and captions.

| # | File | Screen | Suggested caption (overlay or first line of listing) |
|---|------|--------|------------------------------------------------------|
| 1 | 01-subscriptions | Subscriptions list with totals | "Every subscription, one tally" |
| 2 | 02-upcoming | Upcoming renewals, 30-day window | "Know what's due before it hits your card" |
| 3 | 03-insights | Insights with category and timeline charts (Pro) | "See where the money goes" |
| 4 | 04-detail | Subscription detail with trial ending | "Free-trial reminders before they turn into charges" |
| 5 | 05-editor | Add/edit form with presets | "Add a service in seconds" |
| 6 | 06-dark-subscriptions | Dark mode list | "Light or dark, your choice" |
| 7 | 07-pro | Pro screen | "Pro is a one-time purchase, not a subscription" |
| 8 | 08-onboarding | First screen of onboarding | "No account. No bank link. Works offline." |

Required sizes covered:

| Store slot | Device folder | Pixels |
|------------|---------------|--------|
| App Store iPhone 6.9" (required) | `iphone-6.9` | 1320 x 2868 |
| App Store iPhone 6.5" | `iphone-6.5` | 1284 x 2778 |
| App Store iPad 13" (required if iPad is supported) | `ipad-13` | 2064 x 2752 |
| Google Play phone (2 to 8 required) | `android-phone` | 1080 x 1920 |
| Google Play 10" tablet | `android-tablet-10` | 1600 x 2560 |

Google Play also wants a 512 x 512 icon: upload `assets/icon.png` (1024 x 1024; the console scales it).

## ASO notes

- The name carries the two highest-value terms ("subscription", "tracker"); the keyword field deliberately avoids repeating them.
- "Offline", "private", "no account" and "one-time" are the differentiators the research found competitors lack; they appear in the subtitle, short description and first lines of both descriptions, which is the text users see before "more".
- Reply to every review in the first weeks; both stores weigh recent rating velocity heavily.
- Localise the listing (not the app) for the top non-English markets later; the app's currency handling already works for them.
