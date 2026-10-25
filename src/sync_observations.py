#!/usr/bin/env python3
"""Pull Pieter's own wild observations into content/observations.json.

Sources (each switched on/off and configured in the CMS under
"Field log → Settings", which edits content/fieldlog.json):

  * iNaturalist          – public API, by username
  * Danmarks Svampeatlas – public API, by user (ID or a link to one of your finds)
  * Arter.dk             – via GBIF, which republishes Arter.dk weekly
  * DOFbasen             – via GBIF (DOF's own dataset; GBIF holds back the
                           newest ~60 days)

The page (fieldlog.html) merges this file with the curation in
content/fieldlog.json (hidden finds, hidden species, cover photos, manual
entries) when it loads, so hiding something never needs a re-sync.

Runs nightly from .github/workflows/sync-observations.yml; can also be run by
hand:   python3 src/sync_observations.py
Uses only the Python standard library.

Privacy: no coordinates and no observer details are stored — only species,
date, a coarse place name, a photo and a link back to the original record.
"""
import datetime
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
SETTINGS = ROOT / "content" / "fieldlog.json"
OUT = ROOT / "content" / "observations.json"
UA = "ndrshfflr.github.io field-log sync (+https://ndrshfflr.github.io/fieldlog.html)"
CPH = ZoneInfo("Europe/Copenhagen")

GBIF_ARTER = "963a6b96-4d22-4428-86e4-afee52cf4a8e"   # Species recordings from Arter.dk
GBIF_DOF = "95db4db8-f762-11e1-a439-00145eb45e9a"     # DOF/BirdLife Denmark – DOFbasen

SOURCE_LABEL = {"inaturalist": "iNaturalist", "svampeatlas": "Svampeatlas", "arter": "Arter.dk", "dofbasen": "DOFbasen"}


# ---------------------------------------------------------------- helpers
def get_json(url, params=None, tries=3):
    if params:
        url += ("&" if "?" in url else "?") + urllib.parse.urlencode(params)
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            last = e
            time.sleep(3 * (attempt + 1))
    raise RuntimeError(f"{url}: {last}")


def coarse_place(text):
    """Keep a place name general: drop street addresses / house numbers and
    the country, keep at most the last two parts ("Dyrehaven, Lyngby")."""
    if not text:
        return ""
    parts = [re.sub(r"^(DK-?)?\d{4}\s+", "", p.strip()) for p in str(text).split(",") if p.strip()]  # "2800 Lyngby" → "Lyngby"
    parts = [p for p in parts if p and not re.search(r"\d", p)
             and p.lower() not in {"denmark", "danmark", "dk", "kingdom of denmark"}]
    return ", ".join(parts[-2:])


def group_from(kingdom="", phylum="", klass="", iconic=""):
    k, p, c, i = (s or "" for s in (kingdom, phylum, klass, iconic))
    if i == "Fungi" or k == "Fungi":
        return "fungi"
    if i == "Aves" or c == "Aves":
        return "birds"
    if i == "Insecta" or c == "Insecta":
        return "insects"
    if i == "Arachnida" or c == "Arachnida":
        return "arachnids"
    if i == "Mammalia" or c == "Mammalia":
        return "mammals"
    if i in ("Amphibia", "Reptilia") or c in ("Amphibia", "Reptilia", "Squamata", "Testudines", "Crocodylia"):
        return "herps"
    if i == "Actinopterygii" or c in ("Actinopterygii", "Elasmobranchii", "Petromyzonti"):
        return "fish"
    if i == "Mollusca" or p == "Mollusca":
        return "molluscs"
    if i == "Plantae" or k == "Plantae":
        return "plants"
    return "other"


def local_date(iso):
    """Svampeatlas stores local midnight as UTC (e.g. 2009-02-28T23:00Z = 1 March)."""
    if not iso:
        return ""
    try:
        dt = datetime.datetime.fromisoformat(iso.replace("Z", "+00:00"))
        if dt.tzinfo:
            dt = dt.astimezone(CPH)
        return dt.date().isoformat()
    except ValueError:
        return iso[:10]


# ---------------------------------------------------------------- iNaturalist
def fetch_inaturalist(cfg, opts):
    user = (cfg.get("user") or "").strip().lstrip("@")
    if not user:
        return None
    base = "https://api.inaturalist.org/v1/observations"
    params = {"user_login": user, "per_page": 200, "order_by": "id", "order": "asc",
              "captive": "false"}   # captive/cultivated finds (e.g. terrarium pets) are left out
    if opts.get("researchGradeOnly"):
        params["quality_grade"] = "research"
    items, id_above = [], 0
    while True:
        data = get_json(base, dict(params, id_above=id_above))
        res = data.get("results") or []
        for o in res:
            t = o.get("taxon") or {}
            if not t.get("name"):
                continue
            photo = ""
            if o.get("photos"):
                photo = (o["photos"][0].get("url") or "").replace("/square.", "/medium.")
            items.append({
                "id": f"inat:{o['id']}", "source": "inaturalist",
                "url": o.get("uri") or f"https://www.inaturalist.org/observations/{o['id']}",
                "date": (o.get("observed_on") or "")[:10],
                "name": t["name"], "rank": t.get("rank") or "",
                "common_en": t.get("preferred_common_name") or "", "common_da": "",
                "group": group_from(iconic=t.get("iconic_taxon_name")),
                "photo": photo, "place": coarse_place(o.get("place_guess")),
                "_taxon": t.get("id"),
            })
        if len(res) < 200:
            break
        id_above = res[-1]["id"]
        time.sleep(1.1)
    # Danish common names, one lookup per species.
    ids = sorted({i["_taxon"] for i in items if i["_taxon"]})
    da = {}
    for n in range(0, len(ids), 30):
        chunk = ids[n:n + 30]
        data = get_json("https://api.inaturalist.org/v1/taxa/" + ",".join(map(str, chunk)), {"locale": "da"})
        for t in data.get("results") or []:
            if t.get("preferred_common_name"):
                da[t["id"]] = t["preferred_common_name"]
        time.sleep(1.1)
    for i in items:
        i["common_da"] = da.get(i.pop("_taxon"), "")
    return items


# ---------------------------------------------------------------- Svampeatlas
def svampeatlas_user(cfg):
    uid = str(cfg.get("userId") or "").strip()
    if uid.isdigit():
        return int(uid)
    m = re.search(r"(\d+)\s*/?\s*$", str(cfg.get("anyObservation") or ""))
    if m:
        obs = get_json(f"https://svampe.databasen.org/api/observations/{m.group(1)}")
        if obs and obs.get("primaryuser_id"):
            return int(obs["primaryuser_id"])
    return None


def fetch_svampeatlas(cfg, opts):
    uid = svampeatlas_user(cfg)
    if not uid:
        return None
    items, offset, page = [], 0, 100
    while True:
        res = get_json("https://svampe.databasen.org/api/observations",
                       {"where": json.dumps({"primaryuser_id": uid}), "limit": page, "offset": offset})
        if isinstance(res, dict):
            res = res.get("rows") or res.get("results") or []
        for o in res:
            if o.get("primaryuser_id") != uid:   # never take someone else's find
                continue
            dv = o.get("DeterminationView") or {}
            name = dv.get("Taxon_FullName")
            if not name:
                continue
            imgs = [im for im in (o.get("Images") or []) if not im.get("hide") and im.get("name")]
            loc = (o.get("Locality") or {}).get("name") or o.get("verbatimLocality") or ""
            items.append({
                "id": f"svampeatlas:{o['_id']}", "source": "svampeatlas",
                "url": f"https://svampe.databasen.org/observations/{o['_id']}",
                "date": local_date(o.get("observationDate")),
                "name": name, "rank": "species" if dv.get("Taxon_RankID") == 10000 else "",
                "common_en": "", "common_da": dv.get("Taxon_vernacularname_dk") or "",
                "group": "fungi",
                "photo": f"https://svampe.databasen.org/uploads/{imgs[0]['name']}.JPG" if imgs else "",
                "place": coarse_place(loc),
            })
        if len(res) < page:
            break
        offset += page
        time.sleep(0.5)
    return items


# ---------------------------------------------------------------- GBIF (Arter.dk, DOFbasen)
def fetch_gbif(cfg, dataset, source):
    names = [n.strip() for n in re.split(r"[\n;]", str(cfg.get("recordedBy") or "")) if n.strip()]
    if not names:
        return None
    items = []
    for name in names:
        offset = 0
        while True:
            data = get_json("https://api.gbif.org/v1/occurrence/search",
                            {"datasetKey": dataset, "recordedBy": name, "limit": 300, "offset": offset})
            for r in data.get("results") or []:
                sci = r.get("species") or r.get("acceptedScientificName") or r.get("scientificName")
                if not sci:
                    continue
                if not r.get("species") and r.get("genus"):
                    sci = r.get("genus") + " sp."
                photo = ""
                for m in r.get("media") or []:
                    if m.get("identifier") and (m.get("type") in (None, "StillImage")):
                        photo = m["identifier"]
                        break
                if source == "arter":
                    url = (r.get("occurrenceID") or "").replace("arter.dk//", "arter.dk/")
                else:
                    url = r.get("references") or ""
                if not url.startswith("http"):
                    url = f"https://www.gbif.org/occurrence/{r['key']}"
                place = r.get("locality") or r.get("level2Name") or r.get("municipality") or ""
                items.append({
                    "id": f"{source}:{r['key']}", "source": source, "url": url,
                    "date": (r.get("eventDate") or "")[:10],
                    "name": sci, "rank": (r.get("taxonRank") or "").lower(),
                    "common_en": "", "common_da": (r.get("vernacularName") or "").strip(),
                    "group": group_from(r.get("kingdom"), r.get("phylum"), r.get("class")),
                    "photo": photo, "place": coarse_place(place),
                })
            if data.get("endOfRecords", True):
                break
            offset += 300
            time.sleep(0.5)
    return items


# ---------------------------------------------------------------- main
def label(i):
    common = i.get("common_da") or i.get("common_en")
    return f"{i['date']} · {i['name']}{' (' + common + ')' if common else ''} · {SOURCE_LABEL.get(i['source'], i['source'])}"


def main():
    settings = json.loads(SETTINGS.read_text(encoding="utf-8")) if SETTINGS.exists() else {}
    src_cfg = settings.get("sources") or {}
    opts = settings.get("options") or {}
    previous = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    prev_items = previous.get("items") or []

    fetchers = {
        "inaturalist": lambda c: fetch_inaturalist(c, opts),
        "svampeatlas": lambda c: fetch_svampeatlas(c, opts),
        "arter": lambda c: fetch_gbif(c, GBIF_ARTER, "arter"),
        "dofbasen": lambda c: fetch_gbif(c, GBIF_DOF, "dofbasen"),
    }
    items, status = [], {}
    for key, fetch in fetchers.items():
        cfg = src_cfg.get(key) or {}
        if not cfg.get("enabled", True):
            status[key] = {"state": "off", "count": 0}
            continue
        try:
            got = fetch(cfg)
        except Exception as e:  # keep what we had, report the problem
            kept = [i for i in prev_items if i.get("source") == key]
            items += kept
            status[key] = {"state": "error", "count": len(kept), "error": str(e)[:300]}
            print(f"! {key}: {e} (kept {len(kept)} from last sync)", file=sys.stderr)
            continue
        if got is None:
            status[key] = {"state": "not set up", "count": 0}
            continue
        items += got
        status[key] = {"state": "ok", "count": len(got)}
        print(f"{key}: {len(got)} observations")

    # The same bird can reach GBIF through both Arter.dk and DOFbasen.
    seen, deduped = {}, []
    for i in sorted(items, key=lambda x: (not x["photo"], x["id"])):
        if i["source"] in ("arter", "dofbasen"):
            k = (i["name"], i["date"])
            if k in seen and seen[k] != i["source"]:
                continue
            seen[k] = i["source"]
        deduped.append(i)
    items = sorted(deduped, key=lambda x: (x["date"] or "9999", x["id"]))
    for i in items:
        i["label"] = label(i)

    species = {}
    for i in items:
        species.setdefault(i["name"], i.get("common_da") or i.get("common_en") or "")
    species_list = [{"name": n, "label": n + (f" ({c})" if c else "")} for n, c in sorted(species.items())]

    if items == prev_items and status == previous.get("status"):
        print("no changes")
        return
    out = {
        "_note": "Generated by src/sync_observations.py — do not edit by hand; it is overwritten on every sync.",
        "updated": datetime.datetime.now(CPH).isoformat(timespec="minutes"),
        "status": status,
        "species": species_list,
        "items": items,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"wrote content/{OUT.name}: {len(items)} observations, {len(species_list)} taxa")


if __name__ == "__main__":
    main()
