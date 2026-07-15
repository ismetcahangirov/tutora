<div align="center">

# Tutora

**Find a trusted tutor in minutes — not weeks.**

Tutora is a modern platform that connects students and parents with trusted tutors through an intelligent, fast, and transparent matching experience. Tutors get a steady, predictable stream of students without relying on social media or word‑of‑mouth.

[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-4F46E5)](#)
[![Mobile](https://img.shields.io/badge/mobile-React%20Native%20%2B%20Expo-4F46E5)](#)
[![Backend](https://img.shields.io/badge/backend-NestJS%20%2B%20PostgreSQL-4338CA)](#)
[![License](https://img.shields.io/badge/license-Proprietary-0F172A)](#license)
[![Conventional Commits](https://img.shields.io/badge/commits-Conventional-16A34A)](https://www.conventionalcommits.org/)

</div>

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [The Problem](#the-problem)
3. [The Solution](#the-solution)
4. [Target Audience](#target-audience)
5. [Key Advantages](#key-advantages)
6. [Brand Principles](#brand-principles)
7. [Features](#features)
8. [Tech Stack](#tech-stack)
9. [System Architecture](#system-architecture)
10. [Repository & Naming](#repository--naming)
11. [Folder Structure](#folder-structure)
12. [Design System](#design-system)
13. [Localization](#localization)
14. [Authentication](#authentication)
15. [Landing Page](#landing-page)
16. [Coding Standards](#coding-standards)
17. [Git Strategy](#git-strategy)
18. [Getting Started](#getting-started)
19. [Environment Variables](#environment-variables)
20. [Scripts](#scripts)
21. [Testing](#testing)
22. [Roadmap](#roadmap)
23. [Contributing](#contributing)
24. [License](#license)

---

## Project Overview

**Project Name:** Tutora

Tutora is a mobile‑first marketplace that helps parents and students find the **right tutor** based on their **budget, district, subject, schedule, teaching format, and other criteria** — in a matter of minutes. Instead of scrolling through disorganized social media posts, users get a curated, comparable, and trustworthy list of verified tutors.

For tutors, Tutora removes the dependency on personal networks and social‑media marketing. Verified tutors receive a **consistent, predictable flow of student applications** and can manage their profile, schedule, pricing, and reputation from a single place.

> **Vision:** Become the default, trusted way to find and book a tutor in the region — and a scalable foundation for international expansion.

---

## The Problem

Today, finding a tutor is slow, opaque, and unreliable. Discovery happens through:

- **Facebook groups**
- **Instagram advertisements**
- **Telegram groups**
- **Word‑of‑mouth / personal connections**

These channels share the same structural problems:

| Problem                                 | Impact                                           |
| --------------------------------------- | ------------------------------------------------ |
| ❌ No way to **compare** tutors         | Decisions are made blindly                       |
| ❌ Pricing is **not transparent**       | Hidden or inconsistent costs                     |
| ❌ **Trust is unknown**                 | No verification of identity or credentials       |
| ❌ **No real reviews**                  | Reputation is anecdotal                          |
| ❌ **No filtering system**              | Impossible to narrow by district, price, subject |
| ❌ **Wasted time**                      | Days or weeks to find someone suitable           |
| ❌ Finding a **reliable tutor is hard** | High risk, low confidence                        |

Tutora is designed to eliminate every one of these problems.

---

## The Solution

Tutora provides a single, structured platform where:

- **Students & parents** search, filter, compare, and contact verified tutors, read real reviews, and shortlist favorites — fast.
- **Tutors** build a rich, verified profile (certificates, experience, languages, formats, schedule, pricing) and receive a steady stream of qualified applications.
- **Admins** operate the entire marketplace: verification, moderation, content, payments, analytics, and system health from an enterprise admin panel.

Everything is transparent by design: **prices are visible, credentials are verified, and reviews are real.**

---

## Target Audience

- **Parents** looking for reliable tutors for their children.
- **Students** (high‑school, university, exam‑prep) searching for subject help.
- **Tutors** who want a steady student pipeline without social‑media marketing.
- **Education centers / independent teachers** wanting a verified online presence.

---

## Key Advantages

- 🔎 **Powerful filtering** — district, subject, price, rating, online/offline, language.
- ⚖️ **Side‑by‑side tutor comparison.**
- ✅ **Verified tutors** with certificate and identity checks.
- ⭐ **Real, moderated reviews** and ratings.
- 💬 **In‑app chat** between students and tutors.
- 💸 **Transparent pricing.**
- ⚡ **Fast matching** — minutes, not weeks.
- 🌍 **Multi‑language** (Azerbaijani, English, Russian) and internationalization‑ready.
- 🛡️ **Enterprise‑grade security, moderation, and admin tooling.**

---

## Brand Principles

Tutora as a brand is intentionally:

- **Short** — easy to say and type.
- **Memorable** — sticks after one exposure.
- **Modern** — contemporary product feel.
- **Premium** — polished, high‑quality experience.
- **Trustworthy** — safety and verification at the core.
- **Scalable** — built to grow across markets.
- **International‑ready** — suitable for future global expansion.

> **Naming rule:** All documentation, code, repository names, package names, environment variables, application titles, and branding must consistently use the name **“Tutora”**.

---

## Features

### Authentication

- **Google Login** (primary, OAuth 2.0)
- **Email Login** (planned / future)
- **JWT Authentication** (short‑lived access tokens)
- **Refresh Tokens** (secure rotation)
- **Secure Session** management (Expo Secure Store on device, httpOnly on web/admin)
- **Role‑based access** — Student, Tutor, Admin
- **Account lifecycle** — onboarding, role selection, profile completion, deactivation

### Student

- 🔎 **Tutor search** with fast, debounced results
- 🗺️ **Filter by district**
- 📚 **Filter by subject**
- 💰 **Price filter** (min/max range)
- ⭐ **Rating filter**
- 🌐 **Online / Offline filter**
- 🗣️ **Teaching language filter**
- ❤️ **Favorites** (save & compare later)
- 👤 **Student profile** & preferences
- 🔔 **Notifications** (push + in‑app)
- 💬 **Chat** with tutors
- 📝 **Write reviews** & ratings (post‑session)
- ⚖️ **Tutor comparison** (side‑by‑side)
- 📄 **Tutor detail pages** with certificates, experience, schedule, pricing
- 🧾 **Application / request** to a tutor
- 🕘 **Recent searches & search history**

### Tutor

- 🧑‍🏫 **Create & manage profile**
- 📜 **Add certificates** (with verification)
- 🧠 **Experience & specializations**
- 🗣️ **Teaching languages**
- 🎓 **Lesson formats** (online / in‑person / at student’s home / at tutor’s place)
- 🗓️ **Availability & schedule**
- 💵 **Pricing** (per subject / per format)
- 📊 **Statistics** (profile views, applications, conversion, ratings)
- 📥 **Incoming applications / requests** management
- ✅ **Verification status** (pending / verified / rejected)
- 💬 **Chat** with students
- 🔔 **Notifications**
- 💳 **Subscription / plan** management (for premium visibility)

### Admin

The admin panel provides **full control** over the marketplace. Modules:

| Group             | Modules                                                       |
| ----------------- | ------------------------------------------------------------- |
| **Overview**      | Dashboard, Analytics, Monitoring                              |
| **Users**         | Users, Students, Tutors, Roles, Permissions                   |
| **Marketplace**   | Applications, Verification Requests, Reviews, Reports         |
| **Taxonomy**      | Subjects, Categories, Districts, Languages                    |
| **Engagement**    | Notifications, Push Notifications                             |
| **Content (CMS)** | Landing Page Management, FAQ Management, Blog, Media Library  |
| **Support**       | Support Tickets                                               |
| **Monetization**  | Payments, Subscription Plans, Advertisement Management        |
| **Platform**      | Feature Flags, System Settings, Email Templates, Localization |
| **Governance**    | Audit Logs, Error Logs, Security Logs                         |
| **Operations**    | Backup, Monitoring                                            |

**Detailed module responsibilities:**

- **Dashboard** — KPIs (active users, tutors, applications, revenue), trends, quick actions.
- **Users / Students / Tutors** — search, filter, view, suspend, verify, edit, impersonate (audited).
- **Applications** — track student→tutor requests and their statuses.
- **Verification Requests** — review tutor certificates/identity, approve or reject with reasons.
- **Reviews** — moderate, hide, or remove reviews; handle disputes.
- **Reports** — user reports of abuse/spam; resolution workflow.
- **Subjects / Categories / Districts / Languages** — CRUD taxonomies powering search filters.
- **Notifications / Push Notifications** — compose, segment, schedule, and send.
- **CMS / Landing Page Management** — edit hero, sections, stats, testimonials, FAQ, blog.
- **FAQ Management** — CRUD FAQ entries per locale.
- **Blog** — rich‑text posts with cover images, SEO metadata, scheduling.
- **Support Tickets** — inbound support, assignment, statuses, SLA.
- **Payments** — transactions, refunds, payout tracking.
- **Subscription Plans** — tiers, pricing, entitlements, feature gating.
- **Advertisement Management** — promoted tutors / banners with scheduling.
- **Analytics** — funnels, retention, cohort, search analytics.
- **Audit Logs** — every privileged action recorded (who / what / when).
- **Roles & Permissions** — fine‑grained RBAC.
- **Feature Flags** — progressive rollout & kill switches.
- **System Settings** — global configuration.
- **Email Templates** — transactional email content per locale.
- **Localization** — manage translation keys (az / en / ru).
- **Media Library** — centralized asset management (Cloud Storage).
- **Backup** — database backup status & restore points.
- **Monitoring** — service health, queues, jobs.
- **Error Logs / Security Logs** — observability and incident response.

---

## Tech Stack

### Mobile

`React Native (Expo)` · `TypeScript` · `Expo Router` · `NativeWind` · `Tailwind CSS` · `React Hook Form` · `TanStack Query` · `Axios` · `Zod` · `React Native Reanimated` · `React Native Gesture Handler` · `React Native MMKV` · `React Native SVG` · `React Native Bottom Sheet` · `FlashList` · `Expo Image` · `Expo Notifications` · `Expo Secure Store` · `Expo Image Picker` · `Expo Localization` · `Expo Device` · `Expo Splash Screen` · `Expo Updates` · `Expo Linking` · `Expo Haptics`

### UI / Design Layer

- **shadcn/ui‑inspired** component architecture (composition over configuration)
- **Reusable components** built with **Atomic Design** (atoms → molecules → organisms)
- **Dark mode ready**
- **Accessibility** (WCAG AA, screen‑reader labels, ≥44px tap targets)
- **Responsive design**
- **Modern, minimal UI** — **no gradients**, soft colors, premium look

### Backend

`Node.js` · `NestJS` · `PostgreSQL` · `Prisma ORM` · `Redis` · `JWT` · `Refresh Tokens` · `Google OAuth` · `Firebase` · `Cloud Storage` · `BullMQ` · `Cron Jobs` · `Swagger` · `REST API` · `Rate Limiting` · `Caching` · `class-validator + Zod` · `Pino Logging` · `Monitoring` · `Docker` · `Nginx`

### Admin Panel

`React` · `Vite` · `TypeScript` · `Tailwind CSS` · `shadcn/ui` · `TanStack Table` · `React Hook Form` · `Zod` · `TanStack Query` · `React Icons` · `Recharts` · `Tiptap (Rich Text Editor)` · `Image Upload` · `Role‑Based Access Control` · `Permission Management`

### Landing Page

`Next.js` (App Router, SSG/ISR) · `TypeScript` · `Tailwind CSS` · `shadcn/ui` · `next-seo` · `Optimized Images` · `High Lighthouse Scores`

---

## System Architecture

> Current-state overview: [`docs/architecture.md`](docs/architecture.md). The
> reasoning behind major choices is recorded as
> [Architecture Decision Records](docs/adr/README.md).

```
                         ┌────────────────────────┐
                         │      Tutora Clients      │
                         └────────────────────────┘
   ┌────────────────┐   ┌────────────────┐   ┌────────────────┐
   │  Mobile App    │   │  Admin Panel   │   │  Landing Page  │
   │ RN + Expo      │   │ React + Vite   │   │  Next.js       │
   │ (tutora)       │   │ (tutora-admin) │   │  (tutora-web)  │
   └───────┬────────┘   └───────┬────────┘   └───────┬────────┘
           │  HTTPS / REST + JWT │                    │
           └──────────┬──────────┴─────────┬──────────┘
                      ▼                     ▼
              ┌───────────────────────────────────┐
              │        Nginx (reverse proxy)       │
              └───────────────────┬───────────────┘
                                  ▼
              ┌───────────────────────────────────┐
              │        NestJS API (tutora-api)     │
              │  Auth · Users · Tutors · Students  │
              │  Search · Applications · Reviews   │
              │  Chat · Notifications · Payments   │
              │  Media · Admin · CMS               │
              └───┬───────────┬──────────┬────────┘
                  ▼           ▼          ▼
          ┌───────────┐ ┌──────────┐ ┌──────────────┐
          │PostgreSQL │ │  Redis   │ │  BullMQ jobs │
          │ (Prisma)  │ │ (cache)  │ │  + Cron      │
          └───────────┘ └──────────┘ └──────────────┘
                  │
       ┌──────────┴───────────┬───────────────┐
       ▼                      ▼               ▼
 ┌───────────┐        ┌──────────────┐  ┌──────────────┐
 │ Firebase  │        │Cloud Storage │  │ Google OAuth │
 │ (push)    │        │  (media)     │  │              │
 └───────────┘        └──────────────┘  └──────────────┘
```

See [`.claude/context/architecture.md`](.claude/context/architecture.md) for the detailed architecture guide.

---

## Repository & Naming

| Concern           | Value               |
| ----------------- | ------------------- |
| Repository name   | `tutora`            |
| Application name  | **Tutora**          |
| Bundle identifier | `com.tutora.mobile` |
| Mobile package    | `tutora`            |
| Admin panel       | `tutora-admin`      |
| Landing page      | `tutora-web`        |
| Backend API       | `tutora-api`        |

---

## Folder Structure

> Tutora uses a **feature‑first** structure across every surface. Below are enterprise‑ready layouts for each application.

### Mobile — `tutora` (React Native + Expo, Expo Router)

```
tutora/
├── app/                          # Expo Router routes (file-based)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── onboarding.tsx
│   ├── (student)/
│   │   ├── (tabs)/
│   │   │   ├── home.tsx
│   │   │   ├── search.tsx
│   │   │   ├── favorites.tsx
│   │   │   ├── chat.tsx
│   │   │   └── profile.tsx
│   │   └── tutor/[id].tsx
│   ├── (tutor)/
│   │   └── (tabs)/
│   │       ├── dashboard.tsx
│   │       ├── applications.tsx
│   │       ├── schedule.tsx
│   │       └── profile.tsx
│   ├── _layout.tsx
│   └── +not-found.tsx
├── src/
│   ├── features/                 # Feature-first modules
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   ├── types/
│   │   │   └── index.ts          # barrel export
│   │   ├── search/
│   │   ├── tutor-profile/
│   │   ├── favorites/
│   │   ├── chat/
│   │   ├── reviews/
│   │   └── notifications/
│   ├── components/               # Shared UI (atoms/molecules/organisms)
│   │   ├── ui/                   # Button, Input, Card, Sheet, Toast...
│   │   └── layout/
│   ├── hooks/                    # Shared hooks
│   ├── lib/                      # axios, query client, mmkv, i18n
│   ├── services/                 # API clients / gateways
│   ├── theme/                    # colors, spacing, typography tokens
│   ├── i18n/                     # az / en / ru
│   ├── constants/
│   ├── types/
│   └── utils/
├── assets/                       # fonts, images, icons, lottie
├── app.config.ts
├── tailwind.config.js
├── babel.config.js
├── tsconfig.json
└── package.json
```

### Backend — `tutora-api` (NestJS + Prisma)

```
tutora-api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/                   # cross-cutting
│   │   ├── decorators/
│   │   ├── filters/              # exception filters
│   │   ├── guards/               # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/         # logging, transform, cache
│   │   ├── pipes/                # ZodValidationPipe
│   │   └── utils/
│   ├── config/                   # env, swagger, throttler, redis
│   ├── modules/                  # feature-first modules
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── strategies/       # google, jwt, refresh
│   │   │   └── dto/
│   │   ├── users/
│   │   ├── students/
│   │   ├── tutors/
│   │   ├── search/
│   │   ├── applications/
│   │   ├── reviews/
│   │   ├── chat/
│   │   ├── notifications/
│   │   ├── payments/
│   │   ├── subscriptions/
│   │   ├── media/
│   │   ├── cms/
│   │   └── admin/
│   ├── jobs/                     # BullMQ processors + cron
│   ├── prisma/                   # PrismaService
│   └── i18n/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── test/                         # e2e
├── Dockerfile
├── docker-compose.yml
├── nginx/
├── tsconfig.json
└── package.json
```

### Admin — `tutora-admin` (React + Vite)

```
tutora-admin/
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── router.tsx
│   │   └── providers.tsx         # QueryClient, Theme, Auth
│   ├── features/                 # feature-first
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── tutors/
│   │   ├── verification/
│   │   ├── reviews/
│   │   ├── taxonomy/             # subjects, districts, languages
│   │   ├── payments/
│   │   ├── cms/
│   │   ├── notifications/
│   │   ├── settings/
│   │   └── audit-logs/
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── data-table/           # TanStack Table wrappers
│   │   └── layout/               # Sidebar, Topbar, Shell
│   ├── hooks/
│   ├── lib/                      # api, auth, rbac, query
│   ├── routes/
│   ├── i18n/
│   ├── types/
│   └── utils/
├── public/
├── index.html
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Landing — `tutora-web` (Next.js)

```
tutora-web/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # single-page landing
│   │   ├── blog/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   └── (legal)/privacy/page.tsx
│   ├── sections/                 # Hero, Problem, HowItWorks, Stats...
│   ├── components/
│   │   └── ui/
│   ├── lib/                      # seo, analytics
│   ├── content/                  # MDX blog / FAQ (or from API)
│   ├── i18n/
│   └── styles/
├── public/                       # og images, screenshots, icons
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

Full standards live in [`.claude/context/coding-standards.md`](.claude/context/coding-standards.md).

---

## Design System

> **Design principle:** Minimal, premium, trustworthy. **No gradients anywhere.** Soft colors, generous spacing, low‑elevation shadows. Follows **Apple Human Interface Guidelines** + **Material Design 3**. Dark‑mode ready. Accessible.

### Color Palette

**Light theme**

| Token           | HEX                  | Usage                       |
| --------------- | -------------------- | --------------------------- |
| Primary         | `#4F46E5`            | Primary actions, brand      |
| Primary Dark    | `#4338CA`            | Pressed / emphasis          |
| Primary Light   | `#EEF2FF`            | Tinted backgrounds          |
| Secondary       | `#0EA5E9`            | Secondary accents           |
| Accent          | `#F59E0B`            | Highlights (used sparingly) |
| Background      | `#FFFFFF`            | App background              |
| Surface         | `#F8FAFC`            | Elevated surfaces           |
| Card            | `#FFFFFF`            | Cards                       |
| Border          | `#E2E8F0`            | Borders                     |
| Divider         | `#EEF2F6`            | Dividers                    |
| Text Primary    | `#0F172A`            | Primary text                |
| Text Secondary  | `#64748B`            | Secondary text              |
| Muted / Neutral | `#94A3B8`            | Muted text, icons           |
| Success         | `#16A34A`            | Success states              |
| Warning         | `#F59E0B`            | Warnings                    |
| Danger          | `#DC2626`            | Errors / destructive        |
| Info            | `#2563EB`            | Informational               |
| Disabled        | `#CBD5E1`            | Disabled states             |
| Overlay         | `rgba(15,23,42,0.5)` | Modal/scrim overlay         |

**Dark theme**

| Token          | HEX       |
| -------------- | --------- |
| Background     | `#0B1120` |
| Surface        | `#111827` |
| Card           | `#1E293B` |
| Border         | `#334155` |
| Text Primary   | `#F8FAFC` |
| Text Secondary | `#94A3B8` |
| Primary        | `#6366F1` |

### Typography

**Font:** **Plus Jakarta Sans** (primary), fallback **Inter** — via Google Fonts.

| Style      | Size / Line height | Weight |
| ---------- | ------------------ | ------ |
| Display    | 32 / 40            | 700    |
| Headline   | 28 / 36            | 700    |
| Title      | 22 / 28            | 600    |
| Subtitle   | 18 / 26            | 600    |
| Body       | 16 / 24            | 400    |
| Body Small | 14 / 20            | 400    |
| Label      | 13 / 16            | 500    |
| Caption    | 12 / 16            | 400    |
| Button     | 15 / 20            | 600    |

### Radius & Spacing

- **Radius (px):** `xs 6` · `sm 8` · `md 12` · `lg 16` · `xl 20` · `2xl 24` · `full 999`. Default card radius **16**.
- **Spacing (4pt grid, px):** `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`.
- **Shadow:** soft, low‑elevation only (e.g. `0 1px 2px rgba(15,23,42,0.06)`, `0 4px 12px rgba(15,23,42,0.08)`).
- **Icon sizes (px):** `16 · 20 · 24 · 28`.
- **Animation:** Reanimated; durations 150–300ms; easing `ease-out` / spring for gestures.

The complete UI/UX guide (buttons, inputs, cards, loading, skeletons, bottom sheets, toasts, modals, FAB, search, filter) is in [`.claude/context/ui-guidelines.md`](.claude/context/ui-guidelines.md).

---

## Localization

Tutora ships with **three languages**:

- 🇦🇿 **Azerbaijani** (`az`) — default
- 🇬🇧 **English** (`en`)
- 🇷🇺 **Russian** (`ru`)

**i18n architecture**

- **Mobile:** `i18next` + `react-i18next` + `expo-localization` for device‑locale detection; persisted with MMKV.
- **Web / Admin:** `i18next` (or `next-intl` for landing) with locale routing.
- **Backend:** `nestjs-i18n` for localized emails, notifications, and validation messages.
- **Rule:** **No hardcoded user‑facing strings.** Every string is a translation key. Keys are namespaced per feature (e.g. `search.filter.district`).
- **Admin CMS** exposes translation‑key management so non‑developers can update copy per locale.

```
i18n/
├── az/
│   ├── common.json
│   ├── auth.json
│   └── search.json
├── en/
└── ru/
```

---

## Authentication

- **Google Authentication** is mandatory (primary sign‑in).
- **Email login** is planned for a later phase.
- **JWT** access tokens (short‑lived) + **Refresh Tokens** (rotated, revocable).
- **Role‑Based Authentication:** `Student`, `Tutor`, `Admin`.
- Access tokens stored in **Expo Secure Store** on mobile; httpOnly cookies for web/admin.
- **Guards** (`JwtAuthGuard`, `RolesGuard`) protect every non‑public endpoint on the backend.
- Role is selected during onboarding and enforced on both client and server.

```
Client ──(Google ID token)──▶ tutora-api ──verify──▶ Google
      ◀──(access + refresh)──
Client ──(access token)─────▶ protected routes (JwtAuthGuard + RolesGuard)
Client ──(refresh token)────▶ /auth/refresh ──▶ new access + rotated refresh
```

---

## Landing Page

A dedicated, SEO‑optimized **single‑page** landing at `tutora-web` (Next.js). Sections:

1. **Hero** — value proposition + primary CTA
2. **Problem & Solution**
3. **How It Works**
4. **Key Advantages**
5. **Platform Statistics**
6. **Benefits for Tutors**
7. **Benefits for Students**
8. **App Screens** (screenshots)
9. **User Testimonials**
10. **FAQ**
11. **Blog Preview**
12. **Call To Action**
13. **Footer**

**Requirements:** SEO‑optimized (metadata, Open Graph, structured data, sitemap), fully responsive, **high Lighthouse scores** (Performance/Accessibility/Best‑Practices/SEO ≥ 90), **no gradients**, premium & minimalist design.

---

## Coding Standards

Tutora enforces modern, professional standards across all codebases:

- **Clean Architecture** · **SOLID** · **DRY** · **KISS**
- **Feature‑First** structure
- **Absolute imports** + **Barrel exports** (`@/features/...`)
- **Reusable** components, hooks, and services
- **Generic, strong TypeScript** (no `any`; explicit return types on public APIs)
- **ESLint** + **Prettier** + **Husky** + **lint‑staged**
- **Conventional Commits**
- Components should stay focused and small (**< 300 lines** when avoidable)
- **No inline business logic** in components; extract to hooks/services
- **No magic numbers / hardcoded strings** — use constants and i18n keys

Full details: [`.claude/context/coding-standards.md`](.claude/context/coding-standards.md) and [`CLAUDE.md`](CLAUDE.md).

---

## Git Strategy

### Branches

- **`main`** — production. **Protected.**
- **`develop`** — integration. **Protected.**
- **Feature branches** — one per task, branched from up‑to‑date `main`/`develop`.

**Before starting any task:**

```bash
git checkout main
git pull origin main
git checkout -b feature/<scope>
```

**Branch naming:**

```
feature/auth-google
feature/search-filter
feature/tutor-profile
feature/admin-dashboard
bugfix/login
hotfix/payment
refactor/home
docs/readme
chore/dependencies
style/profile-ui
test/auth
```

### Commit Convention

[Conventional Commits](https://www.conventionalcommits.org/):

```
feat:      a new feature
fix:       a bug fix
refactor:  code change that neither fixes a bug nor adds a feature
docs:      documentation only
test:      adding or correcting tests
style:     formatting, no logic change
build:     build system or dependencies
ci:        CI configuration
perf:      performance improvement
chore:     maintenance
```

### Pull Requests

1. Open a **Draft PR** early.
2. Request **Code Review**.
3. Obtain **approval**.
4. **Squash merge**.
5. **Delete the branch**.

PRs must use the [Pull Request template](.github/PULL_REQUEST_TEMPLATE.md) and satisfy the Definition of Done.

### GitHub Labels

`feature` · `bug` · `priority: high` · `priority: medium` · `priority: low` · `documentation` · `refactor` · `testing` · `ui` · `ux` · `backend` · `frontend` · `mobile` · `admin` · `api` · `database` · `performance` · `security` · `blocked` · `ready for review` · `in progress` · `done` · `duplicate` · `help wanted` · `good first issue` · `question`

Create them all with:

```bash
bash scripts/setup-labels.sh        # macOS/Linux
pwsh scripts/setup-labels.ps1       # Windows
```

Templates: [Issue templates](.github/ISSUE_TEMPLATE) · [PR template](.github/PULL_REQUEST_TEMPLATE.md) · [CODEOWNERS](.github/CODEOWNERS).

Full workflow: [`.claude/context/git-workflow.md`](.claude/context/git-workflow.md).

---

## Getting Started

> **This is a pnpm + Turborepo monorepo** — one `pnpm install` at the root sets up
> every app. The snippets below are a quick reference; the authoritative,
> step-by-step local setup (with troubleshooting) is
> [`docs/onboarding.md`](docs/onboarding.md).

### Prerequisites

- **Node.js** ≥ 20, **pnpm** ≥ 9 (or npm/yarn)
- **PostgreSQL** ≥ 15, **Redis** ≥ 7
- **Docker** & **Docker Compose** (recommended for backend)
- **Expo CLI** / **EAS CLI** (mobile)
- A **Google OAuth** client and **Firebase** project

### Backend — `tutora-api`

```bash
cd tutora-api
pnpm install
cp .env.example .env
docker compose up -d            # Postgres + Redis
pnpm prisma migrate dev
pnpm prisma db seed
pnpm start:dev                  # http://localhost:3000  (Swagger at /docs)
```

### Mobile — `tutora`

```bash
cd tutora
pnpm install
cp .env.example .env
pnpm start                      # Expo dev server
# press i (iOS) / a (Android)
```

### Admin — `tutora-admin`

```bash
cd tutora-admin
pnpm install
cp .env.example .env
pnpm dev                        # http://localhost:5173
```

### Landing — `tutora-web`

```bash
cd tutora-web
pnpm install
cp .env.example .env
pnpm dev                        # http://localhost:3001
```

---

## Environment Variables

> Never commit secrets. All variables are read from `.env` and validated at startup (Zod). Prefix all Tutora‑specific variables consistently.

**Backend (`tutora-api`)**

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/tutora
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
CLOUD_STORAGE_BUCKET=...
```

**Mobile (`tutora`)**

```env
EXPO_PUBLIC_API_URL=https://api.tutora.app
EXPO_PUBLIC_GOOGLE_CLIENT_ID=...
```

**Admin / Web**

```env
VITE_API_URL=https://api.tutora.app        # admin
NEXT_PUBLIC_API_URL=https://api.tutora.app # web
```

---

## Scripts

Common scripts (per package):

```bash
pnpm dev            # start dev server
pnpm build          # production build
pnpm lint           # ESLint
pnpm format         # Prettier
pnpm typecheck      # tsc --noEmit
pnpm test           # unit tests
pnpm test:e2e       # end-to-end tests
```

---

## Testing

- **Unit** — Jest (backend), Jest + React Native Testing Library (mobile), Vitest + React Testing Library (admin/web).
- **E2E** — Supertest (API), Detox/Maestro (mobile), Playwright (admin/web).
- **Coverage** — critical paths (auth, search, applications, payments) must be covered.
- Bug fixes ship with a **regression test**. See the TDD workflow in [`CLAUDE.md`](CLAUDE.md).

---

## Roadmap

- [ ] **MVP:** Auth (Google), tutor search + filters, tutor profiles, favorites, reviews, chat.
- [ ] **Tutor tools:** verification, schedule, pricing, statistics.
- [ ] **Admin:** dashboard, verification, moderation, taxonomy.
- [ ] **Monetization:** subscriptions, promoted tutors, payments.
- [ ] **Growth:** push campaigns, blog/CMS, referrals.
- [ ] **Scale:** internationalization, additional markets.

---

## Contributing

See **[`CONTRIBUTING.md`](CONTRIBUTING.md)** for the full guide. In short:

1. Pick or open an issue.
2. `git checkout main && git pull` → create a `<type>/<description>` branch.
3. Follow the [coding standards](.claude/context/coding-standards.md) and [`CLAUDE.md`](CLAUDE.md).
4. Open a **Draft PR** using the template; request review.
5. Ensure lint, types, and tests pass; satisfy the **Definition of Done**.
6. Squash‑merge after approval and delete the branch.

New here? Start with the [onboarding guide](docs/onboarding.md).

---

## License

Proprietary — © Tutora. All rights reserved. Unauthorized copying, distribution, or use is prohibited.

---

<div align="center">

**Tutora** — Find a trusted tutor in minutes.

</div>
