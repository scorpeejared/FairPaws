# Fair Paws

An offline-first bill splitter for iOS and Android. Add the people at the table, enter what was ordered (or just the total), add tax / service / discount / tip, and see exactly who owes what. Every split reconciles to the centavo.

Built with Expo SDK 58, React Native, TypeScript, Expo Router, Zustand, Expo SQLite and Zod. No backend, no account, no network.

## Run it

Requires **Node 22.13+** (React Native 0.88 and Expo SDK 58 require it; Node 20 prints warnings; use 22 for the dev server and builds).

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (SDK 58) or press `a` / `i` for an emulator / simulator.

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # expo lint
npm run format         # Prettier
npm run brand          # re-render icons and splash from the cat art
npx expo-doctor        # dependency / config check
npm run web            # browser dev server
npm run build:web      # production web app into dist/ (see "Share it as a web app")
npm run serve:web      # serve dist/ locally with the production headers (http://localhost:8090)
```

## Build an installable app

Builds run on Expo's servers through [EAS Build](https://docs.expo.dev/build/introduction/); you don't need Android Studio or Xcode.

```bash
npm install -g eas-cli
eas login
eas build:configure   # first time only; links the project to your Expo account
```

**Android APK** (installs directly on a device):

```bash
eas build --platform android --profile preview
```

When it finishes, EAS prints a download link to the `.apk`. Open it on the phone (allow "install unknown apps") or `adb install` it.

**Android AAB** for the Play Store: `eas build --platform android --profile production`.

**iOS IPA**:

```bash
eas build --platform ios --profile preview
```

- A real-device `.ipa` needs a paid Apple Developer account. EAS walks you through creating the certificates and registering the device (ad-hoc distribution).
- No Apple account? Build for the simulator instead: `eas build --platform ios --profile preview-simulator` produces a `.tar.gz` containing a `.app` you can drag onto a simulator (macOS only).
- For TestFlight / App Store: `eas build --platform ios --profile production` then `eas submit --platform ios`.

Bundle identifiers are `com.fairpaws.app` (see [app.json](app.json)); change them before publishing. Build profiles live in [eas.json](eas.json).

## Share it as a web app (free, works on iPhones)

An iPhone app outside the App Store needs a paid Apple account, but a web app doesn't: friends open a link in Safari and tap **Share → Add to Home Screen**. It then launches full-screen with its own icon, and works offline.

```bash
npm run build:web     # writes the site to dist/
npm run serve:web     # optional: try it locally at http://localhost:8090
```

**Host `dist/` somewhere free with HTTPS.** The easiest is [Netlify Drop](https://app.netlify.com/drop): drag the `dist` folder onto the page and you get a link. Cloudflare Pages (`npx wrangler pages deploy dist`) also works. Both read [public/_headers](public/_headers) and [public/_redirects](public/_redirects), which carry two requirements any other host must also meet:

- the headers `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` (SQLite runs as WebAssembly and needs them), and
- an `index.html` fallback for every unknown path (it's a single-page app).

How it behaves in the browser:

- **Offline.** [public/sw.js](public/sw.js) caches the app on the first visit. After a new deploy the next online visit picks it up. If you change unhashed files (icons, manifest), bump `CACHE` in that file.
- **Data stays on each phone,** in the browser's private file storage, per site address. It doesn't sync, and moving to a different web address starts empty. Clearing Safari's website data or deleting the Home Screen app erases the bills.
- **Private tabs can't store data,** so the app shows a message instead of starting there.
- **Differences from the native app:** no haptics, and Share uses the system share sheet on iPhone but copies to the clipboard on browsers without Web Share.
- **Updating the icon** (`npm run brand`) also rewrites the web icons in `public/`.
- **No `node_modules` folder in the build, on purpose.** Expo publishes package assets (the SQLite wasm, the fonts) under `assets/node_modules/`, and Netlify's drag-and-drop skips any folder with that name, so the deployed site had no database engine and showed "The cat can't find your data". [asset-plugin.js](scripts/asset-plugin.js) (wired in [metro.config.js](metro.config.js)) publishes them under `assets/vendor/` instead, and `npm run build:web` ends with [check-web-build.mjs](scripts/check-web-build.mjs), which fails the build if a `node_modules` folder, the wasm, the fonts or the hosting files are missing.

Verified in Chrome (full flow: build a bill, split, reload, offline, delete) and rendered in a WebKit build. File storage could not be verified on real iPhone Safari from here, so open the link on an iPhone and check that a bill is still there after closing and reopening the app before you send it around.

## How the split works

All money is stored as **integer minor units** (centavos). There is no floating point anywhere in the pipeline.

Order of operations (see [src/domain/calculate.ts](src/domain/calculate.ts)):

1. **Items** are split between the people sharing them by *portions* (1 each by default; 2 and 1 of 3 beers is supported).
2. **Discount**: percent or fixed, taken off the subtotal (never more than the subtotal).
3. **Service charge**: on subtotal − discount.
4. **Tax**: on subtotal − discount + service charge.
5. **Tip**: on subtotal − discount.
6. **Rounding**: optional, per person (nearest or up, to 1 / 5 / 10 / 50 whole units). The difference appears as its own "Rounding" line.

Each charge is distributed with the **largest-remainder method** ([allocate.ts](src/domain/allocate.ts)), weighted by what each person ordered, so the parts always sum exactly to the charge. Leftover centavos rotate between people instead of always landing on the first name.
Items nobody picked are split evenly and flagged, rather than silently dropped.

**Assumptions to check against real receipts.** Prices are treated as tax-exclusive: tax is added on top of the subtotal. Many Philippine menus show VAT-inclusive prices, and Senior Citizen / PWD discounts are VAT-exempt, so those two cases are not modelled yet. The order above (and tip on the pre-tax amount) is a convention chosen for this app, not a rule taken from any regulation.

## Project layout

```
src/
  app/            Expo Router screens: history (index), bill/[id], settings
  domain/         Pure TypeScript: money, allocation, calculation, validation (Zod), share text
  db/             SQLite schema + migrations, bill repository, expo-sqlite bootstrap
  store/          Zustand: editor (draft bill + debounced autosave), history, settings
  features/bill/  The four bill steps: People, Bill, Extras, Split
  components/     UI primitives (Button, Sheet, Segmented, AmountInput, ...) and CurrencySheet
  theme/          Colour tokens, light/dark ThemeProvider
  lib/            Haptics wrapper, date formatting
```

Decisions worth knowing:

- **Domain is UI-free.** `calculateBill(bill)` is a pure function; screens call it in `useMemo`. Nothing in `domain/` imports React or Expo.
- **Autosave.** Edits are saved 400 ms after the last change and again when leaving the screen. Untouched blank bills are never written; bills emptied out again are removed.
- **SQLite schema** is normalised (`bills`, `participants`, `items`, `item_shares`, `settings`) with versioned migrations in [migrations.ts](src/db/migrations.ts) tracked through `PRAGMA user_version`. Rows are validated with Zod on load; a corrupted bill shows an error instead of crashing.
- **Currency switching** rescales stored amounts when the decimal places differ (₱10.00 → ¥10), so nothing silently becomes 100× larger.
- **Icons** are inline SVG (`react-native-svg`) so they look identical on both platforms.

## Notes

- **Web.** The same code runs in the browser; see "Share it as a web app" above. [metro.config.js](metro.config.js) adds the `.wasm` type and the cross-origin-isolation headers expo-sqlite needs in the browser (production gets them from [public/_headers](public/_headers)); native builds are unaffected. React Native's `Alert.alert` does nothing on web, so every confirmation and error goes through [dialogs.ts](src/lib/dialogs.ts), which falls back to the browser's own dialogs.
- **Branding.** The logo is a waving lucky cat drawn once, in [luckyCatArt.ts](src/components/cat/luckyCatArt.ts), with colours from [palette.ts](src/components/cat/palette.ts). The app draws it from that source ([LuckyCat.tsx](src/components/ui/LuckyCat.tsx)), and `npm run brand` ([scripts/build-brand.ts](scripts/build-brand.ts)) renders the icon, Android adaptive layers (including the single-colour themed-icon layer), favicon, splash and the SVGs in [assets/brand/](assets/brand) from the same source, on a soft pink background. Edit the art or palette, run the script, and everything follows. Icon and splash changes need a new build; they don't show up in Expo Go.
- **Loading screen.** The native splash shows the cat as a still image (`expo-splash-screen` plugin in [app.json](app.json); its `imageWidth` matches the cat's size in [States.tsx](src/components/ui/States.tsx)), then the animated cat takes over. The boot progress bar counts three real steps (fonts, database opened and migrated, settings loaded) and glides to each as it finishes; the caption follows the step. The cat is held on screen for at least `MIN_SPLASH_MS` (0.9 s, in [_layout.tsx](src/app/_layout.tsx)) so the wave is seen even when startup is instant. Other loading screens run the same bar as an endless loop.
- **Cat theme.** Warm cream and cat-ink-brown palette with pink accents, set in rounded Nunito (`@expo-google-fonts/nunito`, loaded in [_layout.tsx](src/app/_layout.tsx)); tokens are in [tokens.ts](src/theme/tokens.ts). Other cat art lives in [src/components/cat/](src/components/cat): `CatFace` (empty/error states, bill rows), `CatPeek` (over the results card), `CatRunner` + `CatProgress` (the loading bar), `PawTrail`. Participants are cat-ear avatars in their colour ([Avatar.tsx](src/components/ui/Avatar.tsx)) and selected shares get paw prints. Motion respects the OS "reduce motion" setting.
- **Haptics** do nothing on web and on devices without a haptic engine; they can be switched off in Settings.
- **Autosave on background.** Besides the 400 ms debounce, the open bill is saved when the app leaves the foreground.
- **Licence.** There isn't one yet: the file inherited from the Expo template named Expo's company as copyright holder, so it was removed. Add your own before publishing the source.
- **Known issues.** `npm audit` reports moderate-severity advisories in transitive dependencies of Expo's tooling; they aren't auto-fixed because Expo pins those versions, and they will move with Expo SDK upgrades. The app has been run on iOS (Expo Go) and in a browser preview, not yet on an Android device.
