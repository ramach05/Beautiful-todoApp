# Security Policy

This is a solo portfolio project running on demo infrastructure with demo data.
It is hardened to the level its threat model needs (see the auth threat table in
[ADR-0004](docs/adr/0004-auth-better-auth.md)), not to payment-service standards.

## Reporting a vulnerability

Please report security issues privately via a
[GitHub security advisory](https://github.com/ramach05/Beautiful-todoApp/security/advisories/new).
Do not open a public issue. I aim to respond within a week; the project is
maintained on a best-effort basis, so fixes are prioritized by real impact.

## What is already covered

- session cookie is `httpOnly` + `SameSite`, better-auth manages tokens;
- rate limit on every auth POST (default 20/min per IP, `AUTH_RATE_LIMIT_MAX`);
- `X-Forwarded-For` is trusted only from the `TRUST_PROXY` CIDR list;
- helmet security headers, HSTS in production;
- every rpc procedure requires a session, data is owner-scoped in the repository layer;
- a generated email is never revealed by login errors (better-auth).

## Known demo-level trade-offs (by design, not vulnerabilities)

- `minPasswordLength: 4` — chosen for frictionless demos; a real deployment raises it.
- The rate-limit counter lives in one process's memory: correct for a single api
  instance, wrong behind multiple replicas (Redis would be the fix).
- CSP is disabled so the bundled Scalar UI at `/docs` can run its inline scripts;
  the api itself only serves JSON.
- No 2FA, no device fingerprinting, no audit log.
