# weAR – Virtual Fitting Room SaaS Frontend

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
- [Feature documentation](#feature-documentation)
- [Testing strategy](#testing-strategy)
- [Development conventions](#development-conventions)
- [Project status](#project-status)

---

## Overview

**weAR** is a virtual fitting-room SaaS frontend. It combines a B2B retailer dashboard with a B2C shopping experience and shared platform infrastructure.

The current codebase is a **single Vite-powered SPA** with role-based routing and modular feature folders. It integrates with the production backend by default and can be pointed to any compatible API through an environment variable.

Primary user roles:

- **Retailer**: manages products, inventory, categories, offers, orders, subscriptions, analytics, settings, and notifications.
- **Customer**: shops products, manages profile/avatar/address data, uses virtual try-on, favorites products, builds outfits, compares products, manages cart/checkout flow, and requests AI wardrobe suggestions.
- **Admin**: route and placeholder support are present; full admin portal implementation is still pending.

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
- 3D try-on viewer integration through `@google/model-viewer`.
- Unit/component tests with Vitest and React Testing Library.

### Pending or placeholder areas

- Full Admin portal beyond the `/admin` placeholder route.
- Backend-dependent production flows require the configured API to be available and to return the expected response envelopes.

---

## Tech stack

| Category | Technology |
| --- | --- |
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
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | No | `https://vfr-backend.onrender.com` | Base URL used by the shared Axios client. |

---

## Available scripts

| Script | Command | Purpose |
| --- | --- | --- |
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
    AppProviders.tsx        # App-level providers, currently TanStack Query
    globals.css             # Global Tailwind/CSS setup
    guards/                 # Auth and role guards
    routes/router.tsx       # Central React Router tree
  components/
    layout/                 # Shared app/auth layouts
    ui/                     # Reusable shadcn-style primitives
  features/
    auth/                   # Retailer auth + shared auth store
    common/                 # Shared pages such as role selection and coming soon
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
| --- | --- |
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

All retailer routes require an authenticated user with the `retailer` role.

| Route | Page |
| --- | --- |
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

All customer routes require an authenticated user with the `customer` role.

| Route | Page |
| --- | --- |
| `/customer` | Redirects to `/customer/home`. |
| `/customer/dashboard` | Redirects to `/customer/home`. |
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
| `/customer/avatar/photo` | Photo-based avatar flow. |
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
| --- | --- |
| `/admin` | Currently renders the shared Coming Soon page inside the protected app area. |

Unknown routes redirect to `/`.

---

## Authentication and authorization

Authentication state is stored with Zustand persistence under the `wear-auth` storage key.

Stored session data includes:

- `user`
- `role`
- `isAuthenticated`
- `accessToken`
- `refreshToken`

Route protection is split into two guards:

- `RequireAuth` waits for persisted-store hydration and redirects unauthenticated users to `/`.
- `RequireRole` validates the active role and redirects users to the correct home/login path when the role does not match the requested route.

Supported roles in the auth store are:

- `retailer`
- `customer`
- `admin`

Role home paths:

| Role | Home path |
| --- | --- |
| `retailer` | `/retailer` |
| `customer` | `/customer/home` |
| `admin` | `/admin` |

---

## API integration

All backend calls should use the shared `apiClient` from `src/lib/axios.ts`.

### Shared API client behavior

- Uses `VITE_API_BASE_URL` when provided.
- Falls back to `https://vfr-backend.onrender.com`.
- Sends JSON by default.
- Adds `Authorization: Bearer <token>` for non-auth endpoints.
- Removes manual `Content-Type` for `FormData` so the browser can set the multipart boundary.
- Handles `401` responses by attempting a refresh-token request.
- Uses a role-aware refresh endpoint:
  - Customer: `/api/customer/auth/refresh`
  - Retailer/default: `/api/auth/refresh-token`
- Queues failed requests while a token refresh is already in progress.

### Retailer API modules

| Module | Main responsibility |
| --- | --- |
| `auth.api.ts` | Retailer login, Google login, registration, logout, forgot/reset password. |
| `dashboard.api.ts` | KPIs, charts, reports, export. |
| `products.api.ts` | Product CRUD. |
| `inventory.api.ts` | Inventory list, adjustment, threshold, export. |
| `categories.api.ts` | Categories and subcategories CRUD/status. |
| `offers.api.ts` | Offers CRUD/status. |
| `orders.api.ts` | Orders and status updates/export. |
| `settings.api.ts` | Profile, password, avatar, logo, notifications, account deletion. |
| `subscription.api.ts` | Plans, trial, select/upgrade/downgrade/cancel, recurring, SaaS enquiry. |
| `payment.api.ts` | Retailer payment methods. |
| `notification.api.ts` | Retailer notifications. |

### Customer API modules

| Module | Main responsibility |
| --- | --- |
| `customerAuth.api.ts` | Customer registration, profile completion, login, logout, forgot/reset password. |
| `catalog.api.ts` | Product catalog, product details, similar products, compare, category/offer data. |
| `favorites.api.ts` | Favorite list/toggle/check. |
| `profileAvatar.api.ts` | Profile, password/account actions, addresses, avatar, measurements, size recommendation support. |
| `tryOn.api.ts` | Try-on session creation, session list/details, product sessions. |
| `outfits.api.ts` | Outfit list/create/delete. |
| `suggestions.api.ts` | AI wardrobe suggestions and product resolution. |
| `wardrobeCollections.api.ts` | Wardrobe collections and collection items. |
| `recommendations.api.ts` | Size and complementary product recommendations. |

---

## Feature documentation

### Retailer area

Retailer pages live under `src/features/retailer` and are mounted under `/retailer`.

Current capabilities include:

- Dashboard KPIs/charts and reporting API hooks.
- Product list and product management API integration.
- Inventory records, stock adjustment, threshold updates, and CSV export.
- Category and subcategory management.
- Offer management and status toggling.
- Order status management and export.
- Subscription plan selection and subscription lifecycle actions.
- Payment method management.
- Profile/settings, avatar/logo uploads, notification preferences, and account deletion.
- Notification dropdown/data integration.

### Customer area

Customer pages live under `src/features/customer` and are mounted under `/customer`.

Current capabilities include:

- Customer auth, onboarding/profile completion, and password recovery flows.
- Home/shop/product-details shopping experience.
- Query-parameter support for shop filters.
- Product cards, rails, grid, skeletons, error states, and price display components.
- Favorites management.
- Account profile and address-book management.
- Avatar flows for manual measurements and photo-based extraction/repair.
- Size recommendations and profile/avatar utilities.
- Virtual try-on session creation/history with 3D model URL normalization and a model-viewer wrapper.
- Cart and checkout state/pages.
- Outfit creation/list/delete flows.
- AI wardrobe suggestions with cost-control test coverage.
- Wardrobe collections.
- Product comparison.
- Static about, shipping/returns, and blog pages.

### Shared UI and styling

- Global styles are in `src/app/globals.css`.
- Shared layouts are in `src/components/layout`.
- UI primitives are in `src/components/ui`.
- Customer-specific theme tokens/helpers are in `src/features/customer/styles/customerTheme.ts`.

---

## Testing strategy

The repository uses Vitest with jsdom and React Testing Library.

Test coverage includes:

- Shared Axios/token-refresh helpers.
- Storage setup and persisted auth behavior.
- Customer auth/API adapters.
- Customer catalog, favorites, outfits, suggestions, wardrobe collections, avatar/profile APIs and queries.
- Customer pages including home, shop, product details, favorites, password flows, static pages, AI suggestions, outfits, wardrobe collections, compare, try-on, cart, and checkout.
- Customer route constants and query-param helpers.
- Customer selectors/error utilities.
- Retailer payment/subscription APIs and queries.
- Retailer layout and subscription plan-change utilities.

Run all tests with:

```bash
npm test
```

Run linting with:

```bash
npm run lint
```

Run a production build with:

```bash
npm run build
```

---

## Development conventions

- Add new route entries in `src/app/routes/router.tsx`.
- Add reusable path constants for customer routes in `src/features/customer/routes/customerRoutes.ts`.
- Keep backend calls in feature-level `api/*.ts` modules.
- Keep TanStack Query wrappers in feature-level `queries/*.ts` modules.
- Keep TypeScript types close to their domain in `types/*.ts`.
- Use the shared `apiClient`; do not create ad hoc Axios instances for app API calls unless there is a documented reason.
- Prefer feature-local tests next to the code being tested.
- Avoid wrapping imports in `try/catch` blocks.
- When sending `FormData`, let `apiClient` remove the JSON content type automatically.

---

## Project status

The frontend has moved beyond the initial skeleton and currently contains working modules for both retailer and customer experiences. The customer virtual fitting-room and AI-assisted wardrobe flows are implemented at the frontend/API-integration layer. The admin area remains the main incomplete role area and currently uses a placeholder route.
