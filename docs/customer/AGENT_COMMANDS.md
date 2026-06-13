# Low-Token Agent Command Sequence

Use one command at a time. Do not send the full PDF, Swagger and all commands on every run. The agent should read only the named repository references.

## Command 00 — audit only
```text
Work in repository abdelrhmanSobhy/weAR on a new branch customer/foundation created from customer-implementation-plan.
Read docs/customer/CUSTOMER_SHARED_CONTEXT.md, CUSTOMER_FEATURE_MATRIX.md and CUSTOMER_IMPLEMENTATION_PLAN.md.
Audit the current customer frontend and reusable shared/retailer primitives. Do not implement UI yet.
Run build, lint and tests. Report:
1. existing customer routes/files,
2. reusable components/utilities,
3. baseline failures,
4. exact proposed file changes for foundation,
5. conflicts with the docs.
Do not modify unrelated retailer/admin behavior. End after the report.
```

## Command 01 — foundation and routing
```text
Continue on customer/foundation after approval.
Read CUSTOMER_SHARED_CONTEXT.md and Phase 0–1 of CUSTOMER_IMPLEMENTATION_PLAN.md.
Implement customer-specific selectors/types, normalized customer API errors, customer route constants, nested CustomerLayout skeleton and redirects from /customer and /customer/dashboard to /customer/home.
Remove CustomerOnboardingPage from normal routing, but do not delete the file unless no references remain.
Preserve retailer auth and route behavior.
Add focused route/selector tests. Run build, lint and tests.
Report changed files, commands, failures and remaining risks. Do not build catalog pages yet.
```

## Command 02 — shared customer shell
```text
Create branch customer/storefront-shell from the approved customer/foundation branch.
Read CUSTOMER_SHARED_CONTEXT.md and CUSTOMER_DESIGN_REFERENCE.md sections for page 6 and responsive rules.
Implement the reusable customer announcement bar, header, desktop/mobile navigation, content container and footer using existing project primitives and centralized design tokens.
Add placeholder route pages only where required to verify navigation; do not implement feature content.
Ensure keyboard navigation, mobile menu focus behavior and responsive layout.
Run build, lint and focused tests. Report screenshots needed for review and changed files.
```

## Command 03 — customer API layer and product primitives
```text
Continue on customer/storefront-shell or create customer/catalog from its approved head.
Read CUSTOMER_API_REFERENCE.md sections Catalog and Favorites plus Phase 2 of CUSTOMER_IMPLEMENTATION_PLAN.md.
Implement typed catalog/favorites API adapters, query keys and hooks through existing apiClient. No raw axios calls inside pages.
Create reusable ProductCard, ProductGrid, ProductRail, PriceDisplay, loading skeleton, empty state and API error state.
Favorite mutations must use optimistic update with rollback and invalidate affected queries.
Add tests for envelope parsing, query parameters and favorite rollback.
Do not implement full pages yet. Run build, lint and tests.
```

## Command 04 — home and shop
```text
On customer/catalog, read CUSTOMER_DESIGN_REFERENCE.md pages 6, 8 and 10 and CUSTOMER_API_REFERENCE.md Catalog.
Implement /customer/home and /customer/shop using the shared shell and product primitives.
Home: hero/static marketing sections plus real categories, offers and product rails where endpoints support them.
Shop: URL-synchronized search, sort, filters and pagination; desktop sidebar and mobile drawer.
Handle loading, empty and retry states. Do not hard-code customer or retailer IDs.
Do not invent API fields. Add focused interaction/query tests and run build/lint/tests.
```

## Command 05 — product details and recommendations
```text
On customer/catalog, read CUSTOMER_DESIGN_REFERENCE.md page 7, CUSTOMER_API_REFERENCE.md Catalog/Avatar/Outfits and ThreeEndpoint integration notes summarized there.
Implement /customer/products/:productId with images, product data, supported variants, favorite action, size recommendation, similar products and complementary products.
Hide complementary section silently for empty data, 404 or graceful AI degradation.
Reuse ProductCard and common states. Keep cart action behind the future local cart adapter if not yet implemented.
Add tests for discount rendering, empty complementary section, favorite action and size-recommendation fallback. Run build/lint/tests.
```

## Command 06 — profile, addresses and avatar APIs
```text
Create branch customer/profile-avatar from approved customer/catalog.
Read CUSTOMER_API_REFERENCE.md Profile/Addresses/Avatar, CUSTOMER_DESIGN_REFERENCE.md pages 4,5,20,21,28,29,30, and CUSTOMER_SHARED_CONTEXT.md.
Implement typed profile, addresses and avatar API adapters/query hooks first.
Create one shared measurement schema/form usable for create and update. Bind only backend-supported canonical fields unless a field is explicitly frontend-only.
Photo extraction must use one JPEG/PNG <=5 MB plus required heightCm, browser-generated multipart boundary, null measurement display as em dash, and avatar3dModelUrl-null fallback.
Add tests for validation, FormData, customer identity and 404 no-avatar handling. Do not implement try-on yet.
```

## Command 07 — account and avatar pages
```text
Continue on customer/profile-avatar.
Implement /customer/account, /customer/account/addresses, /customer/avatar, /customer/avatar/manual and /customer/avatar/photo using the adapters and shared forms from Command 06.
Include profile update, address CRUD/default state, avatar summary/history, manual create/update, delete confirmation and image-extraction review/retry.
Preserve intended return route when avatar setup was opened as a try-on prerequisite.
Match the design hierarchy while prioritizing current backend contracts.
Run build/lint/tests and report any unsupported design measurements separately.
```

## Command 08 — Try-on phase 1
```text
Create branch customer/try-on-2d from approved customer/profile-avatar.
Read TRY_ON_FLOW.md, CUSTOMER_SHARED_CONTEXT.md and the supplied try-on visual states summarized in CUSTOMER_DESIGN_REFERENCE.md.
Implement typed try-on API/hooks and an explicit state-machine-driven /customer/try-on flow:
entry -> product-ready -> submitting/processing -> completed-2d or recoverable error.
Use authenticated customer ID and Overlay2D first. Preserve product selection on retry. Require an avatar and route to setup with return state when missing.
Reproduce the curtain entry, fitting-room product card and blurred processing overlay without fixed-screen-coordinate hacks.
Do not add a 3D library yet.
Add state transition, duplicate-submit, fallback and auth tests. Run build/lint/tests.
```

## Command 09 — local cart and checkout
```text
Create branch customer/local-cart-checkout from approved customer/try-on-2d.
Read CUSTOMER_SHARED_CONTEXT.md backend gaps policy and CUSTOMER_DESIGN_REFERENCE.md pages 12–18.
Implement a typed persisted Zustand cart and presentational cart/checkout routes. Use real product data and customer addresses where available, but do not call invented checkout, payment or customer-order endpoints.
Place all unsupported behavior behind explicit frontend-only adapters/types so it can be replaced later.
Implement payment result states as local routes only.
Add cart calculation, persistence and checkout validation tests. Run build/lint/tests.
```

## Command 10 — Try-on phase 2
```text
Create branch customer/try-on-3d from approved customer/try-on-2d or latest integrated customer branch.
Read TRY_ON_FLOW.md Phase 2 only.
First inspect bundle constraints and recommend the lightest compatible GLB viewer. Implement it only after documenting the dependency choice.
The viewer must be dynamically imported after explicit Interact in 3D action, never on storefront/page load. Cap DPR at 2, use minimal lighting, dispose WebGL resources on unmount, and retain 2D fallback for null/failed GLB.
Add a test proving the viewer module is not requested before interaction. Add IndexedDB/service-worker caching only after viewer stability and keep cache logic isolated.
Run production build and report bundle-size impact.
```

## Command 11 — optional pages and final audit
```text
Create branch customer/polish from the latest approved integrated customer branch.
Read CUSTOMER_FEATURE_MATRIX.md and implement only remaining approved Nice-to-have items: comparison, saved outfits, static About, Shipping/Returns and fixture-backed Blog. Keep customer orders/tracking explicitly blocked or fixture-only until a real customer endpoint exists.
Then perform responsive, accessibility and consistency audit across all customer routes.
Run build, lint, complete tests and route smoke tests. Report:
- completed/partial/blocked features,
- backend mismatches,
- bundle warnings,
- accessibility findings,
- exact merge order for customer branches.
Do not change retailer/admin features unless fixing a proven shared regression.
```

## Compact continuation prompt
Use this between tasks instead of resending context:
```text
Continue the approved customer plan on the current branch. Read docs/customer/CUSTOMER_SHARED_CONTEXT.md and only the files named in Command NN of docs/customer/AGENT_COMMANDS.md. Review the previous commit/report, implement only that command's scope, run its required checks, and stop with a concise changed-files/tests/blockers report.
```