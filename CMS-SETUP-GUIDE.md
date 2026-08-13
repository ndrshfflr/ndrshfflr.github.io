# Setting up your in-browser editor (Decap CMS)

This adds a private editing screen at `yoursite.com/admin/` where you can log in with your GitHub account and edit text, swap photos, manage the gallery, and add new pages — all through a form-based UI, no code. Every save creates a commit in your GitHub repo, so your site updates automatically through GitHub Pages, and you always have full version history.

It takes about 15–20 minutes to set up, and you only do it once.

## Why the extra setup?

Your site is hosted on plain GitHub Pages (not Netlify), and GitHub's login system doesn't allow a plain website to complete a login on its own — it needs a small middleman ("OAuth proxy") to finish the handshake securely. The standard free way to do this is a tiny script hosted on Cloudflare's free tier. You'll deploy it once, then never think about it again.

## Step 1 — Upload the new files to your repo

Add these files to your `ndrshfflr.github.io` repository, keeping the exact folder structure:

```
admin/index.html
admin/config.yml
content/home.json
content/gallery.json
content/pages/example-page.md
page.html
styles.css
index.html          (replaces your current one)
```

You can do this by dragging them into the GitHub web UI (repo → "Add file" → "Upload files"), or via `git add` / `git commit` / `git push` if you're comfortable with git. Either way, once pushed, GitHub Pages will rebuild your site automatically within a minute or two.

## Step 2 — Create a GitHub OAuth App

1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **OAuth Apps** → **New OAuth App**.
2. Fill in:
   - **Application name**: anything, e.g. `Pieter Portal CMS`
   - **Homepage URL**: `https://ndrshfflr.github.io`
   - **Authorization callback URL**: `https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev/callback` — you won't know this exact URL until Step 3, so open this OAuth App page again afterwards to fill it in (or just come back and edit it once you have your Worker's URL).
3. Click **Register application**.
4. On the app's page, click **Generate a new client secret** and copy both the **Client ID** and the **Client Secret** somewhere safe. You'll need them in the next step. Treat the secret like a password — never put it directly in your website's code.

## Step 3 — Deploy the free OAuth proxy (Cloudflare Worker)

This uses a small, widely-used open-source proxy ([sterlingwes/decap-proxy](https://github.com/sterlingwes/decap-proxy)) so you don't have to write this part yourself.

You'll need a free [Cloudflare account](https://dash.cloudflare.com/sign-up) and [Node.js](https://nodejs.org) installed on your computer.

1. Clone the proxy and install it:
   ```
   git clone https://github.com/sterlingwes/decap-proxy.git
   cd decap-proxy
   npm install
   ```
2. Log in to Cloudflare from the command line:
   ```
   npx wrangler login
   ```
   This opens a browser window to authorize.
3. Set your GitHub OAuth credentials as secrets (it'll prompt you to paste each one):
   ```
   npx wrangler secret put GITHUB_OAUTH_ID
   npx wrangler secret put GITHUB_OAUTH_SECRET
   ```
4. Deploy:
   ```
   npx wrangler deploy
   ```
   This prints a URL like `https://decap-proxy.your-name.workers.dev` — that's your OAuth proxy. Copy it.

5. Go back to your GitHub OAuth App (Step 2) and set the **Authorization callback URL** to:
   ```
   https://decap-proxy.your-name.workers.dev/callback
   ```
   Save.

## Step 4 — Point your CMS at the proxy

Open `admin/config.yml` in your repo and replace the placeholder line:

```yaml
base_url: https://REPLACE-WITH-YOUR-OAUTH-PROXY.example.workers.dev
```

with your real Worker URL, e.g.:

```yaml
base_url: https://decap-proxy.your-name.workers.dev
```

Commit that change. GitHub Pages will rebuild.

## Step 5 — Log in and edit

Visit `https://ndrshfflr.github.io/admin/`. Click **Login with GitHub**, authorize the app, and you'll land in the CMS dashboard with three sections:

- **Main Page** — every headline, paragraph, button label, and link on the homepage, plus your credentials list.
- **Photo Gallery** — add, remove, and reorder gallery photos, each with an optional caption. Upload the images directly through the form.
- **Extra Pages** — write new pages (e.g. "Guided Tours") using a simple text editor with bold/italic/links/lists/images. Each new page automatically appears in the site's navigation menu.

Every change you save there becomes a real commit to your GitHub repo — so nothing is fragile, and you can always see the history or revert something in GitHub if needed.

## A note on what's tested vs. not

I've thoroughly tested the underlying mechanics locally — the content pipeline (JSON → live page), the gallery rendering, the new-page rendering and navigation, and the CMS configuration's field-by-field match against your content files. What I have *not* been able to test directly is the live Decap CMS login/editing screen itself and the OAuth handshake, since my environment can't reach the CDN it loads from or your real GitHub repo. Those pieces are well-established, widely used patterns (Decap CMS is the direct continuation of Netlify CMS, and the Cloudflare Worker proxy is a common community solution), but you'll be the first to actually click through the live login flow. If anything doesn't behave as expected at Step 5, tell me what you see and I'll help debug it.
