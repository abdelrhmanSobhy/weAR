# Customer Frontend Implementation Plan

## Delivery strategy
Work in small reviewable tasks. Every implementation task must begin by reading:
- `CUSTOMER_SHARED_CONTEXT.md`
- The relevant section of `CUSTOMER_API_REFERENCE.md`
- The relevant screen rows in `CUSTOMER_DESIGN_REFERENCE.md`
- The previous task's completion report

Do not ask an agent to re-read the full PDF and Swagger for every task.

## Phase 0 — audit and foundation
1. Run build, lint and tests; record baseline failures without masking them.
2. Inventory reusable layout, typography, buttons, cards, dialogs, forms, skeletons and API utilities.
3. Create customer route constants and query-key conventions.
4. Introduce customer-specific profile selectors/types without breaking retailer auth.
5. Normalize customer API error/envelope handling.

**Exit:** no visual redesign; foundation tests pass and existing retailer behavior is unchanged.

## Phase 1 — storefront shell and routes
1. Add protected nested `CustomerLayout`.
2. Build responsive announcement bar, header/navigation, mobile menu and footer.
3. Replace `ComingSoonPage` and placeholder routing.
4. Redirect `/customer` and `/customer/dashboard` to `/customer/home`.
5. Remove customer onboarding from the normal entry flow because it is absent from the approved design.

**Exit:** all planned routes render through a consistent shell and role guards still work.

## Phase 2 — API domain layer and primitives
1. Catalog API/types/query keys/hooks.
2. Favorites API/hooks.
3. Profile and addresses API/hooks.
4. Avatar API/hooks and shared measurement schema.
5. Try-on API/types/query keys.
6. Reusable product card, price display, product grid, horizontal rail, state panels and skeletons.

**Exit:** domain hooks are independently testable and no page performs raw axios calls.

## Phase 3 — core shopping experience
1. Home using categories, offers and product collections.
2. Shop with URL-synchronized search/filter/sort/page state.
3. Product details with variants and size recommendation.
4. Similar products.
5. Complementary products with silent empty-state hiding.
6. Favorites integration across all cards and details.

**Exit:** customer can browse, filter, open product details and manage wishlist using real APIs.

## Phase 4 — profile and avatar
1. Customer account/profile.
2. Address CRUD and default address.
3. Avatar overview and history.
4. Manual measurement create/update.
5. Photo extraction: one image, max 5 MB, required height.
6. Extracted-value review, null display and retry/edit flow.

**Exit:** customer can establish and maintain an avatar required by try-on.

## Phase 5 — Try-on phase 1
1. Entry/reference-image visual state.
2. Product-ready state.
3. Explicit flow state machine.
4. Overlay2D submission and processing overlay.
5. 2D result, recovery and retry.
6. Session history where stable.

**Exit:** end-to-end 2D flow works without any 3D dependency.

## Phase 6 — local shopping flows
1. Typed persisted cart store.
2. Cart page and item editing.
3. Presentational checkout steps using real customer addresses.
4. Payment-result placeholders.
5. Explicit `frontend-only` adapter boundaries.

**Exit:** design can be demonstrated without claiming unsupported backend persistence/payment behavior.

## Phase 7 — Try-on phase 2
1. Choose the lightest viewer compatible with the current stack.
2. Add dynamically imported GLB viewer.
3. Add viewer lifecycle/disposal tests where practical.
4. Add 2D fallback and low-capability handling.
5. Add local GLB caching only after viewer stabilization.

**Exit:** 3D assets never inflate the normal storefront bundle and 2D remains functional.

## Phase 8 — optional pages and polish
1. Product comparison.
2. Saved outfits.
3. Static About and Shipping/Returns.
4. Fixture-based Blog.
5. Order UI only as clearly documented fixture/blocked work.
6. Accessibility, responsive and visual consistency pass.
7. Full build/lint/test plus route smoke test.

## Recommended branch sequence
```text
customer-implementation-plan            # documentation only
customer/foundation
customer/storefront-shell
customer/catalog
customer/profile-avatar
customer/try-on-2d
customer/local-cart-checkout
customer/try-on-3d
customer/polish
```

Each branch should be based on the latest approved customer branch, not developed in parallel when it depends on previous shared components.

## Review checkpoints
After phases 1, 3, 4 and 5:
- Compare desktop and mobile screenshots with references.
- Verify APIs against deployed backend, not Swagger assumptions alone.
- Update this plan and the feature matrix with discovered blockers.
- Do not continue to optional work while a critical customer path is broken.