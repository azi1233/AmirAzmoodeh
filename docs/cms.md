# Writing posts in the browser (Decap CMS)

This file explains how to write and edit blog posts in a web page instead of
editing `.md` files by hand.

There are two ways to do it. Both create the **same plain Markdown file** in
`src/content/post/`. There is no database. The file is the post.

|                 | Local (recommended)     | Production (optional)                        |
| --------------- | ----------------------- | -------------------------------------------- |
| Page address    | `http://localhost:4321/admin/local.html` | `https://azi1233.github.io/AmirAzmoodeh/admin/` |
| Extra program   | `pnpm cms:local` (port 8081) | none                                   |
| Login           | one button, no password | "Login with GitHub"                          |
| Accounts needed | none                    | free Netlify account + GitHub OAuth app      |
| Reaches readers | after you run `git push` | automatically, about 2 minutes later          |
| Can break the site? | no — nothing is pushed | yes — it commits to `main` directly       |

**Use local only.** It is free, it needs no accounts, and it cannot publish
anything by accident. Production is optional; add it later if you want to edit
posts from a phone.

---

## Part 1 — Local writing (use this one)

### Step 1: start the git proxy

In your first terminal, run:

```bash
pnpm cms:local
```

Leave it running. Do not type anything else in this terminal.

This program is the **bridge** that lets a web page write files on your
computer. A web page normally cannot save files, so Decap needs this helper. It
is the same program Netlify would otherwise run for you.

You should see a message with `http://localhost:8081`.

### Step 2: start the site

In a second terminal, run:

```bash
pnpm dev
```

### Step 3: open the editor

Go to this address exactly:

```
http://localhost:4321/admin/local.html
```

Then click the blue **Login** button. That is all — there is no username and no
password. After clicking, you see the list of posts.

> **The one rule: the address must end in `local.html`.**
>
> If you see a box asking for a username and a password, you opened the
> production page by mistake. Go back and use `/admin/local.html`.
>
> If the page is blank or the Login button does nothing, the proxy from
> Step 1 is not running.

### Step 4: write your post

Click **Posts** → **New Post**. Fill in the boxes (they are explained below).
Write your text in the big box at the bottom. The right side shows how it will
look.

When you are happy, click **Publish**.

### Step 5: send it to the world

Publishing only wrote a file on your computer. Nothing is online yet.

```bash
git add -A
git commit -m "add my new post"
git push
```

Now your blog rebuilds by itself and the post is live. Watch it on the
[Actions tab](https://github.com/azi1233/AmirAzmoodeh/actions).

---

## The fields, one by one

Only three fields are required. You can ignore the rest.

| Field in the editor  | Required? | What to write                                                      |
| -------------------- | --------- | ------------------------------------------------------------------ |
| **Title**            | yes       | The headline.                                                       |
| **Publish Date**     | yes       | The day it goes live. You can pick a future day.                    |
| **Description**      | yes       | One sentence, 10–160 characters. Used in cards and social previews. |
| Updated Date         | no        | Only if you change the post later. Shows "Updated …".               |
| Tags                 | no        | Short words. Press Enter after each one.                            |
| **Draft**            | no        | `true` = keep it hidden. See below.                                 |
| Cover Image          | no        | One picture at the top of the post.                                 |
| OG Image             | no        | Rarely needed. The site draws its own social card from your text.   |
| **Body**             | yes       | Your post.                                                          |

### A filled-in example

```yaml
---
title: My first post
publishDate: 2026-10-05
description: A short guide to my new blog, written for beginners.
tags:
  - intro
  - guide
draft: true
---
```

That is the whole format. The part above the `---` lines is called
**frontmatter** — it is the information about the post. Everything after the
second `---` is the post itself.

### Draft: your safety button

Turn **Draft** on and the post is completely hidden from the live site. It is
still saved, still listed in the CMS, still in git. Only the live build skips
it.

Use this every time:

- you want to write but are not ready yet
- you want to check the live site before anyone else sees it
- you are not sure yet

This is your only safety net when publishing straight to `main`, so use it
without guilt.

### Images

Drag a picture onto the **Cover Image → Image** box. Decap copies the file into
`public/images/` and writes the path into your post for you.

Do not use `Shift`+`Ctrl`+`X` or any keyboard shortcut for images — that is for
special characters.

---

## Rules that keep things safe

1. **Publish from a clean project.** Before you open the CMS, run `git status`.
   If it shows changes you have not committed yet, commit them first. The proxy
   saves with `git add .`, so it may sweep your other work into the same commit.

2. **Use `local.html` for local work.** `/admin/` is the production page.

3. **Turn Draft on until you are ready.** Then run `git push`.

4. **One post at a time.** Save, push, then start the next.

---

## If something goes wrong

| What you see                                       | What it means and what to do                                                     |
| -------------------------------------------------- | -------------------------------------------------------------------------------- |
| A username and password box                        | Wrong page. Use `/admin/local.html`, not `/admin/`.                              |
| Blank white page                                   | `pnpm cms:local` is not running. Start it.                                       |
| "Failed to load ... local.html" or a red banner    | The proxy is not running, or you opened the page in a browser tab that is not localhost. |
| "Image is required. / Alt text are required."       | Fixed already. If it returns, tell me — it means a config file lost a fix.       |
| "EADDRINUSE" on port 8081                          | A proxy is already running. Fine — just use the page.                            |
| The `.md` file changed but `git log` shows nothing  | Commit it yourself: `git add -A && git commit`. Nothing is lost either way.      |
| A post does not show on the live site               | It is still Draft, or you have not run `git push`.                               |
| A post shows a 404 link                             | The filename changed. The address is the filename without `.md`.                 |

---

## Part 2 — Production writing (optional)

Skip this whole part if you are happy to write locally and run `git push`. That
is a complete workflow.

Read this only if you want to edit posts from a phone, or anywhere that is not
your computer.

### Why an extra account is needed

Locally, the proxy trusts you because you already own the files. On the live
site, anyone on the internet can open `/admin/`, so the site must ask GitHub who
you are before saving. Something has to hold that login button, and GitHub's
free answer is a small service called Netlify.

**Netlify is only the login helper.** Your website stays on GitHub Pages, and
your posts stay in this repository. Netlify never stores your posts and never
gets a copy of your site.

### The three setup steps

Each one takes about five minutes. Do them in order.

#### Step A — make a GitHub OAuth app

GitHub gives you two secret codes. Decap sends them to Netlify.

1. On GitHub, click your profile picture → **Settings**.
2. At the bottom of the left menu: **Developer settings**.
3. **OAuth Apps** → **New OAuth App**.
4. Fill in:
   - **Application name**: anything, for example `My Blog CMS`
   - **Homepage URL**: `https://azi1233.github.io/AmirAzmoodeh/`
   - **Authorization callback URL**: this one is **exact**:

     ```
     https://api.netlify.com/auth/done
     ```

     A single missing slash or the word `login` at the end will break the login
     later, with no useful error message. Copy and paste it.
5. Click **Register application**.
6. Copy the **Client ID**. Then click **Generate a new client secret** and copy
   the secret too. You will not see the secret again, so save it now.

#### Step B — make a blank Netlify site

This site exists only to hold the two codes from Step A.

1. Go to <https://app.netlify.com/drop> and sign up with GitHub.
2. Click **Add new site** → **Deploy manually**.
3. Name it something clear, for example `amirazmoodeh-cms-auth`.
4. Wait for the placeholder page. Nothing you do on that site matters.

Now give Netlify the codes:

1. In the site: **Site configuration** → **Access & security**.
2. Find **OAuth** → **Install provider** → **GitHub**.
3. Paste the Client ID and the Client Secret from Step A.
4. Click **Connect**.

#### Step C — paste the site ID into this project

1. In Netlify, open **Site settings**. Copy the value labelled **Project ID**
   (the API calls it Site ID).
2. In this project, open `public/admin/config.yml`.
3. Find line 25:

   ```yaml
   site_id: "REPLACE_WITH_NETLIFY_PROJECT_ID"
   ```

4. Put your ID between the quotes:

   ```yaml
   site_id: "b8f3a1c2-4d5e-6789-abcd-ef0123456789"
   ```

5. Save the file and push:

   ```bash
   git add public/admin/config.yml
   git commit -m "connect CMS login"
   git push
   ```

Now open <https://azi1233.github.io/AmirAzmoodeh/admin/> and click
**Login with GitHub**.

### What publishing does on production

There is no review step.

```
Save  →  commit to main  →  GitHub Actions rebuilds  →  live (about 2 min)
```

To see the rebuild, watch the [Actions tab](https://github.com/azi1233/AmirAzmoodeh/actions).
If the build fails, the old site stays online — a broken build cannot take your
blog down.

So again: turn **Draft** on while you write. It is the only thing between a
half-finished sentence and the internet.

---

## Why the two pages are separate files

Decap CMS always sends you to the same login screen for GitHub. For local work
we do not want that. So there are two config files:

| File                                     | Page                | Backend                            |
| ---------------------------------------- | ------------------- | ---------------------------------- |
| `public/admin/index.html` + `config.yml` | `/admin/`           | GitHub, through Netlify            |
| `public/admin/local.html` + `config.local.yml` | `/admin/local.html` | the proxy from `pnpm cms:local` |

`local.html` and `config.local.yml` are in `.gitignore`, so they cannot be
pushed and cannot be deployed. Only the production pair goes online.

The **fields** (the part that lists your post boxes) is identical in both files.
If you add a new field, add it to both, so what you test locally is what
production shows.

Do not put the `<script>` tags at the top of `<head>` in either file. Decap
mounts itself into `document.body`, and a script in `<head>` runs too early and
breaks the page. They must be the first things inside `<body>`.

---

## Notes and limits

- The CMS collection uses `extension: md`, so **`.mdx` posts do not appear**
  in the editor. `src/content/post/writing-with-mdx.mdx` is one of them. Edit
  MDX posts by hand. This is deliberate: the editor's Markdown box cannot hold
  JSX components.
- The CMS edits **posts only**. The about page (`src/content/page/about.md`) and
  the Showcase list (`src/data/showcase.ts`) are still edited by hand.
- Local preview uses the blog's colours and fonts, but they are a close copy, not
  the real site. The real check is `pnpm preview:prod`.
- The local preview pane strips images from uploaded paths so they show at the
  right size. The built site is correct.
- `pnpm preview:prod` builds with the real address prefix `/AmirAzmoodeh/`,
  which is what the live site uses. Use it before you push, if you added
  images or links.