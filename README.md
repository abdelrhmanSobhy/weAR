<div align="center">

# 🪞 weAR — Virtual Fitting Room

**A full-stack SaaS frontend for AI-powered virtual try-on experiences**

_Try clothes on your 3D avatar before you buy — powered by React, TypeScript, and fal.ai (via backend proxy)._

<br/>

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?style=for-the-badge)](https://tanstack.com/query)
[![Tests](https://img.shields.io/badge/tests-486_passing-22C55E?style=for-the-badge&logo=vitest&logoColor=white)](./src)

</div>

---

<div align="center">

### 🛍️ Shop &nbsp;·&nbsp; 👗 Try On &nbsp;·&nbsp; 🧍 3D Avatar &nbsp;·&nbsp; 📦 Manage &nbsp;·&nbsp; 📊 Analytics

</div>

---

## 📋 Table of Contents

- [✨ Overview](#-overview)
- [🚀 Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [⚙️ Prerequisites & Getting Started](#️-prerequisites--getting-started)
- [🔐 Environment Variables](#-environment-variables)
- [📜 Available Scripts](#-available-scripts)
- [🗂️ Project Structure](#️-project-structure)
- [🗺️ Routing Map](#️-routing-map)
- [🔒 Authentication & Authorization](#-authentication--authorization)
- [🌐 API Integration](#-api-integration)
- [📡 Backend Contract](#-backend-contract)
- [🛡️ AI Cost-Control & Security](#️-ai-cost-control--security)
- [🧪 Testing Strategy](#-testing-strategy)
- [📏 Development Conventions](#-development-conventions)
- [📊 Project Status](#-project-status)

---

## ✨ Overview

**weAR** is a virtual fitting-room SaaS platform frontend. It combines a **B2B retailer dashboard** with a **B2C shopping experience** and shared platform infrastructure — all in a single Vite-powered SPA with role-based routing.

```
Customer  ──►  Shop products  ──►  Upload photos  ──►  3D/2D Try-On  ──►  Add to Cart
Retailer  ──►  Manage catalog  ──►  Track orders   ──►  View analytics ──►  Grow sales
```

> All AI generation (avatar extraction, virtual try-on) is proxied through the backend.  
> **No third-party AI keys ever touch the frontend.**

---

## 🚀 Features

<table>
<tr>
<td width="50%">

**👗 Customer Experience**
- 🛍️ Full product catalog with filters
- ❤️ Favorites & product comparison
- 🧍 Photo-based 3D avatar extraction
- 🪞 Virtual try-on (3D model + 2D overlay)
- 📏 Manual & AI-extracted measurements
- 🤖 AI wardrobe suggestions
- 👚 Outfit builder & wardrobe collections
- 🛒 Cart & checkout
- 📦 Order tracking

</td>
<td width="50%">

**📊 Retailer Dashboard**
- 📈 KPIs, charts & analytics
- 🏷️ Product, inventory & category management
- 💰 Offers & discount management
- 📋 Order management & export
- 💳 Subscription & payment management
- 🔔 Notifications
- ⚙️ Profile, avatar & settings

</td>
</tr>
</table>

**🛡️ Security & Reliability**
- 🔒 No third-party AI keys in the frontend
- 🚫 Duplicate-submission prevention (inFlight guard)
- ♻️ Backend cache-response handling
- 🧭 Friendly AI error messages for all generation failure codes
- 🔁 Automatic token refresh with request queueing

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| ⚡ Build | **Vite 7** | Lightning-fast dev server & bundler |
| ⚛️ UI | **React 19** | Component rendering |
| 🏷️ Language | **TypeScript 5** | Type safety across the codebase |
| 🗺️ Routing | **React Router 7** | Client-side navigation & guards |
| 🌐 Server state | **TanStack Query 5** | Data fetching, caching & sync |
| 💾 Client state | **Zustand 5** | Persisted auth & UI state |
| 📡 HTTP | **Axios 1** | API client with interceptors |
| 🎨 Styling | **Tailwind CSS 4** | Utility-first CSS |
| 🧩 UI primitives | **Radix UI + shadcn** | Accessible component foundations |
| 📋 Forms | **React Hook Form + Zod** | Validation & schema parsing |
| 📊 Charts | **Recharts** | Retailer analytics visualisation |
| 🎭 Icons | **Lucide React** | Consistent icon set |
| 🧊 3D viewer | **@google/model-viewer** | WebGL-based glTF/GLB viewer |
| 🧪 Testing | **Vitest + RTL** | Unit & component tests |
| ✅ Quality | **ESLint 9 + Prettier** | Linting & formatting |

---

## ⚙️ Prerequisites & Getting Started

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | `>= 18.x` (22.x recommended) | Required by Vite 7 |
| **npm** | `>= 9.x` | Bundled with Node.js |
| **Git** | any | For cloning the repository |

> 💡 **Tip:** Use [nvm](https://github.com/nvm-sh/nvm) to manage Node versions:
> ```bash
> nvm install 22
> nvm use 22
> ```

### 1 · Clone

```bash
git clone https://github.com/abdelrhmanSobhy/weAR.git
cd weAR
```

### 2 · Install dependencies

```bash
npm install
```

### 3 · Configure environment

```bash
# Copy the example and edit if needed
cp .env.example .env
```

Edit `.env` and set `VITE_API_BASE_URL` to your backend URL (see [Environment Variables](#-environment-variables)).

### 4 · Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Environment Variables

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `VITE_API_BASE_URL` | No | `https://vfr-backend.onrender.com` | Base URL for all API calls |

```bash
# .env (local only — never commit real values)
VITE_API_BASE_URL=http://localhost:3000
```

> ⛔ **Forbidden variables** — these must never exist in the frontend:
> `VITE_FAL_API_KEY` · `FAL_API_KEY` · `VITE_CLOUDINARY_SECRET` · `VITE_STRIPE_SECRET_KEY`

---

## 📜 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | 🚀 Start local dev server with HMR |
| `build` | `vite build` | 📦 Create optimised production build |
| `preview` | `vite preview` | 🔍 Preview production build locally |
| `test` | `vitest run` | 🧪 Run test suite once |
| `lint` | `eslint .` | 🔎 Lint the entire codebase |

---

## 🗂️ Project Structure

```
weAR/
├── 📁 public/                      # Static assets served as-is
├── 📁 src/
│   ├── 📁 app/
│   │   ├── AppProviders.tsx        # TanStack Query & global providers
│   │   ├── globals.css             # Tailwind base + global styles
│   │   ├── 📁 guards/              # RequireAuth, RequireRole
│   │   └── 📁 routes/
│   │       └── router.tsx          # Centralised React Router tree
│   │
│   ├── 📁 components/
│   │   ├── 📁 layout/              # AppLayout, AuthLayout (shared shells)
│   │   └── 📁 ui/                  # shadcn-style primitives (Button, Card…)
│   │
│   ├── 📁 features/
│   │   ├── 📁 auth/                # Retailer auth + shared Zustand auth store
│   │   ├── 📁 common/              # RoleSelectPage, ComingSoonPage
│   │   │
│   │   ├── 📁 customer/            # ── Customer domain ──────────────────────
│   │   │   ├── 📁 api/             # customerAuth, catalog, profileAvatar…
│   │   │   ├── 📁 cart/            # Cart store, CartPage, CheckoutPage
│   │   │   ├── 📁 compare/         # Product comparison
│   │   │   ├── 📁 components/      # ProductCard, PriceDisplay, AvatarShared…
│   │   │   ├── 📁 layouts/         # CustomerLayout (nav + sidebar)
│   │   │   ├── 📁 pages/           # Home, Shop, Avatar, Account…
│   │   │   ├── 📁 queries/         # TanStack Query hooks
│   │   │   ├── 📁 routes/          # CUSTOMER_ROUTES constants
│   │   │   ├── 📁 styles/          # customerTheme.ts tokens
│   │   │   ├── 📁 try-on/          # ── Try-On sub-domain ────────────────────
│   │   │   │   ├── 📁 api/         # tryOn.api.ts
│   │   │   │   ├── 📁 components/  # TryOn3DViewer, ErrorBoundary
│   │   │   │   ├── 📁 hooks/       # tryOn.queries.ts
│   │   │   │   ├── 📁 pages/       # CustomerTryOnPage, HistoryPage
│   │   │   │   ├── 📁 types/       # TryOnSession, flow reducer, helpers
│   │   │   │   └── 📁 utils/       # modelUrl safety utils
│   │   │   └── 📁 types/           # CustomerAvatar, BodyMeasurements…
│   │   │
│   │   ├── 📁 retailer/            # ── Retailer domain ──────────────────────
│   │   │   ├── 📁 api/             # dashboard, products, inventory, orders…
│   │   │   ├── 📁 components/      # Dashboard widgets, data tables
│   │   │   ├── 📁 layouts/         # RetailerLayout
│   │   │   ├── 📁 pages/           # Dashboard, Products, Orders, Settings…
│   │   │   ├── 📁 queries/         # TanStack Query hooks
│   │   │   └── 📁 types/           # Domain types
│   │   │
│   │   └── 📁 admin/               # 🔲 Placeholder (Coming Soon)
│   │
│   ├── 📁 lib/
│   │   ├── axios.ts                # Shared API client + interceptors
│   │   └── utils.ts                # Shared helpers (cn, etc.)
│   │
│   └── 📁 test/
│       └── setup.ts                # Vitest + jest-dom setup
│
├── .env.example                    # Environment variable template
├── vite.config.ts                  # Vite + Vitest config
├── tsconfig.json                   # TypeScript config
├── eslint.config.js                # ESLint 9 flat config
└── package.json
```

---

## 🗺️ Routing Map

### 🌐 Public

| Route | Page |
|-------|------|
| `/` | Role selection |
| `/login/retailer` | Retailer login |
| `/signup/retailer` → `/step-2` → `/pricing` → `/payment` | Retailer onboarding funnel |
| `/forgot-password` · `/reset-password` | Retailer password recovery |
| `/login/customer` | Customer login |
| `/signup/customer` | Customer signup |
| `/forgot-password/customer` · `/reset-password/customer` | Customer password recovery |

### 🏪 Protected — Retailer (`/retailer/*`)

| Route | Page |
|-------|------|
| `/retailer` | Dashboard (KPIs & charts) |
| `/retailer/products` | Product management |
| `/retailer/inventory` | Inventory management |
| `/retailer/orders` | Order management |
| `/retailer/offers` | Offer management |
| `/retailer/categories` | Category & subcategory management |
| `/retailer/pricing` | Subscription management |
| `/retailer/help` | Help page |
| `/retailer/settings` | Account & settings |

### 🛍️ Protected — Customer (`/customer/*`)

| Route | Page |
|-------|------|
| `/customer/home` | Home page |
| `/customer/shop` | Product catalog |
| `/customer/products/:productId` | Product details |
| `/customer/try-on` · `/customer/try-on/:productId` | 🪞 Virtual fitting room |
| `/customer/try-on/history` | Try-on history |
| `/customer/favorites` | Saved favourites |
| `/customer/compare` | Product comparison |
| `/customer/account` | Profile settings |
| `/customer/account/addresses` | Address book |
| `/customer/avatar` | Avatar overview |
| `/customer/avatar/manual` | Manual measurements |
| `/customer/avatar/photo` | 📸 Photo extraction flow |
| `/customer/cart` | Shopping cart |
| `/customer/checkout` | Checkout |
| `/customer/outfits` | Outfit builder |
| `/customer/ai-suggestions` | 🤖 AI wardrobe suggestions |
| `/customer/wardrobe/collections` | Wardrobe collections |
| `/customer/about` · `/customer/shipping-returns` · `/customer/blog` | Static pages |

### 🔧 Admin

| Route | Page |
|-------|------|
| `/admin` | Coming Soon placeholder |

> Unknown routes redirect to `/`.

---

## 🔒 Authentication & Authorization

Auth state is persisted via **Zustand** under the `wear-auth` storage key.

```ts
// Stored session shape
{
  user: UserProfile | null
  role: "retailer" | "customer" | "admin" | null
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
}
```

**Guards:**

| Guard | Behaviour |
|-------|-----------|
| `RequireAuth` | Waits for store hydration; redirects unauthenticated users to `/` |
| `RequireRole` | Validates role; redirects to correct home/login when role mismatches |

| Role | Home path |
|------|-----------|
| `retailer` | `/retailer` |
| `customer` | `/customer/home` |
| `admin` | `/admin` |

---

## 🌐 API Integration

All calls use the shared `apiClient` from `src/lib/axios.ts`.

```
Request  ──►  apiClient  ──►  Bearer token injected  ──►  Backend
Response ◄──  apiClient  ◄──  401? → refresh + replay ◄──  Backend
```

**Key behaviours:**
- Falls back to `https://vfr-backend.onrender.com` when `VITE_API_BASE_URL` is unset.
- Strips `Content-Type` from `FormData` uploads so the browser sets the multipart boundary.
- Queues concurrent failed requests while a token refresh is in flight.

<details>
<summary><b>📦 Retailer API modules</b></summary>

| Module | Responsibility |
|--------|---------------|
| `auth.api.ts` | Login, Google OAuth, registration, logout, password recovery |
| `dashboard.api.ts` | KPIs, charts, reports, CSV export |
| `products.api.ts` | Product CRUD |
| `inventory.api.ts` | Stock levels, adjustments, thresholds, export |
| `categories.api.ts` | Categories & subcategories CRUD/status |
| `offers.api.ts` | Offers CRUD/status |
| `orders.api.ts` | Order list, status updates, export |
| `settings.api.ts` | Profile, password, avatar, logo, notifications, account deletion |
| `subscription.api.ts` | Plans, trial, select/upgrade/downgrade/cancel |
| `payment.api.ts` | Payment methods |
| `notification.api.ts` | Notification list & actions |

</details>

<details>
<summary><b>🛍️ Customer API modules</b></summary>

| Module | Responsibility |
|--------|---------------|
| `customerAuth.api.ts` | Registration, profile completion, login, logout, password recovery |
| `catalog.api.ts` | Product catalog, details, similar products, compare |
| `favorites.api.ts` | Favourite list/toggle/check |
| `profileAvatar.api.ts` | Profile, addresses, avatar extraction/repair, measurements |
| `tryOn.api.ts` | Try-on session creation, list/details |
| `outfits.api.ts` | Outfit list/create/delete |
| `suggestions.api.ts` | AI wardrobe suggestions |
| `wardrobeCollections.api.ts` | Wardrobe collections & items |
| `recommendations.api.ts` | Size & complementary product recommendations |

</details>

---

## 📡 Backend Contract

> Frontend is aligned with the following backend DTOs from `vfr-backend`.

### AvatarDto — guaranteed fields

```ts
{
  id: string
  heightCm: number
  weightKg?: number
  // ... other body measurements
  avatar3dModelUrl: string | null   // GLB model URL
  sourceImageUrl:   string | null   // original photo used for extraction
  has2DCapability:  boolean
  has3DCapability:  boolean
  lastMeasuredAt:   string | null
}
```

> `avatarFrontImageUrl`, `avatar2dImageUrl`, `generationSource`, `isCached` — **optional only**, UI never depends on them.

### TryOnResultDto — guaranteed fields

```ts
{
  status:          string
  resultImageUrl:  string | null   // ← canonical result field
  resultType:      "Model3D" | "Image2D" | string
  recommendedSize: string | null
  confidenceScore: number | null
  durationSeconds: number | null
}
```

> `resultModelUrl`, `isCached`, `generationSource` — **optional**, used defensively when present.

### Capability rules

```
canUse2DTryOn  =  has2DCapability === true  OR  sourceImageUrl is non-empty
canUse3DTryOn  =  has3DCapability === true  AND  avatar3dModelUrl passes URL safety check
```

### 3D result rendering

```
modelUrl  =  resultModelUrl (preferred, if present & safe)
          ??  resultImageUrl (fallback — backend sends GLB URL here for 3D sessions)
```

---

## 🛡️ AI Cost-Control & Security

### Architecture

```
┌─────────────┐       ┌─────────────┐       ┌──────────────┐
│   Frontend  │ ────► │   Backend   │ ────► │   fal.ai     │
│  (no keys)  │       │  (secrets)  │       │  AI provider │
└─────────────┘       └─────────────┘       └──────────────┘
```

The frontend holds **zero** AI provider credentials.

### Duplicate Submission Prevention

| Surface | Guard mechanism |
|---------|----------------|
| 📸 Avatar photo extraction | `inFlight` ref — blocks re-entry while request is in flight; submit button disabled while `isPending` |
| 🪞 Virtual try-on | Same `inFlight` ref pattern; `Try Product` button disabled during processing |

### AI Error Codes

| Code | User-facing message |
|------|-------------------|
| `AI_GENERATION_IN_PROGRESS` | _The same generation is already in progress. Please wait a moment and try again shortly._ |
| `AI_GENERATION_QUOTA_EXCEEDED` | _Daily AI generation limit reached. Previously generated results may still be available._ |
| `AI_GENERATION_PREVIOUSLY_FAILED` | _Previous AI generation for the same input failed recently. Please try again later or change the input._ |

### Cache Response Handling

When backend explicitly returns `isCached: true` or `generationSource: "Cache"` → non-blocking status notice is shown.

> Cache is **never** inferred from `durationSeconds` or `confidenceScore`.

### Error Reference ID

When backend returns a `traceId` → displayed as `Reference: <traceId>` for support. No stack traces are exposed.

---

## 🧪 Testing Strategy

```
📁 51 test files   ·   ✅ 486 tests passing
```

**Framework:** Vitest + jsdom + React Testing Library + jest-dom

<details>
<summary><b>Coverage areas</b></summary>

| Area | Coverage |
|------|---------|
| Axios client & token refresh | ✅ |
| Auth store persistence | ✅ |
| Customer API adapters (avatar, catalog, favorites, try-on…) | ✅ |
| Customer pages (home, shop, avatar, try-on, cart, checkout…) | ✅ |
| AI cost-control layer (duplicate guard, cache notice, error codes, traceId) | ✅ |
| `resultImageUrl` fallback for 3D | ✅ |
| `canUse2DTryOn` with `sourceImageUrl` | ✅ |
| `Overlay2D` sent only on explicit 2D selection | ✅ |
| Retailer API/query adapters | ✅ |
| Subscription plan-change utilities | ✅ |
| Route constants & query-param helpers | ✅ |

</details>

```bash
npm test          # run all tests
npm run lint      # lint the codebase
npm run build     # production build
```

---

## 📏 Development Conventions

- 📁 New routes → `src/app/routes/router.tsx`
- 🔑 Customer route constants → `src/features/customer/routes/customerRoutes.ts`
- 📡 Backend calls → feature-level `api/*.ts` modules
- 🔄 Data fetching → feature-level `queries/*.ts` with TanStack Query
- 🏷️ Types → `types/*.ts` close to their domain
- 🌐 Always use the shared `apiClient` — no ad hoc Axios instances
- 📤 `FormData` uploads → let `apiClient` strip `Content-Type` automatically
- 🧪 Tests → co-located next to the feature code
- ⛔ **Never** add third-party AI provider keys to the frontend

---

## 📊 Project Status

| Area | Status | Notes |
|------|:------:|-------|
| 🏪 Retailer dashboard | ✅ | Full CRUD, analytics, subscription lifecycle |
| 🛍️ Customer storefront | ✅ | Shop, favorites, compare, cart, checkout |
| 🪞 Virtual try-on (3D + 2D) | ✅ | Mode auto-correction, in-flight guard |
| 📸 Photo avatar extraction | ✅ | Staged progress, field validation |
| 🤖 AI wardrobe suggestions | ✅ | Query + cost-control safeguards |
| 🛡️ AI cost-control & security | ✅ | inFlight guard, error codes, cache notice |
| 📡 Backend contract alignment | ✅ | Aligned with `TryOnResultDto` + `AvatarDto` |
| 🔧 Admin portal | 🔲 | Placeholder route only |

---

<div align="center">

Built with ❤️ using React, TypeScript & Vite

</div>
