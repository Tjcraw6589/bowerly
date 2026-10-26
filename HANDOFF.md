# SubTally — handoff: the steps only you can do

Everything in the code is finished and verified (see `PLAN.md` for what was verified and how). The remaining steps all need your identity, your money or your logins, so they cannot be automated. Work through them in order; most are one-time account setups. Total: roughly half a day, mostly waiting on account approvals.

All commands run from this folder (`C:\Users\Tyjcr\Documents\SubTally`) in a terminal.

---

## 1. Create the free Expo account and link the project (10 min)

1. Sign up at https://expo.dev/signup (free tier is enough).
2. Log in from the terminal and create the EAS project:
   ```bash
   npx eas-cli@latest login
   ```
   ```bash
   npx eas-cli@latest init
   ```
   Accept the default name `subtally`. This writes `extra.eas.projectId` into `app.json`; commit that change.

## 2. Enroll in the Apple Developer Program (USD 99/year; approval 1 to 2 days)

1. Enroll at https://developer.apple.com/programs/enroll/ with your Apple ID (as an individual).
2. When approved, open https://appstoreconnect.apple.com/ → **Apps** → **+** → **New App**:
   - Platforms: iOS. Name: `SubTally`. Primary language: English (U.S.).
   - Bundle ID: register `com.tyjcraw.subtally` when prompted (type "Explicit", description "SubTally"). The code already uses this identifier.
   - SKU: `subtally`. User access: Full access.
3. Note two values for step 8:
   - **Apple ID of the app** (numeric): App Store Connect → your app → **App Information** → "Apple ID".
   - **Team ID**: https://developer.apple.com/account → Membership details.
4. Sign the **Paid Apps agreement** (required for the Pro purchase): App Store Connect → **Business** → Agreements → Paid Apps → accept, then add bank and tax details.

## 3. Create the Google Play Console account (USD 25 one-time; identity verification can take days)

1. Register at https://play.google.com/console/signup as a personal developer account and complete identity verification.
2. Create the app: **Create app** → name `SubTally`, App, Free, accept declarations.
3. Create a **service account** so EAS can upload builds for you. Follow Expo's guide exactly: https://github.com/expo/fyi/blob/main/creating-google-service-account.md. Save the downloaded JSON as:
   ```
   C:\Users\Tyjcr\Documents\SubTally\credentials\google-play-service-account.json
   ```
   (the `credentials/` folder is git-ignored; never commit this file).

## 4. Host the privacy policy and terms (15 min, free)

Both stores require a public privacy policy URL. The pages are already generated in `docs/`.

1. Create a GitHub account if you do not have one: https://github.com/signup
2. Create a new public repository named `subtally` and push this project to it:
   ```bash
   git remote add origin https://github.com/Tjcraw6589/subtally.git
   ```
   ```bash
   git push -u origin main
   ```
3. In the repository: **Settings** → **Pages** → Source "Deploy from a branch" → Branch `main`, folder `/docs` → Save. (Docs: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
4. After a minute your pages are live at:
   - `https://Tjcraw6589.github.io/subtally/privacy.html`
   - `https://Tjcraw6589.github.io/subtally/terms.html`
   You will enter these URLs in step 8.

## 5. Set up AdMob (30 min; ad serving starts after Google approves the app, usually within a day)

1. Sign in at https://apps.admob.com/ and create an AdMob account (needs an AdSense payments profile; follow the prompts).
2. **Apps** → **Add app** → platform **Android** → "No, the app isn't listed on a supported app store" (you can link it after launch) → name `SubTally`. Copy the **App ID** (looks like `ca-app-pub-1234567890123456~1234567890`).
3. In that app → **Ad units** → **Add ad unit** → **Banner** → name `SubTally Android Banner`. Copy the **Ad unit ID** (looks like `ca-app-pub-1234567890123456/1234567890`).
4. Repeat 2 and 3 for platform **iOS** (App ID and a Banner ad unit).
5. Consent for EU/UK users and the iOS tracking prompt are handled by AdMob's built-in messages. Turn them on once: **Privacy & messaging** → **GDPR** → Create message (select the SubTally apps, default settings) → Publish. Then **IDFA** (iOS) → Create message → Publish. Docs: https://support.google.com/admob/answer/10113207 and https://support.google.com/admob/answer/10115027. The app already calls the consent flow at startup, after onboarding.
6. Keep the four IDs for step 8.

## 6. Set up RevenueCat and the Pro product (45 min)

The app expects exactly these identifiers:

| Thing | Value the code expects |
|-------|------------------------|
| Entitlement identifier | `pro` |
| Product identifier (both stores) | `subtally_pro_lifetime` |
| Offering | the **current** offering, containing a **Lifetime** package with the product above |

1. **App Store Connect**: your app → **Monetization** → **In-App Purchases** → **+** → type **Non-Consumable**, reference name `SubTally Pro`, product ID `subtally_pro_lifetime`. Pick a price (about USD 6.99 is in line with the market; nothing in the app assumes a price). Add the English display name "SubTally Pro" and description "Remove ads, unlimited subscriptions, export". Upload any screenshot of the Pro screen for review and add the review note from `STORE_LISTING.md`. Docs: https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/create-in-app-purchases
2. **Google Play Console**: your app → **Monetize** → **Products** → **In-app products** → **Create product** → product ID `subtally_pro_lifetime`, name `SubTally Pro`, description "Remove ads, unlimited subscriptions, export", set a price → Save → **Activate**. (Play requires one build to be uploaded first, see step 9; come back and create the product after that if the page refuses.)
3. **RevenueCat**: sign up at https://app.revenuecat.com/signup → create project `SubTally`.
   - **Apps & providers** → add **App Store** app: bundle ID `com.tyjcraw.subtally`, then follow the on-screen link to add an App Store Connect **In-App Purchase Key** (docs: https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration).
   - Add **Play Store** app: package `com.tyjcraw.subtally`, upload a Play service credentials JSON (docs: https://www.revenuecat.com/docs/service-credentials/creating-play-service-credentials). You may reuse the service account from step 3 if you grant it the permissions that guide lists.
   - **Product catalog** → **Products** → import or add `subtally_pro_lifetime` for both apps.
   - **Entitlements** → **+ New** → identifier `pro` → attach both products.
   - **Offerings** → the default offering → **+ New package** → type **Lifetime** → attach both products. Make sure this offering is marked **Current**.
   - **Project settings** → **API keys** → copy the two **public app-specific keys**: Apple (`appl_…`) and Google (`goog_…`).

## 7. (Optional, recommended) Test the real store flows before release

Build a development client once and test purchases with a sandbox account:
```bash
npx eas-cli@latest build --platform android --profile development
```
Install the APK on an Android phone (the build page gives a QR code), run `npx expo start`, open the app, add 10 subscriptions to see the free limit, tap **See Pro** and buy with a Play **license tester** account (Play Console → Setup → License testing). On iOS the same works with an `ios-simulator`/`development` build and a Sandbox Apple ID (App Store Connect → Users and Access → Sandbox).

## 8. Put your identifiers into the project (5 min)

Run the guided setup; it validates each value and writes `app.json` and `eas.json`:
```bash
npm run setup
```
You will be asked for: the four AdMob IDs (step 5), the two RevenueCat keys (step 6), the support email, the two legal URLs (step 4), your Apple ID email, the app's numeric App Store Connect ID and Team ID (step 2), and the service-account path and Play track (step 3).

Then commit:
```bash
git add app.json eas.json
```
```bash
git commit -m "Configure store identifiers"
```

## 9. Build both apps in the cloud (about 20 to 30 min per platform, nothing to install locally)

```bash
npx eas-cli@latest build --platform all --profile production
```
First-run prompts: let EAS **generate the Android keystore** and **manage iOS credentials** (log in with your Apple ID when asked; EAS creates the distribution certificate and provisioning profile). Builds run on Expo's servers; the terminal and https://expo.dev show progress.

## 10. First upload and submission

**Android — the very first upload must be manual** (Google requires it):
1. Download the `.aab` from the build page.
2. Play Console → **Testing** → **Internal testing** → **Create new release** → upload the `.aab` → fill release notes with the "What's New" text from `STORE_LISTING.md` → Save → Review release → Start rollout to Internal testing.
3. Complete every item under **Dashboard** → "Set up your app": privacy policy URL (step 4), app access (all functionality available without special access), ads (Yes), content rating questionnaire, target audience, news app (No), data safety (answers in `STORE_LISTING.md`), government app (No), financial features (none), store listing (copy from `STORE_LISTING.md`, screenshots from `store/screenshots/android-phone` and `android-tablet-10`, icon `assets/icon.png`, feature graphic `store/feature-graphic.png`).
4. Promote the internal release to **Production** → **Create new release** → **Add from library** → send for review.
5. Later releases can be uploaded by:
   ```bash
   npx eas-cli@latest submit --platform android --latest
   ```

**iOS**:
1. Upload the build:
   ```bash
   npx eas-cli@latest submit --platform ios --latest
   ```
2. App Store Connect → your app → **1.0 Prepare for Submission**: paste name, subtitle, promotional text, keywords, description and What's New from `STORE_LISTING.md`; upload screenshots from `store/screenshots/iphone-6.9` and `ipad-13`; set the support URL and privacy policy URL (step 4); fill **App Privacy** with the table in `STORE_LISTING.md`; select the build; attach the `subtally_pro_lifetime` in-app purchase to the version; set age rating (all "None" → 4+); pricing Free.
3. **Add for Review** → **Submit to App Review**.

## 11. After approval

- AdMob: link the published store listings to the AdMob apps (**Apps** → app → **App settings** → "Add store listing") so ads start serving at full fill.
- Play Console: set the Pro in-app product to **Active** if you deferred it in step 6.
- Reply to early reviews; the in-app rating prompt only appears after a user's fourth session with three or more subscriptions, so expect ratings to trickle in during week two.

## Everyday commands

| Task | Command |
|------|---------|
| Type check, lint and all unit/router tests | `npm run verify` |
| Web preview in a browser | `npm run web` |
| Export the web build and run the end-to-end test | `npm run export:web` then `npm run test:e2e` |
| Regenerate icons and splash from the vector design | `npm run assets` |
| Regenerate legal HTML and in-app copies after editing `legal/*.md` | `npm run legal:html` |
| Regenerate store screenshots | `npm run export:web` then `npm run screenshots` |
| New production build (both stores) | `npx eas-cli@latest build --platform all --profile production` |
| Submit the latest build | `npx eas-cli@latest submit --platform ios --latest` / `--platform android --latest` |

## What stays on your to-do list for the long term

- Renew the Apple Developer Program yearly (Apple emails you).
- Each release: bump `version` in `app.json` (build numbers auto-increment on EAS), run `npm run verify`, build, submit.
