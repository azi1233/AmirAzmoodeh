# Astro Sienna

A minimal Astro blog template with serif typography, dark mode, RSS, OG images, and optional Giscus comments and
analytics.

**Live demo:** [Github Pages](https://anjaygoel.github.io/astro-sienna)

![Astro Sienna home page in dark and light themes](.github/assets/preview.png)

## Features

- Astro 6 with content collections (posts and pages, both validated by Zod)
- MDX support — embed Astro/JSX components, imports, and JS expressions inside posts
- Light and dark mode with a CSS-only theme toggle
- Self-hosted serif body font ([Newsreader](https://github.com/productiontype/Newsreader)) and mono (JetBrains Mono)
- Code blocks via [astro-expressive-code](https://expressive-code.com): themes, copy button, terminal frames, line
  highlighting
- Math via KaTeX (`$inline$` and `$$display$$`)
- Custom containers (`:::note`, `:::tip`, `:::caution`)
- Per-post OG images generated at build time (Satori + resvg)
- RSS feed, sitemap, robots.txt, web manifest
- Optional [Giscus](https://giscus.app) comments with custom matched themes
- Optional GA4 and Goatcounter analytics, both loaded via [Partytown](https://partytown.qwik.dev/) so they run on a
  worker thread
- Optional [webmentions](https://webmention.io), fetched at build and cached locally
- Perfect Lighthouse scores (Performance, Accessibility, Best Practices, SEO)

## Quick start

Click **Use this template** on GitHub, or clone directly:

```sh
git clone https://github.com/AnjayGoel/astro-sienna.git my-site
cd my-site
pnpm install
pnpm dev
```

Open http://localhost:4321.

## Commands

| Command             | What it does                                                       |
| ------------------- | ------------------------------------------------------------------ |
| `pnpm dev`          | Start the dev server with HMR                                      |
| `pnpm build`        | Type-check, build, and run Pagefind indexing                       |
| `pnpm preview`      | Preview the production build locally                               |
| `pnpm preview:prod` | Build **and** preview with the deploy base path (`/AmirAzmoodeh/`) |
| `pnpm check:build`  | Post-build checks: base paths, required files, draft leaks         |
| `pnpm cms:local`    | Start the Decap CMS git proxy (port 8081) for local post writing   |
| `pnpm format`       | Run Biome and Prettier                                             |
| `pnpm lint`         | Lint with Biome                                                    |

### Testing against the real base path

`pnpm dev` and a plain `pnpm build` both serve from `/`, but production is served from
`/AmirAzmoodeh/`. A missing base prefix is therefore invisible locally and only surfaces as
404s after deploy. Use `pnpm preview:prod` whenever you are checking anything path-related —
links, images, the manifest, the feed.

```sh
pnpm preview:prod   # http://localhost:4321/AmirAzmoodeh/
```

`pnpm check:build` runs the same checks CI does, against whatever is in `dist/`:

- **base-path** — every root-relative `href`/`src` in the built HTML carries the base prefix
- **smoke** — RSS, sitemap, manifest, robots, the Pagefind index and OG images were all emitted
- **drafts** — posts marked `draft: true` did not reach `dist/`, and published posts did

Override the defaults for a fork or a root-deployed host with environment variables:

```sh
BASE_PATH=/ pnpm preview:prod
SITE_URL=https://example.com pnpm build
```

Content is **not** split between environments — one repo, one branch, one set of posts. The
`draft` frontmatter flag is the local/production split: drafts are visible in `pnpm dev` and
excluded from the build (`src/data/post.ts`).

## Configuration

Most personalisation happens in two files.

**`src/site.config.ts`** holds author, profile, comments, analytics, and webmentions. Every field in `profile` is
optional. Leave any of `email`, `github`, `linkedin`, `employer`, `alumni`, or `avatar` undefined and the corresponding
link is hidden site-wide. Same for `comments` and `analytics`: undefined means the script never loads.

**`astro.config.ts`** is where you set `site` to your final domain (used for canonical URLs, sitemap, RSS, and OG image
URLs). The base path is handled automatically — see [Deploying](#deploying); you normally don't touch it.

Replace these assets in `public/`:

- `icon.png` (512×512). Drives the favicon and the auto-generated `apple-touch-icon`, `icon-192`, and `icon-512` PWA
  manifest icons.
- `social-card.png` (1200×630). Fallback OG image, used when a post doesn't have its own. The default is a placeholder
  you can swap.
- `avatar.png` (optional). Referenced from `siteConfig.profile.avatar`, used in the About page's structured data and any
  avatar slot you add.

### Per-post OG images

Every post gets its own 1200×630 OG image generated at build time by [Satori](https://github.com/vercel/satori). The
markup lives in `src/pages/og-image/[...slug].png.ts`. Tweak it once and every post's card updates on the next build. To
skip the generated image and point a post at your own, set `ogImage: "/path/to/image.png"` in the post's frontmatter.

## Writing posts

Posts live in `src/content/post/` as `.md` or `.mdx` files. The filename becomes the slug.

```yaml
---
title: "Your post title"
publishDate: 2026-01-12
description: "One-sentence summary used in cards, social previews, and meta tags."
tags: [tag-one, tag-two]
# updatedDate: 2026-02-01     # optional, shown as "Updated …"
# draft: true                  # excludes the post from production builds
# coverImage:
#   src: ./_assets/cover.png
#   alt: "Description for screen readers"
---
```

The about page is also markdown, at `src/content/page/about.md`. Showcase entries are typed objects in
`src/data/showcase.ts`; empty the array and the Showcase tab is hidden automatically.

### Writing posts in the browser (Decap CMS)

You can write and edit posts through a web editor instead of by hand. It is a
**local git proxy**: no Netlify account, no GitHub OAuth app, no login screen,
nothing pushed anywhere. When you press **Publish**, Decap writes a plain
`.md` file into `src/content/post/` — exactly the file format described above.

Two terminals:

```bash
# terminal 1 — the git proxy (leave it running)
pnpm cms:local

# terminal 2 — the site
pnpm dev
```

Then open <http://localhost:4321/admin/local.html> and click **Login**.

Use `local.html`, not `/admin/`. There are two configs:

| File                                           | Used for               | Backend                          |
| ---------------------------------------------- | ---------------------- | -------------------------------- |
| `public/admin/index.html` + `config.yml`       | production (`/admin/`) | GitHub via Netlify's OAuth relay |
| `public/admin/local.html` + `config.local.yml` | local development      | the proxy from `pnpm cms:local`  |

`local.html` and `config.local.yml` are git-ignored, so they can never be
deployed. The two configs share an identical `collections` block, so what you
test locally is what production uses.

**Full guide: [docs/cms.md](docs/cms.md)** — every field explained, the image
and draft workflow, a troubleshooting table, and the optional production setup
(GitHub OAuth app + Netlify as the login relay).

Two things to know before your first publish:

- Commit from a **clean working tree**. The proxy saves with `git add .`, so it
  will bundle any other edits you have in progress into the same commit.
- Editorial workflow is not available locally; `draft: true` is the safety net
  that keeps a post out of production builds.

## Project layout

```
src/
  site.config.ts        # author / profile / integrations
  content.config.ts     # collection schemas (post, page)
  content/
    post/*.md           # blog posts
    page/about.md       # about page
  data/showcase.ts      # showcase entries (or empty for none)
  components/           # blog/, layout/, ui/
  layouts/              # Base.astro, BlogPost.astro
  pages/                # routes (incl. /og-image, /posts pagination, rss)
  plugins/              # remark-admonitions, remark-reading-time
  styles/global.css     # design tokens and shared utilities
public/                 # static assets served at site root
docs/cms.md             # browser editor (Decap CMS) guide
```

## Theming

Design tokens are CSS variables at the top of `src/styles/global.css`: accent colour, hairlines, surfaces, fonts. The
light and dark variants are gated by `[data-theme="light"]` and `[data-theme="dark"]` on the `<html>` element, so
swapping them is a single re-render with no script.

Code-block themes are configured separately in `expressiveCodeOptions` in `site.config.ts` (defaults: `min-light` and
`min-dark`).

## Deploying

Output is a static `dist/` directory that deploys anywhere serving files: Cloudflare Pages, Netlify, Vercel, GitHub
Pages, S3 + CloudFront. Build command: `pnpm build`. Output directory: `dist`.

### Base path

Defaults to root (`/`) — no config needed for local dev, Netlify, Vercel, Cloudflare Pages, a custom domain, or a
GitHub Pages **user** site. The whole site (links, assets, feeds, OG/canonical, manifest, Markdown links) is base-aware.

For a GitHub Pages **project** site (served from `/repo/`), the bundled `.github/workflows/deploy.yml` detects the
subpath and configures it automatically; the only manual step is **Settings → Pages → Source: GitHub Actions**. For a
subpath on any other host, build with `BASE_PATH=/sub pnpm build`.

## Pulling theme updates

To keep tracking upstream changes after you've forked, add this repo as a second remote:

```sh
git remote add theme https://github.com/AnjayGoel/astro-sienna.git
git fetch theme
git merge theme/main --allow-unrelated-histories
```

Use `.gitattributes` with a `merge=ours` driver on personal-content paths (e.g. `src/content/post/*`,
`src/site.config.ts`, `public/avatar.png`) to keep your changes through the merge.

## Credits

Originally forked from [astro-theme-cactus](https://github.com/chrismwilliams/astro-theme-cactus)
by [Chris Williams](https://github.com/chrismwilliams), then heavily revamped into its current form.

## License

[MIT](./LICENSE).
