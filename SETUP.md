# Independent Cope's Supply storefront
Preserves the existing logo, hero artwork, colors, categories and About text. No Shopify connections, credentials, inventory, domains or checkout are used.

## Current status
Catalog, search, inquiry cart, contact and bulk quote forms are implemented. Existing products have no confirmed prices, stock or specifications, so they are inquiry-only. No real payments can be processed. Test checkout rejects live Stripe keys and verifies test prices server-side. Checkout success is not evidence of payment or fulfillment; live order storage, verified webhooks, stock management, shipping, tax and refund handling remain future work.

## Affordable hosting
Keep GitHub as the source repository. Deploy this branch to Cloudflare Pages with no framework/build command and repository root as output directory. Pages Functions supplies /api routes. Do not move the existing domain or change DNS until the preview has been reviewed. GitHub Pages is not intended for ecommerce hosting: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
Cloudflare Pages free plan: https://www.cloudflare.com/developer-platform/products/pages/
Stripe standard pricing has no monthly/setup fees; transaction and optional service fees apply when live payments are eventually authorized: https://stripe.com/pricing
Domain registration remains a separate existing cost. Free-tier usage limits apply. No paid subscription or new account has been activated by this change.

## Inquiry setup
Create a Cloudflare D1 database dedicated to Cope's Supply, run migrations/0001_inquiries.sql, and bind it as INQUIRIES in Pages preview settings. Forms return an explicit failure until configured; no false success. Review inquiries in the authenticated D1 dashboard. Email notifications are not configured. Confirm the business contact email and a privacy notice before publication. Limit staff access; delete handled inquiries after 90 days and rate-limit rows daily. Do not expose an unauthenticated inquiry listing API.
The per-IP 60-second cooldown is a basic control. Add Cloudflare Turnstile and appropriate edge rate limits before public promotion.

## Test checkout setup
Use a dedicated Stripe sandbox for this business, separate from Shopify. Set CHECKOUT_MODE=test and STRIPE_SECRET_KEY to a sk_test_ key in Cloudflare secrets, never in GitHub. Create TEST prices, then update catalog.js with verified priceCents, priceId and available=true only for approved products. No live-payment code path exists. Only product IDs and quantities are accepted from the browser; prices are checked on the server.
Test with Stripe test cards only: https://docs.stripe.com/testing
Before live commerce: confirm actual catalog/photos/SKUs, stock, shipping regions/rates, tax requirements, business contact details, return/privacy policies, verified Stripe webhooks and durable paid-order records. Live payment support requires a separate explicitly approved change.

## Review and verification
Run npm test. Review desktop and mobile visuals using original repository assets on a Cloudflare preview. No DNS, production hosting, Shopify or main-branch changes are needed to review this draft.
