# Impression

Impression is a Next.js communication-coaching app for practicing interviews,
presentations, pitches, and everyday conversations. The repository root is the
Next.js project root; application code is maintained in TypeScript under
`app/`, `components/`, `config/`, `contexts/`, `hooks/`, `i18n/`, and `utils/`.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

In development and staging, sign in with the demo account:

- Email: `demo@impression.local`
- Password: `ImpressionDemo2026!`

No Google or Firebase login is needed for the demo account. Demo sessions and
progress are stored locally in the browser.

## Environment modes

Set `NEXT_PUBLIC_APP_ENV` to `development`, `staging`, or `production`.
Development is the default for `next dev`; production is the default for a
production build when the variable is omitted.

| Mode | Sign-in | Payments and other configured mocks |
| --- | --- | --- |
| `development` | Demo credentials | Enabled |
| `staging` | Demo credentials | Enabled |
| `production` | Firebase Google sign-in | Disabled |

Production payments require a configured backend (`NEXT_PUBLIC_API_ENDPOINT`)
and the relevant public gateway keys. Payment orders and signature verification
are delegated to the backend; the browser never creates a production order or
uses a payment secret. Firebase client configuration is supplied with
`NEXT_PUBLIC_FIREBASE_*` variables. Do not put private keys or server secrets in
`NEXT_PUBLIC_*` variables.

## Commands

```bash
npm run dev
npm run build
npm start
npm run lint
npm test
npm run test:coverage
```

Unit coverage is enforced at 70% for core analysis, progress, language, question,
scenario, and environment logic. UI presentation and external-service adapters
are outside that unit-coverage denominator.
