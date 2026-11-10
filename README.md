# Atul Joshi — an evolving personal portfolio

A full portfolio and owner workspace: Home, About, Experience, Projects, individual case studies, My Journey, Skills & Toolkit, Contact and Admin. Built with Next.js, TypeScript, Tailwind, Radix primitives and shadcn-style UI components.

The connected private preview runs on managed Sites with D1, R2 and ChatGPT identity. A Supabase Auth/PostgreSQL/Storage adapter and a genuine Next.js/Vercel deployment path are included. No Supabase account or Vercel credentials were supplied, so those external services are not provisioned or claimed as deployed.

## Open your workspace

Visit `/admin` on the private Site. While the Site is still owner-private, sign in with the owning ChatGPT account and select **Activate my workspace**. This atomic, one-time action fixes the owner ID. All subsequent private reads and writes check that ID. Another signed-in account cannot become an administrator. Turn the `OWNER_BOOTSTRAP` runtime variable to `disabled` after activation. Do not share the Site before activating; the first signed-in visitor can activate while bootstrap is enabled.

The Site starts owner-private. Publishing a site version does not make the site publicly accessible. Audience settings are managed separately in Sites. LinkedIn previews and search indexing become useful after intentional public sharing, or on a public Vercel deployment.

## Source and instructions

After activation, open **Setup & guide → Download full source & setup guide**. This owner-only ZIP contains the complete source, database schemas, private workbook seed, README, deployment instructions and environment-variable example. It excludes dependencies, build output, local environment files and credentials. Keep this download private because it contains your original challenge notes.

## Add your first real project

1. Open **Projects → Add project**, or **Challenge library → Create draft**.
2. Edit the public title and description. Choose category, project type and status. A completed challenge does not automatically become a published project.
3. Fill in the problem, objective, approach, research, output and lessons. Only report measurable impact you can support.
4. Add skills, tools, screenshots, videos and optional live/GitHub links.
5. Turn on **Published**, optionally **Feature on homepage**, then **Save changes**.
6. Open the project from its public link and review it. Unpublishing immediately removes it from the public content API and sitemap.

The website itself is the only initially published project, labelled **Built / In Progress**. Two clearly labelled editable planning templates are private. Exploration cards are interests, not claims of completed work. No supplied employment dates or metrics have been invented. Blaze's dates are deliberately unset.

## Profile, media and contact

- **Profile → Edit your profile** updates the hero, biography, story, learning callout, email and social links.
- Upload a portrait and a video, or use a YouTube `/embed/` or Vimeo player URL. Video upload takes precedence over an embed; clear it to use the embed.
- The photo and introduction-video placeholders are intentional until you add your media.
- Media supports JPG, PNG, WebP, GIF, MP4 and WebM, up to 25 MB per file. Select files from the library in any relevant editor. Save to apply a replacement, then remove an unused original.
- Uploads are private until referenced by published content. Published media can be downloaded by visitors; keep private documents out of published content.
- The contact form stores submissions in **Messages**. It uses a signed time token, a honeypot, size validation, replay prevention and a database-backed per-IP rate limit. IPs are hashed before rate-limit storage. No transactional email notifications have been configured. The email reply link opens your mail app; it does not send messages automatically.
- Set your own email in Profile to show a real email button. Until then, visitors can use the working contact form or LinkedIn.

## Workbook import

The attached `HiveSchool _ C3 - 101 Things To Do.xlsx` was parsed from the **Master Tracker** sheet. Its title and section rows were ignored; the numeric source identifiers, challenge text, categories, source status, date fields and notes were retained. The source contains 101 unique challenges (95 Not Started, 1 In Progress, 5 Done). These figures are internal only; no total, source numbers or spreadsheet progress percentage appears on the public site.

The private dataset is in `server/challenges-seed.json`; it is bundled into server code only and inserted idempotently into the database on first use. It is excluded from the public client data. Existing data is never overwritten by the initial seed.

**Import an update:** open Challenge library → Import workbook → choose `.xlsx` or `.xls` → inspect preview → Import private records. Accepted headers include `#`, `Category`, `Challenge`, `Status`, `Date Completed`, `Proof / Notes`. The parser detects offset headers and skips instruction sheets. Original numeric identifiers are mandatory and duplicates in a workbook are rejected. IDs match within the `hiveschool-c3` source namespace, so use this importer for that workbook series. Re-importing updates the private source record without changing a linked project's copy, media, skills or publication settings. Re-conversion opens the existing project.

## Database

- Managed SQLite/D1 schema: `db/schema.ts`; versioned schema-only migrations: `drizzle/`.
- Supabase/PostgreSQL schema and RLS/storage policies: `supabase/schema.sql`.
- Tables: profile, experiences, projects, categories, project_media, skills, tools, journey_milestones, learning_reflections, internal_challenges, contact_submissions, admins, rate_limits and metadata.
- Project categories, linked challenges and learning reflections have foreign keys. A unique challenge linkage prevents duplicate conversion. Every table has a stable primary key. Content properties are stored as typed application records inside JSON, with relational identifiers and visibility represented by indexed columns.
- Internal notes, source identifiers, contact messages and draft records are served only through owner-authorized endpoints. Public JSON is selected by publication and strips private linkage fields.

## Local development

Requires Node.js 22.13+ (Node 24 recommended) and npm.

```sh
npm ci
npm run typecheck
npm test
npm run build
```

`npm run build` statically exports Next.js, then bundles the exported assets and full API into a Cloudflare Worker for Sites. `dist/server/index.js` is the deployable Worker. `npm run db:generate` generates append-only Drizzle migrations after schema changes.

For a functional local Next.js server with Supabase, follow the Vercel setup below, populate `.env.local`, then run `npm run dev`. A plain static Next dev preview has no API until the adapter is prepared. Do not fabricate local authentication headers or introduce a development bypass in production.

## Vercel + Supabase production deployment

1. Create your Supabase project. Run `supabase/schema.sql` in its SQL editor against a **fresh database**. The script creates tables, RLS and a private `portfolio-media` bucket.
2. Create your owner account in Supabase **Authentication → Users**; use a strong password. Disable public sign-ups. Add your owner UUID to the `admins` table using the final SQL example.
3. Copy `.env.example` to `.env.local`. Set your project URL, public anon key, service-role key, owner Auth UUID and production website origin. Never place the service-role key in a `NEXT_PUBLIC_*` variable or commit it.
4. Run `node scripts/prepare-vercel.mjs`. This installs the Next.js API route and dynamic clean-URL project page, and switches from static export to a standard Next.js server build.
5. Run `npm run typecheck`, `npm test`, then `npm run build:next`. For local use run `npm run dev`, open `/admin`, and sign in with the owner account. Production Supabase authorization validates the bearer token with Auth and checks the exact configured owner UUID.
6. Import the source repository in Vercel. Framework: **Next.js**. Install command: `npm ci`. Build command: `node scripts/prepare-vercel.mjs && npm run build:next`. Keep the default Next.js output setting; do not set a static output directory.
7. Add the variables below to the Vercel project's environment settings. Deploy and set a custom domain if desired. Update `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin, then redeploy. Configure the Supabase Auth site URL to your final origin.
8. Visit the homepage to initialise the factual content and private challenge seed, sign in to `/admin`, update your profile/media and publish a real project.
9. Review mobile/desktop layouts, a published case study and its share preview, and submit a real contact message. Confirm it reaches Messages. Also verify a non-owner account receives 403 on private APIs.

The Supabase adapter is implemented but requires your project configuration and live end-to-end verification. The SQL is for a fresh project; use versioned migrations for later changes. Do not apply this initial schema twice.

## Environment variables

| Variable | Where | Required | Meaning |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Build/server, Vercel | Yes for final domain | Canonical site origin and default social/SEO URLs. Public. |
| `SUPABASE_URL` | Server, Vercel | Yes | Supabase HTTPS project origin. Public configuration, served to admin for Auth. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Server/build, Vercel | Yes | Public anon key for sign-in. RLS denies anonymous direct table reads. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only, Vercel | Yes | Database and private-storage service key. Secret. |
| `ADMIN_USER_ID` | Server, Vercel | Yes | Exact UUID of your Supabase owner Auth account. |
| `OWNER_BOOTSTRAP` | Managed Sites only | Initial activation | `enabled` permits one-time owner assignment. Set `disabled` afterwards. Never enable for a public, unclaimed Site. |
| `DB` | Sites binding | Provisioned | Managed D1 database. Not a string credential. |
| `BUCKET` | Sites binding | Provisioned | Managed R2 media bucket. Not a string credential. |

No OpenAI API key is needed. This version does not call an AI API or send email automatically.

## SEO and sharing

Each page has a title/description, social metadata, an OG PNG, favicon, robots and sitemap. The managed Worker creates case-study metadata and a dynamic sitemap from published projects. Private/unpublished project URLs return 404. The Vercel adapter includes dynamic case-study metadata. Admin routes are noindex. Structured data contains the supplied professional identity, without fictional expertise or achievements.

New content is loaded from the database. Static initial render contains only the supplied factual public content and the website's own in-progress case study. For LinkedIn sharing, use a public deployment and refresh the URL in LinkedIn Post Inspector after metadata changes.

## Validation and limits

See `docs/VALIDATION.md` for the checks actually performed. Browser-driven QA depends on the managed environment's browser tool being available; do not equate a successful build with testing every interaction in a real browser. Supabase and Vercel require user-owned service configuration and were not deployed without those credentials.

Future blog/newsletter/analytics features can be added as separate tables/routes. They are intentionally absent from this release.
