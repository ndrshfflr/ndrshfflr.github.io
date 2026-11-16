#!/usr/bin/env python3
"""Photos sent from the iPhone (see PHOTO-UPLOAD-GUIDE.md) arrive in images/inbox/.
This script, run by .github/workflows/photo-inbox.yml, files each one:

  1. reads its caption and weight — from a sidecar file next to it
     (<name>.json or <name>.txt) or else from the commit message that added it:
         Photo from iPhone
         caption: Fly agaric after rain
         weight: 3
     (also understood: post: <blog post file name>, focus: top/bottom/left/right,
      species: <field-log species, several separated by commas>,
      metadata: keep)
  2. turns it upright, shrinks it to 2000 px on the long side, saves it as a JPEG
     with no EXIF data at all (so no GPS location), keeping its colour profile.
     With "metadata: keep" the photo's metadata (camera, lens, settings, date,
     position) stays in the new file, and the parts to sort by are noted on the
     photo in content/gallery.json (keepMetadata, taken, camera, lens, lat, lon)
  3. moves it to images/gallery/ and puts it at the top of content/gallery.json,
     so it shows on the photography page within a minute or two
  4. a species sent from the upload page as a new find (one the field log doesn't
     have yet) is added to "Finds I add by hand" in content/fieldlog.json, with
     the photo

It also sweeps the photo folders the CMS uploads to (images/gallery, images/uploads,
images/blog): GPS location is removed from every JPEG (losslessly — the photo
itself is untouched), very large photos are shrunk, and HEIC photos are turned
into JPEGs (with links to them updated in content/). Photos marked "Keep
metadata" in content/gallery.json (keepMetadata: true) are left as they are,
position included.

    pip install pillow pillow-heif piexif
    python3 src/photo_inbox.py
"""
import datetime
import hashlib
import json
import os
import re
import shutil
import subprocess
import unicodedata
from pathlib import Path

import piexif
from PIL import Image, ImageOps

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:  # HEIC support is optional
    pillow_heif = None

ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / "images" / "inbox"
GALLERY_DIR = ROOT / "images" / "gallery"
GALLERY_JSON = ROOT / "content" / "gallery.json"
FIELDLOG_JSON = ROOT / "content" / "fieldlog.json"
OBS_JSON = ROOT / "content" / "observations.json"
GROUPS = {"fungi", "birds", "insects", "arachnids", "mammals", "herps", "fish", "molluscs", "plants", "other"}
SWEEP = [ROOT / "images" / d for d in ("gallery", "uploads", "blog")]
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
LONG_SIDE = 2000          # px on the long side for photos on the site
TOO_BIG = 2600            # photos larger than this get shrunk in the sweep
FOCUS = {"center": "center", "centre": "center", "middle": "center", "midt": "center",
         "top": "top", "top.": "top", "bottom": "bottom", "bund": "bottom",
         "left": "left", "venstre": "left", "right": "right", "højre": "right"}
KEYS = ("caption", "weight", "post", "focus", "species", "metadata")

log = []


def say(msg):
    print(msg)
    log.append(msg)


def git(*args):
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True).stdout.strip()


# ---------------------------------------------------------------- reading the details
def parse_lines(text):
    meta = {}
    for line in (text or "").splitlines():
        m = re.match(r"^\s*(caption|weight|post|focus|species|metadata|billedtekst|vægt)\s*[:=]\s*(.*?)\s*$", line, re.I)
        if m:
            key = {"billedtekst": "caption", "vægt": "weight"}.get(m.group(1).lower(), m.group(1).lower())
            meta[key] = m.group(2)
    return meta


def details_for(path):
    """Caption, weight, … for one inbox photo, and the date it was sent."""
    meta = {}
    for ext in (".json", ".txt"):
        side = path.with_suffix(ext)
        if side.exists():
            text = side.read_text(encoding="utf-8")
            if ext == ".json":
                try:
                    data = json.loads(text)
                    meta = {k: data[k] if k == "species" else str(data[k]) for k in KEYS if data.get(k) not in (None, "", [])}
                    if data.get("onPhotoPage") is False:
                        meta["onPhotoPage"] = False
                    if isinstance(data.get("newFinds"), list):
                        meta["newFinds"] = data["newFinds"]
                except ValueError:
                    meta = parse_lines(text)
            else:
                meta = parse_lines(text)
            break
    rel = str(path.relative_to(ROOT))
    if not meta:
        meta = parse_lines(git("log", "--diff-filter=A", "-1", "--format=%B", "--", rel))
    date = git("log", "--diff-filter=A", "-1", "--format=%cs", "--", rel) or datetime.date.today().isoformat()

    entry = {"caption": meta.get("caption", "").strip()}
    m = re.search(r"[1-5]", meta.get("weight", ""))
    entry["weight"] = int(m.group(0)) if m else 1
    focus = FOCUS.get(meta.get("focus", "").strip().lower())
    if focus and focus != "center":
        entry["focus"] = focus
    post = meta.get("post", "").strip()
    if re.match(r"^[A-Za-z0-9._-]+$", post):
        entry["post"] = re.sub(r"\.md$", "", post)
    # one or several species (a list, or names separated by commas or semicolons)
    sp = meta.get("species") or []
    names = sp if isinstance(sp, list) else re.split(r"[;,]", str(sp))
    names = [str(n).strip() for n in names if str(n).strip()]
    if names:
        entry["species"] = names
    if meta.get("onPhotoPage") is False:
        entry["onPhotoPage"] = False
    if re.match(r"^(keep|behold|yes|ja|true|1)\b", str(meta.get("metadata") or "").strip().lower()):
        entry["keepMetadata"] = True
    finds = [f for f in (clean_find(x, date) for x in meta.get("newFinds") or []) if f]
    if finds:
        entry["newFinds"] = finds
        entry["species"] = entry.get("species", []) + [f["name"] for f in finds if f["name"] not in entry.get("species", [])]
    return entry, date


def clean_find(x, sent):
    """One new find from the upload page, checked: only the fields /admin knows."""
    if not isinstance(x, dict):
        return None
    text = lambda k, n=120: re.sub(r"\s+", " ", str(x.get(k) or "")).strip()[:n]
    name = text("name")
    if not name:
        return None
    date = text("date", 10)
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", date):
        date = sent
    group = text("group").lower()
    find = {"name": name[0].upper() + name[1:]}
    for k in ("common", "commonDa"):
        if text(k):
            find[k] = text(k)
    find["group"] = group if group in GROUPS else "other"
    find["date"] = date
    if text("place"):
        find["place"] = text("place")
    return find


def norm(s):
    return unicodedata.normalize("NFD", str(s or "").lower()).encode("ascii", "ignore").decode().strip()


def sighting_id(find):
    """A stable id for a sighting added by hand ("manual:<id>" links photos to it)."""
    h = hashlib.sha1(f"{find['name']}|{find['date']}|{find.get('place', '')}".encode()).hexdigest()[:4]
    return "m" + find["date"].replace("-", "") + "-" + h


def add_finds(finds):
    """Put new finds into "Finds I add by hand" as sightings, and link each
    photo (its gallery entry) to its sighting."""
    if not finds or not FIELDLOG_JSON.exists():
        return
    cfg = json.loads(FIELDLOG_JSON.read_text(encoding="utf-8"))
    manual = cfg.setdefault("manual", [])
    obs = json.loads(OBS_JSON.read_text(encoding="utf-8")) if OBS_JSON.exists() else {}
    synced = {norm(sp.get("name")) for sp in obs.get("species") or [] if isinstance(sp, dict)}
    synced |= {norm(o.get("name")) for o in obs.get("items") or [] if isinstance(o, dict)}
    changed = False
    for find, item in finds:
        k = norm(find["name"])
        # the same sighting sent with several photos (or earlier in this batch)
        mine = next((m for m in manual if m and norm(m.get("name")) == k and str(m.get("date", ""))[:10] == find["date"]), None)
        if mine is None and k in synced:
            say(f"{find['name']} is already in the field log: the photo is linked to the species")
            continue
        if mine is None:
            mine = dict({"id": sighting_id(find)}, **find)
            manual.append(mine)
            say(f"new find in the field log: {find['name']} ({find['date']})")
            changed = True
        elif not mine.get("id"):
            mine["id"] = sighting_id(dict(find, place=mine.get("place", "")))
            changed = True
        link = "manual:" + mine["id"]
        if link not in item.setdefault("sightings", []):
            item["sightings"].append(link)
    if changed:
        FIELDLOG_JSON.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def slug(text, fallback="photo"):
    t = (text or "").lower().replace("æ", "ae").replace("ø", "oe").replace("å", "aa")
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode()
    t = "-".join(re.findall(r"[a-z0-9]+", t))[:40].strip("-")
    return t or fallback


# ---------------------------------------------------------------- image work
NOTED = ("taken", "camera", "lens", "lat", "lon")  # what's noted on a photo that keeps its metadata, to sort by


def kept_exif(exif):
    """A photo's EXIF for a photo that keeps its metadata: all of it, marked upright
    (the photo itself gets turned) and without its small built-in preview (which
    isn't). None when it can't be read."""
    try:
        d = piexif.load(exif)
    except Exception:
        return None
    d["0th"][piexif.ImageIFD.Orientation] = 1
    d["1st"], d["thumbnail"] = {}, None
    try:
        return piexif.dump(d)
    except Exception:
        d["Exif"].pop(piexif.ExifIFD.MakerNote, None)  # some cameras' own notes can't be written back
        try:
            return piexif.dump(d)
        except Exception:
            return None


def facts(src):
    """The parts of a photo's metadata the site sorts by (src: a file path, or EXIF
    bytes): when it was taken, camera, lens, and position (5 decimals)."""
    try:
        d = piexif.load(src)
    except Exception:
        return {}
    def text(ifd, tag):
        v = d.get(ifd, {}).get(tag) or b""
        v = v.decode("latin-1", "ignore") if isinstance(v, bytes) else str(v)
        return re.sub(r"[^\x20-\x7e]", "", v.split("\x00")[0]).strip()
    out = {}
    m = re.match(r"^(\d{4}):(\d{2}):(\d{2})(?: (\d{2}:\d{2}:\d{2}))?", text("Exif", piexif.ExifIFD.DateTimeOriginal) or text("0th", piexif.ImageIFD.DateTime))
    if m and m.group(1) != "0000":
        out["taken"] = f"{m.group(1)}-{m.group(2)}-{m.group(3)}" + (f"T{m.group(4)}" if m.group(4) else "")
    make, model = text("0th", piexif.ImageIFD.Make), text("0th", piexif.ImageIFD.Model)
    camera = f"{make} {model}" if make and model and not model.lower().startswith(make.lower().split(" ")[0]) else (model or make)
    if camera:
        out["camera"] = camera
    if text("Exif", piexif.ExifIFD.LensModel):
        out["lens"] = text("Exif", piexif.ExifIFD.LensModel)
    gps = d.get("GPS") or {}
    def degrees(value, ref, negative):
        deg = sum((n / m) / 60 ** i for i, (n, m) in enumerate(value))
        ref = ref.decode() if isinstance(ref, bytes) else str(ref or "")
        return round(-deg if ref.strip("\x00 ").upper() == negative else deg, 5)
    try:
        lat = degrees(gps[piexif.GPSIFD.GPSLatitude], gps.get(piexif.GPSIFD.GPSLatitudeRef), "S")
        lon = degrees(gps[piexif.GPSIFD.GPSLongitude], gps.get(piexif.GPSIFD.GPSLongitudeRef), "W")
        if (lat or lon) and abs(lat) <= 90 and abs(lon) <= 180:
            out["lat"], out["lon"] = lat, lon
    except (KeyError, TypeError, ValueError, ZeroDivisionError):
        pass
    return out


def save_clean(img, dest, icc=None, exif=None):
    """Upright, at most LONG_SIDE px, JPEG with no EXIF (so no location) — or, for
    a photo that keeps its metadata, with the EXIF passed in (from kept_exif)."""
    img = ImageOps.exif_transpose(img)
    if img.mode not in ("RGB", "L"):
        if "A" in img.getbands():
            bg = Image.new("RGB", img.size, (255, 255, 255))
            bg.paste(img.convert("RGBA"), mask=img.convert("RGBA").split()[-1])
            img = bg
        else:
            img = img.convert("RGB")
    img.thumbnail((LONG_SIDE, LONG_SIDE), Image.LANCZOS)
    kwargs = {"quality": 85, "optimize": True, "progressive": True}
    if icc:
        kwargs["icc_profile"] = icc
    if exif:
        kwargs["exif"] = exif
    img.save(dest, "JPEG", **kwargs)


def file_inbox():
    if not INBOX.exists():
        return 0
    photos = [p for p in INBOX.iterdir() if p.suffix.lower() in IMAGE_EXT]
    if not photos:
        return 0
    # newest upload first; photos sent together keep the order they were chosen in
    photos.sort(key=lambda p: (-int(git("log", "--diff-filter=A", "-1", "--format=%ct", "--", str(p.relative_to(ROOT))) or 0), p.name))
    new, finds = [], []
    doc = json.loads(GALLERY_JSON.read_text(encoding="utf-8")) if GALLERY_JSON.exists() else {}
    images = doc.setdefault("images", [])
    GALLERY_DIR.mkdir(parents=True, exist_ok=True)
    done = 0
    for p in photos:
        try:
            entry, date = details_for(p)
            with Image.open(p) as img:
                icc = img.info.get("icc_profile")
                h = hashlib.sha1(p.read_bytes()).hexdigest()[:6]
                dest = GALLERY_DIR / f"{date}-{slug(entry['caption'])}-{h}.jpg"
                # "metadata: keep": the photo's EXIF goes along into the new file
                kept = kept_exif(img.info["exif"]) if entry.get("keepMetadata") and img.info.get("exif") else None
                # the upload page already sends small JPEGs with no metadata: keep them as they are
                if img.format == "JPEG" and not img.info.get("exif") and max(img.size) <= LONG_SIDE:
                    shutil.copyfile(p, dest)
                else:
                    save_clean(img, dest, icc, kept)
        except Exception as e:  # leave it in the inbox and say why
            say(f"could not file {p.name}: {e}")
            continue
        item = {"image": "/" + str(dest.relative_to(ROOT)).replace("\\", "/"), "caption": entry["caption"], "weight": entry["weight"]}
        for k in ("focus", "post", "species"):
            if entry.get(k):
                item[k] = entry[k]
        if entry.get("onPhotoPage") is False:
            item["onPhotoPage"] = False  # a field-log photo only
        if kept:
            item["keepMetadata"] = True
            item.update(facts(kept))
        new.append(item)
        finds += [(f, item) for f in entry.get("newFinds", [])]
        for side in (p, p.with_suffix(".json"), p.with_suffix(".txt")):
            if side.exists():
                side.unlink()
        say(f"filed {p.name} → {dest.name} (weight {entry['weight']}{', “' + entry['caption'] + '”' if entry['caption'] else ''}{', metadata kept' if kept else ''})")
        done += 1
    if done:
        add_finds(finds)  # before saving the gallery: it links the photos to their sightings
        images[0:0] = new
        GALLERY_JSON.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return done


def relink(old, new):
    """Point every mention of an image in content/ to its new file name."""
    old_url, new_url = "/" + str(old.relative_to(ROOT)), "/" + str(new.relative_to(ROOT))
    for f in (ROOT / "content").rglob("*"):
        if f.suffix in (".json", ".md") and f.is_file():
            text = f.read_text(encoding="utf-8")
            if old_url in text:
                f.write_text(text.replace(old_url, new_url), encoding="utf-8")


def keepers():
    """The photos marked "Keep metadata" in content/gallery.json: {path on the site: its entry}."""
    try:
        doc = json.loads(GALLERY_JSON.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}, None
    keep = {}
    for g in doc.get("images") or []:
        if isinstance(g, dict) and g.get("keepMetadata") is True and g.get("image"):
            keep["/" + str(g["image"]).lstrip("/")] = g
    return keep, doc


def sweep():
    """Remove GPS from photos uploaded through /admin; shrink huge ones; HEIC → JPEG.
    Photos marked "Keep metadata" are left as they are (and get the parts to sort by noted)."""
    changed = 0
    keep, gallery = keepers()
    noted = False
    for folder in SWEEP:
        if not folder.exists():
            continue
        for p in sorted(folder.iterdir()):
            ext = p.suffix.lower()
            try:
                if ext in (".heic", ".heif"):
                    if pillow_heif is None:
                        continue
                    dest = p.with_suffix(".jpg")
                    with Image.open(p) as img:
                        save_clean(img, dest, img.info.get("icc_profile"))
                    p.unlink()
                    relink(p, dest)
                    say(f"converted {p.name} → {dest.name} (location removed)")
                    changed += 1
                    continue
                if ext not in (".jpg", ".jpeg"):
                    continue
                entry = keep.get("/" + str(p.relative_to(ROOT)).replace("\\", "/"))
                with Image.open(p) as img:
                    big = max(img.size) > TOO_BIG
                    if big:
                        icc = img.info.get("icc_profile")
                        kept = kept_exif(img.info["exif"]) if entry is not None and img.info.get("exif") else None
                        img.load()
                        tmp = p.with_suffix(".tmp.jpg")
                        save_clean(img, tmp, icc, kept)
                if big:
                    tmp.replace(p)
                    say(f"shrank {p.relative_to(ROOT)} to {LONG_SIDE} px ({'metadata kept' if kept else 'location removed'})")
                    changed += 1
                if entry is not None:  # "Keep metadata": the file stays as it is; note the parts to sort by
                    found = facts(str(p))
                    if any(entry.get(k) != found[k] for k in found):
                        entry.update(found)
                        noted = True
                    continue
                if big:
                    continue
                exif = piexif.load(str(p))
                if exif.get("GPS"):
                    exif["GPS"] = {}
                    try:
                        piexif.insert(piexif.dump(exif), str(p))
                    except Exception:
                        exif["Exif"].pop(piexif.ExifIFD.MakerNote, None)
                        piexif.insert(piexif.dump(exif), str(p))
                    say(f"removed location from {p.relative_to(ROOT)}")
                    changed += 1
            except Exception as e:
                say(f"skipped {p.relative_to(ROOT)}: {e}")
    if noted:
        GALLERY_JSON.write_text(json.dumps(gallery, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        say("noted the details of photos that keep their metadata")
        changed += 1
    return changed


if __name__ == "__main__":
    n = file_inbox()
    m = sweep()
    print(f"{n} photo(s) filed from the inbox, {m} photo(s) cleaned")
    out = os.environ.get("PHOTO_INBOX_SUMMARY")  # the workflow puts this list in its commit message
    if out:
        Path(out).write_text("\n".join(log) + "\n" if log else "", encoding="utf-8")
