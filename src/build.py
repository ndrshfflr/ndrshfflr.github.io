#!/usr/bin/env python3
"""Regenerate the site's HTML pages from src/templates/ and content/*.json.

You only need this when the page *structure* changes. Everyday text edits made
through /admin go into content/*.json and are picked up live by assets/site.js;
re-running this just bakes those edits into the HTML for search engines.

    pip install jinja2
    python3 src/build.py
"""
import datetime
import json
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).resolve().parent.parent
SITE_URL = "https://ndrshfflr.github.io/"

UI = {
    "en": {
        "skip": "Skip to content",
        "menu": "Menu",
        "themeToggle": "Toggle day and night mode",
        "otherLang": "da", "otherLangLabel": "DA", "otherLangName": "Dansk",
        "turnaround": "Turnaround",
        "offerCta": "Ask about this",
        "offerPrefill": "About: ",
        "phone": "Phone", "area": "Service area",
        "caseProblem": "The problem", "caseFinding": "What I found", "caseOutcome": "Outcome",
        "formName": "Name", "formEmail": "Email", "formTopic": "What's it about?", "formMessage": "Message",
        "formTopics": ["Mould or damp in a building", "Foraging or cultivation", "Tours & workshops", "Research or collaboration", "Something else"],
        "formSend": "Send message",
        "formSending": "Sending…",
        "formSent": "Thanks — your message is on its way. I'll get back to you soon.",
        "formError": "Something went wrong. Please email me directly instead.",
        "formInvalid": "Please fill in your name, a valid email address and a message.",
        "formMailto": "Your email app should open with the message filled in — just press send.",
        "eggEyebrow": "You found it", "eggTitle": "Enter the mycelium",
        "eggHint": "move or tilt to explore · esc to close",
        "enableMotion": "Enable motion", "close": "Close",
        "eggFallback": "This needs WebGL, which your browser doesn't seem to support. The network is still out there.",
        "back": "Back to the main page", "loading": "Loading…",
        "notFound": "Page not found", "notFoundBody": "Sorry, this page couldn't be found.",
        "downloadPdf": "Download as PDF",
    },
    "da": {
        "skip": "Gå til indhold",
        "menu": "Menu",
        "themeToggle": "Skift mellem lyst og mørkt tema",
        "otherLang": "en", "otherLangLabel": "EN", "otherLangName": "English",
        "turnaround": "Leveringstid",
        "offerCta": "Spørg om dette",
        "offerPrefill": "Angående: ",
        "phone": "Telefon", "area": "Område",
        "caseProblem": "Problemet", "caseFinding": "Hvad jeg fandt", "caseOutcome": "Resultat",
        "formName": "Navn", "formEmail": "E-mail", "formTopic": "Hvad drejer det sig om?", "formMessage": "Besked",
        "formTopics": ["Skimmel eller fugt i en bygning", "Svampesankning eller dyrkning", "Ture & workshops", "Forskning eller samarbejde", "Noget andet"],
        "formSend": "Send besked",
        "formSending": "Sender…",
        "formSent": "Tak — din besked er sendt. Jeg vender tilbage hurtigst muligt.",
        "formError": "Noget gik galt. Skriv venligst direkte til min e-mail i stedet.",
        "formInvalid": "Udfyld venligst navn, en gyldig e-mailadresse og en besked.",
        "formMailto": "Dit mailprogram burde åbne med beskeden udfyldt — tryk bare send.",
        "eggEyebrow": "Du fandt den", "eggTitle": "Træd ind i myceliet",
        "eggHint": "bevæg eller vip for at udforske · esc for at lukke",
        "enableMotion": "Slå bevægelse til", "close": "Luk",
        "eggFallback": "Det her kræver WebGL, som din browser vist ikke understøtter. Netværket er der stadig.",
        "back": "Tilbage til forsiden", "loading": "Indlæser…",
        "notFound": "Siden blev ikke fundet", "notFoundBody": "Beklager, siden kunne ikke findes.",
        "downloadPdf": "Download som PDF",
    },
}

META = {
    "en": {
        "title": "Pieter Shiffler Carpentier — Mould, Indoor Microbiology & Mycology",
        "description": "Pieter Shiffler Carpentier, MSc Biology — indoor microbiology specialist and mycologist. Mould and damp sampling, lab analysis and remediation guidance.",
        "ogDescription": "MSc Biology — indoor microbiology specialist, mycologist, and guide to the world of fungi.",
    },
    "da": {
        "title": "Pieter Shiffler Carpentier — Skimmelsvamp, indeklima & mykologi",
        "description": "Pieter Shiffler Carpentier, MSc Biologi — specialist i indeklimamikrobiologi og mykolog. Prøvetagning og laboratorieanalyse af skimmel og fugt samt rådgivning om udbedring.",
        "ogDescription": "MSc Biologi — specialist i indeklimamikrobiologi, mykolog og guide til svampenes verden.",
    },
}

PAGES = {
    # out file: (template, lang, body class)
    "index.html": ("index.html.j2", "en"),
    "da.html": ("index.html.j2", "da"),
    "exploration.html": ("exploration.html.j2", "en"),
    "exploration.da.html": ("exploration.html.j2", "da"),
    "page.html": ("page.html.j2", "en"),
}
HOME = {"en": "index.html", "da": "da.html"}
EXPLORATION = {"en": "exploration.html", "da": "exploration.da.html"}


def load(name):
    return json.loads((ROOT / "content" / name).read_text(encoding="utf-8"))


def jsonld(d, lang):
    socials = [s["url"] for s in d["contact"].get("socials", []) if s.get("url", "").startswith("http")]
    person = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Pieter Shiffler Carpentier",
        "jobTitle": "Indoor Microbiology Specialist & Mycologist" if lang == "en" else "Specialist i indeklimamikrobiologi & mykolog",
        "description": META[lang]["ogDescription"],
        "url": SITE_URL + ("" if lang == "en" else "da.html"),
        "email": "mailto:" + d["contact"]["email"],
        "alumniOf": {"@type": "CollegeOrUniversity", "name": "University of Copenhagen"},
        "knowsAbout": ["Mycology", "Indoor microbiology", "Mould", "Building moisture damage", "Fungal identification", "Mushroom cultivation"],
        "knowsLanguage": ["da", "en"],
    }
    if socials:
        person["sameAs"] = socials
    return person


def main():
    env = Environment(loader=FileSystemLoader(ROOT / "src" / "templates"), autoescape=select_autoescape(["j2", "html"]),
                      trim_blocks=False, lstrip_blocks=False)
    content = {"en": load("home.json"), "da": load("home.da.json")}
    gallery = [g for g in load("gallery.json").get("images", []) if g.get("image")]
    year = datetime.date.today().year

    for out, (tpl, lang) in PAGES.items():
        d = content[lang]
        other = "da" if lang == "en" else "en"
        is_home = tpl == "index.html.j2"
        is_expl = tpl == "exploration.html.j2"
        if is_home:
            canonical = SITE_URL + ("" if lang == "en" else "da.html")
            alternates = [
                {"hreflang": "en", "href": SITE_URL},
                {"hreflang": "da", "href": SITE_URL + "da.html"},
                {"hreflang": "x-default", "href": SITE_URL},
            ]
            other_href = HOME[other]
            meta = dict(META[lang])
        elif is_expl:
            canonical = SITE_URL + EXPLORATION[lang]
            alternates = [
                {"hreflang": "en", "href": SITE_URL + EXPLORATION["en"]},
                {"hreflang": "da", "href": SITE_URL + EXPLORATION["da"]},
            ]
            other_href = EXPLORATION[other]
            meta = dict(META[lang])
            meta["title"] = d["exploration"]["heading"] + " — Pieter Shiffler Carpentier"
            meta["description"] = d["exploration"]["intro"][:155].rsplit(" ", 1)[0] + "…"
        else:  # page.html — generic CMS pages, English
            canonical = ""
            alternates = []
            other_href = HOME[other]
            meta = dict(META[lang])
            meta["title"] = "Pieter Shiffler Carpentier"

        html = env.get_template(tpl).render(
            d=d, lang=lang, ui=UI[lang], meta=dict(meta, canonical=canonical, alternates=alternates),
            site_url=SITE_URL, home_href=("" if is_home else HOME[lang]), other_lang_href=other_href,
            exploration_href=EXPLORATION[lang], gallery=gallery, year=year,
            jsonld=jsonld(d, lang), body_class=("home" if is_home else "subpage"),
        )
        (ROOT / out).write_text(html, encoding="utf-8")
        print("wrote", out)

    # sitemap
    urls = ["", "da.html", "exploration.html", "exploration.da.html", "page.html?slug=cv"]
    today = datetime.date.today().isoformat()
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        sm.append(f"  <url>\n    <loc>{SITE_URL}{u.replace('&', '&amp;')}</loc>\n    <lastmod>{today}</lastmod>\n  </url>")
    sm.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sm) + "\n", encoding="utf-8")
    print("wrote sitemap.xml")


if __name__ == "__main__":
    main()
