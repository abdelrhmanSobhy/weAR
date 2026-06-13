# Customer Frontend Shared Context

## Purpose
This file is the minimum context every coding agent must read before changing the customer frontend.

## Repository and branch
- Repository: `abdelrhmanSobhy/weAR`
- Planning branch: `customer-implementation-plan`
- Implementation work should be performed on a dedicated customer feature branch created from the latest approved branch.

## Locked architecture
- React 19 + TypeScript strict
- React Router v7
- TanStack Query for server state
- Zustand for client-only state
- Tailwind CSS v4
- Existing Shadcn/Radix primitives
- React Hook Form + Zod
- Axios through the existing `apiClient`
- Vitest + React Testing Library

Do not introduce an alternative router, HTTP client, global state library, CSS framework, component system, or duplicated auth store.

## Sources of truth
When sources conflict, apply this order:
1. Functional behavior and request/response contracts: Swagger and integration guides.
2. Visual structure, spacing, content hierarchy and interaction intent: Figma PDF and Try-on reference images.
3. Code organization, naming and reusable primitives: current repository.

## Customer identity
- Customer authentication is the only source of `customerId`, access token and customer profile.
- Never hard-code a customer ID.
- Never request a customer ID from a form or URL query when it already exists in auth state.
- Customer-scoped API calls must use the authenticated user's ID.

## Current repository facts
- Customer auth pages and API adapter exist.
- Customer authenticated routing currently resolves to a `ComingSoonPage`.
- `StorePage.tsx` is only a placeholder.
- There is no complete storefront layout, catalog, product, avatar, favorites or try-on feature yet.
- The current customer API auth adapter contains compatibility fallbacks; do not remove them without testing the actual backend envelope.

## Scope policy
### Must-have
- Customer storefront shell and responsive navigation
- Home
- Shop/catalog with filters, search, sort and pagination
- Product details, similar products and complementary products
- Favorites
- Customer profile and addresses
- Avatar creation/editing through measurements or one full-body image
- Try-on phase 1: complete flow, 2D result and graceful fallback
- Loading, empty and error states
- Route guards and integration tests for critical flows

### Nice-to-have
- Product comparison
- Local cart and checkout presentation
- Order-history presentation where no customer order API is available
- Saved outfits
- Try-on phase 2: lazy GLB viewer and local model caching
- Static About, Shipping/Returns and Blog pages

## Backend gaps policy
When a Figma page has no supporting customer endpoint:
- Implement the visual page using typed local state or fixtures.
- Mark the feature clearly in code as `frontend-only`.
- Do not invent an API route.
- Keep adapters replaceable so a future endpoint can be connected without rewriting UI components.

## Definition of done for each task
- Reuses existing primitives before creating new ones.
- Contains typed API models and query keys where relevant.
- Handles loading, empty, error and unauthenticated states.
- Works on mobile and desktop.
- Has no hard-coded user identity.
- Adds focused tests for logic and critical interaction.
- `npm run build`, `npm run lint` and relevant tests pass.
- Agent reports changed files, tests executed, unresolved backend/design conflicts and follow-up work.