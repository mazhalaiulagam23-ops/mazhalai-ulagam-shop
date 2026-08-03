# Mazhalai Ulagam AI Platform

refer above image i need same,Mazhalai Ulagam — Lovable AI Build Prompts

Step 1 — Create the website foundation

Create a modern, professional, responsive e-commerce website named Mazhalai Ulagam for baby products, return gifts, toys, educational toys, baby gear, kids fashion, organic baby care, and stationery in Coimbatore, Tamil Nadu.

Use the attached reference image only for visual inspiration. Do not copy its code, images, or logo.

Brand style:

Premium, warm, child-friendly and trustworthy

Main colours: coral/baby pink, teal green, soft yellow/gold, white, and very light pastel backgrounds

Rounded cards, soft shadows, clear typography, simple child-friendly icons

Fully responsive on mobile, tablet, and desktop

Use original placeholder product images that can be replaced later

Build a fast, clean, SEO-friendly structure

Create these public pages and routes:

Home

Shop / All Products

Category pages

Baby Products

Return Gifts

Toys & Games

Educational Toys

Baby Gear

Kids Fashion

Organic Baby Care

Stationery

Offers

About Us

Contact Us

FAQ

Blog / Parenting Tips

Shipping Policy

Returns & Refunds

Privacy Policy

Terms & Conditions

My Account

Wishlist

Cart

Checkout

Order Tracking

Create a polished header with:

Coimbatore, Tamil Nadu location

Phone, email, Instagram, Facebook, WhatsApp

Search bar

Account, wishlist and cart icons

Category navigation with working internal links

Create a polished footer with:

Internal page links

Contact details

Social links

Newsletter form

Payment-method icons

WhatsApp order button

Copyright area

Do not build the admin panel yet. First complete the public frontend structure, routing, header, footer and design system.

Step 2 — Create the homepage and shopping experience

Now build the complete homepage for Mazhalai Ulagam.

Include these sections in this order:

Hero banner carousel with editable title, subtitle, image, call-to-action button and optional countdown timer.

Featured product categories with icons and internal links.

Trust strip: Safe Products, Secure Payments, Fast Delivery, Easy Returns.

Best Sellers product grid.

New Arrivals product grid.

Special Offers product grid.

Promotional banners for Return Gifts and Newborn Essentials.

Customer testimonials.

Newsletter signup.

Instagram-style social gallery.

Blog article previews for SEO.

Build working product cards with:

Product image

Product name

Regular price and sale price

Discount badge

Star rating and review count

Add to Cart button

Wishlist button

Quick View button

Product category link

Create product listing pages with:

Search

Category filter

Price filter

Age-group filter

Sort by price, popularity, newest and discount

Pagination

Empty search state

Create a detailed product page with:

Multiple product images

Product name, ratings, price, discount and stock status

Quantity selector

Add to Cart and Buy Now buttons

Wishlist button

Product description, specifications, shipping information and return policy

Related products

Customer reviews

SEO-friendly breadcrumbs

Make all buttons and internal links functional using realistic sample data.

Step 3 — Connect Supabase and create the secure backend

Connect this Lovable project to Supabase.

Create secure authentication and these roles:

Owner / Super Admin

Admin

Staff

Delivery Staff

Accountant

Customer

Create database tables for:

Profiles and user roles

Products

Product categories

Product images

Product variants: colour, size, pack quantity, age group

Inventory and stock movement

Orders

Order items

Customers

Customer addresses

Wishlist

Cart

Reviews

Coupons

Offers

Banners

Blog posts

Newsletter subscribers

Contact enquiries

Site settings

SEO metadata

Shipping settings

Payment records

Apply Row Level Security carefully:

Customers can view only their own account, orders, addresses, wishlist and cart.

Only authorised staff can access the admin dashboard.

Only owner/admin can manage products, pricing, offers, customers and website settings.

Do not expose private data or secret payment keys in the frontend.

Create an admin login page and a separate secure admin dashboard route.

Step 4 — Build the no-code admin panel

Build a complete, simple admin dashboard that non-technical staff can use without coding.

Dashboard overview must show:

Today’s sales

Weekly sales

Monthly sales

Total orders

New customers

Repeat customers

Customer visits

Top-selling products

Low-stock products

Revenue and estimated profit margin

Recent orders

Offer performance

Create these admin sections:

Products

Add, edit, duplicate, hide, publish and delete products

Upload multiple images

Product name, description, SKU, barcode, category, tags and brand

Cost price, selling price, sale price, profit margin, stock, GST, weight and shipping details

Product variations

SEO title, SEO description, slug and image alt text

Bulk product import/export using CSV or Excel-compatible files

Categories

Add, edit, reorder and hide categories

Category image, description and SEO settings

Orders

View orders

Update order status

Print/download invoice

View customer information

Process cancellation, return and refund status

Customers

Customer list

New and repeat customer indicators

Purchase history

Total customer spending

Customer notes

Offers and Coupons

Create percentage discount, fixed discount, Buy One Get One, free shipping and category/product-specific offers

Set offer start date and end date

Show an automatic countdown timer on public pages

Automatically disable the offer after expiry

Generate coupon code, usage limit, minimum order amount, expiry date and customer-specific coupon

Content

Edit hero banners, homepage sections, navigation menu, footer, contact details, social links and FAQ without coding

Manage blog posts and SEO details

Reports

Daily, weekly and monthly sales

Orders, revenue, product performance, customer and inventory reports

Export reports to CSV/PDF where supported

Step 5 — Inventory, barcode, payments and billing integration

Add inventory features:

Automatic stock reduction when an order is placed

Restore stock on cancelled or returned orders

Low-stock alerts in dashboard

Product barcode generation

Barcode field and barcode scanner-ready workflow for future POS use

Set up an integration-ready billing/POS area:

Build a settings page where the admin can later enter billing/POS API credentials

Support product and stock import/export in CSV format

Keep billing/POS functions modular so an actual provider can be connected later without redesigning the app

Generate GST-ready invoices with seller details, customer details, product rows, taxes and totals

Set up payment architecture:

Create payment selection UI for UPI, cards, net banking and Cash on Delivery

Add placeholders/settings for Razorpay, Cashfree or PayU integration

Do not use fake payment success. Payment success must only happen after verified provider confirmation.

Store payment status safely in the database.

Set up shipping architecture:

Pincode serviceability field

Shipping charge calculation

Tracking number field

Admin shipping status update area

Integration-ready settings area for Shiprocket or another courier provider

Step 6 — SEO, Google ranking and internal links

Implement strong on-page technical SEO.

For every product, category, page and blog post, create admin-editable:

SEO title

Meta description

URL slug

Canonical URL

Open Graph title, description and image

Image alt text

Implement:

Clean SEO-friendly URLs

XML sitemap

robots.txt

Breadcrumbs

Product schema markup

Review schema markup

FAQ schema markup

Local Business schema for Coimbatore, Tamil Nadu

Organisation schema

Canonical tags

301 redirect management area

Internal links between categories, products, related products and blog posts

Optimised images and lazy loading

Mobile-first performance improvements

Create integration settings fields for:

Google Analytics 4

Google Search Console verification

Google Tag Manager

Google Ads conversion ID

Meta Pixel ID

Meta Conversion API credentials, stored securely in backend secrets only

Track these e-commerce events:

View Content

Search

Add to Cart

Add to Wishlist

Initiate Checkout

Purchase

Create a blog system designed for organic Google ranking. Include categories such as baby care, parenting tips, return-gift ideas, educational toys and newborn essentials.

Step 7 — Final quality checks

Review the complete Mazhalai Ulagam project and fix all issues.

Check:

Every internal navigation link works

All pages are responsive and visually consistent

Cart, wishlist, checkout, login and customer account flows work

Admin permissions are secure

Admin can edit products, prices, margins, stock, offers, coupons, banners, SEO content and pages without coding

Offer timers start and end automatically

Expired offers are not shown as active

Product data is correctly connected to the database

Empty states, loading states and error messages are professional

Forms validate properly

Accessibility: readable contrast, keyboard navigation, labels and alt text

SEO headings are structured correctly with one H1 per page

No sensitive keys are exposed in frontend code

Add a short README inside the project explaining admin setup, Supabase setup, payment integration steps, billing/POS integration steps and deployment steps.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mazhalai-ulagam-shop.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/22e33238-3e33-4d9f-b59e-9dfcf6b6bb09).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
