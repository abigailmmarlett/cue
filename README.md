# Cue: Coach Confidently

Cue is an iPhone app for fitness coaches who teach on the move. You build a class as a sequence of
timed exercises, grouped into sections, then run it with a timer that shows what's now and what's
next, and buzzes at each transition so you can keep your eyes on the room.

- **Builder:** sections of exercises with durations, drag-to-reorder, tags, load icons (modified /
  base / amplified), left/right sides and timed variation cues.
- **Exercise library:** reusable exercises whose tags, loads and sides carry into every sequence that
  uses them.
- **Timer:** three progress rings (exercise, section, whole class), haptic cues for transitions,
  countdowns, and load, side or variation changes, and a screen that stays awake.
- **Sharing:** a sequence can be copied as a `cue://import?data=…` link and imported on another phone.
- **Settings:** 14 color themes, light/dark mode, text and button sizes, and haptic patterns.

Everything is stored on the device in SQLite. Nothing is sent anywhere.

## Stack

[Expo](https://expo.dev) SDK 58 (React Native 0.88, React 19.3) with Expo Router, the React Compiler,
Reanimated 4, Gesture Handler 3, expo-sqlite and TypeScript. Cue is iOS-only for now.

## Getting started

You need macOS with Xcode and an iOS Simulator, and Node 24 (see `.nvmrc`; the tests use Node's
built-in SQLite).

```bash
npm ci
npx expo run:ios   # builds the development app and opens it in the Simulator
```

`expo run:ios` builds the native app, which you only need to redo when native dependencies or
`app.json` change. Otherwise `npm start` starts the bundler for the app you already have installed.
To try it on an iPhone, use `npx expo run:ios --device`; add `--configuration Release` to test
behavior that differs in development, such as keeping the screen awake.

The `ios/` folder is generated from `app.json` and isn't checked in.

## Scripts

| Command             | What it does                                          |
| ------------------- | ----------------------------------------------------- |
| `npm start`         | Starts the Metro bundler for the development app      |
| `npm run ios`       | Builds and runs the app in the Simulator              |
| `npm test`          | Runs the unit and database tests (`lib/**/*.test.ts`) |
| `npm run typecheck` | Type checks with `tsc`                                |
| `npm run lint`      | Lints the whole project; any warning fails            |
| `npm run format`    | Formats with Prettier (`format:check` only checks)    |

CI (`.github/workflows/checks.yml`) runs the type check, lint, formatting check and tests, then
bundles the app for iOS, on every pull request and every push to `master`.

## Project layout

```
app/                 Screens, one file per route (Expo Router)
components/          Shared UI; ui/ holds the basics (Text, TextInput, Sheet, IconButton…)
  preferences/       The sections of the Settings screen
  timer/             The timer's rings, controls and finish animation
constants/           Spacing, type sizes, the color themes and the support/privacy links
docs/                The support and privacy pages, published with GitHub Pages
lib/
  contexts/          Theme and onboarding-tour state
  db/                SQLite access, one module per table, plus the schema and migrations
  hooks/             The timer, haptics, preferences and sequence loading
  utils/             Time formatting, share links, contrast checks and other pure helpers
test/                Test helpers, stubs for native modules, and frozen old schemas
```

## Working on the database

- All access goes through `getDb()` and `transaction()` in `lib/db/client.ts`. Nested transactions
  join the outer one.
- Schema changes are numbered migrations in `lib/db/schema.ts`, tracked with `PRAGMA user_version`.
  Never edit a migration that has shipped; add a new one.
- The tests run against an in-memory database per file. `test/fixtures/schemas.ts` holds copies of
  old schemas so the migrations are tested from each one; never edit those either.

## Releasing

Builds and App Store submissions go through [EAS](https://docs.expo.dev/eas/) (`eas.json`):

```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

EAS keeps the build number and bumps it on every production build. The version people see comes from
`version` in `app.json`, and Settings shows it too.
