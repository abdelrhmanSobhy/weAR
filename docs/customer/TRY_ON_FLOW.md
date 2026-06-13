# Customer Try-on Flow

## Goal
Deliver a stable 2D-first fitting experience, then add an optional 3D GLB viewer without slowing the normal storefront.

## State machine
```text
entry
  -> selecting-product
  -> ready
  -> submitting
  -> processing
  -> completed-2d
  -> completed-3d-available
  -> error-retryable
  -> error-avatar-required
  -> fallback-2d
```

Keep state transitions explicit. Do not represent the entire flow with unrelated booleans.

## Phase 1 — required
### Entry
- Reproduce the curtain-based fitting-room introduction.
- Back navigation returns safely to the source page.
- `Enter Room` checks authentication and active avatar.
- If no avatar exists, route to avatar setup and preserve the intended product/return route.

### Product selection / ready
- Accept an optional product ID from the route or navigation state.
- Resolve the product through catalog API.
- Show reusable selected-product card with image, name, size/color selection and price/discount.
- Disable `Try Product` until required selections and avatar prerequisites are valid.

### Submit
Call:
```http
POST /api/customers/{customerId}/try-on
```
Initial stable session type:
```json
{ "productId": "...", "sessionType": "Overlay2D" }
```
Use authenticated `customerId`; never accept it from UI input.

### Processing
- Blur/dim the existing fitting-room scene.
- Keep selected product visible but de-emphasized.
- Show branded loader and staged text:
  1. Preparing your avatar
  2. Applying the selected garment
  3. Rendering your fitting result
- Use indeterminate/staged progress unless the backend exposes real progress.
- Do not claim an exact percentage derived only from elapsed time. The reference image percentage may be used visually only when clearly presented as staged progress.
- Prevent duplicate submissions while a request is active.

### 2D result
- Render image results accessibly with retry, change-product and save/share affordances where supported.
- Include size recommendation when returned.
- Preserve the original product card and route back to product details.
- Record/display a failed result without losing the user's selection.

### Errors
- 401: allow centralized auth refresh, then redirect to customer login if refresh fails.
- 403: treat as identity mismatch/programming error; never ask user to type an ID.
- 404 product/avatar: route to the appropriate recovery screen.
- 422: display normalized validation/business message.
- timeout/network: show retry while preserving selection.

## Phase 2 — optional 3D
### Eligibility
Show `Interact in 3D` only when:
- Avatar has a non-null `avatar3dModelUrl`, and
- Try-on result resolves to a `.glb` scene or the backend marks it as 3D.

### Loading strategy
- Do not import or mount Three.js/Babylon/React Three Fiber in the normal page bundle.
- Dynamically import the 3D viewer only after explicit user action.
- Show the 2D/static result first.
- Cap effective device pixel ratio at 2.
- Use minimal lighting and avoid expensive real-time shadows.
- Dispose geometry, materials, textures, loaders and WebGL context on unmount.

### Cache strategy
Implement only after the viewer is stable:
- Cache successful GLB downloads by URL using IndexedDB or a service worker.
- Respect failed/expired URLs and provide cache invalidation.
- Do not store access tokens or private response metadata in cache keys.

### Graceful degradation
When avatar or scene 3D generation fails:
- Keep 2D try-on available.
- Hide/disable 3D action.
- Show a concise non-blocking explanation.
- Do not mark the entire try-on as failed when a usable 2D result exists.

## Suggested component split
```text
features/customer/try-on/
  api/tryOn.api.ts
  api/tryOn.keys.ts
  components/FittingRoomShell.tsx
  components/SelectedProductCard.tsx
  components/TryOnProcessingOverlay.tsx
  components/TryOnResult2D.tsx
  components/TryOn3DLauncher.tsx
  components/TryOnViewer3D.lazy.tsx
  hooks/useTryOnFlow.ts
  pages/TryOnPage.tsx
  pages/TryOnHistoryPage.tsx
  types/tryOn.ts
```

## Required tests
- Product and customer IDs are sourced correctly.
- Submit is guarded against duplicate clicks.
- Processing -> success and processing -> error transitions.
- Null 3D URL produces 2D fallback.
- Viewer module is not loaded before explicit interaction.
- Retry preserves product configuration.
- Unauthenticated access redirects through existing guards.