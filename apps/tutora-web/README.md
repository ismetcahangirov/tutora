# @tutora/web — Landing Page

The public, SEO-optimized **single-page** marketing site for Tutora, built with
**Next.js (App Router)**, **Tailwind CSS v4**, and **next-intl**. Minimal, premium,
**no gradients**, and tuned for high Lighthouse scores.

## Stack

- **Next.js 16** App Router, statically rendered (SSG) per locale.
- **Tailwind CSS v4** with design tokens mirroring the shared Tutora system
  (indigo primary on slate neutrals, 16px card radius, Plus Jakarta Sans).
- **next-intl** for `az` / `en` / `ru`, locale-prefixed routing (`/az`, `/en`, `/ru`).
- Fully server-rendered sections — the only client JS is the language switcher.

## Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx      # font, metadata (OG, twitter, hreflang), JSON-LD
│   │   └── page.tsx        # composes the landing sections
│   ├── og/route.tsx        # dynamic Open Graph image (next/og)
│   ├── sitemap.ts          # locale-aware sitemap with hreflang alternates
│   ├── robots.ts           # robots.txt
│   ├── manifest.ts         # PWA manifest
│   ├── icon.svg            # favicon / brand mark
│   └── globals.css         # design tokens + Tailwind
├── features/landing/       # section components (hero, benefits, faq, …)
├── shared/
│   ├── components/         # reusable UI atoms (Button, Card, Section, …)
│   └── seo/                # structured data + URL helpers (unit-tested)
├── i18n/                   # next-intl routing / request config
└── messages/               # az / en / ru catalogs (kept in key parity)
```

## Sections

Hero · Problem/Solution · How It Works · Key Advantages · Platform Stats ·
Benefits (tutors) · Benefits (students) · App Screens · Testimonials · FAQ ·
Blog Preview · Call To Action · Footer.

## SEO

- Per-locale `<title>`, description, keywords, canonical, and `hreflang` alternates.
- Open Graph + Twitter cards with a generated brand image (`/og`).
- `Organization`, `WebSite`, and `FAQPage` JSON-LD.
- `sitemap.xml`, `robots.txt`, and a PWA manifest.

## Scripts

```bash
pnpm dev        # dev server
pnpm build      # production build (SSG)
pnpm start      # serve the production build
pnpm lint       # eslint
pnpm typecheck  # tsc --noEmit
pnpm test       # vitest (seo helpers + catalog/nav integrity)
```

## Environment

All public and optional-with-defaults (see `src/shared/config/env.ts`):

| Variable                  | Default                 | Purpose                              |
| ------------------------- | ----------------------- | ------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`    | `https://tutora.az`     | Canonical origin (metadata, sitemap) |
| `NEXT_PUBLIC_API_URL`     | `http://localhost:3000` | Backend API base                     |
| `NEXT_PUBLIC_IOS_URL`     | `#`                     | App Store link (until published)     |
| `NEXT_PUBLIC_ANDROID_URL` | `#`                     | Google Play link (until published)   |
