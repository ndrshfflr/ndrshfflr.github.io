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
ROUND = re.compile(r"kugle|rund|globose|spheric|subglobose", re.I)
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


def parse_spores(text):
    """Return a list of measurement dicts found in spore sentences of a description."""
    out = []
    ss = sentences(text)
    for i, s in enumerate(ss):
        if not re.search(r"spor", s, re.I):
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
            if not ROUND.search(s):
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
        if "uden ornament" in low or "excluding ornament" in low or "without ornament" in low or "without the ornament" in low:
            rec["ornIncluded"] = False
        elif "inkl. ornament" in low or "including ornament" in low or "med ornament" in low:
            rec["ornIncluded"] = True
        out.append(rec)
    return out


# ------------------------------------------------------------------ Svampeatlas
def sa_record(name):
    r = raw("svampeatlas", name)
    if not r or not r.get("taxa"):
        return None
    taxa = [t["data"] for t in r["taxa"].values() if isinstance(t.get("data"), dict) and not t["data"].get("_error")]
    if not taxa:
        return None
    # prefer the accepted taxon that carries attributes
    taxa.sort(key=lambda t: (t.get("_id") != t.get("accepted_id"), not t.get("attributes")))
    return {"taxon": taxa[0], "retrieved": r.get("retrieved"), "all": taxa}


def sa_measurements(sa):
    a = (sa["taxon"].get("attributes") or {}) if sa else {}
    if isinstance(a, list):
        a = a[0] if a else {}
    found = []
    for field, lang in (("diagnose", "da"), ("beskrivelse", "da"), ("BeskrivelseUK", "en"),
                        ("bogtekst_gyldendal_en", "en"), ("bogtekst_gyldendal", "da")):
        for m in parse_spores(a.get(field) or ""):
            m["field"], m["lang"] = field, lang
            found.append(m)
    # de-duplicate identical numeric statements (book text often repeats the diagnosis)
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
    r = raw("indexfungorum", name)
    if not r:
        return None
    recs = []
    for num, v in (r.get("full") or {}).items():
        x = v.get("xml") if isinstance(v, dict) else None
        if not isinstance(x, str):
            continue
        recs.append({
            "id": num,
            "name": xml_field(x, "NAME_x0020_OF_x0020_FUNGUS"),
            "authors": xml_field(x, "AUTHORS"),
            "year": xml_field(x, "YEAR_x0020_OF_x0020_PUBLICATION"),
            "status": xml_field(x, "NAME_x0020_STATUS"),
            "current": xml_field(x, "CURRENT_x0020_NAME_x0020_RECORD_x0020_NUMBER"),
            "currentName": xml_field(x, "CURRENT_x0020_NAME"),
            "isCurrentOf": v.get("isCurrentOf"),
            "url": v.get("url"),
        })
    return {"records": recs, "retrieved": r.get("retrieved")}


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
    use = [m for m in meas if not m.get("excluded")]
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
         "n_sources": len({m["src"] for m in use})}
    flags = []
    if len({m["src"] for m in use}) > 1:
        mL = [(m["L"][1] + m["L"][2]) / 2 for m in use]
        mQ = [((m["L"][1] + m["L"][2]) / 2) / ((m["W"][1] + m["W"][2]) / 2) for m in use]
        if (max(mL) - min(mL)) / statistics.mean(mL) > 0.15:
            flags.append({"k": "disagree-L", "t": f"Sources differ by {round(100*(max(mL)-min(mL))/statistics.mean(mL))} % in mean spore length"})
        if (max(mQ) - min(mQ)) / statistics.mean(mQ) > 0.15:
            flags.append({"k": "disagree-Q", "t": f"Sources differ by {round(100*(max(mQ)-min(mQ))/statistics.mean(mQ))} % in mean Q"})
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
                    s["crossref"] = {
                        "title": (msg.get("title") or [""])[0],
                        "year": ((msg.get("issued") or {}).get("date-parts") or [[None]])[0][0],
                        "container": (msg.get("container-title") or [""])[0],
                        "first_author": ((msg.get("author") or [{}])[0]).get("family"),
                        "retrieved": cr.get("retrieved"),
                    }
        elif s["type"] != "database-entry":
            s["noDoi"] = True

    species_in = [dict(s, origin="v3") for s in seed["species"]] + [dict(s, origin="added") for s in additions["species"]]
    out_species, report = [], []
    lit_by = {}
    for m in literature:
        lit_by.setdefault(m["species"], []).append(m)

    for s in species_in:
        name = s["n"]
        names_to_try = [name] + ([s["syn"]] if s.get("syn") else []) + s.get("sa_names", [])
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
            for m in sa_measurements(sa):
                m["src"] = sid
                meas.append(m)
        for m in lit_by.get(name, []):
            mm = {k: v for k, v in m.items() if k != "species"}
            meas.append(mm)

        cons, flags = consensus(meas)
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
        if sa and nomen["sa"]["name"] and nomen["sa"]["name"] != name:
            flags.append({"k": "nomen-sa", "t": f'Svampeatlas uses {nomen["sa"]["name"]}'})

        rec = {k: v for k, v in s.items() if k not in ("src", "sp", "nordic")}
        rec.update({"id": slug(name), "sp": sp, "meas": meas, "flags": flags,
                    "legacy": legacy if (legacy and cons and (abs(legacy["lo"] - cons["lo"]) > 0.4 or abs(legacy["hi"] - cons["hi"]) > 0.4 or abs(legacy["wlo"] - cons["wlo"]) > 0.4 or abs(legacy["whi"] - cons["whi"]) > 0.4)) or (legacy and not cons) else None,
                    "gbif": {"key": g["acceptedKey"], "counts": g["counts"], "retrieved": g["retrieved"]} if g else None,
                    "saId": sa["taxon"]["_id"] if sa else s.get("saId"),
                    "dkSA": nomen["sa"]["dk"] if sa else None,
                    "ifId": next((r["id"] for r in (ifi or {}).get("records", []) if r["name"] == name), None) if ifi else None,
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
            "VOCAB": seed["VOCAB"], "LABELS": seed["LABELS"], "PRINT_COLOR": seed["PRINT_COLOR"]}
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
