# Retailer API Integration Notes

Base URL:

```txt
https://vfr-backend.onrender.com
```

The endpoint candidates are grouped in these files so you can adjust the exact Swagger path in one place if the backend uses a different naming convention:

```txt
src/features/auth/api/auth.api.ts
src/features/retailer/api/retailer.api.ts
src/lib/apiClient.ts
```

## Auth endpoints now covered

Login candidates:

```txt
POST /api/auth/login
POST /auth/login
POST /api/Auth/login
POST /Auth/login
POST /api/retailer/login
POST /retailer/login
POST /api/retailer/auth/login
```

Retailer signup/register candidates:

```txt
POST /api/auth/signup
POST /api/auth/register
POST /auth/signup
POST /auth/register
POST /api/Auth/signup
POST /api/Auth/register
POST /Auth/signup
POST /Auth/register
POST /api/retailer/signup
POST /api/retailer/register
POST /retailer/signup
POST /retailer/register
POST /api/retailer/auth/signup
POST /api/retailer/auth/register
```

Profile/logout candidates:

```txt
GET  /api/auth/me
GET  /api/auth/profile
GET  /auth/me
GET  /auth/profile
GET  /api/retailer/profile
GET  /retailer/profile
POST /api/auth/logout
POST /auth/logout
POST /api/retailer/logout
POST /retailer/logout
```

## Retailer feature endpoints covered

```txt
GET    /api/retailer/dashboard
GET    /api/retailer/products
POST   /api/retailer/products
PUT    /api/retailer/products/:id
DELETE /api/retailer/products/:id
GET    /api/retailer/categories
POST   /api/retailer/categories
PUT    /api/retailer/categories/:id
DELETE /api/retailer/categories/:id
GET    /api/retailer/offers
POST   /api/retailer/offers
PUT    /api/retailer/offers/:id
DELETE /api/retailer/offers/:id
GET    /api/retailer/orders
PUT    /api/retailer/orders/:id/status
GET    /api/retailer/inventory
PUT    /api/retailer/inventory/:productId
GET    /api/retailer/settings
PUT    /api/retailer/settings
GET    /api/retailer/pricing
GET    /api/retailer/subscription
```

Alternative candidates are also included in code, such as `/api/retailers/...`, `/api/products`, `/products`, `/retailer/products`.

## Test cases

### 1. Build / compile smoke test

```bash
npm install
npm run build
npm run dev
```

Expected:

- No JSX error from `md:size`.
- No missing asset errors.
- App opens normally.

### 2. Retailer signup flow

Path:

```txt
/signup/retailer
```

Steps:

1. Fill name, email, password, brand name.
2. Click Next.
3. Fill business type and 3D models question.
4. Choose a plan.
5. Fill payment form.
6. Click Confirm.

Expected:

- A signup/register request appears in DevTools Network under Auth.
- On success, token is saved in localStorage.
- User redirects to `/retailer`.

### 3. Retailer login flow

Path:

```txt
/login/retailer
```

Steps:

1. Enter a valid backend retailer email/password.
2. Click Login.

Expected:

- Login request appears in Network.
- Token is saved.
- User redirects to `/retailer`.
- Protected retailer pages open.

### 4. Products page

Path:

```txt
/retailer/products
```

Expected:

- GET products request appears.
- Products show from backend if endpoint succeeds.
- If backend returns empty, UI keeps safe fallback behavior.
- Create/Edit/Delete buttons do not break the UI.

### 5. Categories page

Path:

```txt
/retailer/categories
```

Expected:

- GET categories request appears.
- Create/Edit/Delete actions call backend endpoints when used.

### 6. Offers page

Path:

```txt
/retailer/offers
```

Expected:

- GET offers request appears.
- Create/Edit/Delete actions call backend endpoints when used.

### 7. Orders page

Path:

```txt
/retailer/orders
```

Expected:

- GET orders request appears.
- Changing an order status calls `PUT /orders/:id/status` candidate.
- CSV export still works.

### 8. Inventory page

Path:

```txt
/retailer/inventory
```

Expected:

- GET inventory request appears.
- Search/filter/sort still work.
- CSV export still works.

### 9. Auth persistence

Steps:

1. Login.
2. Refresh browser.
3. Open `/retailer/products`.

Expected:

- User remains authenticated.
- Authorization header contains `Bearer <token>`.

### 10. Failure handling

Steps:

1. Try wrong login credentials.
2. Temporarily use a wrong endpoint path.

Expected:

- Login page shows an error message.
- App does not crash.
