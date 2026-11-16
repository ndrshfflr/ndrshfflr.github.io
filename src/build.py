#!/usr/bin/env python3
"""Regenerate the site's HTML pages from src/templates/ and content/*.json.

You only need this when the page *structure* changes. Everyday text edits made
through /admin go into content/*.json and are picked up live by assets/site.js;
re-running this just bakes those edits into the HTML for search engines.

    pip install jinja2
    python3 src/build.py
"""
import datetime
import re
import unicodedata
import hashlib
import json
import math
from pathlib import Path

import yaml
from jinja2 import Environment, FileSystemLoader, select_autoescape

import cv_page

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
        "formTopics": ["Mould or damp in a building", "Foraging or cultivation", "Tours & workshops", "Buying a culture", "Insects & terrariums", "Research or collaboration", "Something else"],
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
        "pathsLabel": "Where to start",
        "faqMore": "Something else on your mind?",
        "faqMoreLink": "Ask me directly.",
        "duration": "Duration",
        "book": "Book a spot",
        "origin": "Origin", "format": "Format",
        "inStock": "Available", "soldOut": "Not available right now",
        "buy": "Buy", "orderCulture": "Order this culture",
        "readMore": "Read more", "allPosts": "All posts", "filterTags": "Filter posts by topic",
        "inhabitants": "Lives here", "careGuide": "Care guide", "askAvailability": "Ask about availability",
        "flSpecies": "Species", "flRecords": "Records", "flThisYear": "New this year", "flFilter": "Show one group",
        "flAll": "All", "flSearch": "Search the log", "flSortLabel": "Sort", "flSortNumber": "In the order found",
        "flSortNewest": "Newest first", "flSortAz": "A–Z", "flSortMost": "Most records", "flNoMatch": "Nothing in the log matches that.",
        "flFirst": "First found", "flLast": "Last seen", "flNew": "New", "flNotebook": "My notebook", "flOpenRecord": "Open the record",
        "flSynced": "Last synced", "flOf": "of", "flFromBlog": "From the blog",
        "flRefPhoto": "Reference photo, not mine", "flRefShort": "Ref. photo",
        "photoFieldlog": "In the field log", "photoPost": "Read the post", "postPhotos": "Photos",
        "flGroups": {"fungi": "Fungi", "birds": "Birds", "insects": "Insects", "arachnids": "Spiders & kin", "mammals": "Mammals",
                     "herps": "Amphibians & reptiles", "fish": "Fish", "molluscs": "Molluscs", "plants": "Plants", "other": "Other"},
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
        "formTopics": ["Skimmel eller fugt i en bygning", "Svampesankning eller dyrkning", "Ture & workshops", "Køb af en kultur", "Insekter & terrarier", "Forskning eller samarbejde", "Noget andet"],
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
        "pathsLabel": "Hvor vil du starte?",
        "faqMore": "Har du et andet spørgsmål?",
        "faqMoreLink": "Spørg mig direkte.",
        "duration": "Varighed",
        "book": "Book en plads",
        "origin": "Oprindelse", "format": "Format",
        "inStock": "På lager", "soldOut": "Ikke på lager lige nu",
        "buy": "Køb", "orderCulture": "Bestil denne kultur",
        "readMore": "Læs mere", "allPosts": "Alle indlæg", "filterTags": "Filtrér indlæg efter emne",
        "inhabitants": "Beboere", "careGuide": "Plejeguide", "askAvailability": "Spørg om de kan fås",
        "flSpecies": "Arter", "flRecords": "Fund", "flThisYear": "Nye i år", "flFilter": "Vis én gruppe",
        "flAll": "Alle", "flSearch": "Søg i fundbogen", "flSortLabel": "Sortér", "flSortNumber": "I fundrækkefølge",
        "flSortNewest": "Nyeste først", "flSortAz": "A–Å", "flSortMost": "Flest fund", "flNoMatch": "Intet i fundbogen matcher det.",
        "flFirst": "Første fund", "flLast": "Senest set", "flNew": "Ny", "flNotebook": "Min notesbog", "flOpenRecord": "Åbn fundet",
        "flSynced": "Senest synkroniseret", "flOf": "af", "flFromBlog": "Fra bloggen",
        "flRefPhoto": "Referencefoto, ikke mit eget", "flRefShort": "Ref.-foto",
        "photoFieldlog": "I fundbogen", "photoPost": "Læs indlægget", "postPhotos": "Fotos",
        "flGroups": {"fungi": "Svampe", "birds": "Fugle", "insects": "Insekter", "arachnids": "Edderkopper m.fl.", "mammals": "Pattedyr",
                     "herps": "Padder & krybdyr", "fish": "Fisk", "molluscs": "Bløddyr", "plants": "Planter", "other": "Andet"},
    },
}

# Wording shared by the stone circle and the worlds behind it (header, seasons,
# rune language) — see src/templates/world.html.j2 and assets/world.js.
WORLD_UI = {
    "en": {
        "language": "Language", "runesName": "Runes (long-branch Younger Futhark)",
        "seasons": {"winter": "Winter", "spring": "Spring", "summer": "Summer", "autumn": "Autumn"},
        "tod": {"night": "night", "dawn": "dawn", "dusk": "dusk", "day": "day"},
        "todaySeason": "Today's season", "today": "today", "todayHint": "(today)",
        "seasonAria": "Season: {s}. Change season", "chooseSeason": "Choose a season",
        "aa": "Show the text in Latin letters", "back": "Back to the circle",
        "toMoon": "Fly to the moon", "toSun": "Fly to the sun", "toEarth": "Fly back to the circle", "flyBack": "Fly back",
    },
    "da": {
        "language": "Sprog", "runesName": "Runer (yngre futhark, langkvist)",
        "seasons": {"winter": "Vinter", "spring": "Forår", "summer": "Sommer", "autumn": "Efterår"},
        "tod": {"night": "nat", "dawn": "daggry", "dusk": "skumring", "day": "dag"},
        "todaySeason": "Dagens årstid", "today": "i dag", "todayHint": "(i dag)",
        "seasonAria": "Årstid: {s}. Skift årstid", "chooseSeason": "Vælg en årstid",
        "aa": "Vis teksten med latinske bogstaver", "back": "Tilbage til cirklen",
        "toMoon": "Flyv til månen", "toSun": "Flyv til solen", "toEarth": "Flyv tilbage til cirklen", "flyBack": "Flyv tilbage",
    },
}

# The entry page (the stone circle of portals, index.html / da.html).
# Names, portals and the small menu live in content/entry.json + entry.da.json.
ENTRY_UI = {
    "en": {
        "worlds": "Worlds", "prev": "Turn to the previous world", "next": "Turn to the next world",
        "choosePortal": "Choose a world", "notesTools": "Notes and tools", "ofN": "{i} of {n}",
        "comingSoon": "This world is still being built",
    },
    "da": {
        "worlds": "Verdener", "prev": "Drej til forrige verden", "next": "Drej til næste verden",
        "choosePortal": "Vælg en verden", "notesTools": "Noter og værktøjer", "ofN": "{i} af {n}",
        "comingSoon": "Denne verden er stadig under opbygning",
    },
}

# The photography world (photography.html / photography.da.html).
# Photos, captions, weights and the page look live in content/gallery.json.
PHOTO_UI = {
    "en": {
        "gridLabel": "Photographs", "empty": "No photos yet.", "photoN": "Photo {i}",
        "readPost": "Read the post", "readPostTitle": "Read the post: {t}", "inFieldlog": "In the field log",
        "close": "Close", "prevPhoto": "Previous photo", "nextPhoto": "Next photo", "count": "{i} of {n}",
        "gear": "My gear", "show": "Show", "hide": "Hide", "views": "Ways to look at the photos",
        "stream": "Stream", "albums": "Albums", "trips": "Field trips", "allAlbums": "All albums",
        "photosN": "{n} photos", "photo1": "1 photo", "findsN": "{n} finds in the field log", "find1": "1 find in the field log",
        "world": "World", "zoomTo": "Zoom in on {t}", "tripsHere": "{n} trips", "openTrip": "Open the trip {t}",
        "mapLabel": "Map of the field trips", "noAlbums": "No albums yet.", "noTrips": "No field trips yet.",
        "kinds": {"camera": "Interchangeable-lens camera", "compact": "Fixed-lens compact camera", "phone": "Phone",
                  "prime": "Prime lens", "zoom": "Telephoto zoom lens", "other": ""},
    },
    "da": {
        "gridLabel": "Fotografier", "empty": "Ingen fotos endnu.", "photoN": "Foto {i}",
        "readPost": "Læs indlægget", "readPostTitle": "Læs indlægget: {t}", "inFieldlog": "I fundbogen",
        "close": "Luk", "prevPhoto": "Forrige foto", "nextPhoto": "Næste foto", "count": "{i} af {n}",
        "gear": "Mit udstyr", "show": "Vis", "hide": "Skjul", "views": "Måder at se fotografierne på",
        "stream": "Strøm", "albums": "Album", "trips": "Ture", "allAlbums": "Alle album",
        "photosN": "{n} fotos", "photo1": "1 foto", "findsN": "{n} fund i fundbogen", "find1": "1 fund i fundbogen",
        "world": "Verden", "zoomTo": "Zoom ind på {t}", "tripsHere": "{n} ture", "openTrip": "Åbn turen {t}",
        "mapLabel": "Kort over turene", "noAlbums": "Ingen album endnu.", "noTrips": "Ingen ture endnu.",
        "kinds": {"camera": "Systemkamera", "compact": "Kompaktkamera med fast objektiv", "phone": "Telefon",
                  "prime": "Fastobjektiv", "zoom": "Telezoomobjektiv", "other": ""},
    },
}
# The field log in the circle's world (fieldlog.html / fieldlog.da.html): the
# fl* strings from UI above, plus these.
FIELDLOG_UI = {
    "en": {
        "flSortLatest": "Latest sightings first", "flSortNewest": "Newest species first",
        "flFavourites": "Favourites", "flFavourite": "Favourite", "flHasStory": "There's a story about this find",
        "flReadAbout": "Read about this find", "flPhoto": "Photo",
        # only shown to you, when you're signed in (same sign-in as /admin)
        "flEditing": "Editing as", "flFavAdd": "Mark as favourite", "flFavRemove": "Remove from favourites",
        "flUseCover": "Use as cover", "flIsCover": "Cover", "flCoverAuto": "Cover · tap to go back to automatic",
        "flSaving": "Saving…", "flSaved": "Saved. On the site for everyone in a minute or two.", "flSaveFailed": "Couldn't save",
    },
    "da": {
        "flSortLatest": "Senest set først", "flSortNewest": "Nyeste arter først",
        "flFavourites": "Favoritter", "flFavourite": "Favorit", "flHasStory": "Der er en historie om dette fund",
        "flReadAbout": "Læs om dette fund", "flPhoto": "Foto",
        "flEditing": "Redigerer som", "flFavAdd": "Markér som favorit", "flFavRemove": "Fjern fra favoritter",
        "flUseCover": "Brug som forsidebillede", "flIsCover": "Forsidebillede", "flCoverAuto": "Forsidebillede · tryk for automatisk",
        "flSaving": "Gemmer…", "flSaved": "Gemt. Synligt for alle om et minut eller to.", "flSaveFailed": "Kunne ikke gemme",
    },
}

# Labdiary (blog), its posts, the CV and other extra pages, and the Bioinformatics
# world — all standing in the circle's world. Wording of the Labdiary comes from
# the "Blog" texts in content/home*.json; the tools from content/tools.json.
PAGES_UI = {
    "en": {
        "allPosts": "All posts", "readMore": "Read more", "loading": "Loading…", "filterTags": "Filter posts by topic",
        "notFound": "Page not found", "notFoundBody": "Sorry, this page couldn't be found.",
        "postPhotos": "Photos", "photoFieldlog": "In the field log", "downloadPdf": "Download as PDF",
        "toLabdiary": "Back to the labdiary", "openTool": "Open", "coming": "Coming", "toolsLabel": "Tools",
        "noTools": "No tools yet.",
    },
    "da": {
        "allPosts": "Alle indlæg", "readMore": "Læs mere", "loading": "Indlæser…", "filterTags": "Filtrér indlæg efter emne",
        "notFound": "Siden blev ikke fundet", "notFoundBody": "Beklager, siden kunne ikke findes.",
        "postPhotos": "Fotos", "photoFieldlog": "I fundbogen", "downloadPdf": "Download som PDF",
        "toLabdiary": "Tilbage til labdagbogen", "openTool": "Åbn", "coming": "På vej", "toolsLabel": "Værktøjer",
        "noTools": "Ingen værktøjer endnu.",
    },
}

PHOTO_META = {
    "en": {"description": "Photographs by Pieter Shiffler Carpentier."},
    "da": {"description": "Fotografier af Pieter Shiffler Carpentier."},
}
PHOTO_POS = {"center": "50% 50%", "top": "50% 18%", "bottom": "50% 82%", "left": "22% 50%", "right": "78% 50%"}

ENTRY_META = {
    "en": {
        "title": "Pieter Shiffler Carpentier — Biologist · Mycologist · Animist",
        "description": "Pieter Shiffler Carpentier, MSc Biology — indoor microbiology, fungiculture, foraging, conservation, small worlds, nature photography and bioinformatics.",
        "ogDescription": "Biologist, mycologist and animist. Step through a portal: indoor microbiology, fungiculture, foraging, conservation, small worlds, photography and bioinformatics.",
    },
    "da": {
        "title": "Pieter Shiffler Carpentier — Biolog · Mykolog · Animist",
        "description": "Pieter Shiffler Carpentier, MSc Biologi — indeklimamikrobiologi, svampedyrkning, sankning, naturbevarelse, små verdener, naturfotografi og bioinformatik.",
        "ogDescription": "Biolog, mykolog og animist. Træd gennem en portal: indeklimamikrobiologi, svampedyrkning, sankning, naturbevarelse, små verdener, fotografi og bioinformatik.",
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

# One Elder Futhark rune per section, chosen for its traditional meaning.
# (Runes co-opted by extremist groups — ōþila, algiz, double sōwilō — are avoided.)
RUNES = {
    "en": {
        "about": ("ᛗ", "mannaz — humankind"),
        "services": ("ᛚ", "laguz — water"),
        "trust": ("ᛏ", "tīwaz — justice"),
        "projects": ("ᚲ", "kenaz — torch, knowledge"),
        "mycology": ("ᛃ", "jēra — harvest"),
        "photography": ("ᛞ", "dagaz — daylight"),
        "faq": ("ᚨ", "ansuz — speech, wisdom"),
        "contact": ("ᛖ", "ehwaz — partnership"),
        "exploration": ("ᛈ", "perþ — mystery"),
        "fungi": ("ᛜ", "ingwaz — seed"),
        "grow": ("ᛃ", "jēra — harvest"),
        "tours": ("ᚱ", "raidō — journey"),
        "library": ("ᛒ", "berkanan — birch, growth"),
        "terrarium": ("ᚹ", "wunjō — joy"),
        "blog": ("ᚨ", "ansuz — speech, the word"),
        "tanks": ("ᛇ", "eihwaz — yew, endurance"),
        "species": ("ᚢ", "ūruz — wild beast"),
        "fieldlog": ("ᚠ", "fehu — wealth, what is gathered"),
    },
    "da": {
        "about": ("ᛗ", "mannaz — menneske"),
        "services": ("ᛚ", "laguz — vand"),
        "trust": ("ᛏ", "tīwaz — retfærdighed"),
        "projects": ("ᚲ", "kenaz — fakkel, viden"),
        "mycology": ("ᛃ", "jēra — høst"),
        "photography": ("ᛞ", "dagaz — dag"),
        "faq": ("ᚨ", "ansuz — tale, visdom"),
        "contact": ("ᛖ", "ehwaz — partnerskab"),
        "exploration": ("ᛈ", "perþ — mysterium"),
        "fungi": ("ᛜ", "ingwaz — frø"),
        "grow": ("ᛃ", "jēra — høst"),
        "tours": ("ᚱ", "raidō — rejse"),
        "library": ("ᛒ", "berkanan — birk, vækst"),
        "terrarium": ("ᚹ", "wunjō — glæde"),
        "blog": ("ᚨ", "ansuz — tale, ordet"),
        "tanks": ("ᛇ", "eihwaz — taks, udholdenhed"),
        "species": ("ᚢ", "ūruz — vildt dyr"),
        "fieldlog": ("ᚠ", "fehu — rigdom, det samlede"),
    },
}

PAGES = {
    # out file: (template, lang, body class)
    "index.html": ("entry.html.j2", "en"),      # the stone circle of portals
    "da.html": ("entry.html.j2", "da"),
    "classic.html": ("index.html.j2", "en"),    # the long one-page site, reached through the portals
    "classic.da.html": ("index.html.j2", "da"),
    "exploration.html": ("exploration.html.j2", "en"),
    "exploration.da.html": ("exploration.html.j2", "da"),
    "fungi.html": ("fungi.html.j2", "en"),
    "fungi.da.html": ("fungi.html.j2", "da"),
    "terrarium.html": ("terrarium.html.j2", "en"),
    "terrarium.da.html": ("terrarium.html.j2", "da"),
    "fieldlog.html": ("fieldlog.html.j2", "en"),
    "fieldlog.da.html": ("fieldlog.html.j2", "da"),
}
# The pages above that the circle no longer leads to (since the worlds were emptied
# for a rebuild). They stay online for old links but ask search engines to drop them.
UNLISTED = {"classic.html", "classic.da.html", "exploration.html", "exploration.da.html",
            "fungi.html", "fungi.da.html", "terrarium.html", "terrarium.da.html"}
ENTRY = {"en": "index.html", "da": "da.html"}
HOME = {"en": "classic.html", "da": "classic.da.html"}
PHOTOGRAPHY = {"en": "photography.html", "da": "photography.da.html"}
EXPLORATION = {"en": "exploration.html", "da": "exploration.da.html"}
FUNGI = {"en": "fungi.html", "da": "fungi.da.html"}
TERRARIUM = {"en": "terrarium.html", "da": "terrarium.da.html"}
BLOG = {"en": "blog.html", "da": "blog.da.html"}
FIELDLOG = {"en": "fieldlog.html", "da": "fieldlog.da.html"}
POST = {"en": "post.html", "da": "post.da.html"}
PAGE = {"en": "page.html", "da": "page.da.html"}
BIOINFO = {"en": "bioinformatics.html", "da": "bioinformatics.da.html"}
MOON = {"en": "moon.html", "da": "moon.da.html"}
SUN = {"en": "sun.html", "da": "sun.da.html"}

# The moon and the sun (moon.html, sun.html + .da.html): the disc in the sky is a link that
# lands you there — the moon at dusk and night, the sun by day.
SKY_UI = {
    "moon": {"en": {"heading": "The Moon", "comingSoon": "This world is still being built"},
             "da": {"heading": "Månen", "comingSoon": "Denne verden er stadig under opbygning"}},
    "sun": {"en": {"heading": "The Sun", "comingSoon": "This world is still being built"},
            "da": {"heading": "Solen", "comingSoon": "Denne verden er stadig under opbygning"}},
}
CV = {"en": "cv.html", "da": "cv.da.html"}


def load(name):
    return json.loads((ROOT / "content" / name).read_text(encoding="utf-8"))


MONTHS = {
    "en": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    "da": ["januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"],
}


def load_posts():
    """Blog posts written in the CMS live in content/posts/*.md (front matter +
    markdown). They are listed newest first; site.js refreshes the list live, so
    a new post shows up without re-running this script."""
    posts = []
    for f in sorted((ROOT / "content" / "posts").glob("*.md")):
        text = f.read_text(encoding="utf-8")
        m = re.match(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", text, re.S)
        meta = (yaml.safe_load(m.group(1)) or {}) if m else {}
        if not meta.get("title"):
            continue
        raw = meta.get("date") or f.stem[:10]
        if isinstance(raw, datetime.datetime):
            date = raw.date()
        elif isinstance(raw, datetime.date):
            date = raw
        else:
            try:
                date = datetime.date.fromisoformat(str(raw)[:10])
            except ValueError:
                date = datetime.date.today()
        tags = meta.get("tags") or []
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(",") if t.strip()]
        posts.append({
            "slug": f.stem, "title": str(meta["title"]), "summary": str(meta.get("summary") or "").strip(),
            "cover": meta.get("cover") or "", "tags": [str(t) for t in tags], "language": meta.get("language") or "",
            "date": date, "date_iso": date.isoformat(),
            "date_label": {"en": f"{date.day} {MONTHS['en'][date.month - 1]} {date.year}",
                           "da": f"{date.day}. {MONTHS['da'][date.month - 1]} {date.year}"},
        })
    posts.sort(key=lambda p: (p["date"], p["slug"]), reverse=True)
    return posts


def jsonld(d, lang):
    socials = [s["url"] for s in d["contact"].get("socials", []) if s.get("url", "").startswith("http")]
    person = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Pieter Shiffler Carpentier",
        "jobTitle": "Indoor Microbiology Specialist & Mycologist" if lang == "en" else "Specialist i indeklimamikrobiologi & mykolog",
        "description": META[lang]["ogDescription"],
        "url": SITE_URL + ("" if lang == "en" else ENTRY["da"]),
        "email": "mailto:" + d["contact"]["email"],
        "alumniOf": {"@type": "CollegeOrUniversity", "name": "University of Copenhagen"},
        "knowsAbout": ["Mycology", "Indoor microbiology", "Mould", "Building moisture damage", "Fungal identification", "Mushroom cultivation"],
        "knowsLanguage": ["da", "en"],
    }
    if socials:
        person["sameAs"] = socials
    return person


def asset_version(rel):
    """Short content hash, appended as ?v=… so browsers fetch a changed file
    immediately instead of serving a cached copy. Re-run this script after
    editing styles.css or the scripts so the hash updates."""
    return hashlib.sha1((ROOT / rel).read_bytes()).hexdigest()[:8]


def world_ui(page_ui):
    return {lang: dict(WORLD_UI[lang], **page_ui[lang]) for lang in ("en", "da")}


def render_world_page(env, tpl, files, lang, **ctx):
    """One page built on src/templates/world.html.j2 (the circle's sky, header
    and rune language). files = {"en": "x.html", "da": "x.da.html"}."""
    html = env.get_template(tpl).render(
        template_name=tpl, lang=lang, site_url=SITE_URL, entry_href=ENTRY[lang], lang_hrefs=files, **ctx)
    (ROOT / files[lang]).write_text(html, encoding="utf-8")
    print("wrote", files[lang])


WEIGHT_CELLS = {1: (1, 1), 2: (2, 1), 3: (2, 2), 4: (3, 2), 5: (3, 3)}


def photo_cells(p, weight):
    """How many grid cells a photo spans (columns, rows). Width and height (1–3 each, set on the page)
    win; without them the old size 1–5 gives the shape."""
    def cells(v):
        try:
            return min(3, max(1, int(v)))
        except (TypeError, ValueError):
            return 0
    w, h = cells(p.get("width")), cells(p.get("height"))
    if w or h:
        return w or 1, h or 1
    return WEIGHT_CELLS.get(weight, (1, 1))


def album_id(name, taken=()):
    base = re.sub(r"[^a-z0-9]+", "-", unicodedata.normalize("NFKD", str(name).lower().replace("æ", "ae").replace("ø", "oe").replace("å", "aa"))
                  .encode("ascii", "ignore").decode()).strip("-") or "album"
    i, out = 2, base
    while out in taken:
        out, i = f"{base}-{i}", i + 1
    return out


def photo_albums(gallery_doc):
    """The albums of the photography page, in their order (content/gallery.json → albums:
    id, name, Danish name, cover, photos in their order). Only photos on the photography
    page count. Album names still written on a photo (the old way) are added on."""
    on_page = {str(p["image"]) for p in gallery_doc.get("images") or [] if p and p.get("image") and p.get("onPhotoPage") is not False}
    albums, by_name = [], {}
    for a in gallery_doc.get("albums") or []:
        name = str((a or {}).get("name") or "").strip()
        if not name:
            continue
        aid = str(a.get("id") or "").strip()
        aid = aid if re.match(r"^[a-z0-9-]+$", aid) and aid not in {x["slug"] for x in albums} else album_id(name, {x["slug"] for x in albums})
        photos = []
        for x in a.get("photos") or []:
            x = str(x or "")
            if x in on_page and x not in photos:
                photos.append(x)
        cover = str(a.get("cover") or "")
        albums.append({"slug": aid, "name": name, "nameDa": str(a.get("nameDa") or "").strip(),
                       "cover": cover if cover in photos else "", "images": photos})
        by_name[name.lower()] = albums[-1]
    for p in gallery_doc.get("images") or []:  # the old way: album names on the photo
        if not p or str(p.get("image") or "") not in on_page:
            continue
        for name in p.get("albums") or []:
            name = str(name or "").strip()
            if not name:
                continue
            if name.lower() not in by_name:
                albums.append({"slug": album_id(name, {x["slug"] for x in albums}), "name": name, "nameDa": "", "cover": "", "images": []})
                by_name[name.lower()] = albums[-1]
            if p["image"] not in by_name[name.lower()]["images"]:
                by_name[name.lower()]["images"].append(str(p["image"]))
    return albums


def photo_extras(gallery_doc, photos, titles):
    """The gear, the albums and the field trips of the photography page (content/gallery.json)."""
    gear = []
    for g in gallery_doc.get("gear") or []:
        name = str((g or {}).get("name") or "").strip()
        if name:
            kind = g.get("kind") if g.get("kind") in ("camera", "compact", "phone", "prime", "zoom") else "other"
            gear.append({"name": name, "kind": kind})

    albums = photo_albums(gallery_doc)

    # when a photo was taken: its sighting's date, else its kept metadata's date, else the date its file name starts with
    fl = load("fieldlog.json")
    obs = load("observations.json")
    records = [r for r in obs.get("items") or [] if r.get("date")]
    manual = {m.get("id"): m for m in fl.get("manual") or [] if m and m.get("id")}
    records += [{"date": m.get("date"), "name": m.get("name"), "place": m.get("place") or ""} for m in manual.values() if m.get("date")]
    by_id = {r.get("id"): r for r in obs.get("items") or [] if r.get("id")}

    def sighting(sid):
        sid = str(sid or "")
        if sid.startswith("manual:"):
            return manual.get(sid[7:])
        return by_id.get(sid)

    def taken(p):
        """When a photo was taken: its sighting's date, else the date kept in its metadata, else the date its file name starts with."""
        for sid in p.get("sightings") or []:
            s = sighting(sid)
            if s and s.get("date"):
                return s["date"][:10], s.get("place") or ""
        if re.match(r"^\d{4}-\d{2}-\d{2}", str(p.get("taken") or "")):
            return str(p["taken"])[:10], ""
        m = re.match(r"(\d{4}-\d{2}-\d{2})", (p.get("image") or "").split("/")[-1])
        return (m.group(1) if m else ""), ""

    trips = []
    for t in gallery_doc.get("trips") or []:
        t = t or {}
        name = str(t.get("name") or "").strip()
        try:
            lat, lon = float(t.get("lat")), float(t.get("lon"))
        except (TypeError, ValueError):
            continue
        if not name or not (-90 <= lat <= 90 and -180 <= lon <= 180):
            continue
        start = str(t.get("from") or "")[:10]
        end = str(t.get("to") or "")[:10] or start
        match = str(t.get("placeMatch") or "").strip().lower()
        pics = [str(x) for x in t.get("photos") or [] if x]
        if start and t.get("gather", True) is not False:
            for p in gallery_doc.get("images") or []:
                if not p or not p.get("image"):
                    continue
                day, place = taken(p)
                if day and start <= day <= end and not (match and place and match not in place.lower()) and p["image"] not in pics:
                    pics.append(str(p["image"]))
        finds = [r for r in records if start and start <= (r.get("date") or "")[:10] <= end
                 and not (match and match not in (r.get("place") or "").lower())]
        species = []
        for r in finds:
            n = str(r.get("name") or "").strip()
            if n and n not in species:
                species.append(n)
        post = str(t.get("post") or "")
        trips.append({"id": re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "trip", "name": name,
                      "nameDa": str(t.get("nameDa") or "").strip(), "from": start, "to": end,
                      "place": str(t.get("place") or ""), "placeDa": str(t.get("placeDa") or ""),
                      "lat": round(lat, 4), "lon": round(lon, 4), "images": pics,
                      "finds": len(finds), "species": species[:8],
                      "post": post if re.match(r"^[A-Za-z0-9._-]+$", post) else "", "postTitle": titles.get(post, "")})
    trips.sort(key=lambda x: x["from"] or "", reverse=True)
    # photos a trip shows that aren't in the stream (field-log-only): what the viewer needs for them
    shown = {p["image"] for p in photos}
    more = {}
    for p in gallery_doc.get("images") or []:
        img = str((p or {}).get("image") or "")
        if img and img not in shown and any(img in t["images"] for t in trips):
            post = str(p.get("post") or "")
            more[img] = {"image": img, "caption": str(p.get("caption") or ""), "pos": PHOTO_POS.get(p.get("focus"), PHOTO_POS["center"]),
                         "post": post if re.match(r"^[A-Za-z0-9._-]+$", post) else "",
                         "species": [str(x) for x in (p.get("species") if isinstance(p.get("species"), list) else [p.get("species")]) if x]}
    for t in trips:
        t["images"] = [i for i in t["images"] if i in shown or i in more]
    return {"gear": gear, "albums": albums, "trips": trips, "more": more}


def render_photography(env, entry, gallery_doc, posts, versions):
    """photography.html / photography.da.html: one mosaic of weighted photos."""
    titles = {p["slug"]: p["title"] for p in posts}
    photos = []
    for p in gallery_doc.get("images", []):
        if not p.get("image") or p.get("onPhotoPage") is False:  # field-log-only photos stay off this page
            continue
        try:
            weight = min(5, max(1, round(float(p.get("weight") or 1))))
        except (TypeError, ValueError):
            weight = 1
        post = str(p.get("post") or "")
        c, r = photo_cells(p, weight)
        photos.append({  # same keys, same order as normalise() in assets/photos.js
            "image": str(p["image"]), "caption": str(p.get("caption") or ""), "weight": weight, "c": c, "r": r,
            "pos": PHOTO_POS.get(p.get("focus"), PHOTO_POS["center"]),
            "post": post if re.match(r"^[A-Za-z0-9._-]+$", post) else "",
            "species": [str(x) for x in (p.get("species") if isinstance(p.get("species"), list) else [p.get("species")]) if x],
        })
    look = "darkroom" if gallery_doc.get("look") == "darkroom" else "sky"
    intro = gallery_doc.get("intro") or {}
    portal = {lang: next((x for x in entry[lang]["portals"] if x.get("key") == "photography"), {}) for lang in ("en", "da")}
    text = {lang: {"heading": portal[lang].get("name") or ("Photography" if lang == "en" else "Fotografi"),
                   "intro": str(intro.get(lang) or "") if isinstance(intro, dict) else ""} for lang in ("en", "da")}
    cover = max(photos, key=lambda p: p["c"] * p["r"], default=None)  # the biggest photo is the social preview
    extras = photo_extras(gallery_doc, photos, titles)
    ui = world_ui(PHOTO_UI)
    for lang in ("en", "da"):
        alternates = [{"hreflang": l, "href": SITE_URL + PHOTOGRAPHY[l]} for l in ("en", "da")]
        meta = {"title": text[lang]["heading"] + " — Pieter Shiffler Carpentier",
                "description": text[lang]["intro"] or PHOTO_META[lang]["description"],
                "canonical": SITE_URL + PHOTOGRAPHY[lang], "alternates": alternates,
                "image": (SITE_URL + cover["image"].lstrip("/")) if cover else ""}
        meta["ogDescription"] = meta["description"]
        render_world_page(
            env, "photography.html.j2", PHOTOGRAPHY, lang,
            ui=ui[lang], meta=meta, jsonld=None, v=versions, world_class="scrolls" + (" look-darkroom" if look == "darkroom" else ""),
            world_data={"page": lang, "ui": ui},
            heading=text[lang]["heading"], intro=text[lang]["intro"], rune=portal[lang].get("rune") or "ᛋ",
            photos=[dict(p, post_title=titles.get(p["post"], "")) for p in photos],
            gear=extras["gear"], has_trips=bool(extras["trips"]),
            data={"photos": photos, "posts": titles,
                  "text": text, "fieldlog": FIELDLOG, **extras,
                  # for editing on the page (assets/photos-edit.js): fetched only when the owner is signed in
                  "edit": dict(edit_backend(), v={"core": versions["editcorejs"], "js": versions["photoseditjs"], "css": versions["photoseditcss"]})},
        )


def edit_backend():
    """Where edits made on the site itself are saved, and how to sign in: the same as /admin."""
    cms = yaml.safe_load((ROOT / "admin" / "config.yml").read_text(encoding="utf-8"))["backend"]
    return {"repo": cms["repo"], "branch": cms.get("branch", "main"),
            "proxy": cms.get("base_url", ""), "authEndpoint": cms.get("auth_endpoint", "auth")}


def render_upload(env, posts, versions):
    """upload.html: the Photos page — every picture on the site, and one New form (not linked, not indexed)."""
    data = {
        **edit_backend(),
        "photography": PHOTOGRAPHY["en"], "fieldlog": "fieldlog.html",
        "posts": [{"slug": p["slug"], "title": p["title"], "date": p["date_iso"]} for p in posts],
    }
    html = env.get_template("upload.html.j2").render(data=data, v=versions, photography_href=PHOTOGRAPHY["en"])
    (ROOT / "upload.html").write_text(html, encoding="utf-8")
    print("wrote upload.html")


def render_fieldlog(env, content, posts, versions):
    """fieldlog.html / fieldlog.da.html: the field log, standing in the circle's world."""
    page_ui = {lang: dict({k: v for k, v in UI[lang].items() if k.startswith("fl")},
                          loading=UI[lang]["loading"], close=UI[lang]["close"], **FIELDLOG_UI[lang]) for lang in ("en", "da")}
    ui = world_ui(page_ui)
    text = {lang: content[lang]["fieldlog"] for lang in ("en", "da")}
    cms = yaml.safe_load((ROOT / "admin" / "config.yml").read_text(encoding="utf-8"))["backend"]
    for lang in ("en", "da"):
        fl = text[lang]
        alternates = [{"hreflang": l, "href": SITE_URL + FIELDLOG[l]} for l in ("en", "da")]
        description = fl["intro"][:155].rsplit(" ", 1)[0] + ("…" if len(fl["intro"]) > 155 else "")
        meta = {"title": fl["heading"] + " — Pieter Shiffler Carpentier", "description": description, "ogDescription": description,
                "canonical": SITE_URL + FIELDLOG[lang], "alternates": alternates}
        render_world_page(
            env, "fieldlog.html.j2", FIELDLOG, lang,
            t=fl, ui=ui[lang], meta=meta, jsonld=None, v=versions, world_class="scrolls fl-world",
            world_data={"page": lang, "ui": ui}, rune="ᚱ",
            data={"text": text, "posts": {p["slug"]: p["title"] for p in posts},
                  "repo": cms["repo"], "branch": cms.get("branch", "main")},
        )


def menu_item(entry, lang, link_start, fallback):
    """The name and rune of a small-menu item (or portal), found by its link."""
    for m in entry[lang].get("menu", []) + entry[lang].get("portals", []):
        if str(m.get("link") or "").startswith(link_start):
            return {"name": m.get("name") or fallback, "rune": m.get("rune") or ""}
    return {"name": fallback, "rune": ""}


def render_pages(env, content, entry, posts, versions):
    """The Labdiary (blog.html), posts (post.html), the CV and other extra pages
    (page.html?slug=…) and the Bioinformatics world, in the circle's world."""
    ui = world_ui(PAGES_UI)
    tools_doc = load("tools.json")
    for lang in ("en", "da"):
        other = "da" if lang == "en" else "en"
        b = content[lang]["blog"]
        lab = menu_item(entry, lang, "blog", "Labdiary" if lang == "en" else "Labdagbog")
        tags = []
        for p in posts:
            for t in p["tags"]:
                if t not in tags:
                    tags.append(t)
        common = dict(ui=ui[lang], jsonld=None, v=versions, world_class="scrolls pg-world",
                      world_data={"page": lang, "ui": ui}, labdiary_href=BLOG[lang], post_href=POST[lang])
        description = b["intro"][:155]
        render_world_page(
            env, "blog.html.j2", BLOG, lang,
            meta={"title": lab["name"] + " — Pieter Shiffler Carpentier", "description": description, "ogDescription": description,
                  "canonical": SITE_URL + BLOG[lang], "alternates": [{"hreflang": l, "href": SITE_URL + BLOG[l]} for l in ("en", "da")]},
            heading=lab["name"], rune=lab["rune"] or "ᚬ", b=b, posts=posts, tags=tags, **common)
        render_world_page(
            env, "post.html.j2", POST, lang,
            meta={"title": lab["name"] + " — Pieter Shiffler Carpentier", "description": description, "ogDescription": description,
                  "canonical": "", "alternates": []},
            rune=lab["rune"] or "ᚬ", **common)
        cv = menu_item(entry, lang, "page.html", "CV")
        render_world_page(
            env, "page.html.j2", PAGE, lang,
            meta={"title": "Pieter Shiffler Carpentier", "description": META[lang]["description"], "ogDescription": META[lang]["ogDescription"],
                  "canonical": "", "alternates": []},
            rune=cv["rune"] or "ᛘ", **common)
        bio = next((p for p in entry[lang]["portals"] if p.get("key") == "bioinformatics"), {})
        heading = bio.get("name") or ("Bioinformatics" if lang == "en" else "Bioinformatik")
        intro = (tools_doc.get("intro") or {}).get(lang) or ""
        tools = []
        for t in tools_doc.get("tools", []):
            desc = t.get("description") or {}
            tools.append({"name": str(t.get("name") or ""), "link": str(t.get("link") or ""),
                          "status": "coming" if t.get("status") == "coming" or not t.get("link") else "live",
                          "text": str(desc.get(lang) or desc.get(other) or "")})
        bdesc = intro or ", ".join(t["name"] for t in tools)
        render_world_page(
            env, "bioinformatics.html.j2", BIOINFO, lang,
            meta={"title": heading + " — Pieter Shiffler Carpentier", "description": bdesc, "ogDescription": bdesc,
                  "canonical": SITE_URL + BIOINFO[lang], "alternates": [{"hreflang": l, "href": SITE_URL + BIOINFO[l]} for l in ("en", "da")]},
            heading=heading, rune=bio.get("rune") or "ᚼ", intro=intro, tools=tools, **common)


def render_sky(env, versions):
    """moon.html and sun.html (+ .da.html): the moon or the sun, landed on. Placeholders for now."""
    for body, files in (("moon", MOON), ("sun", SUN)):
        ui = world_ui(SKY_UI[body])
        for lang in ("en", "da"):
            t = SKY_UI[body][lang]
            render_world_page(
                env, "sky.html.j2", files, lang, body=body,
                meta={"title": t["heading"] + " — Pieter Shiffler Carpentier", "description": t["comingSoon"],
                      "ogDescription": t["comingSoon"], "canonical": SITE_URL + files[lang],
                      "alternates": [{"hreflang": l, "href": SITE_URL + files[l]} for l in ("en", "da")]},
                ui=ui[lang], jsonld=None, v=versions, world_class="sky-world " + body + "-world", world_data={"page": lang, "ui": ui})


def render_cv(env, content, entry, posts, versions):
    """cv.html / cv.da.html: the CV on the road down from the mountain (content/cv.json,
    prepared by src/cv_page.py). The English text is shown on both pages; the page's
    own words (headings, buttons, labels) follow the language."""
    doc = load("cv.json")
    try:
        observations = load("observations.json")
    except (OSError, ValueError):
        observations = {}
    ui = world_ui({l: {} for l in ("en", "da")})
    for lang in ("en", "da"):
        cvm = menu_item(entry, lang, "cv", "CV")
        lab = menu_item(entry, lang, "blog", "Labdiary" if lang == "en" else "Labdagbog")
        cv = cv_page.build(doc, posts, observations, lang, POST[lang], lab["name"])
        description = (doc.get("tagline") or "") + (" — " + doc["intro"][:120].rsplit(" ", 1)[0] + "…" if doc.get("intro") else "")
        meta = {"title": "CV — Pieter Shiffler Carpentier", "description": description, "ogDescription": description,
                "canonical": SITE_URL + CV[lang], "alternates": [{"hreflang": l, "href": SITE_URL + CV[l]} for l in ("en", "da")]}
        render_world_page(
            env, "cv.html.j2", CV, lang,
            ui=ui[lang], meta=meta, jsonld=None, v=versions, world_class="scrolls cv-world",
            world_data={"page": lang, "ui": ui}, rune=cvm["rune"] or "ᛘ", cv=cv,
            email=(content[lang].get("contact") or {}).get("email") or "", post_href=POST[lang],
            data={"ui": {"countAll": cv["ui"]["countAll"], "countSome": cv["ui"]["countSome"]}, "counts": cv["counts"]},
        )


def render_entry(env, content, entry, versions):
    """index.html and da.html: the stone circle of portals."""
    count = len(entry["en"]["portals"])
    ring = []
    for i in range(count):  # the ring as it stands before assets/entry.js takes over
        phi = i * 360 / count
        c = math.cos(math.radians(phi))
        ring.append({"t": f"rotateY({phi:g}deg) translateZ(var(--r)) rotateY({-phi:g}deg)",
                     "o": f"{0.3 + 0.7 * (c + 1) / 2:.3f}", "lo": f"{max(0.0, c):.3f}"})
    # the row of runes under the circle, laid out as the circle looks at the start: the front
    # portal in the middle, its neighbours either side, the ones at the back on the ends
    dot_order = [off % count for off in range(-((count - 1) // 2), count // 2 + 1)]
    for lang in ("en", "da"):
        alternates = [
            {"hreflang": "en", "href": SITE_URL},
            {"hreflang": "da", "href": SITE_URL + ENTRY["da"]},
            {"hreflang": "x-default", "href": SITE_URL},
        ]
        meta = dict(ENTRY_META[lang], canonical=SITE_URL + ("" if lang == "en" else ENTRY["da"]), alternates=alternates)
        ui = world_ui(ENTRY_UI)
        render_world_page(
            env, "entry.html.j2", ENTRY, lang,
            e=entry[lang], ui=ui[lang], meta=meta, jsonld=jsonld(content[lang], lang), ring=ring, dot_order=dot_order, v=versions,
            world_data={"page": lang, "ui": ui}, data={"content": entry}, world_class="circle",
        )


def main():
    env = Environment(loader=FileSystemLoader(ROOT / "src" / "templates"), autoescape=select_autoescape(["j2", "html"]),
                      trim_blocks=False, lstrip_blocks=False)
    content = {"en": load("home.json"), "da": load("home.da.json")}
    # Photos are shared: the Danish page falls back to the English hero photo/portrait.
    for key, sub in (("image", "hero"), ("imageAlt", "hero"), ("portrait", "about")):
        if not content["da"][sub].get(key):
            content["da"][sub][key] = content["en"][sub].get(key, "")
    gallery = [g for g in load("gallery.json").get("images", []) if g.get("image") and g.get("onPhotoPage") is not False]
    year = datetime.date.today().year
    versions = {"css": asset_version("styles.css"), "js": asset_version("assets/site.js"),
                "mycelium": asset_version("assets/mycelium.js"), "md": asset_version("assets/markdown.js"),
                "fieldlog": asset_version("assets/fieldlog.js"), "fieldlogcss": asset_version("assets/fieldlog.css"),
                "worldcss": asset_version("assets/world.css"), "worldjs": asset_version("assets/world.js"),
                "entrycss": asset_version("assets/entry.css"), "entryjs": asset_version("assets/entry.js"),
                "photoscss": asset_version("assets/photos.css"), "photosjs": asset_version("assets/photos.js"), "photosmorejs": asset_version("assets/photos-more.js"),
                "uploadcss": asset_version("assets/upload.css"), "uploadjs": asset_version("assets/upload.js"),
                "editcorejs": asset_version("assets/edit-core.js"),
                "photoseditjs": asset_version("assets/photos-edit.js"), "photoseditcss": asset_version("assets/photos-edit.css"),
                "pagescss": asset_version("assets/pages.css"), "pagesjs": asset_version("assets/pages.js"),
                "skycss": asset_version("assets/sky.css"),
                "cvcss": asset_version("assets/cv.css"), "cvjs": asset_version("assets/cv.js")}
    posts = load_posts()
    entry = {"en": load("entry.json"), "da": load("entry.da.json")}
    render_entry(env, content, entry, versions)
    render_photography(env, entry, load("gallery.json"), posts, versions)
    render_upload(env, posts, versions)
    render_fieldlog(env, content, posts, versions)
    render_pages(env, content, entry, posts, versions)
    render_sky(env, versions)
    render_cv(env, content, entry, posts, versions)

    for out, (tpl, lang) in PAGES.items():
        d = content[lang]
        other = "da" if lang == "en" else "en"
        is_home = tpl == "index.html.j2"
        is_expl = tpl == "exploration.html.j2"
        is_fungi = tpl == "fungi.html.j2"
        is_terra = tpl == "terrarium.html.j2"
        is_blog = tpl == "blog.html.j2"
        is_log = tpl == "fieldlog.html.j2"
        if tpl in ("entry.html.j2", "fieldlog.html.j2"):
            continue  # rendered by render_entry() / render_fieldlog()
        if is_home:
            canonical = SITE_URL + HOME[lang]
            alternates = [
                {"hreflang": "en", "href": SITE_URL + HOME["en"]},
                {"hreflang": "da", "href": SITE_URL + HOME["da"]},
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
        elif is_fungi:
            canonical = SITE_URL + FUNGI[lang]
            alternates = [
                {"hreflang": "en", "href": SITE_URL + FUNGI["en"]},
                {"hreflang": "da", "href": SITE_URL + FUNGI["da"]},
            ]
            other_href = FUNGI[other]
            meta = dict(META[lang])
            f = d["fungi"]
            meta["title"] = f["grow"]["heading"] + " · " + f["tours"]["heading"] + " — Pieter Shiffler Carpentier"
            meta["description"] = f["intro"][:155].rsplit(" ", 1)[0] + ("…" if len(f["intro"]) > 155 else "")
            meta["ogDescription"] = meta["description"]
        elif is_terra:
            canonical = SITE_URL + TERRARIUM[lang]
            alternates = [
                {"hreflang": "en", "href": SITE_URL + TERRARIUM["en"]},
                {"hreflang": "da", "href": SITE_URL + TERRARIUM["da"]},
            ]
            other_href = TERRARIUM[other]
            meta = dict(META[lang])
            tt = d["terrarium"]
            meta["title"] = tt["teaserHeading"] + " — Pieter Shiffler Carpentier"
            meta["description"] = tt["intro"][:155].rsplit(" ", 1)[0] + ("…" if len(tt["intro"]) > 155 else "")
            meta["ogDescription"] = meta["description"]
        elif is_blog:
            canonical = SITE_URL + BLOG[lang]
            alternates = [
                {"hreflang": "en", "href": SITE_URL + BLOG["en"]},
                {"hreflang": "da", "href": SITE_URL + BLOG["da"]},
            ]
            other_href = BLOG[other]
            meta = dict(META[lang])
            meta["title"] = d["blog"]["heading"] + " — Pieter Shiffler Carpentier"
            meta["description"] = d["blog"]["intro"][:155]
            meta["ogDescription"] = meta["description"]
        elif is_log:
            canonical = SITE_URL + FIELDLOG[lang]
            alternates = [
                {"hreflang": "en", "href": SITE_URL + FIELDLOG["en"]},
                {"hreflang": "da", "href": SITE_URL + FIELDLOG["da"]},
            ]
            other_href = FIELDLOG[other]
            meta = dict(META[lang])
            fl = d["fieldlog"]
            meta["title"] = fl["heading"] + " — Pieter Shiffler Carpentier"
            meta["description"] = fl["intro"][:155].rsplit(" ", 1)[0] + ("…" if len(fl["intro"]) > 155 else "")
            meta["ogDescription"] = meta["description"]
        else:  # page.html / post.html — generic CMS pages, English
            canonical = ""
            alternates = []
            other_href = HOME[other]
            meta = dict(META[lang])
            meta["title"] = "Pieter Shiffler Carpentier"

        html = env.get_template(tpl).render(
            d=d, lang=lang, ui=UI[lang], meta=dict(meta, canonical=canonical, alternates=alternates),
            site_url=SITE_URL, home_href=("" if is_home else HOME[lang]), entry_href=ENTRY[lang], other_lang_href=other_href,
            exploration_href=EXPLORATION[lang], fungi_href=FUNGI[lang], terrarium_href=TERRARIUM[lang], blog_href=BLOG[lang], fieldlog_href=FIELDLOG[lang], posts=posts, gallery=gallery, year=year,
            jsonld=jsonld(d, lang), body_class=("home" if is_home else "subpage portal-page" if (is_fungi or is_terra or is_log) else "subpage"), v=versions,
            runes={k: {"glyph": g, "title": t} for k, (g, t) in RUNES[lang].items()},
            noindex=out in UNLISTED,
        )
        (ROOT / out).write_text(html, encoding="utf-8")
        print("wrote", out)

    # sitemap
    urls = ["", "da.html", "photography.html", "photography.da.html", "bioinformatics.html", "bioinformatics.da.html",
            "blog.html", "blog.da.html", "fieldlog.html", "fieldlog.da.html", "cv.html", "cv.da.html"]
    today = datetime.date.today().isoformat()
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    urls += ["post.html?slug=" + p["slug"] for p in posts]
    for u in urls:
        sm.append(f"  <url>\n    <loc>{SITE_URL}{u.replace('&', '&amp;')}</loc>\n    <lastmod>{today}</lastmod>\n  </url>")
    sm.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sm) + "\n", encoding="utf-8")
    print("wrote sitemap.xml")


if __name__ == "__main__":
    main()
