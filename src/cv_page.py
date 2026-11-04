"""The CV (cv.html / cv.da.html), standing in the circle's world.

Content lives in content/cv.json (/admin → CV). This module turns it into what
src/templates/cv.html.j2 needs: entries grouped by section and laid out
left/right, logo tiles, course and blog-post hover cards, the strengths radar
for every "View as" lens, the figures at the top, and the mountain with the
road that winds down the page.
"""
import math
import random
import re

from markupsafe import Markup, escape

LENSES = ["all", "researcher", "consultant", "guide"]

# Section order, rune (long-branch Younger Futhark) and the groups inside it.
SECTIONS = [
    ("education", "ᛒ", ["education"]),
    ("work", "ᛏ", ["work", "volunteering"]),
    ("grants", "ᚠ", ["grants"]),
    ("research", "ᚴ", ["research"]),
    ("presentations", "ᛋ", ["presentations"]),
]

CV_UI = {
    "en": {
        "eyebrow": "Curriculum vitae", "heading": "Curriculum vitae",
        "downloadPdf": "Download CV (PDF)", "contact": "Get in touch",
        "now": "current main occupation",
        "sections": {"education": "Education", "work": "Work Experience & Volunteering", "grants": "Grants & Funding",
                     "research": "Research Experience", "presentations": "Presentations & Outreach"},
        "groups": {"work": "Work", "volunteering": "Volunteering"},
        "viewAs": "View as", "viewAsLabel": "View the CV as",
        "lenses": {"all": "Everything", "researcher": "Researcher", "consultant": "Consultant", "guide": "Guide"},
        "lensRunes": {"all": "ᛘ", "researcher": "ᚴ", "consultant": "ᛏ", "guide": "ᚠ"},
        "countAll": "All {n} entries", "countSome": "{k} of {n} entries highlighted",
        "coworker": "As a coworker",
        "captions": {"all": "The whole picture", "researcher": "Seen as a researcher", "consultant": "Seen as a consultant", "guide": "Seen as a guide"},
        "strength": "strength", "lessMine": "less my thing",
        "radarAria": "Strengths, {c}, rated 1 to 5: {list}",
        "keyCourses": "Key courses", "builtOn": "Built on", "usedIn": "Used in",
        "readPost": "Read the post", "logos": "Logos: {names}",
        "grantsNote": "{sum} in total", "proficiency": "Proficiency {n} of 5",
    },
    "da": {
        "eyebrow": "Curriculum vitae", "heading": "Curriculum vitae",
        "downloadPdf": "Hent CV (PDF)", "contact": "Skriv til mig",
        "now": "nuværende hovedbeskæftigelse",
        "sections": {"education": "Uddannelse", "work": "Erhvervserfaring & frivilligt arbejde", "grants": "Bevillinger & legater",
                     "research": "Forskningserfaring", "presentations": "Oplæg & formidling"},
        "groups": {"work": "Arbejde", "volunteering": "Frivilligt arbejde"},
        "viewAs": "Se som", "viewAsLabel": "Se CV'et som",
        "lenses": {"all": "Det hele", "researcher": "Forsker", "consultant": "Rådgiver", "guide": "Guide"},
        "lensRunes": {"all": "ᛘ", "researcher": "ᚴ", "consultant": "ᛏ", "guide": "ᚠ"},
        "countAll": "Alle {n} punkter", "countSome": "{k} af {n} punkter fremhævet",
        "coworker": "Som kollega",
        "captions": {"all": "Hele billedet", "researcher": "Set som forsker", "consultant": "Set som rådgiver", "guide": "Set som guide"},
        "strength": "styrke", "lessMine": "mindre min ting",
        "radarAria": "Styrker, {c}, på en skala fra 1 til 5: {list}",
        "keyCourses": "Vigtige kurser", "builtOn": "Bygger på", "usedIn": "Brugt i",
        "readPost": "Læs indlægget", "logos": "Logoer: {names}",
        "grantsNote": "{sum} i alt", "proficiency": "Niveau {n} af 5",
    },
}


def emph(text):
    """Escape, then turn *words* into <em>words</em> (species names)."""
    return Markup(re.sub(r"\*([^*]+)\*", r"<em>\1</em>", str(escape(text or ""))))


def _num(amount):
    digits = re.sub(r"[^\d]", "", str(amount or ""))
    return int(digits) if digits else 0


def _fmt_sum(n, lang):
    s = f"{n:,}"
    return (s.replace(",", ".") if lang == "da" else s) + " DKK"


# ---------------------------------------------------------------- logo tiles
def _abs(path):
    """Logos are drawn through a CSS mask (url() in a custom property), which resolves
    relative paths against assets/cv.css — so make them root-relative."""
    path = str(path or "").strip()
    if not path or re.match(r"^(https?:)?/", path):
        return path
    return "/" + path.lstrip("./")


def logo_tile(keys, orgs, ui):
    found = [orgs[k] for k in (keys or []) if k in orgs][:3]
    if not found:
        return None
    return {
        "n": len(found),
        "label": ui["logos"].format(names=", ".join(o["name"] for o in found)),
        "segs": [{"abbr": o.get("abbr") or o["name"][:3].upper(), "logo": _abs(o.get("logo") or ""), "name": o["name"]} for o in found],
    }


# ---------------------------------------------------------------- radar
def radar(strengths, lens, lang, ui):
    axes = [a for a in strengths if lens == "all" or lens in (a.get("lenses") or [])]
    n = len(axes)
    if n < 3:
        return None
    cx = cy = 150
    rmax = 110

    def pt(r, i):
        ang = math.radians(-90 + 360 * i / n)
        return cx + r * math.cos(ang), cy + r * math.sin(ang)

    f = lambda v: f"{v:.1f}"
    rings = [" ".join(f"{f(x)},{f(y)}" for x, y in (pt(rmax * lv / 5, i) for i in range(n))) for lv in range(1, 6)]
    shape = " ".join("{},{}".format(*map(f, pt(rmax * max(0, min(5, a.get("score") or 0)) / 5, i))) for i, a in enumerate(axes))
    out = []
    for i, a in enumerate(axes):
        ang = math.radians(-90 + 360 * i / n)
        c, s = math.cos(ang), math.sin(ang)
        ex, ey = pt(rmax, i)
        score = max(0, min(5, a.get("score") or 0))
        mx, my = pt(rmax * score / 5, i)
        st = 7
        star = (f"M{f(mx)} {f(my - st)} L{f(mx + st * .3)} {f(my - st * .3)} L{f(mx + st)} {f(my)} L{f(mx + st * .3)} {f(my + st * .3)} "
                f"L{f(mx)} {f(my + st)} L{f(mx - st * .3)} {f(my + st * .3)} L{f(mx - st)} {f(my)} L{f(mx - st * .3)} {f(my - st * .3)} Z")
        lx, ly = pt(rmax + 12, i)
        tx = "-50%" if abs(c) < 0.2 else ("0" if c > 0 else "-100%")
        ty = "-85%" if s < -0.9 else ("-15%" if s > 0.9 else "-50%")
        label = (a.get("labelDa") if lang == "da" else None) or a.get("label") or ""
        long = (a.get("longDa") if lang == "da" else None) or a.get("long") or label
        out.append({"x": f(ex), "y": f(ey), "star": star, "dip": bool(a.get("dip")), "label": label, "long": long, "score": score,
                    "story": a.get("story") or "",
                    "pos": f"left:{(lx + 110) / 520 * 100:.2f}%;top:{(ly + 10) / 320 * 100:.2f}%;transform:translate({tx},{ty})"})
    cap = ui["captions"][lens]
    return {"lens": lens, "rings": rings, "shape": shape, "axes": out, "caption": cap,
            "aria": ui["radarAria"].format(c=cap.lower(), list=", ".join(f"{a['long']} {a['score']}" for a in out))}


# ---------------------------------------------------------------- scenery
def _poly(pts):
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)


def scenery():
    """The moonlit mountain at the top and the road that winds down the page.
    Deterministic (seeded), coloured from the season by CSS (assets/cv.css).
    The road's centre line is the same curve assets/cv.js follows to put every
    entry on it — keep the two in step."""
    rnd = random.Random(11)

    def jag(pts, amp, sub):
        out = [pts[0]]
        for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
            for k in range(1, sub + 1):
                t = k / sub
                y = y1 + (y2 - y1) * t + (rnd.uniform(-amp, amp) if k < sub else 0)
                out.append((x1 + (x2 - x1) * t, y))
        return out

    far = jag([(0, 330), (120, 290), (230, 250), (330, 285), (420, 230), (500, 265), (860, 250), (960, 200), (1060, 245),
               (1150, 215), (1260, 260), (1360, 235), (1440, 270)], 7, 4) + [(1440, 520), (0, 520)]
    ridge = jag([(0, 470), (140, 420), (260, 380), (360, 320), (440, 255), (520, 175), (575, 120), (622, 68), (668, 112),
                 (720, 150), (780, 196), (850, 178), (930, 236), (1040, 290), (1170, 350), (1300, 400), (1440, 440)], 5, 3)
    main = ridge + [(1440, 520), (0, 520)]
    snow = jag([(548, 150), (575, 120), (622, 68), (668, 112), (700, 140)], 2, 2) + [
        (684, 150), (662, 138), (642, 158), (620, 140), (598, 162), (578, 146), (560, 160)]
    lit = [p for p in ridge if p[0] >= 622]
    road = [(720, 520), (560, 476), (770, 430), (600, 384), (740, 338), (632, 294), (708, 252), (650, 214), (690, 182), (652, 156)]
    widths = [16, 13, 10.5, 8.5, 7, 5.5, 4.2, 3.2, 2.4]
    lines = "".join(
        f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" stroke-width="{widths[i]}" opacity="{0.2 - i * 0.012:.3f}"/>'
        for i, (a, b) in enumerate(zip(road, road[1:])))
    mountain = (
        '<svg class="cv-mountain" aria-hidden="true" focusable="false" viewBox="0 0 1440 520" preserveAspectRatio="xMidYMax slice">'
        '<defs><linearGradient id="cv-mt-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/>'
        '<stop offset=".7" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>'
        '<mask id="cv-mt-mask"><rect width="1440" height="520" fill="url(#cv-mt-fade)"/></mask></defs>'
        '<g mask="url(#cv-mt-mask)">'
        f'<polygon class="mt-far" points="{_poly(far)}"/>'
        f'<polygon class="mt-main" points="{_poly(main)}"/>'
        f'<polygon class="mt-snow" points="{_poly(snow)}"/>'
        f'<polyline class="mt-lit" points="{_poly(lit)}"/>'
        f'<g class="mt-road">{lines}</g>'
        '</g></svg>')
    H = 5000
    pts = []
    for i in range(101):
        t = i / 100
        amp = 40 + 260 * t
        x = 720 + amp * math.sin(t * 9.5 + 0.4) * (0.4 + 0.6 * t)
        w = 70 + 560 * t ** 1.1
        pts.append((x, t * H, w))
    left = [(x - w / 2, y) for x, y, w in pts]
    right = [(x + w / 2, y) for x, y, w in reversed(pts)]
    road_svg = (
        f'<svg class="cv-road" aria-hidden="true" focusable="false" viewBox="0 0 1440 {H}" preserveAspectRatio="none">'
        f'<polygon class="rd-body" points="{_poly(left + right)}"/>'
        f'<polyline class="rd-edge" points="{_poly(left)}" vector-effect="non-scaling-stroke"/>'
        f'<polyline class="rd-edge" points="{_poly(list(reversed(right)))}" vector-effect="non-scaling-stroke"/>'
        '</svg>')
    return Markup(mountain), Markup(road_svg)


# ---------------------------------------------------------------- the page
def build(doc, posts, observations, lang, post_href, labdiary):
    ui = CV_UI[lang]
    orgs = {o["key"]: o for o in doc.get("organisations", []) if o.get("key")}
    courses = {c["key"]: c for c in doc.get("courses", []) if c.get("key")}
    post_by_slug = {p["slug"]: p for p in posts}

    def course_card(key):
        c = courses.get(key)
        if not c:
            return None
        meta = " · ".join(x for x in [f"{c['ects']} ECTS" if c.get("ects") else "", str(c.get("year") or ""), c.get("degree") or ""] if x)
        rating = max(0, min(5, int(c.get("rating") or 0)))
        return {"name": c.get("name") or key, "meta": meta, "rating": rating, "stars": [i < rating for i in range(5)],
                "ratingLabel": ui["proficiency"].format(n=rating), "summary": c.get("summary") or "", "usedIn": c.get("usedIn") or ""}

    def post_card(slug):
        p = post_by_slug.get(slug or "")
        if not p:
            return None
        return {"href": f"{post_href}?slug={p['slug']}", "title": p["title"], "summary": p["summary"], "cover": p["cover"],
                "date": p["date_label"][lang], "where": labdiary}

    all_entries = [e for e in doc.get("entries", []) if e.get("title")]
    sections = []
    row = 0
    for key, rune, groups in SECTIONS:
        gs = []
        for g in groups:
            items = []
            for e in (x for x in all_entries if x.get("section") == g):
                side = "left" if len(items) % 2 == 0 else "right"
                row += 1
                lenses = [l for l in (e.get("lenses") or []) if l in LENSES]
                items.append({
                    "id": f"r{row}", "side": side, "year": e.get("year") or "", "title": emph(e["title"]),
                    "detail": emph(e.get("detail") or ""), "amount": e.get("amount") or "", "current": bool(e.get("current")),
                    "lenses": " ".join(lenses), "logo": logo_tile(e.get("logos"), orgs, ui),
                    "image": e.get("image") or "", "imageAlt": e.get("imageAlt") or "",
                    "post": post_card(e.get("post")) if key != "education" else None,
                    "course": course_card(e.get("course")),
                    "keyCourses": [c for c in (course_card(k) for k in (e.get("keyCourses") or [])) if c],
                    "builtOn": [c for c in (course_card(k) for k in (e.get("builtOn") or [])) if c],
                })
            if items:
                gs.append({"key": g, "label": ui["groups"].get(g) if len(groups) > 1 else "", "rows": items})
        if gs:
            sections.append({"key": key, "rune": rune, "heading": ui["sections"][key], "groups": gs})

    grants = [e for e in all_entries if e.get("section") == "grants"]
    figures = []
    for fg in doc.get("figures", []):
        label = (fg.get("labelDa") if lang == "da" else None) or fg.get("label") or ""
        note = (fg.get("noteDa") if lang == "da" else None) or fg.get("note") or ""
        value = str(fg.get("value") or "").strip()
        if fg.get("auto") == "grants":
            value = str(len(grants)) if grants else ""
            total = sum(_num(g.get("amount")) for g in grants)
            note = ui["grantsNote"].format(sum=_fmt_sum(total, lang)) if total else note
        elif fg.get("auto") == "species":
            value = str(len(observations.get("species") or [])) or ""
        if value and value != "0":
            figures.append({"label": label, "value": value, "note": note})

    now = [{"title": n.get("title") or "", "place": n.get("place") or "", "logo": logo_tile(n.get("logos"), orgs, ui)}
           for n in doc.get("now", []) if n.get("title")]
    radars = [r for r in (radar(doc.get("strengths", []), l, lang, ui) for l in LENSES) if r]
    counts = {l: sum(1 for s in sections for g in s["groups"] for it in g["rows"] if l == "all" or l in it["lenses"].split()) for l in LENSES}
    mountain, road = scenery()
    return {
        "ui": ui, "tagline": doc.get("tagline") or "", "intro": doc.get("intro") or "", "portrait": doc.get("portrait") or "",
        "pdf": doc.get("pdf") or "", "now": now, "figures": figures, "radars": radars, "sections": sections,
        "counts": counts, "lenses": LENSES, "mountain": mountain, "road": road,
    }
