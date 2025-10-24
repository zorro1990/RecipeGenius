# Project Context

## Purpose
RecipeGenius is a bilingual (中文/English) health-aware cooking assistant. It helps users list available ingredients, captures dietary preferences and medical conditions, filters unsafe items, and generates tailored recipes plus guidance using AI models. The goal is to deliver safe, personalized meal suggestions that respect allergies and chronic-illness constraints common in Chinese households.

## Tech Stack
- Next.js 15 (App Router) on TypeScript + React 19
- Tailwind CSS 4 + Shadcn/UI component primitives
- Lucide React icon set and Radix UI underpinnings
- AI integrations via `@google/generative-ai` plus vendor SDKs (DeepSeek, Doubao, Qwen, GLM)
- Cloudflare Workers deployment using OpenNext and Wrangler tooling
- Playwright (planned) for end-to-end testing

## Project Conventions

### Code Style
- Strict TypeScript (`strict: true`) with `@/` alias imports; prefer typed utility modules in `lib/`.
- Functional React components, client/server components split by `"use client"` directive; avoid default exports except for Next.js pages.
- Tailwind utility-first styling; keep class lists grouped by layout → spacing → typography to ease scanning.
- ESLint via `eslint.config.mjs` + `next lint`; run `npm run lint` or `npm run build:check` before committing.
- Store user-facing copy in Chinese with optional English inline; keep emoji used in existing UI for consistency.

### Architecture Patterns
- Next.js App Router with colocated route handlers under `app/api/*`.
- UI composed from Shadcn UI primitives in `components/ui` and feature-level components under `components/forms`, `components/modals`, etc.
- Domain logic (ingredient filtering, AI orchestration, storage helpers) lives in `lib/`.
- Client state managed with React hooks and localStorage for API key persistence (`lib/api-key-storage`).
- Server-side AI orchestration encapsulated in `lib/ai-service` with retry helpers; API handlers stay thin.

### Testing Strategy
- Type safety, ESLint, and `npm run build` act as the minimum regression gate.
- `npm run build:check` combines type-check, lint, and Cloudflare build to catch deployment regressions.
- Playwright test suite is planned but not yet populated; prioritize adding scenario coverage when specs introduce new user flows.
- Manual verification remains required for AI-provider switching and health-rule filtering.

### Git Workflow
- Follow OpenSpec’s spec-first workflow: secure proposal approval before coding significant behavior changes.
- Use feature branches named `feature/<short-description>` (or `chore/`, `fix/` as appropriate) off `main`; rebase over merge when possible.
- Commits should be descriptive English clauses (no enforced convention) and reference change IDs when implementing OpenSpec tasks.
- Open PRs once `npm run build:check` passes locally; request review with spec links for context.

## Domain Context
- Focus on chronic-condition dietary safety (gout, diabetes, hypertension, gastritis). Ingredient filters must respect `COMMON_HEALTH_CONDITIONS` rules and enforce the temporary seafood ban for gout users.
- Local storage maintains lightly obfuscated API keys; never persist keys server-side.
- UX expects Chinese-first messaging with supportive emojis; AI prompts should preserve that tone.
- Ingredient recognition leverages AI image upload plus manual entry; both feeds the same filtering pipeline.

## Important Constraints
- Must operate without guaranteed access to Google services—domestic AI vendors (Doubao, DeepSeek) need to work offline-friendly.
- Protect user health: if filtering removes every ingredient, surface explanation instead of generating risky recipes.
- Timeout-sensitive AI calls (2-minute cap) require graceful aborts and user messaging.
- Deployment targets Cloudflare Workers; ensure code stays edge-compatible (no Node-only APIs).
- Remain within browser storage limits when caching recipes and keys; clear corrupted key blobs defensively.

## External Dependencies
- AI providers: Doubao (Volcengine), DeepSeek, Qwen (Aliyun DashScope), GLM (Zhipu), Google Gemini.
- Cloudflare platform via Wrangler + OpenNext build pipeline.
- Browser localStorage for API key persistence and current recipe caching.
- Lucide icon CDN (bundled via npm) and Radix UI primitives.
