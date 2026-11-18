#!/usr/bin/env python3
"""Build sporexplore/data.js from the raw harvest + curated files.

Inputs (all in data/sporexplore/)
  seed_v3.json         curated morphology from v3 (macro characters, micro overrides)
  additions.json       curated morphology for species added in the revamp
  sources.json         reference list (literature + databases), DOIs verified against raw/crossref
  literature.json      spore measurements transcribed from literature, with page numbers
  raw/                 untouched API responses (GBIF, Index Fungorum, Svampeatlas, Crossref)

Outputs
  sporexplore/data.js          window.SPOREX = {...} consumed by the app
  data/sporexplore/report.json per-species audit: old v3 values, new values, flags, sources

Rules (see claude/revamp-roadmap-v7.md §2)
  * every displayed measurement has a source id; v3 values without a verifiable
    source are kept only as `legacy` and flagged
  * consensus core range = span of the sources' typical ranges; extremes in ()
  * flag when sources' mean length or mean Q differ by > 15 %
"""
import glob, html, json, os, re, statistics, sys, unicodedata
from datetime import date

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
D = os.path.join(ROOT, "data", "sporexplore")
RAW = os.path.join(D, "raw")
OUT = os.path.join(ROOT, "sporexplore", "data.js")
COUNTRIES = ["DK", "NO", "SE", "FI", "IS", "FO", "GL"]


def load(p, default=None):
    p = os.path.join(D, p)
    if not os.path.exists(p):
        return default
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def slug(name):
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def raw(sub, name):
    p = os.path.join(RAW, sub, slug(name) + ".json")
    if not os.path.exists(p):
        return None
    with open(p, encoding="utf-8") as f:
        return json.load(f)


# ------------------------------------------------------------------ spore text parser
NUM = r"\d+(?:[.,]\d+)?"
RANGE = (rf"(?:\(\s*(?P<{{p}}min>{NUM})\s*[-–]?\s*\)\s*)?"
         rf"(?P<{{p}}lo>{NUM})(?:\s*[-–]\s*(?P<{{p}}hi>{NUM}))?"
         rf"(?:\s*\(\s*[-–]?\s*(?P<{{p}}max>{NUM})\s*\))?")
PAIR = re.compile(RANGE.format(p="L") + r"\s*[x×X]\s*" + RANGE.format(p="W") + r"(?=\s*(?:µ|μ|u)m|\s*[,;.]|\s*$)", re.U)
ONE = re.compile(RANGE.format(p="D") + r"\s*(?:µ|μ|u)m(?!\s*(?:long|lang))", re.U)
ROUND = re.compile(r"kugle|rund|globose|spheric|subglobose|diamet|ornament|netmønster|reticul", re.I)
GLOBOSE = re.compile(r"(?:sporer|spores)[^.]{0,120}?(?:måler|measure|are|er)?\s*" + RANGE.format(p="D") +
                     r"\s*(?:µ|μ|u)m", re.U | re.I)
QRE = re.compile(r"Q\s*(?:=|:)?\s*(?P<qlo>\d+[.,]\d+)\s*[-–]\s*(?P<qhi>\d+[.,]\d+)")
QM = re.compile(r"Q(?:m|av|mean)\s*(?:=|:)?\s*(?P<qm>\d+[.,]\d+)(?!\s*[-–])")
QAV = re.compile(r"Q[- ]?(?:gns|av\.?(?:\s*range)?|m)\.?\s*(?:=|:)?\s*(?P<lo>\d+[.,]\d+)\s*[-–]\s*(?P<hi>\d+[.,]\d+)")


def f(x):
    return None if x is None else float(x.replace(",", "."))


def sentences(text):
    text = html.unescape(re.sub(r"<[^>]+>", " ", text or ""))
    text = re.sub(r"\s+", " ", text)
    # split on sentence ends that aren't decimal points
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+(?=[A-ZÆØÅ])", text) if s.strip()]


def _genera():
    g = set()
    p = os.path.join(RAW, "gbif", "_nordic_boletales.json")
    if os.path.exists(p):
        for sp in json.load(open(p, encoding="utf-8"))["species"].values():
            if sp.get("canonicalName"):
                g.add(sp["canonicalName"].split()[0])
    seed = os.path.join(D, "seed_v3.json")
    if os.path.exists(seed):
        g |= {s["n"].split()[0] for s in json.load(open(seed, encoding="utf-8"))["species"]}
    return g


GENERA = _genera()


def parse_spores(text, names=()):
    """Return a list of measurement dicts found in spore sentences of a description.
    Sentences whose subject is another taxon (comparisons: "Serpula pulverulenta has smaller
    spores, that measure …") are skipped."""
    out = []
    ss = sentences(text)
    epithets = {n.split()[1] for n in names if n and len(n.split()) > 1}
    for i, s in enumerate(ss):
        if not re.search(r"spor", s, re.I):
            continue
        subj = re.match(r"\s*(?:The |De |Hos )?([A-Z][a-z]+|[A-Z]\.) ([a-z-]{3,})\b", s)
        if subj and epithets and (subj.group(1) in GENERA or subj.group(1).endswith(".")) and subj.group(2) not in epithets:
            continue
        nxt = ss[i + 1] if i + 1 < len(ss) else ""
        m = PAIR.search(s)
        if m:
            g = m.groupdict()
            L = [f(g["Lmin"]), f(g["Llo"]), f(g["Lhi"]) or f(g["Llo"]), f(g["Lmax"])]
            W = [f(g["Wmin"]), f(g["Wlo"]), f(g["Whi"]) or f(g["Wlo"]), f(g["Wmax"])]
            if not (1 <= L[1] <= 40 and 1 <= W[1] <= 25 and L[2] >= W[1]):
                continue
            rec = {"L": L, "W": W, "verbatim": s}
        else:
            if not ROUND.search(s) or re.search(r"more than|less than|larger|smaller|mindre end|større end|over \d|under \d", s, re.I):
                continue
            cands = []
            for m in ONE.finditer(s):
                pre = s[max(0, m.start() - 6):m.start()].lower()
                if "ca." in pre or "under" in pre or "over" in pre:
                    continue
                g = m.groupdict()
                Dd = [f(g["Dmin"]), f(g["Dlo"]), f(g["Dhi"]) or f(g["Dlo"]), f(g["Dmax"])]
                if 2 <= Dd[1] <= 25:
                    cands.append(Dd)
            ranged = [c for c in cands if c[2] > c[1]]
            if not (ranged or cands):
                continue
            Dd = (ranged or cands)[-1]
            rec = {"L": Dd[:], "W": Dd[:], "verbatim": s, "globose": True}
        for src_s in (s, nxt if re.match(r"\s*Q", nxt or "") else ""):
            q = QRE.search(src_s)
            qa = QAV.search(src_s)
            qm = QM.search(src_s)
            if qa and "Qav" not in rec:
                rec["Qav"] = [f(qa["lo"]), f(qa["hi"])]
            elif q and "Q" not in rec:
                rec["Q"] = [f(q["qlo"]), f(q["qhi"])]
            if qm and "Qm" not in rec:
                rec["Qm"] = f(qm["qm"])
            if src_s is not s and (q or qa):
                rec["verbatim"] += " " + src_s
        low = s.lower()
        if "including the spines" in low or "including the ornament" in low or "inkl. pigge" in low:
            rec["ornIncluded"] = True
        elif "uden ornament" in low or "excluding ornament" in low or "without ornament" in low or "without the ornament" in low:
            rec["ornIncluded"] = False
        elif "inkl. ornament" in low or "including ornament" in low or "med ornament" in low:
            rec["ornIncluded"] = True
        out.append(rec)
    return out


# ------------------------------------------------------------------ Svampeatlas
def sa_record(name):
    """The Svampeatlas taxon whose FullName is exactly `name` — or, if that is a synonym,
    its accepted taxon. Never another taxon from the search results (varieties, look-alikes)."""
    r = raw("svampeatlas", name)
    if not r or not r.get("taxa"):
        return None
    taxa = {t["data"].get("_id"): t["data"] for t in r["taxa"].values()
            if isinstance(t.get("data"), dict) and not t["data"].get("_error")}
    exact = [t for t in taxa.values() if (t.get("FullName") or "").strip() == name]
    if not exact:
        return None
    t = exact[0]
    via = None
    if t.get("accepted_id") and t["accepted_id"] != t.get("_id") and t["accepted_id"] in taxa:
        via = t.get("FullName")
        t = taxa[t["accepted_id"]]
    return {"taxon": t, "retrieved": r.get("retrieved"), "via": via}


BINOMIAL_START = re.compile(r"^\s*([A-Z][a-z]+) ([a-z-]+)\b")


def own_text(text, names):
    """Keep only the part of a Svampeatlas book text that describes the target taxon.
    Book texts sometimes start with another species (shared plate text) or run on into the
    next genus/species; measurements from those parts must not be attributed to the target."""
    text = html.unescape(re.sub(r"<[^>]+>", " ", text or ""))
    text = re.sub(r"\s+", " ", text).strip()
    epithets = {n.split()[1] for n in names if len(n.split()) > 1}
    genera = {n.split()[0] for n in names}
    m = BINOMIAL_START.match(text)
    if m and m.group(2) not in epithets and m.group(0) not in names:
        return ""            # text is about another species
    # cut where another genus/species description starts ("X is a ...", "X can be separated ...")
    for mm in re.finditer(r"(?<=[.!?] )([A-Z][a-z]+)(?: ([a-z-]+))? (?:is a|is an|can be separated)", text):
        g, e = mm.group(1), mm.group(2)
        if g not in genera or (e and e not in epithets):
            return text[:mm.start()]
    return text


def sa_measurements(sa, names=()):
    a = (sa["taxon"].get("attributes") or {}) if sa else {}
    if isinstance(a, list):
        a = a[0] if a else {}
    names = set(names) | {sa["taxon"].get("FullName")} if sa else set(names)
    found = []
    for field, lang in (("diagnose", "da"), ("beskrivelse", "da"), ("BeskrivelseUK", "en"),
                        ("bogtekst_gyldendal_en", "en"), ("bogtekst_gyldendal", "da")):
        for m in parse_spores(own_text(a.get(field) or "", names), names):
            m["field"], m["lang"] = field, lang
            found.append(m)
    uniq, seen = [], set()
    for m in found:
        k = (tuple(m["L"]), tuple(m["W"]))
        if k in seen:
            continue
        seen.add(k)
        uniq.append(m)
    return uniq


# ------------------------------------------------------------------ Index Fungorum
def xml_field(xml, tag):
    m = re.search(rf"<{tag}>(.*?)</{tag}>", xml or "", re.S)
    return html.unescape(m.group(1)).strip() if m else None


def if_info(name):
    """Index Fungorum NameSearch records. Each carries Species Fungorum's CURRENT_NAME and
    the Kew referee, so this is where the accepted name comes from."""
    r = raw("indexfungorum", name)
    if not r:
        return None
    blobs = [r.get("search") or ""] + [v.get("xml") for v in (r.get("full") or {}).values() if isinstance(v, dict)]
    recs, seen = [], set()
    for blob in blobs:
        for x in re.findall(r"<IndexFungorum>(.*?)</IndexFungorum>", str(blob), re.S):
            num = xml_field(x, "RECORD_x0020_NUMBER")
            if not num or num in seen:
                continue
            seen.add(num)
            recs.append({
                "id": num,
                "name": xml_field(x, "NAME_x0020_OF_x0020_FUNGUS"),
                "authors": xml_field(x, "AUTHORS"),
                "year": xml_field(x, "YEAR_x0020_OF_x0020_PUBLICATION"),
                "status": xml_field(x, "NAME_x0020_STATUS"),
                "current": xml_field(x, "CURRENT_x0020_NAME_x0020_RECORD_x0020_NUMBER"),
                "currentName": xml_field(x, "CURRENT_x0020_NAME"),
                "referee": xml_field(x, "TAXONOMIC_x0020_REFEREE"),
                "family": xml_field(x, "Family_x0020_name"),
            })
    return {"records": recs, "retrieved": r.get("retrieved"), "url": r.get("searchUrl")}


# ------------------------------------------------------------------ GBIF
def gbif_info(name):
    r = raw("gbif", name)
    if not r:
        return None
    m = r.get("match") or {}
    sp = r.get("species") or {}
    return {
        "key": m.get("usageKey"), "acceptedKey": m.get("acceptedUsageKey") or m.get("usageKey"),
        "matchType": m.get("matchType"), "status": m.get("status"),
        "scientificName": m.get("scientificName"), "accepted": sp.get("accepted"),
        "family": m.get("family"), "counts": r.get("counts") or {},
        "vernacular": [(v.get("language"), v.get("vernacularName")) for v in r.get("vernacular") or []],
        "retrieved": r.get("retrieved"),
    }


# ------------------------------------------------------------------ consensus
def consensus(meas):
    allm = [m for m in meas if not m.get("excluded")]
    use = [m for m in allm if m.get("stat") != "collection-means"] or allm
    if not use:
        return None, []
    lo = min(m["L"][1] for m in use); hi = max(m["L"][2] for m in use)
    wlo = min(m["W"][1] for m in use); whi = max(m["W"][2] for m in use)
    mins = [m["L"][0] for m in use if m["L"][0]]; maxs = [m["L"][3] for m in use if m["L"][3]]
    wmins = [m["W"][0] for m in use if m["W"][0]]; wmaxs = [m["W"][3] for m in use if m["W"][3]]
    qs = [m["Q"] for m in use if m.get("Q")]
    c = {"lo": lo, "hi": hi, "wlo": wlo, "whi": whi,
         "lmin": min(mins) if mins and min(mins) < lo else None,
         "lmax": max(maxs) if maxs and max(maxs) > hi else None,
         "wmin": min(wmins) if wmins and min(wmins) < wlo else None,
         "wmax": max(wmaxs) if wmaxs and max(wmaxs) > whi else None,
         "q": [min(q[0] for q in qs), max(q[1] for q in qs)] if qs else None,
         "n_sources": len({m["src"] for m in allm})}
    flags = []
    if len({m["src"] for m in allm}) > 1:
        mid = lambda m, i, a: m["mean"][i] if m.get("mean") else (m[a][1] + m[a][2]) / 2
        mL = [mid(m, 0, "L") for m in allm]
        mQ = [mid(m, 0, "L") / mid(m, 1, "W") for m in allm]
        if (max(mL) - min(mL)) / statistics.mean(mL) > 0.15:
            flags.append({"k": "disagree-L", "t": f"Sources differ by {round(100*(max(mL)-min(mL))/statistics.mean(mL))} % in mean spore length"})
        if (max(mQ) - min(mQ)) / statistics.mean(mQ) > 0.15:
            flags.append({"k": "disagree-Q", "t": f"Sources differ by {round(100*(max(mQ)-min(mQ))/statistics.mean(mQ))} % in mean Q"})
    for m in allm:
        if m.get("stat") == "collection-means" and m is not use[0]:
            if m["L"][1] < lo - 0.5 or m["L"][2] > hi + 0.5:
                flags.append({"k": "cross-check", "t": f'Collection means in a recent study span {m["L"][1]}–{m["L"][2]} µm in length, beyond the {lo}–{hi} µm typical range'})
    return c, flags


# ------------------------------------------------------------------ APA helpers
MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August",
          "September", "October", "November", "December"]


def long_date(iso):
    y, m, d = (int(x) for x in iso.split("-"))
    return f"{MONTHS[m-1]} {d}, {y}"


def apa_authors(auth):
    """auth: list of {'family','given'} → APA 7 author string (up to 20 authors)."""
    def one(a):
        if a.get("literal"):
            return a["literal"]
        given = a.get("given") or ""
        parts = re.split(r"[\s.]+", given)
        initials = []
        for p in parts:
            if not p:
                continue
            initials.append("-".join(x[0] + "." for x in p.split("-") if x))
        return f'{a["family"]}, {" ".join(initials)}'.strip().rstrip(",")
    names = [one(a) for a in auth]
    if not names:
        return ""
    if len(names) == 1:
        return names[0]
    if len(names) <= 20:
        return ", ".join(names[:-1]) + ", & " + names[-1]
    return ", ".join(names[:19]) + ", . . . " + names[-1]


def ital(s):
    return f"<i>{s}</i>"


def apa(src):
    t = src["type"]
    if t == "database-entry":
        title = src["title"]
        return (f'{src["org"]}. ({src.get("year", "n.d.")}). {title} [{src.get("desc", "Database record")}]. '
                f'{ital(src["site"])}. Retrieved {long_date(src["retrieved"])}, from {src["url"]}')
    a = apa_authors(src["authors"])
    y = src["year"]
    if t == "article":
        vol = ital(str(src["volume"])) if src.get("volume") else ""
        iss = f'({src["issue"]})' if src.get("issue") else ""
        pages = f', {src["pages"]}' if src.get("pages") else (f', Article {src["article"]}' if src.get("article") else "")
        doi = f' https://doi.org/{src["doi"]}' if src.get("doi") else (f' {src["url"]}' if src.get("url") else "")
        return f'{a} ({y}). {src["title"]}. {ital(src["container"])}, {vol}{iss}{pages}.{doi}'
    if t == "book":
        ed = f' ({src["edition"]} ed.)' if src.get("edition") else ""
        eds = " (Eds.)" if src.get("editors") else ""
        tail = f' https://doi.org/{src["doi"]}' if src.get("doi") else ""
        return f'{a}{eds}. ({y}). {ital(src["title"])}{ed}. {src["publisher"]}.{tail}'
    if t == "nomenclature-note":  # e.g. Index Fungorum numbered issues
        return (f'{a} ({y}). {src["title"]}. {ital(src["container"])}, {src.get("issue","")}, {src.get("pages","")}. '
                f'{src["url"]}').replace(", ,", ",")
    raise ValueError(t)


# ------------------------------------------------------------------ main
def main():
    seed = load("seed_v3.json")
    additions = load("additions.json", {"species": []})
    sources = load("sources.json", {})
    literature = load("literature.json", [])
    today = date.today().isoformat()

    # verify DOIs against Crossref raw
    for sid, s in sources.items():
        if s.get("doi"):
            p = os.path.join(RAW, "crossref", slug(s["doi"].lower()) + ".json")
            s["doiVerified"] = False
            if os.path.exists(p):
                cr = json.load(open(p, encoding="utf-8"))
                msg = cr.get("message") or {}
                if isinstance(msg, dict) and msg.get("DOI"):
                    s["doiVerified"] = True
                    if s.get("fromCrossref"):
                        s["authors"] = [{"family": a.get("family"), "given": a.get("given", "")} if a.get("family")
                                        else {"literal": a.get("name")} for a in msg.get("author", [])]
                        s["title"] = re.sub(r"\s+", " ", (msg.get("title") or [s["title"]])[0]).strip()
                        s["container"] = (msg.get("container-title") or [s.get("container")])[0]
                        s["volume"] = msg.get("volume") or s.get("volume")
                        s["issue"] = msg.get("issue") or s.get("issue")
                        if msg.get("page"):
                            s["pages"] = msg["page"].replace("-", "–")
                        s["year"] = ((msg.get("issued") or {}).get("date-parts") or [[s["year"]]])[0][0]
                    s["crossref"] = {
                        "title": (msg.get("title") or [""])[0],
                        "year": ((msg.get("issued") or {}).get("date-parts") or [[None]])[0][0],
                        "container": (msg.get("container-title") or [""])[0],
                        "first_author": ((msg.get("author") or [{}])[0]).get("family"),
                        "retrieved": cr.get("retrieved"),
                    }
        elif s["type"] != "database-entry":
            s["noDoi"] = True

    renames = additions.get("renames", {})
    merges = additions.get("merges", {})
    species_in = []
    for s in seed["species"]:
        s = dict(s, origin="v3")
        if s["n"] in merges:
            continue
        if s["n"] in renames:
            r = renames[s["n"]]
            s.update({k: v for k, v in r.items() if k != "why"})
            s["renamedFrom"] = s.get("renamedFrom") or [k for k, v in renames.items() if v is r][0]
            s["renameWhy"] = r.get("why")
        species_in.append(s)
    for target in set(merges.values()):
        for s in species_in:
            if s["n"] == target:
                s["merged"] = sorted(k for k, v in merges.items() if v == target)
    species_in += [dict(s, origin="added") for s in additions["species"]]
    count_alias = additions.get("countAliases", {})
    out_species, report = [], []
    lit_by = {}
    for m in literature:
        lit_by.setdefault(m["species"], []).append(m)

    for s in species_in:
        name = s["n"]
        names_to_try = [name] + ([s["syn"]] if s.get("syn") else []) + s.get("sa_names", []) + ([s["renamedFrom"]] if s.get("renamedFrom") else [])
        sa = None
        for nm in names_to_try:
            sa = sa_record(nm)
            if sa:
                break
        meas = []
        if sa:
            t = sa["taxon"]
            sid = f'SA-{t["_id"]}'
            sources[sid] = {
                "type": "database-entry", "org": "Danmarks Svampeatlas", "year": "n.d.",
                "title": f'{ital(t.get("FullName"))}{" " + t["Author"] if t.get("Author") else ""}',
                "desc": "Taxon description", "site": "Danmarks Svampeatlas",
                "url": f'https://svampe.databasen.org/taxon/{t["_id"]}',
                "retrieved": sa["retrieved"] or today, "short": "Danmarks Svampeatlas, n.d."}
            for m in sa_measurements(sa, names_to_try + [sa["taxon"].get("FullName") or ""]):
                m["src"] = sid
                meas.append(m)
        for m in lit_by.get(name, []) + (lit_by.get(s["renamedFrom"], []) if s.get("renamedFrom") else []):
            mm = {k: v for k, v in m.items() if k != "species"}
            meas.append(mm)

        cons, flags = consensus(meas)
        if cons is None and s["origin"] == "added":
            report.append({"n": name, "origin": "added", "skipped": "no checkable spore measurement"})
            continue
        legacy = {"lo": s["sp"]["lo"], "hi": s["sp"]["hi"], "wlo": s["sp"]["wlo"], "whi": s["sp"]["whi"],
                  "q": s["sp"].get("q"), "src": s.get("src")} if "sp" in s and "lo" in s["sp"] else None
        if cons is None and legacy:
            flags.append({"k": "legacy", "t": "No verifiable published measurement found yet; showing the v3 value, whose source could not be checked"})
        sp = dict(s.get("sp", {}))
        if cons:
            sp.update({k: cons[k] for k in ("lo", "hi", "wlo", "whi")})
            if cons.get("q"):
                sp["q"] = cons["q"]
            elif "q" in sp and legacy and legacy.get("q"):
                sp.pop("q")
        sp["ext"] = {k: cons[k] for k in ("lmin", "lmax", "wmin", "wmax")} if cons else {}

        g = gbif_info(name)
        if g and name in count_alias:
            g = dict(g, counts=dict(g["counts"]))
            for al in count_alias[name]:
                ga = gbif_info(al)
                if ga and ga.get("acceptedKey") != g.get("acceptedKey"):
                    for c, v in (ga.get("counts") or {}).items():
                        g["counts"][c] = (g["counts"].get(c) or 0) + (v or 0)
            g["countNames"] = [name] + count_alias[name]
        ifi = if_info(name)
        nomen = {"gbif": g, "if": ifi,
                 "sa": {"id": sa["taxon"]["_id"], "name": sa["taxon"].get("FullName"),
                        "author": sa["taxon"].get("Author"),
                        "acceptedName": (sa["taxon"].get("acceptedTaxon") or {}).get("FullName") if isinstance(sa["taxon"].get("acceptedTaxon"), dict) else None,
                        "ifCurrent": sa["taxon"].get("FunIndexCurrUseNumber"),
                        "dk": ((sa["taxon"].get("Vernacularname_DK") or {}).get("vernacularname_dk")
                               if isinstance(sa["taxon"].get("Vernacularname_DK"), dict) else None)} if sa else None}
        # nomenclature flags
        if g and g.get("status") and g["status"] not in ("ACCEPTED", "DOUBTFUL"):
            acc = (g.get("accepted") or "")
            flags.append({"k": "nomen-gbif", "t": f'GBIF treats this name as {g["status"].lower()}' + (f' (accepted: {acc})' if acc else "")})
        sf = None
        if ifi:
            recs = [r for r in ifi["records"] if r.get("currentName")]
            mine = [r for r in recs if r["name"] == name] or [r for r in recs if r["name"] in names_to_try]
            if mine:
                mine.sort(key=lambda r: (r["id"] != r["current"], (r["status"] or "") != "Legitimate"))
                sf = {"current": mine[0]["currentName"], "currentId": mine[0]["current"], "referee": mine[0]["referee"],
                      "family": mine[0]["family"], "recordId": mine[0]["id"]}
        nomen["sf"] = sf
        if sf and sf["current"] and sf["current"] != name:
            flags.append({"k": "nomen-sf", "t": f'Species Fungorum gives the current name as {sf["current"]}'})
        if sa and nomen["sa"]["name"] and nomen["sa"]["name"] != name:
            flags.append({"k": "nomen-sa", "t": f'Svampeatlas uses {nomen["sa"]["name"]}'})

        rec = {k: v for k, v in s.items() if k not in ("src", "sp", "nordic")}
        rec.update({"id": slug(name), "sp": sp, "meas": meas, "flags": flags,
                    "legacy": legacy if (legacy and cons and (abs(legacy["lo"] - cons["lo"]) > 0.4 or abs(legacy["hi"] - cons["hi"]) > 0.4 or abs(legacy["wlo"] - cons["wlo"]) > 0.4 or abs(legacy["whi"] - cons["whi"]) > 0.4)) or (legacy and not cons) else None,
                    "gbif": {"key": g["acceptedKey"], "counts": g["counts"], "retrieved": g["retrieved"],
                             "names": g.get("countNames")} if g else None,
                    "saId": sa["taxon"]["_id"] if sa else s.get("saId"),
                    "dkSA": nomen["sa"]["dk"] if sa else None,
                    "ifId": (sf or {}).get("currentId") or (sa["taxon"].get("FunIndexCurrUseNumber") if sa else None),
                    "sf": sf,
                    "legacyOnly": cons is None})
        if sa and nomen["sa"]["dk"] and s.get("dk") and nomen["sa"]["dk"].lower() != s["dk"].lower():
            rec["dkOld"] = s["dk"]
            rec["dk"] = nomen["sa"]["dk"]
        out_species.append(rec)
        report.append({"n": name, "origin": s["origin"], "legacy": legacy, "consensus": cons, "meas": meas,
                       "flags": flags, "nomen": nomen, "dkOld": rec.get("dkOld"), "dk": rec.get("dk")})

    for sid, s in sources.items():
        s["apa"] = apa(s)

    used = {m["src"] for sp in out_species for m in sp["meas"]} | {sid for sid, s in sources.items() if s.get("always")}
    data = {"built": today, "version": "4.0",
            "sources": {k: v for k, v in sources.items() if k in used},
            "species": out_species,
            "FAMILY_SPORE": seed["FAMILY_SPORE"],
            "SPORE_OVERRIDE": {**seed["SPORE_OVERRIDE"], **additions.get("SPORE_OVERRIDE", {})},
            "VOCAB": {k: v + [x for x in additions.get("vocabAdd", {}).get(k, []) if x not in v] for k, v in seed["VOCAB"].items()}, "LABELS": seed["LABELS"], "PRINT_COLOR": seed["PRINT_COLOR"]}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("/* Generated by src/sporexplore/build_data.py — do not edit by hand. */\n")
        fh.write("window.SPOREX = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    with open(os.path.join(D, "report.json"), "w", encoding="utf-8") as fh:
        json.dump(report, fh, ensure_ascii=False, indent=1)
    n_meas = sum(1 for s in out_species if not s["legacyOnly"])
    print(f"{len(out_species)} species, {n_meas} with sourced measurements, {len(data['sources'])} sources")


if __name__ == "__main__":
    main()
