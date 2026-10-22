# Niche Research — decision record

Date: 2026-10-22
Decision owner: the build agent (per brief, no user decision required)

## Constraints applied to every candidate

- Solo developer, zero marketing budget: downloads must come from store search, so the niche needs clear search demand with beatable competition.
- No backend, no user accounts, no paid or revocable third-party APIs: the app must be fully usable offline from first launch.
- Monetization that does not hurt the experience: non-intrusive AdMob banners plus a one-time Pro unlock (no subscription paywall).
- Good reviews: the job the app does must be simple enough to do flawlessly, and the app should give users a reason to return (which also drives ad impressions and Pro conversions).

## Candidates compared

| # | Niche | Search demand | Competition quality | Fits constraints | Monetization fit | Review potential | Verdict |
|---|-------|---------------|---------------------|------------------|------------------|------------------|---------|
| 1 | **Subscription tracker** (manual, privacy-first) | Near-equal on both stores (one ASO index: iOS popularity 25 / difficulty 36, Android popularity 24 / difficulty 26). Macro tailwind: 70% of US adults have forgotten to cancel a trial; households average 2.6 unused subscriptions; 84% underestimate their spend. | Weak where it matters. 10 of 14 trackers surveyed require bank linking. 5 of the top 20 iOS trackers sell weekly subscriptions (users resent paying a subscription to track subscriptions). Android entrants are tiny and poorly rated (one at 2.3 stars from 3 ratings, others with 31–280 total downloads). Bobby, the best-loved manual tracker, is iOS-only and stale. | Yes. Pure local data, local notifications for renewals, no API. | Excellent. Renewal reminders bring users back weekly; banners sit under lists; Pro unlocks unlimited items, export, insights. "One-time purchase, not a subscription" is itself a selling point in this niche. | High. The job is narrow and fully controllable; a fast, pretty, offline tracker with reliable reminders is exactly what reviews praise. | **PICK** |
| 2 | Debt payoff planner (snowball/avalanche) | Moderate; strong intent but a smaller audience than subscriptions. | Fragmented, no leader; top apps have single-digit review counts. | Yes (pure math, offline). | Good (Pro: unlimited debts, strategies, export). | High when the math is right; users are emotionally invested. | Strong runner-up. Smaller top-of-funnel than #1. |
| 3 | Savings challenge / cash stuffing envelopes | Trend-driven (TikTok), seasonal spike in January. | Several small apps with 3.0–3.7 star averages on tiny samples. | Yes. | Good (Pro: unlimited envelopes, themes). | Medium; novelty-driven usage, churn after the challenge ends. | Viable but seasonal and faddish. |
| 4 | Warranty / receipt tracker | Moderate. | Crowded with 2026 entrants whose features converge on photo capture plus OCR. | Partial. Differentiating OCR needs cloud or heavy on-device ML. | Medium. | Medium; low-frequency usage means fewer sessions. | Pass. |
| 5 | Car maintenance / mileage log | Moderate; stable. | Entrenched Android leaders (Drivvo, Fuelio, Simply Auto); indie iOS apps have small review bases. | Yes. | Medium (Pro: multi-vehicle, export). | Medium. | Pass; harder to displace incumbents. |
| 6 | Plant watering reminder | Moderate. | Crowded with free apps; many add AI identification (paid APIs). | Yes for reminders only; parity features need APIs. | Weak; most rivals are free. | Medium. | Pass. |
| 7 | Pantry / food expiry tracker | Moderate. | Crowded; expected features (barcode lookup, recipes) depend on product databases and APIs. | No; barcode lookup needs a third-party API. | Medium. | Medium (3.5–4.6 stars in the field). | Pass. |

## Why the subscription tracker wins

1. **Demand is real and durable.** Subscription creep is a mainstream pain point with survey data behind it, and the keyword is searched at similar volume on both stores while Android has lower competition.
2. **The incumbents have self-inflicted weaknesses we can exploit on day one.** Bank linking (privacy and trust barrier), subscription pricing (hated in this niche), iOS-only or abandoned apps, and low-quality Android clones.
3. **It fits every hard constraint** without compromise: fully offline, no accounts, no APIs, local notifications only.
4. **Built-in retention.** Upcoming renewals are a natural reason to reopen the app. That retention supports banner revenue without interstitials and gives Pro conversions time to happen.
5. **A solo developer can make it excellent.** The feature surface is small enough to ship with zero half-done features, which is what good reviews require.

## Positioning

- Name: **SubTally**. Store title: "SubTally: Subscription Tracker".
- One-liner: "Track every subscription, catch every renewal. Private, offline, no account, no bank link, and Pro is a one-time purchase."
- Differentiators to lead with in ASO copy: offline and private; renewal reminders; one-time Pro (never a subscription); light and dark mode; CSV export.

## Sources consulted

- Sonar ASO keyword index for "subscription tracker" (iOS vs Android popularity/difficulty): https://trysonar.app/blog/free-aso-keyword-tools.md
- Self Financial, "The Cost of Unused Paid Subscriptions 2026": https://www.self.inc/info/cost-of-unused-paid-subscriptions/
- Adapty, subscription fatigue statistics (84% underestimate spending): https://adapty.io/glossary/subscription-fatigue/
- LemsSubs/Origin roundup noting 10 of 14 trackers require bank linking: https://useorigin.com/resources/blog/10-best-subscription-management-tracking-apps-in-2026
- Recurdash review noting weekly-plan pricing among top iOS trackers: https://recurdash.com/blog/best-subscription-tracker-apps
- Google Play traction of small Android trackers: https://www.appbrain.com/app/subscription-tracker/com.subscription_tracker_app and https://www.appbrain.com/app/substracker-easy-subs-monitor/com.appmakerszone.substrackerapp
- Debt payoff competitors: https://apps.appfollow.io/ios/debt-snowball-payoff-planner/1478622759?country=br and https://www.fool.com/money/personal-finance/debt-payoff-planner-review
- Cash stuffing apps: https://mwm.ai/apps/100-envelope-challenge/6779838041 and https://apps.appfollow.io/ios/budget-bestie/6460258044?country=si
- Warranty trackers: https://mwm.ai/apps/kept-receipts-documents/6790478529 and https://apps.apple.com/us/app/-/id6758876669
- Car logs: https://apps.apple.com/us/app/-/id1386377748 and https://appgoblin.info/apps/6774927156
- Plant reminders: https://apps.apple.com/us/app/-/id6743714233 and https://mwm.ai/apps/leafloop-plant-reminder/6790788078
- Pantry trackers: https://apps.appfollow.io/ios/pantry-inventory-panzy/6748056076?country=us and https://mwm.ai/apps/pantrium-pantry-tracker/6787587377
- General niche guidance: https://bigideasdb.com/profitable-mobile-app-ideas-2026 and https://howtomakemoneyfromhome.online/apps/best-app-niches-2026/
