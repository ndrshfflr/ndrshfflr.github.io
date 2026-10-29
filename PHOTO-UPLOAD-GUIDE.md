# Sending photos to the website from your iPhone

Pick photos in the Photos app, tap **Share → Add to website**, type a caption and
choose a size. A minute or two later they're at the top of the photography page.

How it works: the Shortcut shrinks each photo, strips its location and other
metadata, and sends it to the `images/inbox/` folder of this repository. The
"Photo inbox" workflow (`.github/workflows/photo-inbox.yml`) then files it in the
Photo Gallery with your caption and size, and removes any location data a second
time to be safe.

You need to do two things once: make a GitHub key, and build the Shortcut.

---

## 1. Make a GitHub key (once, about 3 minutes)

The key lets the Shortcut add files to this one repository and nothing else.

1. Open <https://github.com/settings/personal-access-tokens/new> and sign in.
   (The menu path is: your picture → **Settings** → **Developer settings** →
   **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.)
2. **Token name:** `iPhone photos`.
3. **Expiration:** choose the longest it offers. GitHub emails you before it
   runs out; then make a new one and paste it into the Shortcut (step 2.3).
4. **Repository access:** **Only select repositories** → `ndrshfflr/ndrshfflr.github.io`.
5. **Permissions → Repository permissions → Contents:** **Read and write**.
   Leave everything else as it is.
6. **Generate token** and copy it. It starts with `github_pat_` and is shown only once.

Keep the key to yourself. Don't share the Shortcut, because the key is inside it.
If your phone is lost, delete the key on the same page and make a new one.

---

## 2. Build the Shortcut (once, about 10 minutes)

Open the **Shortcuts** app, tap **+**, and name the shortcut **Add to website**.
Add the actions below by typing their names in the search field at the bottom.
Words in *[brackets]* are variables: tap the field and pick them from the
variable bar above the keyboard.

**Setting up the input**
1. Tap the **ⓘ** (Details) button and turn on **Show in Share Sheet**.
2. In the box at the top, **Receive** should say *Images* (tap it and untick
   everything else). Set **If there's no input** to **Ask For Photos**, so the
   shortcut also works when you tap its icon.

**The key**
3. **Text** — paste your key (`github_pat_…`).
4. **Set Variable** — name it `Key`, set to *[Text]*.

**For each photo**
5. **Repeat with Each** — item in *[Shortcut Input]*.
   Put actions 6–17 *inside* the repeat block.
6. **Resize Image** — resize *[Repeat Item]* to width `2000`, height **Auto**.
7. **Convert Image** — convert *[Resized Image]* to **JPEG**. Tap **Show More**:
   set the quality to about 80 % and turn **Preserve Metadata** **off**.
   (This step removes the photo's location.)
8. **Ask for Input** — **Text**, prompt: `Caption (optional)`.
9. **List** — five lines:
   `1 · small`, `2 · wide`, `3 · large`, `4 · larger`, `5 · largest`.
10. **Choose from List** — choose from *[List]*, prompt: `How big on the website?`
11. **Base64 Encode** — encode *[Converted Image]*. Tap **Show More**:
    **Line Breaks: None**.
12. **Format Date** — *[Current Date]*, **Custom** format `yyyyMMdd-HHmmss`.
13. **Text** — exactly these three lines:
    ```
    Photo from iPhone
    caption: [Provided Input]
    weight: [Chosen Item]
    ```
14. **Get Contents of URL**
    - URL: `https://api.github.com/repos/ndrshfflr/ndrshfflr.github.io/contents/images/inbox/[Formatted Date]-[Repeat Index].jpg`
    - Tap **Show More**:
      - **Method:** `PUT`
      - **Headers:** add `Authorization` with the value `Bearer [Key]`
        (the word Bearer, a space, then the variable), and add `Accept` with the
        value `application/vnd.github+json`.
      - **Request Body:** **JSON**, with two **Text** fields:
        - `message`: *[Text]* (the three lines from step 13)
        - `content`: *[Base64 Encoded]*
15. **Get Dictionary Value** — get **Value** for `content` in *[Contents of URL]*.
16. **If** *[Dictionary Value]* **does not have any value**:
17. … **Show Result** — *[Contents of URL]*. (If something went wrong, this shows
    GitHub's answer.) Leave **Otherwise** empty, and let the If block end there.

**After the repeat block**
18. **Show Notification** — `Sent. On the website in a minute or two.`

Optionally, tap **Share → Add to Home Screen** to get an icon.

---

## 3. Using it

- **From Photos:** select one or more photos → **Share** → **Add to website** →
  type a caption (or leave it empty) → pick a size. If you send several photos,
  it asks for each one.
- **From the icon:** tap **Add to website** and pick the photos.

New photos go to the **top** of the photography page. Later, in **/admin → Photo
Gallery**, you can change the size (weight 1–5), the **Keep in frame** crop,
the order, or link a photo to a blog post.

Sizes: 1 small (1×1) · 2 wide (2×1) · 3 large (2×2) · 4 larger (3×2) · 5 largest (3×3).

---

## If something goes wrong

The Shortcut shows GitHub's answer when a photo didn't arrive:

| Message | What it means |
|---|---|
| `Bad credentials` (401) | The key is wrong or has expired: make a new one (step 1) and paste it into action 3. |
| `Not Found` (404) | The key doesn't have access to this repository, or the URL in action 14 has a typo. |
| `Resource not accessible` (403) | The key lacks **Contents: Read and write**. |
| `Invalid request` / `sha` (422) | Two photos got the same name. Send the photo again. |

If you have unpublished changes to the Photo Gallery waiting in /admin, publish
them before sending photos from the phone. Otherwise the two edits to the gallery
list can clash when you publish.

If the photo arrived but doesn't appear on the site, open GitHub → **Actions** →
**Photo inbox** to see what happened. A photo the workflow couldn't read stays in
`images/inbox/`, and the reason is shown in the log.

---

## Other ways to add photos (still available)

- **/admin → Photo Gallery** works from any browser, including on the phone.
  Photos uploaded there are also cleaned automatically: the location is removed,
  very large photos are shrunk, and HEIC photos are turned into JPEGs.
- **An upload page on the site** (not built yet). The inbox already accepts a
  photo together with a small `<same name>.json` file holding `caption`,
  `weight`, `focus` and `post`. A page that signs in with GitHub could therefore
  be added later without changing the workflow.
- **Commit message format**, if you ever send photos another way (for example
  with the GitHub app): add an image to `images/inbox/` with a commit message like
  ```
  Photo from iPhone
  caption: Fly agaric after rain
  weight: 3
  post: 2026-10-24-testing-this-stuff
  focus: top
  ```
  Only `caption` and `weight` are commonly needed. `post` is a blog post's file
  name, without `.md`.
