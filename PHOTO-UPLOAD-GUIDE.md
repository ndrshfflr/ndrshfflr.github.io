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

Open the **Shortcuts** app (Danish: **Genveje**), tap **+**, and name the
shortcut **Add to website**. Add the actions below by typing their names in the
search field at the bottom.

Each action is given as **English** · *Danish*. Danish names marked ✓ are taken
from Apple's Danish Shortcuts guide. The others are my best translation; if one
doesn't turn up, type the **search word** given instead.

Words in *[brackets]* are variables: tap the field and pick them from the
variable bar above the keyboard. On a Danish iPhone they have Danish names too.
Pick the one that comes from the step mentioned, for example the result of
step 7 for *[Converted Image]*.

**Setting up the input**
1. Tap the **ⓘ** (Details) button and turn on **Show in Share Sheet** · *Vis i
   delingsark*.
2. In the box at the top, **Receive** · *Modtag* should say *Images* · *Billeder*
   (tap it and untick everything else). Set **If there's no input** · *Hvis der
   ikke er noget input* to **Ask For** · *Spørg efter* **Photos** · *Fotos*, so
   the shortcut also works when you tap its icon.

**The key**
3. **Text** · *Tekst* ✓ — paste your key (`github_pat_…`).
4. **Set Variable** · *Indstil variabel* ✓ — name it `Key`, set to *[Text]*.

**For each photo**
5. **Repeat with Each** · *Gentag med hver* ✓ — item in *[Shortcut Input]*
   (the shortcut's input, i.e. the photos).
   Put actions 6–17 *inside* the repeat block, before *End Repeat* · *Slut
   gentagelse* ✓. Inside it, *[Repeat Item]* · *Gentag emne* ✓ is the current
   photo and *[Repeat Index]* · *Gentag indeks* ✓ its number.
6. **Resize Image** · search word **størrelse** — resize *[Repeat Item]* to
   width `2000`. Leave the height field **empty**: an empty height means
   *Auto Height*, which keeps the proportions.
7. **Convert Image** · *Konverter billede* (search **konverter**) — convert
   *[Resized Image]* to **JPEG**. Tap **Show More** · *Vis mere* ✓: set
   **Quality** · *Kvalitet* to about 80 %, and turn **Preserve Metadata** ·
   *Bevar metadata* **off**. This step removes the photo's location.
8. **Ask for Input** · *Spørg efter input* ✓ — type **Text** · *Tekst*, prompt:
   `Caption (optional)`.
9. **List** · *Liste* ✓ — five lines:
   `1 · small`, `2 · wide`, `3 · large`, `4 · larger`, `5 · largest`.
10. **Choose from List** · *Vælg på liste* ✓ — choose from *[List]*, prompt:
    `How big on the website?`
11. **Base64 Encode** · search word **base64** — encode *[Converted Image]*. Tap
    **Show More** · *Vis mere*: **Line Breaks** · *Linjeskift*: **None** · *Ingen*.
12. **Format Date** · search word **dato** — *[Current Date]* · *Aktuel dato* ✓,
    **Custom** · *Tilpasset* format `yyyyMMdd-HHmmss`.
13. **Text** · *Tekst* ✓ — exactly these three lines (keep them in English: the
    website reads the words `caption:` and `weight:`):
    ```
    Photo from iPhone
    caption: [Provided Input]
    weight: [Chosen Item]
    ```
    *[Provided Input]* is the answer from step 8, and *[Chosen Item]* is the
    choice from step 10.
14. **Get Contents of URL** · *Hent indhold af URL-adresse* ✓ (search **URL**)
    - URL: `https://api.github.com/repos/ndrshfflr/ndrshfflr.github.io/contents/images/inbox/[Formatted Date]-[Repeat Index].jpg`
    - Tap **Show More** · *Vis mere* ✓:
      - **Method** · *Metode*: `PUT`
      - **Headers** (the header field; the Danish label may be *Headere* or
        *Overskrifter*): add `Authorization` with the value `Bearer [Key]` (the
        word Bearer, a space, then the variable). Then add `Accept` with the
        value `application/vnd.github+json`.
      - **Request Body** · *Indhold af anmodning* ✓: **JSON**, with two
        **Text** · *Tekst* fields:
        - `message`: *[Text]* (the three lines from step 13)
        - `content`: *[Base64 Encoded]* (from step 11)
15. **Get Dictionary Value** · *Hent værdi i ordbog* ✓ — get **Value** · *Værdi*
    for `content` in *[Contents of URL]* (the result of step 14).
16. **If** · *Hvis* ✓ *[Dictionary Value]* **does not have any value** (the
    option meaning "has no value"):
17. … **Show Result** · search word **resultat** — *[Contents of URL]*. If
    something went wrong, this shows GitHub's answer. Leave **Otherwise** ·
    *Ellers* empty, and let the If block end there.

**After the repeat block**
18. **Show Notification** · *Vis notifikation* ✓ — `Sent. On the website in a
    minute or two.`

Optionally, add it to the home screen to get an icon: in the shortcut's
**ⓘ** menu, choose **Add to Home Screen** · *Føj til hjemmeskærm*.

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

## Other ways to add photos

- **/admin → Photo Gallery** works from any browser, including on the phone.
  Photos uploaded there are also cleaned automatically: the location is removed,
  very large photos are shrunk, and HEIC photos are turned into JPEGs.
- **The Photos page** (see the next section).
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

---

## The Photos page: <https://ndrshfflr.github.io/upload.html>

One place for every picture on the site, and for anything new: pictures, a find
in the field log, a blog post, or any mix of them. Open it in Safari, or save it
to the home screen as an app called "Photos".

**Sign in** with **Sign in with GitHub**, which uses the same sign-in as /admin.
If you're already signed in to /admin in this browser, the page uses that.
- **From the home screen:** GitHub sign-in can't return to a home-screen app, so
  choose **Use a key instead** and paste the same key as the Shortcut. The key is
  kept on that phone only.

### New
1. **Pictures** (optional): **From this device**, or **From the library** for
   pictures already on the site. For each one: a caption, **Portfolio** (on the
   photography page, with its size 1–5 and what to keep in frame), and, when you
   make a find or a post, whether it goes **in the find** and **in the post**.
2. **Also make it** (optional, one or both):
   - **A find in the field log.** Type the species. Pick one of its sightings,
     or **A new sighting** (date, read from the first picture; place; for a new
     species also group and names). The pictures are linked to that sighting.
   - **A blog post.** Title and text start filled in from the find. Edit them
     as you like. The pictures ticked "In the post" go below your text, and the
     first one is the cover. With a find, its card in the field log gets "Read
     about this find".
3. **Publish.** Everything goes up in one go and is on the site in a minute or
   two. New pictures are shrunk to 2000 px and their location is removed *on the
   phone*, before anything leaves it.

### Library
Every picture in the site's image folders, with where it's used: Portfolio, Field
log, Blog, Pages, or Not used. Filter and search. Open one to:
- change its caption, put it in or out of the portfolio, and set its size and crop;
- link it to one or more sightings (or a new sighting), or unlink it;
- choose its blog post, and put it in that post's text;
- start something new with it (**New post or find with this picture…**).
- **delete it**: **Delete…** shows where it's used, and **Delete for good**
  removes the file from the website and takes it out of the portfolio, the field
  log, blog posts (the picture and the cover) and page fields.

To delete several: **Select**, tap the pictures (or **Choose all shown**, e.g.
under *Not used*), then **Delete N pictures…**.

The page isn't linked from the site, and search engines are asked not to list it.
Without a sign-in it can't do anything.

To add it to the home screen: open the page in Safari → **Share** · *Del* →
**Add to Home Screen** · *Føj til hjemmeskærm*.
