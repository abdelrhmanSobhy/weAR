# Customer Design Reference

## Design inventory
The supplied customer PDF contains 32 pages. Use the page number below when checking visual intent.

| PDF page | Screen / state | Priority | Notes |
|---|---|---:|---|
| 1 | Customer login | Must | Existing implementation; audit against design and backend errors. |
| 2 | Sign-up step 1 | Must | Name, email, password, phone. |
| 3 | Sign-up step 2 | Must | Age, gender, create-avatar choice. |
| 4 | Manual body measurements | Must | Backend supports fewer canonical fields than the visual draft; bind only supported fields and keep unsupported fields frontend-only only when required. |
| 5 | Upload full-body picture | Must | Functional contract overrides design: one image, max 5 MB, and required height. |
| 6 | Home storefront | Must | Hero, categories, try-on promo, product collections, feature blocks, testimonials and footer. |
| 7 | Product details | Must | Product information, variants, tabs, comparison/cart affordances and recommendation sections. |
| 8 | Product listing / filters | Must | Desktop catalog state. |
| 9 | Product/card alternative state | Must | Treat as reusable card/detail state rather than a separate domain page unless routing proves otherwise. |
| 10 | Product listing alternative state | Must | Likely filtered or responsive state. |
| 11 | Product comparison | Nice | Backend supports comparing 2–4 products. |
| 12–17 | Cart and checkout steps | Nice | Build with typed local state until customer checkout/order endpoints exist. |
| 18 | Payment failed | Nice | Frontend-only status page unless a payment flow is connected later. |
| 19 | Brand/store informational page | Nice | Static presentation. |
| 20–21 | Customer account/profile states | Must | Connect profile and addresses where possible. |
| 22–25 | Order history, tracking and order details | Nice / Blocked | Swagger supplied here exposes retailer order endpoints, not a confirmed customer order API. Do not invent calls. |
| 26–27 | Wishlist states | Must | Connect Favorites endpoints. |
| 28 | Avatar account view | Must | Connect active avatar, measurements and history. |
| 29 | Avatar image upload from account | Must | One-image + height contract. |
| 30 | Avatar manual measurements from account | Must | Reuse the same avatar form used during onboarding. |
| 31 | Shipping & Returns | Nice | Static content. |
| 32 | About Us | Nice | Static content. |

## Try-on image references
The three supplied images define a separate fitting-room experience:

1. **Entry state**
   - Full-viewport curtain photograph.
   - Back action and fitting-room icon.
   - Centered title, short explanation and `Enter Room` action.

2. **Product-ready state**
   - Full-viewport fitting-room scene.
   - Customer/model centered.
   - Floating selected-product card near the lower area.
   - Primary `Try Product` action.

3. **Processing state**
   - Existing scene is blurred/dimmed.
   - Centered branded loader, progress bar, percentage and wait message.
   - The selected-product card remains visible but visually de-emphasized.

## Responsive rules
- Preserve the visual hierarchy, not fixed Figma coordinates.
- Mobile: single-column content, horizontal product carousels, drawer filters, sticky safe-area-aware actions where helpful.
- Desktop: constrained content width, multi-column product grids and persistent filter sidebar.
- Avoid embedding essential text in background images.
- Use semantic headings, labels, buttons and focus states.

## Design-token strategy
Before implementing pages, extract repeated values into existing CSS variables or customer-specific tokens:
- Warm ivory background
- Taupe/brown primary action
- Dark neutral text
- White elevated cards
- Serif display heading paired with the repository body font
- Consistent radii, shadows and spacing

Do not hard-code slightly different colors and spacing in every page.

## Contract overrides to remember
- Image avatar flow uses one full-body JPEG/PNG, maximum 5 MB, plus required `heightCm`.
- Missing extracted measurements display as `—`.
- A successful avatar response may have `avatar3dModelUrl: null`.
- Empty complementary-product responses hide the entire section.
- Try-on must remain usable through 2D fallback when 3D is unavailable.