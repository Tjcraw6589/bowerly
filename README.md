# SubTally

Private, offline subscription tracker for iOS and Android. Built with Expo SDK 58, React Native, TypeScript (strict) and Expo Router; ships through EAS Build.

- `RESEARCH.md` — why this niche.
- `PLAN.md` — features, stack, verified checklist and what could not be verified on this machine.
- `STORE_LISTING.md` — ready-to-paste store copy, privacy answers, screenshot plan.
- `START_HERE.md` — the beginner walkthrough: accounts, codes, three commands.
- `HANDOFF.md` — the same steps in more detail.

## Develop

```bash
npm install
npm run verify        # tsc + eslint + jest
npm run web           # web preview (ads and purchases show their unavailable states on web)
npm run export:web && npm run test:e2e   # Playwright smoke test against the exported web build
```

Native modules (ads, purchases, notifications) need a development build, not Expo Go:

```bash
npx eas-cli@latest build --platform android --profile development
```

## Layout

```
src/app         Expo Router screens (file-based routes)
src/components  UI building blocks (theme-aware, cross-platform)
src/lib         Pure business logic (dates, money, insights, CSV, reminders, validation) — fully unit tested
src/services    Platform integrations: ads, purchases, notifications, review, export/import (.native/.web pairs)
src/store       Zustand store persisted to AsyncStorage
src/theme       Colour tokens, typography, light/dark
__tests__       Jest unit tests and router smoke tests
e2e             Playwright end-to-end smoke test
scripts         Asset, legal, screenshot and setup generators
legal / docs    Privacy policy and terms (Markdown source → hostable HTML + in-app copy)
```
