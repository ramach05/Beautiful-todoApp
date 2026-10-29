# 0006. i18n on react-i18next, user language on the better-auth user record

🇬🇧 **English** | [🇷🇺 Русский](0006-i18n-react-i18next.ru.md)

Date: 2026-10-27. Status: accepted.

## Context

A second UI language (Russian) appeared. Strings were hardcoded in English in roughly 20
files, including aria attributes and validation messages; per-user locale settings in the
database did not exist. Required properties: the language switches in the UI, is stored on the
user profile and arrives before the first render; translation keys must not drift apart silently.

## Decision

- **Library — i18next + react-i18next.** The industry standard by recognizability;
  interpolation and CLDR plurals come out of the box — todo counters in Russian require
  one/few/many forms, which a hand-rolled wrapper would reproduce by hand. The dictionaries
  (`shared/i18n/locales/en.json`, `ru.json`) are bundled statically: the language switch is
  synchronous, no backend loader and no text flicker. Keys are typed through
  `CustomTypeOptions` over the shape of `en.json`: a typo in `t()` is a compile error; ru-vs-en
  parity is checked by a dictionary test.
- **Storage — `user.additionalFields.locale` in better-auth** (the `user.locale` column, a zod
  validator on write, default `en`). The field arrives in `getSession` — the language is known
  from the session request the app already awaits at startup, no extra procedures or settings
  tables appeared. An explicit choice is written with the standard `updateUser`.
- **State — the Effector store `$locale` in `features/locale`** (ADR-0002: language is client
  state); i18next remains the translation mechanism. The binding to the session and the
  profile lives in the composition root (`app/locale-sync.ts`): the `locale` and `auth`
  features do not import each other (the repo's FSD rule).
- **Resolution chain:** session (DB) → localStorage → browser locale → `en`. Before sign-in the
  guest drives the language (localStorage/browser), after sign-in the profile is the truth;
  registration sends the current language into the new profile. Value localization goes through
  `Intl` (the day labels on `/stats`); auth error and zod validation texts are dictionary keys,
  not strings: the `@bt/shared` schema messages stay a contract without UI texts.

## Consequences

- A new user's language is `en` until they switch it: the database value is always defined, the
  profile deterministically wins over the browser.
- Tests and e2e were not rewritten for dictionaries: the `en` default keeps the previous
  selector texts; switching is covered by the `features/locale` and `app/locale-sync` unit tests.
- Cost: a dictionary layer for two languages and mandatory key-parity upkeep; it is documented
  by the parity test and `t()` typing, but new text now means editing two files.
- The tab title (route `head`) is translated on navigation rather than instantly on switch — a
  reactive title would require subscribing to language changes outside the router.
