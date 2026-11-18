#!/usr/bin/env python3
"""Sporexplore data harvest — raw, reproducible pulls from the authoritative sources.

Runs in GitHub Actions (open internet) and writes raw responses, unmodified, to
data/sporexplore/raw/. Nothing here interprets or edits the data: parsing and the
consensus logic live in build_data.py, so every value in the app can be traced
back to a stored raw response with its retrieval date.

Sources
  GBIF            api.gbif.org        backbone match, species record, Nordic record counts,
                                      Nordic Boletales species list (occurrence facets)
  Index Fungorum  indexfungorum.org   NameSearch + NameFullByKey (Species Fungorum current name)
  Svampeatlas     svampe.databasen.org  taxon record incl. attributes (Danish/English descriptions)
  Crossref        api.crossref.org    metadata for every DOI listed in requests/dois.txt

Inputs
  data/sporexplore/requests/names.txt   one scientific name per line (app + candidates)
  data/sporexplore/requests/dois.txt    one DOI per line
  Env HARVEST_PARTS = comma list of: nordic,names,dois  (default: all)
"""
import json, os, re, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
REQ = os.path.join(ROOT, "data", "sporexplore", "requests")
RAW = os.path.join(ROOT, "data", "sporexplore", "raw")
UA = "Sporexplore data harvest (+https://ndrshfflr.github.io/sporexplore.html)"
COUNTRIES = ["DK", "NO", "SE", "FI", "IS", "FO", "GL"]
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%d")


def get(url, params=None, as_json=True, tries=2):
    if params:
        url += ("&" if "?" in url else "?") + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json, text/xml, */*"})
            with urllib.request.urlopen(req, timeout=25) as r:
                body = r.read().decode("utf-8", "replace")
                return (json.loads(body) if as_json else body), url
        except Exception as e:  # noqa: BLE001
            err = f"{type(e).__name__}: {e}"
            time.sleep(2)
    return {"_error": err}, url


def slug(name):
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def save(sub, key, obj):
    d = os.path.join(RAW, sub)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, key + ".json"), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)


def lines(fn):
    p = os.path.join(REQ, fn)
    if not os.path.exists(p):
        return []
    with open(p, encoding="utf-8") as f:
        return [l.strip() for l in f if l.strip() and not l.startswith("#")]


# ---------------------------------------------------------------- Nordic species list
def nordic():
    """Every species-rank Boletales taxon with GBIF records in a Nordic territory."""
    if os.path.exists(os.path.join(RAW, "gbif", "_nordic_boletales.json")):
        return
    m, _ = get("https://api.gbif.org/v1/species/match", {"name": "Boletales", "rank": "ORDER", "kingdom": "Fungi"})
    order_key = m.get("usageKey")
    out = {"retrieved": NOW, "orderKey": order_key, "byCountry": {}, "species": {}}
    for c in COUNTRIES:
        r, url = get("https://api.gbif.org/v1/occurrence/search",
                     {"orderKey": order_key, "country": c, "limit": 0, "facet": "speciesKey", "facetLimit": 2000})
        counts = {}
        for f in r.get("facets", []):
            for x in f.get("counts", []):
                counts[x["name"]] = x["count"]
        out["byCountry"][c] = {"url": url, "counts": counts}
        time.sleep(0.3)
    keys = sorted({k for c in out["byCountry"].values() for k in c["counts"]}, key=int)
    save("gbif", "_nordic_boletales", out)  # facets first, so a slow tail never loses them
    for k in keys:
        s, url = get(f"https://api.gbif.org/v1/species/{k}")
        out["species"][k] = {k2: s.get(k2) for k2 in
                             ("key", "scientificName", "canonicalName", "authorship", "rank", "taxonomicStatus",
                              "family", "genus", "acceptedKey", "accepted")}
        time.sleep(0.1)
    save("gbif", "_nordic_boletales", out)
    print(f"nordic: {len(keys)} species keys")


# ---------------------------------------------------------------- per-name pulls
def gbif_name(name):
    match, murl = get("https://api.gbif.org/v1/species/match", {"name": name, "kingdom": "Fungi", "verbose": "true"})
    rec = {"retrieved": NOW, "match": match, "matchUrl": murl, "counts": {}}
    key = match.get("usageKey")
    if key:
        sp, _ = get(f"https://api.gbif.org/v1/species/{key}")
        rec["species"] = sp
        acc = match.get("acceptedUsageKey") or key
        for c in COUNTRIES:
            r, url = get("https://api.gbif.org/v1/occurrence/search", {"taxonKey": acc, "country": c, "limit": 0})
            rec["counts"][c] = r.get("count")
            time.sleep(0.05)
        vn, _ = get(f"https://api.gbif.org/v1/species/{acc}/vernacularNames", {"limit": 200})
        rec["vernacular"] = [v for v in vn.get("results", [])
                             if v.get("language") in ("dan", "nor", "nob", "nno", "swe", "fin", "isl", "eng")]
    return rec


def if_name(name):
    rec = {"retrieved": NOW, "search": None, "full": {}}
    xml, url = get("http://www.indexfungorum.org/ixfwebservice/fungus.asmx/NameSearch",
                   {"SearchText": name, "AnywhereInText": "false", "MaxNumber": 20}, as_json=False)
    rec["search"], rec["searchUrl"] = xml, url
    if isinstance(xml, str):
        nums = re.findall(r"<RECORD_x0020_NUMBER>(\d+)</RECORD_x0020_NUMBER>", xml)
        names = re.findall(r"<NAME_x0020_OF_x0020_FUNGUS>(.*?)</NAME_x0020_OF_x0020_FUNGUS>", xml)
        for n, nm in zip(nums, names):
            if nm.strip().lower() != name.lower():
                continue
            full, furl = get("http://www.indexfungorum.org/ixfwebservice/fungus.asmx/NameByKey",
                             {"NameKey": n}, as_json=False)
            rec["full"][n] = {"url": furl, "xml": full}
            cur = re.search(r"<CURRENT_x0020_NAME_x0020_RECORD_x0020_NUMBER>(\d+)<", str(full))
            if cur and cur.group(1) != n and cur.group(1) not in rec["full"]:
                cx, curl = get("http://www.indexfungorum.org/ixfwebservice/fungus.asmx/NameByKey",
                               {"NameKey": cur.group(1)}, as_json=False)
                rec["full"][cur.group(1)] = {"url": curl, "xml": cx, "isCurrentOf": n}
            time.sleep(0.2)
    return rec


SA_INCLUDE = json.dumps([
    {"model": "TaxonAttributes", "as": "attributes"},
    {"model": "Taxon", "as": "acceptedTaxon"},
    {"model": "Taxon", "as": "synonyms"},
    {"model": "TaxonDKnames", "as": "Vernacularname_DK"},
])


def sa_name(name):
    rec = {"retrieved": NOW}
    r, url = get("https://svampe.databasen.org/api/taxa",
                 {"where": json.dumps({"FullName": name}), "include": SA_INCLUDE, "limit": 10})
    if isinstance(r, dict) and r.get("_error"):  # include syntax rejected → plain search, then by id
        r, url = get("https://svampe.databasen.org/api/taxa", {"where": json.dumps({"FullName": name}), "limit": 10})
    rec["search"], rec["url"] = r, url
    rec["taxa"] = {}
    if isinstance(r, list):
        for t in r:
            ids = {t.get("_id"), t.get("accepted_id")}
            for tid in filter(None, ids):
                if tid in rec["taxa"]:
                    continue
                full, furl = get(f"https://svampe.databasen.org/api/taxa/{tid}", {"include": SA_INCLUDE})
                if isinstance(full, dict) and full.get("_error"):
                    full, furl = get(f"https://svampe.databasen.org/api/taxa/{tid}",
                                     {"include": json.dumps([{"model": "TaxonAttributes", "as": "attributes"}])})
                rec["taxa"][tid] = {"url": furl, "data": full}
                time.sleep(0.2)
    return rec


def names():
    todo = [n for n in lines("names.txt")
            if not os.path.exists(os.path.join(RAW, "svampeatlas", slug(n) + ".json"))]
    todo = todo[: int(os.environ.get("HARVEST_CHUNK") or 10**6)]
    print(f"names: {len(todo)}")
    for i, nm in enumerate(todo, 1):
        k = slug(nm)
        save("gbif", k, gbif_name(nm))
        save("indexfungorum", k, if_name(nm))
        save("svampeatlas", k, sa_name(nm))
        if i % 10 == 0:
            print(f"  {i}/{len(todo)}", flush=True)


def dois():
    for d in lines("dois.txt"):
        d = d.lower().removeprefix("https://doi.org/")
        r, url = get(f"https://api.crossref.org/works/{urllib.parse.quote(d)}")
        save("crossref", slug(d), {"retrieved": NOW, "doi": d, "url": url,
                                   "message": r.get("message") if isinstance(r, dict) else r,
                                   "error": r.get("_error") if isinstance(r, dict) else None})
        time.sleep(0.2)


def refs():
    """Crossref bibliographic search for each citation string in refs_query.txt."""
    for q in lines("refs_query.txt"):
        k = slug(q)[:80]
        if os.path.exists(os.path.join(RAW, "crossref_query", k + ".json")):
            continue
        r, url = get("https://api.crossref.org/works", {"query.bibliographic": q, "rows": 3,
                     "select": "DOI,title,author,issued,container-title,volume,issue,page,type,publisher"})
        save("crossref_query", k, {"retrieved": NOW, "query": q, "url": url,
                                   "items": (r.get("message") or {}).get("items") if isinstance(r, dict) else r})
        time.sleep(0.3)


if __name__ == "__main__":
    parts = (os.environ.get("HARVEST_PARTS") or "nordic,names,dois").split(",")
    if "nordic" in parts:
        nordic()
    if "names" in parts:
        names()
    if "names-left" in parts:
        print(len([n for n in lines("names.txt")
                   if not os.path.exists(os.path.join(RAW, "svampeatlas", slug(n) + ".json"))]))
        sys.exit(0)
    if "refs" in parts:
        refs()
    if "dois" in parts:
        dois()
    with open(os.path.join(RAW, "_manifest.json"), "w") as f:
        json.dump({"retrieved": NOW, "parts": parts}, f)
    print("done")
