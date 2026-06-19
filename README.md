# weAR – Virtual Fitting Room SaaS Frontend

<p align="left">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 7" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/TanStack_Query-5-FF4154?style=flat-square" alt="TanStack Query 5" />
  <img src="https://img.shields.io/badge/tests-486_passing-22C55E?style=flat-square" alt="tests" />
</p>

> React + TypeScript frontend for a role-based virtual fitting-room platform that serves retailers, customers, and platform admins.

---

## Table of contents

- [Overview](#overview)
- [Current product scope](#current-product-scope)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Application architecture](#application-architecture)
- [Routing map](#routing-map)
- [Authentication and authorization](#authentication-and-authorization)
- [API integration](#api-integration)
- [Backend contract](#backend-contract)
- [AI cost-control and security](#ai-cost-control-and-security)
- [Feature documentation](#feature-documentation)
- [Testing strategy](#testing-strategy)
- [Development conventions](#development-conventions)
- [Project status](#project-status)

---

## Overview

**weAR** is a virtual fitting-room SaaS frontend. It combines a B2B retailer dashboard with a B2C shopping experience and shared platform infrastructure.

The current codebase is a **single Vite-powered SPA** with role-based routing and modular feature folders. It integrates with the production backend by default and can be pointed to any compatible API through an environment variable.

Primary user roles:

| Role | Capabilities |
|------|-------------|
| **Retailer** | Products, inventory, categories, offers, orders, subscriptions, analytics, settings, notifications |
| **Customer** | Shop, profile/avatar/address, virtual try-on, favorites, outfits, compare, cart/checkout, AI wardrobe suggestions |
| **Admin** | Route and placeholder support present; full portal implementation pending |

---

## Current product scope

### Implemented frontend areas

- Role selection entry point.
- Retailer authentication, signup, pricing, payment, password reset, and protected dashboard area.
- Customer authentication, signup, password reset, and protected shopping area.
- Shared persisted auth store with hydration-safe route guards.
- Axios API client with bearer-token injection and role-aware token refresh handling.
- Retailer dashboard, product, inventory, order, offer, category, subscription, payment, notification, help, and settings API/query layers.
- Customer catalog, product details, favorites, profile, addresses, avatar, cart, checkout, outfits, AI suggestions, wardrobe collections, compare, static content, and try-on API/query/UI layers.
- **Virtual try-on** with 3D model viewer (`@google/model-viewer`) and 2D image overlay modes.
- **Photo-based avatar extraction** with staged progress feedback and field-level validation.
- **AI cost-control layer** — duplicate-submission prevention, backend cache-response handling, and friendly error messages for all AI generation error codes.
- Unit/component tests with Vitest and React Testing Library (486 passing).

### Pending or placeholder areas

- Full Admin portal beyond the `/admin` placeholder route.
- Backend-dependent production flows require the configured API to be available.

---

## Tech stack

| Category | Technology |
|----------|-----------|
| Build tool | Vite 7 |
| Core UI | React 19 + React DOM 19 |
| Language | TypeScript 5 |
| Routing | React Router 7 |
| Server state | TanStack Query 5 |
| Client state | Zustand 5 |
| HTTP | Axios 1 |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite` |
| UI foundations | Radix UI, shadcn-compatible components, CVA, `tailwind-merge` |
| Forms/validation | React Hook Form, Zod |
| Icons/charts | Lucide React, Recharts |
| 3D viewer | `@google/model-viewer` |
| Testing | Vitest, jsdom, React Testing Library, jest-dom |
| Quality | ESLint 9, Prettier |

---

## Getting started

### Prerequisites

- Node.js compatible with Vite 7 and the checked-in lockfile.
- npm.

### Installation

```bash
npm install
```

### Run locally

```bash
npm run dev
```

The app starts with Vite. By default, API requests target the production backend configured in `src/lib/axios.ts` unless `VITE_API_BASE_URL` is set.

### Build for production

```bash
npm run build
```

### Preview a production build

```bash
npm run preview
```

---

## Environment variables

Create a local `.env` file when you need to override defaults:

```bash
VITE_API_BASE_URL=https://your-api.example.com
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | `https://vfr-backend.onrender.com` | Base URL used by the shared Axios client. |

> **Security note:** The frontend holds no third-party AI provider keys (`FAL_API_KEY`, `VITE_CLOUDINARY_SECRET`, `VITE_STRIPE_SECRET_KEY`, etc.). All paid AI calls are proxied exclusively through the backend.

---

## Available scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite` | Starts the local development server. |
| `build` | `vite build` | Creates a production build. |
| `lint` | `eslint .` | Runs ESLint over the repository. |
| `preview` | `vite preview` | Serves the built app locally. |
| `test` | `vitest run` | Runs the test suite once. |

---

## Application architecture

The app follows a **single SPA + feature/domain modular architecture**.

```text
src/
  app/
    AppProviders.tsx        # App-level providers (TanStack Query)
    globals.css             # Global Tailwind/CSS setup
    guards/                 # Auth and role guards
    routes/router.tsx       # Central React Router tree
  components/
    layout/                 # Shared app/auth layouts
    ui/                     # Reusable shadcn-style primitives
  features/
    auth/                   # Retailer auth + shared auth store
    common/                 # Shared pages (role selection, coming soon)
    customer/               # Customer storefront, account, cart, try-on, APIs, queries
    retailer/               # Retailer dashboard, management pages, APIs, queries
    admin/                  # Admin placeholders/future pages
  lib/
    axios.ts                # Shared API client and refresh handling
    utils.ts                # Shared utility helpers
  test/
    setup.ts                # Vitest setup
```

### Architectural principles

- Keep each business domain inside `src/features/<domain>`.
- Keep route protection in `src/app/guards`.
- Keep API transport concerns in `src/lib/axios.ts`.
- Use TanStack Query for backend/server state.
- Use Zustand for persisted client/session state and local UX state.
- Keep shared UI primitives in `src/components/ui`.

---

## Routing map

### Public routes

| Route | Page |
|-------|------|
| `/` | Role selection page. |
| `/login` | Redirects to `/`. |
| `/login/retailer` | Retailer login. |
| `/signup/retailer` | Retailer signup step 1. |
| `/signup/retailer/step-2` | Retailer signup step 2. |
| `/signup/retailer/pricing` | Retailer pricing selection. |
| `/signup/retailer/payment` | Retailer payment. |
| `/forgot-password` | Retailer forgot-password flow. |
| `/reset-password` | Retailer reset-password flow. |
| `/login/customer` | Customer login. |
| `/signup/customer` | Customer signup. |
| `/forgot-password/customer` | Customer forgot-password flow. |
| `/reset-password/customer` | Customer reset-password flow. |

### Protected retailer routes

| Route | Page |
|-------|------|
| `/retailer` | Retailer dashboard. |
| `/retailer/products` | Product management/listing. |
| `/retailer/inventory` | Inventory management. |
| `/retailer/orders` | Order management. |
| `/retailer/offers` | Offer management. |
| `/retailer/categories` | Category/subcategory management. |
| `/retailer/pricing` | Subscription/pricing management. |
| `/retailer/help` | Help page. |
| `/retailer/settings` | Retailer account/settings. |

### Protected customer routes

| Route | Page |
|-------|------|
| `/customer/home` | Customer home page. |
| `/customer/shop` | Product catalog/shop. |
| `/customer/products/:productId` | Product details. |
| `/customer/try-on` | Virtual try-on. |
| `/customer/try-on/:productId` | Product-specific virtual try-on. |
| `/customer/try-on/history` | Try-on session history. |
| `/customer/favorites` | Favorite products. |
| `/customer/account` | Account profile. |
| `/customer/account/addresses` | Address book. |
| `/customer/avatar` | Avatar overview. |
| `/customer/avatar/manual` | Manual avatar measurements. |
| `/customer/avatar/photo` | Photo-based avatar extraction. |
| `/customer/cart` | Cart. |
| `/customer/checkout` | Checkout. |
| `/customer/outfits` | Saved outfits. |
| `/customer/ai-suggestions` | AI wardrobe suggestions. |
| `/customer/wardrobe/collections` | Wardrobe collections. |
| `/customer/compare` | Product comparison. |
| `/customer/about` | Static about page. |
| `/customer/shipping-returns` | Shipping and returns page. |
| `/customer/blog` | Blog/static content page. |

### Admin route

| Route | Page |
|-------|------|
| `/admin` | Coming Soon placeholder. |

Unknown routes redirect to `/`.

---

## Authentication and authorization

Authentication state is stored with Zustand persistence under the `wear-auth` storage key.

Stored session data includes `user`, `role`, `isAuthenticated`, `accessToken`, and `refreshToken`.

Route protection is split into two guards:

- `RequireAuth` — waits for persisted-store hydration; redirects unauthenticated users to `/`.
- `RequireRole` — validates the active role; redirects users to the correct home/login path when the role does not match.

| Role | Home path |
|------|-----------|
| `retailer` | `/retailer` |
| `customer` | `/customer/home` |
| `admin` | `/admin` |

---

## API integration

All backend calls use the shared `apiClient` from `src/lib/axios.ts`.

### Shared API client behavior

- Uses `VITE_API_BASE_URL` when provided; falls back to `https://vfr-backend.onrender.com`.
- Sends JSON by default.
- Adds `Authorization: Bearer <token>` for non-auth endpoints.
- Removes manual `Content-Type` for `FormData` so the browser sets the multipart boundary.
- Handles `401` responses by attempting a token refresh.
- Uses role-aware refresh endpoints (`/api/customer/auth/refresh` for customers, `/api/auth/refresh-token` for retailers).
- Queues failed requests while a refresh is in progress.

### Retailer API modules

| Module | Responsibility |
|--------|---------------|
| `auth.api.ts` | Login, Google login, registration, logout, forgot/reset password. |
| `dashboard.api.ts` | KPIs, charts, reports, export. |
| `products.api.ts` | Product CRUD. |
| `inventory.api.ts` | Inventory list, adjustment, threshold, export. |
| `categories.api.ts` | Categories and subcategories CRUD/status. |
| `offers.api.ts` | Offers CRUD/status. |
| `orders.api.ts` | Orders and status updates/export. |
| `settings.api.ts` | Profile, password, avatar, logo, notifications, account deletion. |
| `subscription.api.ts` | Plans, trial, select/upgrade/downgrade/cancel. |
| `payment.api.ts` | Payment methods. |
| `notification.api.ts` | Notifications. |

### Customer API modules

| Module | Responsibility |
|--------|---------------|
| `customerAuth.api.ts` | Registration, profile completion, login, logout, forgot/reset password. |
| `catalog.api.ts` | Product catalog, details, similar products, compare. |
| `favorites.api.ts` | Favorite list/toggle/check. |
| `profileAvatar.api.ts` | Profile, addresses, avatar extraction/repair, measurements. |
| `tryOn.api.ts` | Try-on session creation, list/details, product sessions. |
| `outfits.api.ts` | Outfit list/create/delete. |
| `suggestions.api.ts` | AI wardrobe suggestions. |
| `wardrobeCollections.api.ts` | Wardrobe collections and items. |
| `recommendations.api.ts` | Size and complementary product recommendations. |

---

## Backend contract

The frontend is aligned with the following backend DTOs.

### AvatarDto (guaranteed fields)

```ts
{
  id: string
  heightCm: number
  // body measurements (weightKg, chestCm, waistCm, hipsCm, …)
  avatar3dModelUrl: string | null
  sourceImageUrl: string | null
  has2DCapability: boolean
  has3DCapability: boolean
  lastMeasuredAt: string | null
}
```

> Optional fields (`avatarFrontImageUrl`, `avatar2dImageUrl`, `generationSource`, `isCached`) may be returned by the backend but are **never required** by the UI.

### TryOnResultDto (guaranteed fields)

```ts
{
  status: string
  resultImageUrl: string | null   // canonical result — GLB URL for 3D, image URL for 2D
  resultType: "Model3D" | "Image2D" | string
  recommendedSize: string | null
  confidenceScore: number | null
  durationSeconds: number | null
}
```

> `resultModelUrl`, `isCached`, and `generationSource` are optional. The frontend uses them defensively when present but never requires them.

### Avatar capability rules

```
canUse2DTryOn  =  has2DCapability === true  OR  sourceImageUrl is non-empty
canUse3DTryOn  =  has3DCapability === true  AND  avatar3dModelUrl passes URL safety check
```

### 3D result rendering

```
modelUrl = resultModelUrl (if present and safe)  OR  resultImageUrl (fallback)
```

---

## AI cost-control and security

### Security architecture

```
Frontend  →  Backend  →  fal.ai
```

No third-party AI keys (`FAL_API_KEY`, `VITE_CLOUDINARY_SECRET`, `VITE_STRIPE_SECRET_KEY`, etc.) exist in the frontend. The only allowed public config is `VITE_API_BASE_URL`.

### Duplicate submission prevention

| Surface | Guard |
|---------|-------|
| Avatar photo extraction | `inFlight` ref + `isPending` button disable — blocks re-entry on rapid clicks. |
| Virtual try-on | Same pattern — `Try Product` button disabled while processing. |

### AI generation error codes

| Code | User-facing message |
|------|-------------------|
| `AI_GENERATION_IN_PROGRESS` | The same generation is already in progress. Please wait a moment and try again shortly. |
| `AI_GENERATION_QUOTA_EXCEEDED` | Daily AI generation limit reached. Previously generated results may still be available. |
| `AI_GENERATION_PREVIOUSLY_FAILED` | Previous AI generation for the same input failed recently. Please try again later or change the input. |

### Cache response handling

When the backend explicitly returns `isCached: true` or `generationSource: "Cache"`, a non-blocking status notice is shown to the user. Cache is **never** inferred from `durationSeconds` or `confidenceScore`.

### Error traceId

When the backend returns a `traceId` on error, it is displayed as `Reference: <traceId>` for support purposes. Stack traces are never exposed in the UI.

---

## Feature documentation

### Retailer area

Retailer pages live under `src/features/retailer`, mounted at `/retailer`.

Current capabilities: dashboard KPIs/charts, product management, inventory, categories, offers, orders, subscription lifecycle, payment methods, profile/settings, and notifications.

### Customer area

Customer pages live under `src/features/customer`, mounted at `/customer`.

Current capabilities:

- Auth, onboarding, and password recovery.
- Shop, product details, and filtering.
- Favorites, compare, and product components.
- Account profile and address book.
- Avatar flows: manual measurements, photo-based extraction (with staged progress), and source-image repair.
- **Virtual try-on** with 3D model viewer and 2D image overlay, mode auto-correction, and in-flight state management.
- Cart and checkout.
- Outfits, AI wardrobe suggestions, and wardrobe collections.
- Static pages (about, shipping/returns, blog).

### Shared UI and styling

- Global styles: `src/app/globals.css`.
- Shared layouts: `src/components/layout`.
- UI primitives: `src/components/ui`.
- Customer theme tokens: `src/features/customer/styles/customerTheme.ts`.

---

## Testing strategy

The repository uses **Vitest** with jsdom and React Testing Library.

```
51 test files · 486 tests · all passing
```

Coverage includes:

- Axios/token-refresh helpers and auth store persistence.
- Customer API adapters (avatar, catalog, favorites, outfits, suggestions, wardrobe collections, try-on).
- Customer pages (home, shop, product details, favorites, avatar flows, try-on 3D/2D, cart, checkout, AI suggestions, outfits, compare, password flows, static pages).
- **AI cost-control layer** (duplicate guard, cache notice, error codes, traceId, Overlay2D gating, `resultImageUrl` fallback, `canUse2DTryOn` with `sourceImageUrl`).
- Retailer API/query adapters and subscription plan-change utilities.
- Route constants and customer route param helpers.

```bash
# Run all tests
npm test

# Lint
npm run lint

# Production build
npm run build
```

---

## Development conventions

- Add new route entries in `src/app/routes/router.tsx`.
- Add reusable path constants for customer routes in `src/features/customer/routes/customerRoutes.ts`.
- Keep backend calls in feature-level `api/*.ts` modules.
- Keep TanStack Query wrappers in feature-level `queries/*.ts` modules.
- Keep TypeScript types close to their domain in `types/*.ts`.
- Use the shared `apiClient`; do not create ad hoc Axios instances.
- When sending `FormData`, let `apiClient` remove the JSON content type automatically.
- Prefer feature-local tests next to the code being tested.
- **Never add third-party AI provider keys to the frontend** — all paid AI calls must go through the backend.

---

## Project status

| Area | Status |
|------|--------|
| Retailer dashboard | ✅ Implemented |
| Customer storefront | ✅ Implemented |
| Virtual try-on (3D + 2D) | ✅ Implemented |
| Photo avatar extraction | ✅ Implemented |
| AI cost-control & security | ✅ Implemented |
| Backend contract alignment | ✅ Aligned with `TryOnResultDto` + `AvatarDto` |
| Admin portal | 🔲 Placeholder only |
