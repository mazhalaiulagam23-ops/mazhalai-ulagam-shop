# Mobile responsiveness optimization

## Scope
Optimize the existing storefront specifically for 360px, 375px, 390px, and 414px phone widths while preserving the current branding, content, behavior, and desktop/tablet presentation.

## Changes
- Remove horizontal overflow and add iPhone safe-area support at the document, sticky header, fixed widget, cookie banner, and new bottom-navigation edges.
- Simplify the phone header layout without changing its visual identity; retain the menu, logo, and search while moving primary account/cart/wishlist access into a mobile bottom navigation.
- Keep two-column product grids where usable, but tighten mobile card spacing, typography, badges, prices, image actions, and purchase buttons so content does not clip and tap targets remain comfortable.
- Replace the always-expanded mobile shop filters with an accessible filter drawer and make sorting and pagination fit narrow widths.
- Reflow cart rows, product-detail controls/thumbnails/tabs, checkout fields/payment text/order summary, footer newsletter, and empty states for narrow screens.
- Make chat controls and fixed chat/social elements safe-area aware and prevent them from colliding with the mobile bottom navigation.
- Keep product/banner images in stable aspect-ratio containers with object-fit behavior.

## Verification
- Test `/`, `/shop`, `/cart`, `/wishlist`, `/product/...`, `/checkout`, `/auth`, and `/ai-chat` at all four requested widths.
- Confirm document width never exceeds viewport width, fixed elements do not overlap, controls have practical touch targets, and tablet/desktop breakpoints remain unchanged.
- Check the current preview build and runtime logs after implementation.
