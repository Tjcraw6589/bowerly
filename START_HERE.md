# START HERE — getting Bowerly into the app stores, for someone who has never done this

You do not need to understand the code. The app is finished and tested. What is left is paperwork: creating accounts in your name, pasting a few ID codes into a setup script, and running three commands. Budget about half a day of clicking spread over a week of waiting for approvals.

Every command below is typed into a terminal opened in the project folder. To open one: press the Windows key, type `cmd`, press Enter, then type:

```
cd C:\Users\Tyjcr\Documents\SubTally
```

Costs: Apple charges USD 99 per year. Google charges USD 25 once. Everything else is free.

Keep a notes file open. Several steps give you an ID code you will paste in later. Write each one down as you get it.

---

## Step 1 — Expo account (free, 10 minutes)

Expo is the service that builds the app files for Apple and Google so you never need a Mac or Android Studio.

1. Go to https://expo.dev/signup and create an account with your email.
2. In your terminal run:
   ```
   npx eas-cli@latest login
   ```
   Enter the email and password you just made.
3. Then run:
   ```
   npx eas-cli@latest init
   ```
   When it asks to create a project called `subtally`, answer Yes.

**Done when:** the terminal prints a project ID and `app.json` now contains `"eas": { "projectId": ... }`.

## Step 2 — Apple Developer account (USD 99/year, approval takes 1 to 2 days)

1. Go to https://developer.apple.com/programs/enroll/ and sign in with your Apple ID (the one you use on an iPhone). Choose **Individual**, pay, and wait for the approval email.
2. Once approved, go to https://appstoreconnect.apple.com/ and sign in.
3. Click **Apps**, then the **+** button, then **New App**. Fill in:
   - Platforms: **iOS**
   - Name: **Bowerly**
   - Primary language: **English (U.S.)**
   - Bundle ID: click the dropdown. If `com.tyjcraw.subtally` is not there, choose "Register a new bundle ID", pick **Explicit**, type `com.tyjcraw.subtally`, description `Bowerly`, and come back.
   - SKU: **subtally**
   - User Access: **Full Access**
4. Write down two codes:
   - In App Store Connect, open your app, click **App Information** on the left, and copy the number next to **Apple ID** (it looks like `6751234567`). This is your **App Store Connect App ID**.
   - Go to https://developer.apple.com/account and under **Membership details** copy your **Team ID** (10 letters and numbers).
5. Still in App Store Connect, click your name (top right) → **Business**. Under **Agreements**, accept the **Paid Apps** agreement and fill in the bank and tax forms. Without this the Pro purchase cannot be sold.

**Done when:** your app appears in App Store Connect and you have the App ID and Team ID written down.

## Step 3 — Google Play Console account (USD 25 once, identity check can take a few days)

Two Google rules for new personal accounts that you should know before paying (both are Google policy, not something the app can change):

- **You must verify a real Android phone once.** Google requires new personal accounts to install the "Google Play Console" app on a physical, non-rooted Android phone running Android 10 or newer, sign in with the same Google account, and tap verify. It takes under a minute and only has to happen once. Any phone works: borrow a friend's or family member's for a minute (sign out of the Play Console app afterwards), or buy a cheap used Android phone, which is also the best way to test the Android build before release. Details: https://support.google.com/googleplay/android-developer/answer/14316361
- **You must run a closed test before the public release.** Personal accounts created after November 2023 have to have at least 12 testers opted in to a closed test for 14 continuous days before Google unlocks the Production track. Friends and family count; they just need a Gmail address and to install the test build. Plan on the Android launch landing about three weeks after the iOS one for this reason.

If neither is possible for you right now, publish on the App Store first (Steps 2, 8 and 10 do not depend on Google at all) and come back to Android later.

1. Go to https://play.google.com/console/signup, sign in with a Google account, choose **Yourself** (personal), pay, and complete the identity verification it asks for. When it asks about an Android device, do the phone verification described above.
2. When verified, click **Create app**. Name `Bowerly`, choose **App**, choose **Free**, tick the declarations, click **Create app**.
3. Google needs a "service account" so the build service can upload for you. Follow this guide exactly, it has screenshots: https://github.com/expo/fyi/blob/main/creating-google-service-account.md
4. At the end you download a `.json` file. Create a folder called `credentials` inside the project folder and save the file there with exactly this name:
   ```
   C:\Users\Tyjcr\Documents\SubTally\credentials\google-play-service-account.json
   ```
   This file is a secret. It is already ignored by git so it will never be uploaded anywhere.

**Done when:** Bowerly shows in your Play Console and the JSON file is in the `credentials` folder.

## Step 4 — Put the privacy policy online (free, 15 minutes)

Both stores demand a public web address for a privacy policy. The pages are already written; you just need to host them. GitHub does this for free.

1. Create a GitHub account at https://github.com/signup if you do not have one.
2. On GitHub click **+** (top right) → **New repository**. Name it `subtally`, leave it **Public**, do not tick any of the "initialize" boxes, click **Create repository**.
3. In your terminal, replace `Tjcraw6589` with your actual GitHub username and run these two commands:
   ```
   git remote add origin https://github.com/Tjcraw6589/subtally.git
   ```
   ```
   git push -u origin main
   ```
   (If it asks you to sign in, a browser window opens; approve it.)
4. On the repository page on GitHub: **Settings** (tab at the top) → **Pages** (left menu). Under **Build and deployment**, set Source to **Deploy from a branch**, Branch to **main**, folder to **/docs**, click **Save**.
5. Wait two minutes, then open these in your browser to check (again replacing the username):
   - `https://Tjcraw6589.github.io/subtally/privacy.html`
   - `https://Tjcraw6589.github.io/subtally/terms.html`

**Done when:** both pages open in your browser. Write both addresses down.

## Step 5 — AdMob, the ads in the free version (free, 30 minutes)

1. Go to https://apps.admob.com/ and sign in with a Google account. Follow the sign-up prompts (it will ask for a payments profile, that is where ad money gets paid).
2. Left menu **Apps** → **Add app**. Platform **Android**. When asked "Is the app listed on a supported app store?" choose **No**. App name `Bowerly`. Click **Add**.
3. On the next screen copy the **App ID**. It looks like `ca-app-pub-1234567890123456~1234567890` (note the squiggle `~`). Write it down as **AdMob Android App ID**.
4. Click **Ad units** → **Add ad unit** → **Banner**. Name it `Android Banner`, click **Create ad unit**, and copy the **Ad unit ID**. It looks like `ca-app-pub-1234567890123456/1234567890` (note the slash `/`). Write it down as **AdMob Android banner ID**.
5. Repeat steps 2 to 4 choosing platform **iOS**. Write down the **AdMob iOS App ID** and **AdMob iOS banner ID**.
6. Left menu **Privacy & messaging**. Click **GDPR** → **Create message** → select both Bowerly apps → keep the defaults → **Publish**. Then click **IDFA** → **Create message** → select the iOS app → **Publish**. This makes the app legally ask European users for consent and iOS users for tracking permission; the app already knows how to show these.

**Done when:** you have four AdMob codes written down (two with `~`, two with `/`).

## Step 6 — RevenueCat and the Pro purchase (free, 45 minutes)

The app sells one thing: a one-time "Bowerly Pro" unlock. It must be created in both stores with this exact product ID: `subtally_pro_lifetime`. RevenueCat is the free service that checks who has bought it.

**6a. Create the product at Apple**
1. App Store Connect → your app → left menu **Monetization** → **In-App Purchases** → **+**.
2. Type: **Non-Consumable**. Reference Name: `Bowerly Pro`. Product ID: `subtally_pro_lifetime`. Click **Create**.
3. Price: USD 4.99 (already set; Apple fills in other countries). Under **App Store Localization** add English: Display Name `Bowerly Pro`, Description `Remove ads, unlimited bills, export`.
4. Under **Review Information** upload any screenshot from `store\screenshots\iphone-6.9\07-pro.png` and paste this note: "One-time unlock. Open Settings, tap See Pro, tap Unlock Pro with a sandbox account. After purchase the banner disappears and Insights shows the category and timeline charts." Click **Save**.

**6b. Create the product at Google**
Google only lets you do this after a first build is uploaded (Step 9). Come back then: Play Console → your app → **Monetize** → **Products** → **In-app products** → **Create product**. Product ID `subtally_pro_lifetime`, name `Bowerly Pro`, description `Remove ads, unlimited bills, export`, set a price, **Save**, then **Activate**.

**6c. RevenueCat**
1. Sign up at https://app.revenuecat.com/signup and create a project named `Bowerly`.
2. **Apps & providers** → **+ New** → **App Store**. Bundle ID `com.tyjcraw.subtally`. It asks for an "In-App Purchase Key" from Apple; follow the link it shows you (or https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration) and upload it.
3. **Apps & providers** → **+ New** → **Play Store**. Package `com.tyjcraw.subtally`. It asks for Play service credentials; follow https://www.revenuecat.com/docs/service-credentials/creating-play-service-credentials (you can reuse the service account from Step 3 if you give it the permissions that page lists).
4. **Product catalog** → **Products** → **+ New**. Add `subtally_pro_lifetime` for the App Store app, and again for the Play Store app.
5. **Entitlements** → **+ New**. Identifier exactly `pro`. Open it and **attach** both products.
6. **Offerings** → open the default offering → **+ New package** → type **Lifetime** → attach both products → Save. Make sure the offering is marked **Current**.
7. **Project settings** → **API keys**. Under **App specific keys** copy the **public** key for the Apple app (starts with `appl_`) and for the Google app (starts with `goog_`). Write both down.

**Done when:** you have the two RevenueCat keys written down and the Apple product exists.

## Step 7 — Paste all your codes into the project (5 minutes)

Run:
```
npm run setup
```
It asks one question at a time and checks that each answer looks right. Paste from your notes:
- the four AdMob codes (Step 5)
- the two RevenueCat keys (Step 6)
- your support email
- the two privacy and terms addresses (Step 4)
- your Apple ID email, the App Store Connect App ID and Team ID (Step 2)
- for the Google service account path just press Enter to accept the default; for the track type `internal`

Then save the result to git:
```
git add app.json eas.json
```
```
git commit -m "Add store identifiers"
```
```
git push
```

**Done when:** the script prints "Everything is filled in."

## Step 8 — Build the apps (about 30 minutes of waiting, nothing to install)

```
npx eas-cli@latest build --platform all --profile production
```
The first time it asks a few questions. Answer:
- Generate a new Android Keystore? **Yes**.
- Log in to your Apple account? **Yes**, then enter your Apple ID and password (and the two-factor code sent to your iPhone).
- Let EAS manage your iOS credentials? **Yes**.

Building happens on Expo's computers. The terminal shows a link; you can watch progress at https://expo.dev. When both builds say **Finished**, you get an `.aab` file (Android) and an `.ipa` file (iOS) on that page.

**Done when:** both builds show Finished on expo.dev.

## Step 9 — Upload to Google Play (30 minutes)

Google requires the very first upload to be done by hand in the browser.

1. On the expo.dev build page, download the Android `.aab` file.
2. Play Console → your app → left menu **Testing** → **Internal testing** → **Create new release**. Upload the `.aab`. In Release notes paste: "First release. Track bills and subscriptions, mark bills paid, see what's overdue, and get reminders before due dates and trial ends. Private, offline, no account." Click **Next**, then **Save and publish**.
3. Now do Step 6b (create the Pro product) because Google allows it now.
4. Back on the **Dashboard**, work through every item under **Set up your app**. Each one opens a form. The answers are all written out in `STORE_LISTING.md` in this folder (sections "Google Play", "Store settings" and "Data safety form"). For images: icon is `assets\icon.png`, feature graphic is `store\feature-graphic.png`, phone screenshots are the files in `store\screenshots\android-phone`, tablet screenshots are in `store\screenshots\android-tablet-10`. Privacy policy is your address from Step 4.
5. When the dashboard shows everything complete: left menu **Production** → **Create new release** → **Add from library** → pick the build you uploaded → **Next** → **Save and publish** → **Send for review**.

Future updates can be uploaded with one command instead:
```
npx eas-cli@latest submit --platform android --latest
```

**Done when:** Play Console says the release is "In review".

## Step 10 — Upload to the App Store (30 minutes)

1. Run:
   ```
   npx eas-cli@latest submit --platform ios --latest
   ```
   It uploads the iOS build to Apple. Wait for the email from Apple saying processing is complete (about 15 minutes).
2. App Store Connect → your app → on the left click the version **1.0 Prepare for Submission**.
3. Fill the form using `STORE_LISTING.md`, section "Apple App Store": Name, Subtitle, Promotional Text, Keywords, Description, What's New. Screenshots: drag the files from `store\screenshots\iphone-6.9` into the iPhone 6.9" slot and from `store\screenshots\ipad-13` into the iPad 13" slot. Support URL: your terms address. Privacy Policy URL: your privacy address.
4. Under **Build**, click **+** and select the build you uploaded.
5. Under **In-App Purchases and Subscriptions**, click **+** and tick `subtally_pro_lifetime` so it is reviewed together with the app.
6. Left menu **App Privacy** → **Get started** → answer **Yes, we collect data**, then tick exactly the items in the table in `STORE_LISTING.md` under "App Privacy (nutrition labels)". **Publish**.
7. Left menu **App Information** → Age Rating → answer **None** to everything → result 4+. Left menu **Pricing and Availability** → **Free**.
8. Back on the version page, click **Add for Review**, then **Submit to App Review**.

**Done when:** the version shows "Waiting for Review".

## Step 11 — After approval (a few days later)

- AdMob → **Apps** → each app → **App settings** → **Add store listing** and link the now-public store pages. Ads earn properly only after this.
- Reply to early reviews from inside App Store Connect and Play Console.

---

## If something goes wrong

- A command says "not logged in": run `npx eas-cli@latest login` again.
- A build fails: open the link the terminal printed; the log says what is wrong. Nine times out of ten it is a mistyped ID. Run `npm run setup` again to correct it, then rebuild.
- Apple or Google reject the app: they email the reason. Fix what they name, run Step 8 again, then Step 9 or 10 with the new build.
- Anything else: `HANDOFF.md` has more detail on every step, and `STORE_LISTING.md` has every form answer.

## Checklist you can tick off

- [x] Expo account and `eas init` (done 2026-10-23, project c58526df…)
- [x] Apple Developer paid and app created, App ID and Team ID noted, Paid Apps agreement signed (done; agreement pending with Apple)
- [ ] Google Play paid and app created, service-account JSON saved in `credentials\`
- [x] Privacy and terms pages live on GitHub Pages (https://tjcraw6589.github.io/subtally/)
- [x] AdMob: payment profile complete, ID verified; EU consent message "Bowerly EU consent" published 2026-10-27 (with a Do not consent button; the app's Settings shows "Ad privacy choices" where the law requires it); no IDFA explainer needed because the app shows Apple's tracking prompt itself; iOS app renamed Bowerly (App ID `ca-app-pub-6745854970750685~1639195277`) with banner unit "Bowerly iOS banner" (`ca-app-pub-6745854970750685/6551012115`). Account and app approval finish after the app is live: then AdMob → Apps → Bowerly → App settings → Add store (step below).
- [x] Apple in-app purchase `subtally_pro_lifetime` created (Bowerly Pro, 4.99 USD, Ready for Review)
- [x] RevenueCat: both apps, product, entitlement `pro`, offering, 2 keys noted (iOS app, product, entitlement and offering done; Android later)
- [x] `npm run setup` says everything is filled in; committed and pushed (iOS values written directly, including the real iOS AdMob IDs from build 7 on)
- [x] `eas build --platform all --profile production` finished (iOS builds 3 and 4 finished; Android waits for a Play account)
- [ ] Android: first `.aab` uploaded by hand, Pro product created, listing complete, sent for review
- [x] iOS: `eas submit`, listing complete, IAP attached, App Privacy published, submitted (uploaded; listing, privacy, age rating, pricing done; screenshots and final Submit remain)
