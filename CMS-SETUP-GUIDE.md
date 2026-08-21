# Setting up your in-browser editor (Decap CMS)

This adds a private editing screen at `yoursite.com/admin/` where you can log in with your GitHub account and edit text, swap photos, manage the gallery, and add new pages — all through a form-based UI, no code. Every save creates a commit in your GitHub repo, so your site updates automatically through GitHub Pages, and you always have full version history.

It takes about 15–20 minutes to set up, and you only do it once.

> **Already have this working?** You don't need to redo Steps 2–4 (the GitHub OAuth App and Cloudflare Worker) — those are one-time and already running. Just re-upload the changed files from Step 1 below (they now include a few new ones — nav labels and social links in the CMS, a favicon, a social-share image, and analytics/SEO tags), then jump straight to **Step 6** for the new analytics setup, and skim **Step 5** for what changed in the editing experience (drafts now go through a review step before publishing).

## Why the extra setup?

Your site is hosted on plain GitHub Pages (not Netlify), and GitHub's login system doesn't allow a plain website to complete a login on its own — it needs a small middleman ("OAuth proxy") to finish the handshake securely. The standard free way to do this is a tiny script hosted on Cloudflare's free tier. You'll deploy it once, then never think about it again.

## Step 1 — Upload the new files to your repo

Add these files to your `ndrshfflr.github.io` repository, keeping the exact folder structure:

```
admin/index.html
admin/config.yml
content/home.json
content/gallery.json
content/pages/example-page.md   (skip if you already have this)
page.html
styles.css
index.html          (replaces your current one)
favicon.svg
favicon.ico
apple-touch-icon.png
og-image.png
robots.txt
sitemap.xml
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
2. Create the real config file from the template (this is a required, easy-to-miss step — the repo only ships a *sample* config, and Wrangler won't know your Worker's name without it):
   ```
   cp wrangler.toml.sample wrangler.toml
   ```
   On Windows PowerShell, use `copy wrangler.toml.sample wrangler.toml` instead. No editing needed — the sample already includes a default Worker name (`decap-proxy`).
3. Log in to Cloudflare from the command line:
   ```
   npx wrangler login
   ```
   This opens a browser window to authorize.
4. **If you're on a brand-new Cloudflare account**, Wrangler may not be able to auto-detect which account to use, and later commands will fail with "Failed to automatically retrieve account IDs." If that happens: in the Cloudflare dashboard, press `Cmd+K` (`Ctrl+K` on Windows), type `Copy account ID`, and select it. Then open `wrangler.toml` in a text editor (`open -e wrangler.toml` on Mac, `notepad wrangler.toml` on Windows) and add a new line:
   ```
   account_id = "paste-your-account-id-here"
   ```
   Save the file and re-run whichever command failed.
5. Set your GitHub OAuth credentials as secrets (it'll prompt you to paste each one — nothing will visibly appear as you paste, that's normal for secret input):
   ```
   npx wrangler secret put GITHUB_OAUTH_ID
   npx wrangler secret put GITHUB_OAUTH_SECRET
   ```
6. Deploy:
   ```
   npx wrangler deploy
   ```
   This prints a URL like `https://decap-proxy.your-name.workers.dev` — that's your OAuth proxy. Copy it.

7. Go back to your GitHub OAuth App (Step 2) and set the **Authorization callback URL** to:
   ```
   https://decap-proxy.your-name.workers.dev/callback
   ```
   Save.

## Step 4 — Point your CMS at the proxy

Right now, `admin/config.yml` in your site's repo (`ndrshfflr.github.io` — a different repo from the `decap-proxy` folder on your computer) still has a placeholder Worker address in it. You need to swap that placeholder for the real URL you got back at the end of Step 3.6 (the one that looked like `https://decap-proxy.your-name.workers.dev`).

The easiest way to do this is directly on GitHub's website — no terminal needed for this step:

1. Go to `https://github.com/ndrshfflr/ndrshfflr.github.io` in your browser (log in if needed).
2. Click into the `admin` folder, then click on `config.yml` to open it.
3. Click the pencil icon in the top-right of the file view (it may be labeled "Edit this file" or show up when you hover). This switches the page into an editable text box.
4. Near the top of the file, find this line:
   ```yaml
   base_url: https://REPLACE-WITH-YOUR-OAUTH-PROXY.example.workers.dev
   ```
5. Select just the URL part and replace it with your real Worker URL from Step 3, so the line reads something like:
   ```yaml
   base_url: https://decap-proxy.your-name.workers.dev
   ```
   Double-check: it should start with `https://`, have no trailing slash at the end, and match exactly what Wrangler printed for you — no typos, no extra spaces. Don't touch anything else on that line (`auth_endpoint: auth` stays as-is on the line below it).
6. Scroll to the bottom of the page. Under "Commit changes," you can leave the default commit message as-is (or write something like "Set OAuth proxy URL"). Make sure **"Commit directly to the `main` branch"** is selected.
7. Click **Commit changes**.

GitHub Pages will automatically rebuild your site with this change — that usually takes under a minute, sometimes up to two or three. You can check progress under the **Actions** tab of your repo if you want to watch it happen; a green checkmark means it's done.

**If you have the site repo cloned locally instead** (rather than editing on GitHub's website), the equivalent is: open `admin/config.yml` in a text editor, make the same edit, then run `git add admin/config.yml`, `git commit -m "Set OAuth proxy URL"`, and `git push` from inside that repo's folder.

## Step 5 — Log in and edit

Visit `https://ndrshfflr.github.io/admin/`. Click **Login with GitHub**, authorize the app, and you'll land in the CMS dashboard with three sections:

- **Main Page** — every headline, paragraph, button label, and link on the homepage; your credentials list; the navigation menu labels; and, at the bottom of the Contact section, an optional list of social/other links (Instagram, LinkedIn, a booking page — add as many rows as you like, or none).
- **Photo Gallery** — add, remove, and reorder gallery photos, each with an optional caption. Upload the images directly through the form.
- **Extra Pages** — write new pages (e.g. "Guided Tours") using a simple text editor with bold/italic/links/lists/images. Each new page automatically appears in the site's navigation menu.

### Draft → Review → Publish

Edits no longer go live the instant you save. The CMS now uses an **editorial workflow**: every save creates a draft, and nothing reaches the live site until you explicitly move it to "Ready" and publish. In the CMS sidebar you'll see a workflow board with three columns:

1. **Drafts** — where a saved-but-unfinished change sits. Safe to leave here indefinitely.
2. **In Review** — mark something here when you think it's ready and want to look it over once more (there's a live-ish preview pane).
3. **Ready** — the final step. From here, click **Publish** to actually push the change live.

Behind the scenes each draft is a separate branch and pull request in your GitHub repo (Decap handles this automatically — you never need to touch GitHub directly for it), so you can safely experiment with a change, come back to it later, or abandon it entirely without ever affecting the live site.

Every change becomes a real commit to your GitHub repo once published — so nothing is fragile, and you can always see the history or revert something in GitHub if needed.

## Step 6 — Turn on visitor analytics (optional but recommended)

Both `index.html` and `page.html` already have a Cloudflare Web Analytics tag in them — it just needs your own tracking token. This is free, doesn't use cookies, and doesn't need a cookie-consent banner.

1. In the [Cloudflare dashboard](https://dash.cloudflare.com), go to **Analytics & Logs → Web Analytics** in the left sidebar.
2. Click **Add a site**, enter `ndrshfflr.github.io`, and follow the prompt to add it as a **JavaScript snippet** (not a DNS-based site, since GitHub Pages doesn't run through Cloudflare's DNS).
3. Cloudflare will show you a snippet that includes a `data-cf-beacon='{"token": "..."}'` value — copy just that token (a long string of letters and numbers).
4. Back in your repo (same web-editor approach as Step 4), open `index.html`, find this line near the top:
   ```html
   <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "REPLACE-WITH-YOUR-CF-ANALYTICS-TOKEN"}'></script>
   ```
   Replace `REPLACE-WITH-YOUR-CF-ANALYTICS-TOKEN` with your real token, keeping the quotes. Commit.
5. Do the same in `page.html` (same line, same token).

After that, visits show up in the Cloudflare dashboard within a few minutes — a simple way to see how many people are landing on the site after scanning your QR code.

## What else changed this round (SEO, favicon, and social-share preview)

A few things were added that you don't manage through the CMS — they're static files/tags, deliberately not wired to the JSON content:

- **`favicon.svg` / `favicon.ico` / `apple-touch-icon.png`** — the browser-tab icon and the icon used when someone adds the site to their phone's home screen. Reuses your nav mushroom mark on a dark background.
- **`og-image.png`** — the image shown when the site link is shared in Slack, iMessage, WhatsApp, or social media. Also based on your brand mark and current hero copy.
- **`robots.txt` / `sitemap.xml`** — basic signals for search engines. The sitemap currently only lists the homepage; if you want a page you add via the CMS to be explicitly listed too, that's a one-line manual addition to `sitemap.xml` (search engines will still generally find new pages through your nav menu even without this, so it's a nice-to-have, not essential).
- Meta description, page title, and the social-preview text (Open Graph/Twitter tags) in `index.html`'s `<head>`.

**Why these aren't in the CMS:** anything the CMS controls is filled in by JavaScript *after* the page loads. That's fine for content people actually browsing the site will see — but link-preview bots (Slack, iMessage, Twitter, etc.) and most search engine crawlers read only the raw HTML and never run that JavaScript, so they'd see blank/placeholder values. These particular pieces have to live directly in the HTML to work correctly. If you substantially change your headline or tagline through the CMS later, it's worth manually updating the matching text in these tags too, so link previews and search results stay accurate — happy to do that for you any time, just ask.

## A note on what's tested vs. not

I've thoroughly tested the underlying mechanics locally — the content pipeline (JSON → live page, including the new nav-label and social-link overrides), the gallery rendering, the new-page rendering and navigation, the favicon/OG/robots/sitemap files all serving correctly, and the CMS configuration's field-by-field match against your content files. What I have *not* been able to test directly is the live Decap CMS login/editing screen itself, the editorial workflow board, the OAuth handshake, or the Cloudflare Web Analytics beacon actually recording a visit — since my environment can't reach the CDNs involved or your real GitHub repo/Cloudflare account. Those are well-established, widely used patterns, but you'll be the one to click through them live. Tell me what you see at any step and I'll help debug it.
