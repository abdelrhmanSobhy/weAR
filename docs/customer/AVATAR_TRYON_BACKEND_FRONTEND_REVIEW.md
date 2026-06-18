# Customer Avatar & Virtual Try-on — Backend/Frontend Contract Review

Branch intended for the frontend changes: `customer/avatar-tryon-backend-contract`  
Baseline commit: `9d4c79afedc8547fc4664ef3867453b6ad848efb`  
Original branch `customer/final-qa` should remain pinned to the baseline commit.

This document describes every backend endpoint related to Customer Avatar, measurements, size recommendation, and Virtual Try-on, then maps those contracts to the current frontend pages/API adapters.

---

## 1. Backend global notes

### Authentication and ownership

All endpoints below are customer-scoped. Controllers call `EnsureCustomerOwnership(customerId)`, so the `{customerId}` path parameter must match the authenticated customer identity. If not, the request should be rejected by the base customer controller/security layer.

### Response envelope

Controllers return `ApiResponse<T>` through helpers such as `OkResponse`, `CreatedResponse`, and `NoContentResponse`. Frontend should always unwrap `data`; some deployed endpoints may return nested envelopes, so the frontend uses a defensive `unwrapCustomerApiData` helper.

### JSON casing and enum behavior

The API config sets `JsonNamingPolicy.CamelCase` and ignores null response fields. It does not configure `JsonStringEnumConverter`, so enum request values are safest as numeric values:

- `TryOnSessionType.Overlay2D = 0`
- `TryOnSessionType.Model3D = 1`
- `TryOnSessionType.ARLiveView = 2`

DTOs that expose enum values as strings are explicit string fields, e.g. `VirtualTryOnSessionDto.SessionType` and `VirtualTryOnSessionDto.Status`. `TryOnResultDto.Status` is a `SessionStatus` enum and may serialize numerically unless the server changes enum serialization.

---

## 2. Backend endpoints: Customer Avatar & Measurements

Base route:

```http
/api/customers/{customerId}/avatar
```

`customerId` is a GUID and must be the authenticated customer.

---

### 2.1 Get active avatar

**Name:** Get active avatar  
**Method:** `GET`  
**Path:** `/api/customers/{customerId}/avatar`

#### Request

Path parameters:

```json
{
  "customerId": "guid"
}
```

No body.

#### Success response

Status: `200 OK`  
Envelope data type: `AvatarDto`

Expected `data` shape after camelCase serialization:

```json
{
  "id": "guid",
  "heightCm": 170,
  "weightKg": 70,
  "chestCm": 95,
  "waistCm": 80,
  "hipsCm": 92,
  "shoulderWidthCm": 42,
  "inseamCm": 78,
  "neckCm": null,
  "armLengthCm": null,
  "shoeSizeEu": null,
  "bodyShape": null,
  "avatar3dModelUrl": "https://.../avatar.glb",
  "lastMeasuredAt": "2026-06-15T...Z"
}
```

Null fields may be omitted because API JSON options ignore null values.

#### Errors

- `404 Not Found` if no avatar exists.

#### How it works

The handler loads the avatar by `CustomerId`, caches it under `avatar:{customerId}`, maps it to `AvatarDto`, and returns it. If no avatar exists, it throws `NotFoundException`.

---

### 2.2 Get avatar measurement history

**Name:** Get measurement history  
**Method:** `GET`  
**Path:** `/api/customers/{customerId}/avatar/history`

#### Request

Query parameters:

```json
{
  "pageNumber": 1,
  "pageSize": 20
}
```

Defaults are `pageNumber = 1`, `pageSize = 20`.

#### Success response

Status: `200 OK`  
Envelope data type: `PagedResult<AvatarMeasurementHistoryDto>`

Expected `data` shape:

```json
{
  "items": [
    {
      "id": "guid",
      "measurementDataJson": "{\"HeightCm\":170,\"WeightKg\":70,...}",
      "source": "Manual",
      "recordedAt": "2026-06-15T...Z"
    }
  ],
  "totalCount": 1,
  "pageNumber": 1,
  "pageSize": 20
}
```

`source` must be one of:

- `Manual`
- `BodyScan`
- `AIEstimate`

#### Errors

- The handler throws `NotFoundException` if no avatar exists for the customer.

#### How it works

The handler finds the avatar ID for the customer, including soft-deleted avatars via `IgnoreQueryFilters`, then returns history snapshots ordered by `RecordedAt` descending. Each history row stores the full measurements snapshot as JSON text.

---

### 2.3 Create manual avatar

**Name:** Create a new avatar  
**Method:** `POST`  
**Path:** `/api/customers/{customerId}/avatar`

#### Request body

Type: `CreateAvatarCommand`

Expected JSON body:

```json
{
  "heightCm": 170,
  "weightKg": 70,
  "chestCm": 95,
  "waistCm": 80,
  "hipsCm": 92,
  "shoulderWidthCm": 42,
  "inseamCm": 78,
  "neckCm": null,
  "armLengthCm": null,
  "shoeSizeEu": null,
  "bodyShape": null,
  "source": "Manual"
}
```

Required fields:

- `heightCm` — decimal, `> 0` and `< 300`
- `weightKg` — decimal, `> 0` and `< 500`
- `source` — non-empty, must be `Manual`, `BodyScan`, or `AIEstimate`

Optional measurement fields:

- `chestCm`
- `waistCm`
- `hipsCm`
- `shoulderWidthCm`
- `inseamCm`
- `neckCm`
- `armLengthCm`
- `shoeSizeEu`
- `bodyShape`

Allowed `bodyShape` values if provided:

- `Rectangle`
- `Triangle`
- `InvertedTriangle`
- `Hourglass`
- `Apple`
- `Pear`

#### Success response

Status: `201 Created`  
Envelope data type: `Guid`

Expected `data`:

```json
"avatar-guid"
```

#### Errors

- `400 Bad Request` / business error if customer already has an active avatar: code `AVATAR_EXISTS`.
- `422 Unprocessable Entity` for validation errors such as missing/invalid `weightKg` or wrong `source` casing.

#### How it works

The handler uses the authenticated customer ID from `ICurrentUserService`, rejects duplicate active avatars, creates an `Avatar` entity, creates an initial `AvatarMeasurementHistory` snapshot using the supplied `source`, saves both in one transaction, and returns the avatar ID.

Important frontend detail: `source` must be `Manual`, not `manual`, and `shoulderWidthCm` must be used for backend payloads, not `shoulderCm`.

---

### 2.4 Update avatar measurements

**Name:** Update measurements  
**Method:** `PATCH`  
**Path:** `/api/customers/{customerId}/avatar/measurements`

#### Request body

Type: `UpdateAvatarMeasurementsCommand`

Expected JSON body:

```json
{
  "avatarId": "guid",
  "heightCm": 171,
  "weightKg": 71,
  "chestCm": 96,
  "waistCm": 81,
  "hipsCm": 93,
  "shoulderWidthCm": 43,
  "inseamCm": 79,
  "neckCm": null,
  "armLengthCm": null,
  "shoeSizeEu": null,
  "bodyShape": null,
  "source": "Manual"
}
```

Required fields:

- `avatarId`
- `heightCm`
- `weightKg`
- `source`

Same validation rules as create.

#### Success response

Status: `204 No Content` through the API helper. No useful body should be expected.

#### Errors

- `404 Not Found` if avatar does not exist or does not belong to the authenticated customer.
- `422 Unprocessable Entity` for invalid measurements/source/bodyShape.

#### How it works

The handler loads the avatar by `avatarId`, checks ownership against the authenticated customer, overwrites all measurement fields, updates `LastMeasuredAt`, creates a new immutable `AvatarMeasurementHistory` snapshot, then saves.

Important frontend detail: this is a full overwrite, not a partial patch. The frontend should send all supported fields, using `null` for unknown optional fields.

---

### 2.5 Delete active avatar

**Name:** Delete active avatar  
**Method:** `DELETE`  
**Path:** `/api/customers/{customerId}/avatar`

#### Request body

Type: `DeleteAvatarCommand`

```json
{
  "avatarId": "guid"
}
```

#### Success response

Status: `204 No Content`.

#### Errors

- `404 Not Found` if avatar does not exist or does not belong to the authenticated customer.

#### How it works

The handler loads the avatar by ID, checks ownership, then soft-deletes it. Measurement history remains for audit purposes.

---

### 2.6 Get product size recommendation

**Name:** Get a size recommendation  
**Method:** `GET`  
**Path:** `/api/customers/{customerId}/avatar/size-recommendation/{productId}`

#### Request

Path parameters:

```json
{
  "customerId": "guid",
  "productId": "guid"
}
```

No body.

#### Success response

Status: `200 OK`  
Envelope data type: `SizeRecommendationDto`

Expected `data` shape:

```json
{
  "productId": "guid",
  "recommendedSize": "M",
  "confidenceScore": 0.85,
  "justification": "Based on your waist measurement of 80cm compared to the product size chart."
}
```

#### Errors

- `404 Not Found` if the customer has no avatar.
- `400 Bad Request` possible for malformed IDs or related validation.

#### How it works

The handler loads the authenticated customer's avatar and calls `ISizeRecommendationService`. Current implementation is placeholder logic based mainly on `waistCm`, falling back to `chestCm`, otherwise defaulting to `M` with lower confidence.

---

### 2.7 Extract measurements and 3D avatar from photo

**Name:** Extract measurements from image  
**Method:** `POST`  
**Path:** `/api/customers/{customerId}/avatar/extract-from-image`

#### Request

Content type: `multipart/form-data`

Required form fields:

```text
ImageFile = file
HeightCm = decimal
```

Constraints:

- `ImageFile` is required.
- Size must be greater than 0 and at most 5 MB.
- File must be JPEG or PNG by content/magic bytes, not only extension or MIME type.
- `HeightCm` must be `> 0` and `<= 300`.

#### Success response

Status: `200 OK`  
Envelope data type: `AvatarDto`

Expected `data` shape:

```json
{
  "id": "guid",
  "heightCm": 177,
  "weightKg": 72,
  "chestCm": 95,
  "waistCm": 80,
  "hipsCm": 92,
  "shoulderWidthCm": 42,
  "inseamCm": 78,
  "avatar3dModelUrl": "https://.../avatar.glb",
  "lastMeasuredAt": "2026-06-15T...Z"
}
```

`avatar3dModelUrl` can be absent/null if 3D generation fails; the handler treats 3D model generation as best-effort.

#### Errors

- `401 Unauthorized` if customer identity is missing.
- `422 Unprocessable Entity` for validation errors.
- Business error `INVALID_FILE_TYPE` if magic bytes are not JPEG/PNG.

#### How it works

The handler validates the image bytes, streams the image to the body-measurement extraction service using the provided height as scale, then tries to generate a 3D body model:

1. Uploads the same image to storage under `avatars/3d-source` to get a public URL.
2. Calls fal.ai body generation.
3. Stores the returned GLB URL as `avatar3dModelUrl` if generation succeeds.
4. If generation fails, logs a warning and continues without a 3D model.
5. Upserts the avatar: creates one if none exists, otherwise updates the existing one.
6. Records a history snapshot with source `AIEstimate`.

This is the main path required before 3D try-on can work.

---

## 3. Backend endpoints: Virtual Try-on

Base route:

```http
/api/customers/{customerId}
```

---

### 3.1 Initiate virtual try-on

**Name:** Initiate a virtual try-on session  
**Method:** `POST`  
**Path:** `/api/customers/{customerId}/try-on`

#### Request body

Type: `InitiateTryOnCommand`

Safest JSON body:

```json
{
  "productId": "guid",
  "sessionType": 1,
  "avatarId": "guid"
}
```

Required fields:

- `productId` — required GUID.
- `sessionType` — enum value; safest as number.
  - `0` = `Overlay2D`
  - `1` = `Model3D`
  - `2` = `ARLiveView`

Optional field:

- `avatarId` — technically nullable in command, but current service requires an avatar with `avatar3dModelUrl` for actual processing. In practice, send the active avatar ID.

#### Success response

Status: `200 OK`  
Envelope data type: `TryOnResultDto`

Expected `data` shape:

```json
{
  "status": 1,
  "resultImageUrl": "https://.../scene.glb",
  "recommendedSize": null,
  "confidenceScore": 0.98,
  "durationSeconds": 12
}
```

Important: despite the field name `resultImageUrl`, current backend service returns a GLB scene URL from fal.ai scene alignment, not a 2D image. The frontend should treat this value as a model URL when it is a safe HTTP/HTTPS URL.

Also important: this endpoint returns `TryOnResultDto`, not `VirtualTryOnSessionDto`. The response does not include `id`, `productId`, `customerId`, or `avatarId` unless the backend contract changes.

#### Errors

- `400 Bad Request` for invalid enum/body shape or service errors mapped as bad request.
- `404 Not Found` if product is missing/inactive or avatar ID does not exist/belong to customer.
- `429 Too Many Requests` because the endpoint uses `EnableRateLimiting("customer-tryon")`.
- External service errors if no avatar 3D model, product has no image, or fal.ai fails.

#### How it works

The command handler:

1. Reads authenticated customer ID.
2. Validates product exists and has status `Active`.
3. If `avatarId` is provided, loads the avatar and validates ownership.
4. Creates and saves a `VirtualTryOnSession` with `Processing` status before calling the external service.
5. Calls `IVirtualTryOnService.ProcessTryOnAsync`.
6. If external processing throws, marks the session `Failed` and rethrows.
7. If processing completes and returns `resultImageUrl`, marks the session `Completed`, storing result URL, recommended size, confidence, and duration.
8. Invalidates try-on session list cache.
9. Returns only the `TryOnResultDto`.

Current `VirtualTryOnService` implementation:

1. Requires `avatar.Avatar3dModelUrl`; otherwise throws: `Customer does not have a 3D avatar. Please create one first.`
2. Loads product and first non-deleted product image.
3. Generates a 3D clothing object from the product image and product name.
4. Aligns avatar body mesh and clothing object into a unified 3D scene.
5. Returns the scene GLB URL in `resultImageUrl` with `Status = Completed` and `ConfidenceScore = 0.98`.

---

### 3.2 Get all try-on sessions

**Name:** Get try-on session history  
**Method:** `GET`  
**Path:** `/api/customers/{customerId}/try-on/sessions`

#### Request

Query parameters:

```json
{
  "pageNumber": 1,
  "pageSize": 20
}
```

#### Success response

Status: `200 OK`  
Envelope data type: `PagedResult<VirtualTryOnSessionDto>`

Expected `data` shape:

```json
{
  "items": [
    {
      "id": "guid",
      "customerId": "guid",
      "productId": "guid",
      "retailerId": "guid",
      "avatarId": "guid",
      "sessionType": "Model3D",
      "status": "Completed",
      "recommendedSize": null,
      "confidenceScore": 0.98,
      "resultImageUrl": "https://.../scene.glb",
      "durationSeconds": 12,
      "createdAt": "2026-06-15T...Z"
    }
  ],
  "totalCount": 1,
  "pageNumber": 1,
  "pageSize": 20
}
```

#### How it works

Returns sessions for the customer ordered by `CreatedAt` descending. Cached for 5 minutes under `tryon:{customerId}:p{pageNumber}s{pageSize}` and invalidated after initiating try-on.

---

### 3.3 Get one try-on session

**Name:** Get try-on session details  
**Method:** `GET`  
**Path:** `/api/customers/{customerId}/try-on/sessions/{sessionId}`

#### Request

Path parameters:

```json
{
  "customerId": "guid",
  "sessionId": "guid"
}
```

#### Success response

Status: `200 OK`  
Envelope data type: `VirtualTryOnSessionDto`

Same item shape as in session history.

#### Errors

- `404 Not Found` if session does not exist or does not belong to the authenticated customer.

#### How it works

Loads by `sessionId`, applies an IDOR guard against the authenticated customer, caches the session for 10 minutes, and returns DTO.

---

### 3.4 Get product-specific try-on sessions

**Name:** Get item-specific try-on sessions  
**Method:** `GET`  
**Path:** `/api/customers/{customerId}/products/{productId}/sessions`

#### Request

Path parameters:

```json
{
  "customerId": "guid",
  "productId": "guid"
}
```

Query parameters:

```json
{
  "pageNumber": 1,
  "pageSize": 20
}
```

#### Success response

Status: `200 OK`  
Envelope data type: `PagedResult<VirtualTryOnSessionDto>`

Same paginated shape as all session history, filtered to the authenticated customer and selected product.

#### How it works

Uses authenticated customer ID from `ICurrentUserService`, filters sessions by customer and product, orders descending, caches for 5 minutes under a product/customer/page key.

---

## 4. Correct frontend request/response mapping

### 4.1 Frontend avatar API adapter

File:

```text
src/features/customer/api/profileAvatar.api.ts
```

Expected behavior in the new branch:

- `getAvatar(customerId)` calls `GET /api/customers/{customerId}/avatar`.
- Treats 404 as `null` avatar.
- Maps backend `shoulderWidthCm` to frontend `shoulderCm`.
- Preserves `avatar3dModelUrl`.
- `createAvatar(customerId, measurements)` calls `POST /api/customers/{customerId}/avatar`.
- Sends backend field names:
  - frontend `shoulderCm` -> backend `shoulderWidthCm`
  - `source: "Manual"`
  - required `heightCm` and `weightKg`
  - unknown optional fields as `null`
- `updateMeasurements(customerId, avatarId, measurements)` calls `PATCH /api/customers/{customerId}/avatar/measurements` with the same backend field mapping and `avatarId`.
- `deleteAvatar(customerId, avatarId)` sends DELETE body `{ avatarId }` using Axios `config.data`.
- `extractFromImage(customerId, input)` sends `multipart/form-data` with exact fields:
  - `ImageFile`
  - `HeightCm`
- Leaves multipart boundary generation to the browser by not manually setting a fixed content-type boundary.

Assessment: this mapping is now aligned with backend expectations after the contract fixes.

---

### 4.2 Frontend avatar types and form validation

File:

```text
src/features/customer/types/profileAvatar.ts
```

Expected behavior in the new branch:

- Manual form schema requires `heightCm` and `weightKg`.
- Optional fields are normalized to `null`.
- UI still names shoulder as `shoulderCm`, but adapter converts it to `shoulderWidthCm` before sending.
- Photo extraction helper validates file type and 5 MB size before sending.
- FormData builder uses `ImageFile` and `HeightCm`, matching backend form names.

Assessment: aligned with backend validation, especially the required `WeightKg` and source casing.

---

### 4.3 Frontend try-on API adapter

File:

```text
src/features/customer/try-on/api/tryOn.api.ts
```

Expected behavior in the new branch:

- `createSession(customerId, payload)` calls `POST /api/customers/{customerId}/try-on`.
- It sends numeric `sessionType`, especially `TRY_ON_SESSION_TYPES.model3D = 1` for the current backend pipeline.
- It normalizes the create response as a transient frontend `TryOnSession` because backend returns `TryOnResultDto`, not `VirtualTryOnSessionDto`.
- For create result, `resultImageUrl` is treated as the backend result URL. Current backend returns a GLB scene URL here.
- `listSessions`, `getSession`, and `getProductSessions` still expect `VirtualTryOnSessionDto`/paged result shape from the history endpoints.

Assessment: create-session normalization was necessary because the backend create endpoint does not return a session ID. History endpoints remain session-based and are handled separately.

---

### 4.4 Frontend try-on model URL safety

File:

```text
src/features/customer/try-on/utils/modelUrl.ts
```

Expected behavior:

- Accepts only `http:` and `https:` URLs.
- Rejects empty, whitespace, `javascript:`, and malformed URLs.
- Used for both active avatar model URL and try-on result model URL.

Assessment: good safety layer before passing a URL into `<model-viewer>`.

---

## 5. Frontend pages related to Avatar and Try-on

### 5.1 Avatar overview page

Route:

```text
/customer/avatar
```

File:

```text
src/features/customer/pages/CustomerAvatarPage.tsx
```

Responsibilities:

- Loads active avatar via `useCustomerAvatar`.
- Shows no-avatar state if no active avatar exists.
- Shows active measurements and 3D model availability if avatar exists.
- Links to:
  - manual avatar creation/update page
  - photo extraction page
- Shows measurement history via `useCustomerAvatarHistory`.
- Allows deleting avatar via `useDeleteCustomerAvatar`.

Backend alignment:

- Correctly handles 404 as no avatar through adapter.
- Correctly displays `avatar3dModelUrl` availability.
- History parsing handles paginated result and backend JSON snapshot strings.

Important UX note:

- Manual avatar can create measurements but does not create a 3D model URL. Current try-on backend requires a 3D avatar, so manual-only avatar is not enough for try-on.

---

### 5.2 Manual avatar page

Route:

```text
/customer/avatar/manual
```

File:

```text
src/features/customer/pages/CustomerAvatarManualPage.tsx
```

Responsibilities:

- Allows entering supported measurements.
- Creates avatar if none exists.
- Updates active avatar measurements if one exists.
- Returns to safe `returnTo` route after success.

Backend alignment in latest branch:

- Must require both height and weight.
- Sends frontend measurement object to mutation; adapter converts to backend contract.
- Uses create vs update correctly based on active avatar existence.

Important limitation:

- This flow does not upload a photo and does not create `avatar3dModelUrl`. Therefore, it cannot unlock the current 3D try-on pipeline unless backend later supports manual-to-3D generation.

---

### 5.3 Photo avatar / extraction page

Route:

```text
/customer/avatar/photo
```

File:

```text
src/features/customer/pages/CustomerAvatarPhotoPage.tsx
```

Responsibilities:

- Accepts JPEG/PNG full-body image.
- Requires height in cm.
- Calls `extract-from-image` mutation.
- Shows extracted measurements.
- Warns if backend returns no 3D model URL.
- Supports safe return back to try-on flow.

Backend alignment:

- Correct form names: `ImageFile`, `HeightCm`.
- Correct file constraints: JPEG/PNG and max 5 MB.
- Correctly accepts that `avatar3dModelUrl` may be null because backend treats 3D generation as best-effort.

Important UX note:

- This is the correct flow users need before 3D try-on. If it returns no `avatar3dModelUrl`, try-on should stay blocked and ask user to retry photo avatar creation or report backend/fal.ai issue.

---

### 5.4 Try-on page

Routes:

```text
/customer/try-on
/customer/try-on/{productId}
```

File:

```text
src/features/customer/try-on/pages/CustomerTryOnPage.tsx
```

Responsibilities:

- Entry screen for fitting room.
- Checks active avatar before allowing try-on.
- Loads selected product and variants.
- Requires selected size/color if product has variants.
- Calls `POST /try-on` through `useCreateTryOnSession`.
- Displays the 3D backend result using the lazy `TryOn3DViewer` if `resultImageUrl` is a safe model URL.
- Falls back to product image if backend did not return a safe GLB/URL.
- Allows add-to-cart after try-on.

Backend alignment in latest branch:

- Correctly requires a safe `avatar3dModelUrl` before calling try-on.
- Redirects to photo avatar flow when no usable 3D avatar exists.
- Sends `sessionType: TRY_ON_SESSION_TYPES.model3D` (`1`) instead of the previous 2D value (`0`).
- Sends active `avatarId`.
- Treats `resultImageUrl` from create response as a possible GLB scene URL.
- Does not assume create response contains a session ID.

Important naming issue:

- Backend field name `resultImageUrl` is misleading in current implementation because it contains a GLB scene URL from `AlignSceneAsync`. Frontend should keep this backend field name but internally treat it as `resultModelUrl` where possible.

---

### 5.5 Try-on history page

Route:

```text
/customer/try-on/history
```

File:

```text
src/features/customer/try-on/pages/CustomerTryOnHistoryPage.tsx
```

Responsibilities:

- Loads try-on sessions via `GET /try-on/sessions`.
- Displays previous sessions and result URLs/status where available.

Backend alignment:

- History endpoints return `VirtualTryOnSessionDto`, unlike create endpoint.
- `sessionType` and `status` are strings in history DTO.
- `resultImageUrl` may point to a GLB scene rather than image.

Potential improvement:

- If history UI currently renders `resultImageUrl` as `<img>`, it should be updated to detect safe `.glb`/model URLs and render with the 3D viewer or show a model link/fallback. This needs review against current history page implementation.

---

## 6. End-to-end correct user flow

### New customer with no avatar

1. User opens product and clicks try-on.
2. Try-on page checks avatar.
3. If no avatar or no `avatar3dModelUrl`, frontend sends user to `/customer/avatar/photo?returnTo=/customer/try-on/{productId}`.
4. User uploads full-body JPEG/PNG and enters height.
5. Backend extracts measurements and tries to generate 3D avatar GLB.
6. If response includes `avatar3dModelUrl`, user can return to try-on.
7. Try-on page sends:

```json
{
  "productId": "guid",
  "sessionType": 1,
  "avatarId": "guid"
}
```

8. Backend generates clothing GLB, aligns it with avatar GLB, stores a completed session, and returns `resultImageUrl` as scene GLB URL.
9. Frontend renders the GLB through `<model-viewer>`.

### Customer with manual-only avatar

1. User has height/weight/measurements saved but `avatar3dModelUrl` is null.
2. Size recommendation can work.
3. Try-on cannot work with current backend pipeline.
4. Frontend should route user to photo avatar flow.

---

## 7. Current frontend correctness assessment

### Correct after latest branch changes

- Manual avatar payload uses backend names and valid `source: "Manual"`.
- Manual avatar requires `weightKg`, matching backend validator/domain entity.
- Photo extraction uses correct multipart field names.
- Avatar response maps `shoulderWidthCm` to frontend `shoulderCm`.
- Try-on sends `sessionType: 1` (`Model3D`) and active `avatarId`.
- Try-on requires `avatar3dModelUrl` before calling backend.
- Try-on create response is normalized from `TryOnResultDto`, not incorrectly assumed to be a session DTO.
- 3D result uses safe URL validation before rendering.

### Still needs verification by running tests locally

The branch was updated to address the user-provided failing tests, but this environment did not run `npm test`. Run:

```bash
git fetch origin
git checkout customer/avatar-tryon-backend-contract
npm run lint
npm run build
npm test
```

### Potential follow-up improvements

1. Rename internal frontend variables from `resultImageUrl` to `resultModelUrl` where possible, while keeping API field compatibility.
2. Review try-on history rendering for GLB result URLs.
3. Add user-facing explanation that manual avatar supports measurements/size recommendation, but photo avatar is required for 3D try-on.
4. Consider backend change: return `VirtualTryOnSessionDto` or include `sessionId` from `POST /try-on`, because the session is created and stored but not returned by the create endpoint.
5. Consider backend change: rename `TryOnResultDto.ResultImageUrl` to `ResultModelUrl` or add an alias field to reduce confusion.

---

## 8. Reviewer checklist for another agent

Ask the reviewer to verify:

1. Does `POST /avatar` receive `heightCm`, `weightKg`, `shoulderWidthCm`, and `source: "Manual"`?
2. Does `PATCH /avatar/measurements` send a full overwrite payload, not a partial patch?
3. Does photo extraction submit `ImageFile` and `HeightCm` exactly?
4. Does frontend block try-on unless active avatar has a safe `avatar3dModelUrl`?
5. Does frontend send `sessionType: 1` for current backend 3D pipeline?
6. Does frontend handle `POST /try-on` response as `TryOnResultDto` rather than session DTO?
7. Does frontend render backend `resultImageUrl` as GLB/model URL when safe?
8. Does try-on history avoid treating GLB URLs as regular images?
9. Do all updated tests pass after changing the contract expectations?
