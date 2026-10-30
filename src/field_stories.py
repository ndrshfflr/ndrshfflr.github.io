#!/usr/bin/env python3
"""Stories for the field log.

In /admin → Field log, ticking "Write about this find" (in "Favourites, photos
and stories", or on a find added by hand) and publishing asks for a blog post
about that species. This script, run by .github/workflows/field-stories.yml,
writes that post from what the field log knows — its photos, number, dates,
places and your note — saves it in content/posts/, and fills in "Its blog post"
so the card in the field log shows "Read about this find".

The post is an ordinary blog post: add your own text to it under Blog posts.
Each species gets one post; ticking the box again later does nothing new.

    python3 src/field_stories.py
"""
import datetime
import json
import re
import unicodedata
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
SETTINGS = ROOT / "content" / "fieldlog.json"
OBS = ROOT / "content" / "observations.json"
GALLERY = ROOT / "content" / "gallery.json"
POSTS = ROOT / "content" / "posts"
SLUG = re.compile(r"^[A-Za-z0-9._-]+$")
SOURCE = {"inaturalist": "iNaturalist", "svampeatlas": "Svampeatlas", "arter": "Arter.dk",
          "dofbasen": "DOFbasen", "ebird": "Merlin/eBird", "manual": "Notebook"}
GROUPS = {"fungi": "Fungi", "birds": "Birds", "insects": "Insects", "arachnids": "Spiders & kin", "mammals": "Mammals",
          "herps": "Amphibians & reptiles", "fish": "Fish", "molluscs": "Molluscs", "plants": "Plants", "other": "Other"}
MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]


def load(path, default):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default


def norm(s):
    return unicodedata.normalize("NFD", str(s or "").lower()).encode("ascii", "ignore").decode().strip()


def slugify(text):
    t = (text or "").lower().replace("æ", "ae").replace("ø", "oe").replace("å", "aa")
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode()
    return "-".join(re.findall(r"[a-z0-9]+", t))[:60].strip("-") or "find"


def long_date(iso):
    try:
        d = datetime.date.fromisoformat(iso[:10])
        return f"{d.day} {MONTHS[d.month - 1]} {d.year}"
    except (ValueError, TypeError):
        return iso or ""


def photo_list(x):
    out = []
    for p in x or []:
        src = p if isinstance(p, str) else (p or {}).get("src") or (p or {}).get("image") or ""
        if src:
            out.append(re.sub(r"^https?://ndrshfflr\.github\.io(?=/)", "", src))
    return out


def species_index(cfg, obs, gallery):
    """Every species in the field log, as the page shows it (same numbering)."""
    sources = cfg.get("sources") or {}
    hidden = set(cfg.get("hide") or [])
    hidden_sp = {norm(n) for n in cfg.get("hideSpecies") or []}
    items = [o for o in obs.get("items") or [] if o.get("name") and o.get("id") not in hidden
             and (sources.get(o.get("source")) or {}).get("enabled", True) is not False]
    for m in cfg.get("manual") or []:
        if m and m.get("name"):
            items.append({"source": "manual", "date": str(m.get("date") or "")[:10], "name": m["name"].strip(),
                          "common_en": m.get("common") or "", "common_da": m.get("commonDa") or "", "group": m.get("group") or "other",
                          "place": m.get("place") or "", "photos": photo_list(m.get("photos")) + ([m["photo"]] if m.get("photo") else []),
                          "note": m.get("notes") or ""})
    by = {}
    for o in items:
        k = norm(o["name"])
        if k in hidden_sp:
            continue
        sp = by.setdefault(k, {"name": o["name"], "en": "", "group": "", "recs": []})
        sp["en"] = sp["en"] or o.get("common_en") or ""
        if not sp["group"] or sp["group"] == "other":
            sp["group"] = o.get("group") or "other"
        sp["recs"].append(o)
    for sp in by.values():
        sp["recs"].sort(key=lambda r: r.get("date") or "9999")
        sp["first"] = sp["recs"][0].get("date") or ""
        sp["last"] = sp["recs"][-1].get("date") or ""
    order = sorted(by.values(), key=lambda s: (s["first"] or "9999", s["name"]))
    for i, sp in enumerate(order):
        sp["no"] = i + 1
    for g in (gallery.get("images") or []):
        names = g.get("species") if isinstance(g.get("species"), list) else [g.get("species")]
        for n in names:
            if n and norm(n) in by:
                by[norm(n)].setdefault("gallery", []).append(g)
    return by


def write_post(sp, extra, today):
    name, en = sp["name"], sp["en"]
    title = f"{en} ({name})" if en else name
    photos = []
    for p in (extra.get("photos") or []) + [q for r in sp["recs"] if r["source"] == "manual" for q in r.get("photos", [])] \
            + [g["image"] for g in sp.get("gallery", [])] + [r["photo"] for r in reversed(sp["recs"]) if r.get("photo")]:
        if p and p not in photos:
            photos.append(p)
    photos = photos[:6]
    places = [r.get("place") for r in sp["recs"] if r.get("place")]
    place = f" in {places[0]}" if places else ""
    summary = f"Nº {sp['no']:03d} in my field log, first found on {long_date(sp['first'])}{place}."

    base = f"{today}-{slugify(en or name)}"
    slug, n = base, 2
    while (POSTS / f"{slug}.md").exists():
        slug, n = f"{base}-{n}", n + 1

    log_link = "fieldlog.html#sp=" + quote(name)
    front = ["---", f"title: {json.dumps(title, ensure_ascii=False)}", f"date: {today}", "language: en",
             f"summary: {json.dumps(summary, ensure_ascii=False)}"]
    if photos:
        front.append(f"cover: {json.dumps(photos[0], ensure_ascii=False)}")
    front += ["tags:", "  - Field log", f"  - {GROUPS.get(sp['group'], 'Other')}", f"fieldlog: {json.dumps(name, ensure_ascii=False)}", "---", ""]
    body = []
    for p in photos[1:]:
        body += [f"![{title}]({p})", ""]
    first = long_date(sp["first"])
    seen = f"first found on {first}" + (f", last seen on {long_date(sp['last'])}" if sp["last"] and sp["last"] != sp["first"] else "")
    body += [f"*{name}* — Nº {sp['no']:03d} in the [field log]({log_link}), {seen}.", ""]
    if extra.get("note"):
        body += [extra["note"].strip(), ""]
    body += ["## Sightings", ""]
    for r in reversed(sp["recs"]):
        bits = [long_date(r.get("date") or "")] + ([r["place"]] if r.get("place") else []) + [SOURCE.get(r.get("source"), r.get("source") or "")]
        line = "- " + " · ".join(b for b in bits if b)
        if r.get("url"):
            line += f" ([record]({r['url']}))"
        body.append(line)
    body.append("")
    POSTS.mkdir(parents=True, exist_ok=True)
    (POSTS / f"{slug}.md").write_text("\n".join(front + body), encoding="utf-8")
    return slug


def main():
    cfg = load(SETTINGS, {})
    obs = load(OBS, {})
    gallery = load(GALLERY, {})
    by = species_index(cfg, obs, gallery)
    today = datetime.date.today().isoformat()

    # posts that already exist, per species (from either list)
    entries = [("finds", e, e.get("species")) for e in cfg.get("finds") or [] if e] + \
              [("manual", e, e.get("name")) for e in cfg.get("manual") or [] if e]
    have = {}
    for _, e, name in entries:
        if e.get("post") and SLUG.match(e["post"]) and (POSTS / f"{e['post']}.md").exists():
            have.setdefault(norm(name), e["post"])

    changed = False
    for kind, e, name in entries:
        if not e.get("story") or not name:
            continue
        if e.get("post") and (POSTS / f"{e['post']}.md").exists():
            continue
        k = norm(name)
        if k in have:  # this species already has its post: just link it
            e["post"] = have[k]
            changed = True
            continue
        sp = by.get(k)
        if not sp:
            print(f"skipped {name}: not in the field log (hidden, or spelt differently?)")
            continue
        extra = {"photos": photo_list(e.get("photos")) if kind == "finds" else [],
                 "note": (e.get("text") if kind == "finds" else "") or ""}
        # a note written for the species in the other list counts too
        for f in cfg.get("finds") or []:
            if f and norm(f.get("species")) == k:
                extra["photos"] = extra["photos"] or photo_list(f.get("photos"))
                extra["note"] = extra["note"] or f.get("text") or ""
        e["post"] = have[k] = write_post(sp, extra, today)
        changed = True
        print(f"wrote content/posts/{e['post']}.md for {name}")

    if changed:
        SETTINGS.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    else:
        print("no new stories")


if __name__ == "__main__":
    main()
