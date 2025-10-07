# Aurora Mega Learning

A consolidated, aurora glass-themed Next.js (App Router) platform for modular learning content, experimentation labs, and multi-model chat—governed by feature flags.

## Features
- Glassmorphism + animated aurora background
- Feature Flags: `GROK_CODE_FAST_PREVIEW`, `GPT5_ENABLED`
- Domains: Learn (/learn), Lab (/lab), Chat (/chat)
- API: `/api/feature-flags`, `/api/models`, proxy `/api/proxy?path=/models`
- Model registry with conditional availability
- Theming with dark/light toggle (localStorage + prefers-color-scheme)
- Extensible UI component library (AuroraBackground, GlassCard, GradientText, NavBar)
- MDX support (`/learn/intro.mdx`)
- Chat composer scaffold (`/api/chat` echo)

## Getting Started
Install deps and run dev server.

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## Environment Flags
Copy `.env.example` to `.env.local` and modify values.

```bash
cp .env.example .env.local
```

## Adding Legacy JSX (e.g., `aurora_science_tab_react_demo.jsx`)
1. Create a module slug folder under `src/app/learn/your-slug` if not present.
2. Convert the legacy file:
   - Ensure it is a React Server or Client Component depending on interactivity.
   - Move static textual content into strings / MDX (future) and interactive widgets into dedicated components under `src/components`.
3. Import those components inside that module's `page.tsx`.
4. Incrementally refactor repeated UI pieces into shared glass components.
5. Optional: Use `LegacyModuleTemplate` at `/learn/legacy-template` for structured migration.

## Extending Models
Update `src/lib/models.ts` to add new model specs. Use `flagsRequired` to gate behind feature flags.

## Backend Integration
Backend proxy helper: `src/lib/backend.ts` wraps fetch.

1. Set `BACKEND_API_BASE` and `BACKEND_API_KEY` in `.env.local`.
2. Use `backendRequest({ path: '/your-endpoint', method: 'POST', body: JSON.stringify(payload) })` inside server components / route handlers.
3. Feature flags automatically forwarded via `x-feature-flags` header for contextual backend behavior.

Graceful failure returns empty arrays for optional model lists (see `listBackendModels`). Extend with retries, caching, auth, and tracing as needed.

## Adding a New Feature Flag
1. Add key to `FeatureFlag` union & `FeatureFlagsState` in `src/lib/types.ts`.
2. Update `.env.example` & environment config.
3. Use `getServerFeatureFlags()` where needed.
4. Optionally expose via `/api/feature-flags`.

## Testing
```bash
npm run test
```

## Theming
Global CSS variables live in `src/styles/global.css` + effects in `src/styles/aurora.css`.

## Roadmap (Suggestions)
- Enhance MDX: custom components, remark/rehype plugins
- Persistent chat transcripts
- Code execution sandboxes in Lab
- Streaming + function calling
- Progress tracking / user auth

## License
Original scaffolding generated for your project. Replace / augment freely.
