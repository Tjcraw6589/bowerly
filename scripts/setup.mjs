#!/usr/bin/env node
// Interactive setup: writes your AdMob, RevenueCat, Apple and Google identifiers into app.json and eas.json.
// Run: npm run setup   (re-run any time; press Enter to keep a current value)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appPath = join(root, 'app.json');
const easPath = join(root, 'eas.json');
const app = JSON.parse(readFileSync(appPath, 'utf8'));
const eas = JSON.parse(readFileSync(easPath, 'utf8'));

const rl = createInterface({ input: process.stdin, output: process.stdout });

async function ask(label, current, validate) {
  for (;;) {
    const shown = current ? ` [${current}]` : '';
    const answer = (await rl.question(`${label}${shown}: `)).trim();
    const value = answer || current || '';
    if (!value) return '';
    const problem = validate ? validate(value) : null;
    if (!problem) return value;
    console.log(`  ✗ ${problem}`);
  }
}

const admobApp = (v) => (/^ca-app-pub-\d{16}~\d{10}$/.test(v) ? null : 'AdMob App IDs look like ca-app-pub-1234567890123456~1234567890 (note the ~).');
const admobUnit = (v) => (/^ca-app-pub-\d{16}\/\d{10}$/.test(v) ? null : 'AdMob ad unit IDs look like ca-app-pub-1234567890123456/1234567890 (note the /).');
const rcApple = (v) => (/^(appl_|test_)/.test(v) ? null : 'RevenueCat public Apple keys start with appl_ (or test_ for the Test Store).');
const rcGoogle = (v) => (/^(goog_|test_)/.test(v) ? null : 'RevenueCat public Google keys start with goog_ (or test_ for the Test Store).');
const url = (v) => (/^https:\/\/\S+$/.test(v) ? null : 'Enter a full https:// URL.');
const email = (v) => (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? null : 'Enter an email address.');
const digits = (v) => (/^\d+$/.test(v) ? null : 'Digits only.');
const teamId = (v) => (/^[A-Z0-9]{10}$/.test(v) ? null : 'Apple Team IDs are 10 characters, letters and digits.');

const adsPlugin = app.expo.plugins.find((p) => Array.isArray(p) && p[0] === 'react-native-google-mobile-ads');
const monetization = (app.expo.extra.monetization ??= {});
const support = (app.expo.extra.support ??= {});

console.log('\nBillnest setup. Press Enter to keep the value in brackets.\n');

console.log('— AdMob (apps.admob.com → Apps → App settings → App ID; Ad units → Banner) —');
adsPlugin[1].androidAppId = await ask('AdMob Android App ID', adsPlugin[1].androidAppId, admobApp);
adsPlugin[1].iosAppId = await ask('AdMob iOS App ID', adsPlugin[1].iosAppId, admobApp);
monetization.admobBannerAndroid = await ask('AdMob Android banner ad unit ID', monetization.admobBannerAndroid, admobUnit);
monetization.admobBannerIos = await ask('AdMob iOS banner ad unit ID', monetization.admobBannerIos, admobUnit);

console.log('\n— RevenueCat (app.revenuecat.com → Project settings → API keys → App specific keys) —');
monetization.revenueCatIos = await ask('RevenueCat public Apple API key', monetization.revenueCatIos, rcApple);
monetization.revenueCatAndroid = await ask('RevenueCat public Google API key', monetization.revenueCatAndroid, rcGoogle);

console.log('\n— Support and legal —');
support.email = await ask('Support email shown in the app', support.email, email);
support.privacyUrl = await ask('Privacy policy URL (hosted copy of docs/privacy.html)', support.privacyUrl, url);
support.termsUrl = await ask('Terms of use URL (hosted copy of docs/terms.html)', support.termsUrl, url);

console.log('\n— Apple (App Store Connect → App Information; developer.apple.com → Membership) —');
const ios = (eas.submit.production.ios ??= {});
ios.appleId = await ask('Apple ID email used for the developer account', ios.appleId.startsWith('REPLACE') ? '' : ios.appleId, email);
ios.ascAppId = await ask('App Store Connect App ID (numeric Apple ID of the app)', ios.ascAppId.startsWith('REPLACE') ? '' : ios.ascAppId, digits);
ios.appleTeamId = await ask('Apple Team ID', ios.appleTeamId.startsWith('REPLACE') ? '' : ios.appleTeamId, teamId);
if (ios.ascAppId) app.expo.ios.appStoreUrl = `https://apps.apple.com/app/id${ios.ascAppId}`;

console.log('\n— Google Play —');
const android = (eas.submit.production.android ??= {});
android.serviceAccountKeyPath = await ask('Path to the Google Play service-account JSON', android.serviceAccountKeyPath);
android.track = await ask('Play track for submissions (internal, alpha, beta, production)', android.track, (v) =>
  ['internal', 'alpha', 'beta', 'production'].includes(v) ? null : 'Use internal, alpha, beta or production.',
);

rl.close();

writeFileSync(appPath, `${JSON.stringify(app, null, 2)}\n`);
writeFileSync(easPath, `${JSON.stringify(eas, null, 2)}\n`);

const missing = [];
if (!monetization.admobBannerAndroid || !monetization.admobBannerIos) missing.push('AdMob banner unit IDs (ads will be hidden in production builds)');
if (!monetization.revenueCatIos || !monetization.revenueCatAndroid) missing.push('RevenueCat keys (Pro will show as unavailable)');
if (adsPlugin[1].androidAppId.startsWith('ca-app-pub-3940256099942544')) missing.push('AdMob App IDs are still Google\'s sample IDs');
if (!ios.ascAppId) missing.push('App Store Connect App ID (needed for eas submit --platform ios)');

console.log('\nSaved app.json and eas.json.');
if (missing.length) {
  console.log('Still missing:');
  for (const m of missing) console.log(`  • ${m}`);
} else {
  console.log('Everything is filled in. Next: npx eas-cli@latest build --platform all --profile production');
}
