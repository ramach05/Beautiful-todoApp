# 0004. Auth on better-auth, data isolated per owner

🇬🇧 **English** | [🇷🇺 Русский](0004-auth-better-auth.ru.md)

Date: 2026-10-22. Status: accepted.

## Context

Basic email+password auth is needed, with a session that survives a reload. Options: a
self-made JWT module, a hosted service, or better-auth on top of one's own database.

## Decision

better-auth (drizzle-adapter, PostgreSQL): the `user/session/account/verification` tables live
in the same Drizzle schema, migrations are versioned together with the app. The session is an
httpOnly cookie; Fastify mounts `/api/auth/*` without its own content parsers, proxying the
`Request` into `auth.handler()`.

The key boundary is `SessionResolver` (an interface): the better-auth session in production, a
fixed demo user in the mock. Every contract procedure is authorized: the middleware throws a
typed `UNAUTHORIZED`, and the todo repository takes `userId` as an explicit argument —
owner-scoped filtering is enforced at the query level, not by agreement.

## Consequences

- Passwords never leave the server, XSS cannot read the session; the CSRF surface is limited by
  SameSite cookies.
- Api tests go over real HTTP (signUp + cookie-inject) without mocking auth.
- Cost: extra tables and a process in the database; switching the auth provider means
  rewriting `SessionResolver` and the tables (not free, but localized).

## Threat model

Boundary of the model: a demo application, one api instance behind an HTTPS proxy, no payment
or third-party personal data.

| Threat                                                           | Countermeasure                                                                                                                                                                                                                                                                                                                                                                 | Residual risk                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Password brute force on `/api/auth/*`                            | `@fastify/rate-limit` on the auth scope: the limit covers POST only (GET `get-session` does not spend the bucket), `AUTH_RATE_LIMIT_MAX` requests per minute per IP (default 20 — safe for tests and e2e, production lowers it via env), Fastify answers 429 before entering better-auth. In production better-auth's built-in limiter adds 3 requests/10 s on sign-in/sign-up | The counter is in-memory in a single instance: a second instance needs a shared store (Redis). Slow and IP-distributed enumeration is not blocked, there is no account lockout or captcha; better-auth's built-in limiter takes the IP from headers, so it is not treated as the primary layer |
| Limit bypass via a forged `X-Forwarded-For`                      | `TRUST_PROXY` — a list of proxy addresses/CIDRs: `request.ip` is taken from XFF only if the immediate peer is in the list (fail-closed, empty by default); `trustProxy: true` is not used — it would make Fastify trust the leftmost XFF entry, which the client itself writes                                                                                                 | Until `TRUST_PROXY` is set, behind a reverse proxy all clients share one `request.ip` and one bucket per instance — production must list the edge-proxy address                                                                                                                                |
| Session theft (XSS, cookie reading, MITM)                        | The session is an httpOnly cookie, `sameSite=lax` in dev; in production `sameSite=none` + `secure` because web and api live on different sites (vercel.app ↔ railway.app) — otherwise the browser drops the cookie. Production is HTTPS only                                                                                                                                   | `none` removes the cookie-level CSRF defense — see the row below; XSS can still read todos through the API; there is no session revocation or short TTL                                                                                                                                        |
| CSRF — a request from a foreign site carrying the user's cookie  | Protection is not SameSite but origin checking: better-auth compares the `Origin` of mutations against `trustedOrigins` (the same `CORS_ORIGIN`, a comma-separated list), CORS uses `credentials: true` with an origin list, never `*`                                                                                                                                         | Origin checking is the only line: an origin list that is too wide opens mutations to a foreign site; there is no CSRF token                                                                                                                                                                    |
| Probing "does this email exist"                                  | sign-in returns `INVALID_EMAIL_OR_PASSWORD` on any wrong field, web shows a single "Invalid email or password" text — the code mapping lives in one place (`features/auth/model/session.ts`), internal server messages never surface                                                                                                                                           | sign-up still reports that the email is taken (`USER_ALREADY_EXISTS_...`) — a deliberate choice for clear registration UX                                                                                                                                                                      |
| Session token forgery (foreign/leaked secret)                    | `BETTER_AUTH_SECRET` (min 32) is mandatory in production — a `refine` in the env schema refuses to boot without it; `DEV_AUTH_SECRET` is dev/test only                                                                                                                                                                                                                         | There is no secret rotation: changing it invalidates every active session                                                                                                                                                                                                                      |
| Weak passwords                                                   | `minPasswordLength: 4` — an explicit demo trade-off (the seed user's password is `1234`). The upgrade path: set `emailAndPassword.minPasswordLength` (moved to env — `AUTH_MIN_PASSWORD_LENGTH=8`) and add a complexity check                                                                                                                                                  | Until it is raised, a short password is brute-forced faster; only the rate limit mitigates this indirectly                                                                                                                                                                                     |
| Classic transport and embedding attacks (sniffing, clickjacking) | `@fastify/helmet`: nosniff, frameguard `SAMEORIGIN`, referrer-policy — defaults; HSTS is enabled in production only, browsers ignore it over http in dev                                                                                                                                                                                                                       | CSP is off on purpose (JSON api and the bundled Scalar UI): the api serves no HTML, but if HTML routes ever appear CSP should be enabled at least for them                                                                                                                                     |
