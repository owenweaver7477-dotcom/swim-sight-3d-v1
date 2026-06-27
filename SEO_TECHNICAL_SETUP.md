# Swim Sight 3D Technical SEO Setup

## Public Site URL

Production canonical base URL:

```text
https://swim-sight-3d-v1.vercel.app
```

Optional frontend environment override: `VITE_PUBLIC_SITE_URL`.

## Public Pages Included In Sitemap

The sitemap lives at:

```text
https://swim-sight-3d-v1.vercel.app/sitemap.xml
```

Included pages:

- `/`
- `/features`
- `/for-coaches`
- `/for-clubs`
- `/sample-report`
- `/stroke-analysis`
- `/stroke-analysis/breaststroke`
- `/stroke-analysis/freestyle`
- `/stroke-analysis/backstroke`
- `/stroke-analysis/butterfly`
- `/pricing`
- `/faq`

## Pages Intentionally Excluded

The sitemap intentionally excludes authenticated, internal, tokenised, and private routes:

- `/dashboard`
- `/analyse`
- `/ai-reviews`
- `/ai-review`
- `/ai-jobs`
- `/ai-calibration`
- `/pilot-readiness`
- `/club-settings`
- `/swimmers`
- `/performance`
- `/club-progress`
- `/swimmer-trends`
- `/reference-library`
- `/settings`
- `/shared-report/:token`
- `/join`
- `/club-onboarding`
- `/api/*`

Shared report links are private-by-link and should not be indexed.

## Robots

The robots file lives at:

```text
https://swim-sight-3d-v1.vercel.app/robots.txt
```

It allows normal crawling of public marketing pages and disallows app/internal/API/token routes.

## Structured Data

Structured data currently includes:

- Homepage: `Organization`, `WebSite`, `SoftwareApplication`
- FAQ page: `FAQPage`
- Public pages: `BreadcrumbList` where useful

No fake reviews, fake ratings, fake pricing, medical claims, body-mechanics certainty claims, or official SwimPro claims are included.

## Open Graph Image

Current image:

```text
https://swim-sight-3d-v1.vercel.app/og-swim-sight-3d.svg
```

This is a simple branded SVG card. A future PNG version is recommended because some social platforms handle PNG preview images more consistently than SVG.

## Analytics Status

Vercel Web Analytics and Vercel Speed Insights are mounted in the React app.

After deployment, confirm in Vercel:

1. Open the Vercel project.
2. Go to Analytics and Speed Insights.
3. Confirm data appears after visiting public pages.

No Google Analytics has been added.

## Google Search Console

Recommended setup:

1. Open Google Search Console.
2. Add a URL-prefix property for `https://swim-sight-3d-v1.vercel.app`.
3. Verify using the method Google provides.
4. Submit sitemap:

```text
https://swim-sight-3d-v1.vercel.app/sitemap.xml
```

5. Request indexing for the homepage after the sitemap is accepted.

## Bing Webmaster Tools

Recommended setup:

1. Open Bing Webmaster Tools.
2. Add the site `https://swim-sight-3d-v1.vercel.app`.
3. Verify using the method Bing provides.
4. Submit sitemap:

```text
https://swim-sight-3d-v1.vercel.app/sitemap.xml
```

## Vite SPA Metadata Limitation

Swim Sight 3D is currently a Vite single-page app. Public route metadata is improved with client-side title, description, canonical, Open Graph, Twitter, and robots tags, and the static app shell has safe default metadata.

Future SEO improvements may include static prerendering or server-side rendering so every public route returns route-specific metadata before JavaScript runs.
