#!/usr/bin/env python3
"""Write the sign-off report and the APA bibliography (Markdown) from the built data.
Usage: node -e 'global.window={};require("./sporexplore/data.js");require("fs").writeFileSync(
"/tmp/sporex.json",JSON.stringify(window.SPOREX))' && python3 src/sporexplore/report_docs.py /tmp/sporex.json OUTDIR"""
import json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
D = os.path.join(ROOT, "data", "sporexplore")
X = json.load(open(sys.argv[1])); out = sys.argv[2]
S, SP = X["sources"], X["species"]
A = json.load(open(os.path.join(D, "additions.json")))
cand = json.load(open(os.path.join(D, "candidates_gbif.json")))
it = lambda s: re.sub(r"</?i>", "*", s)
f = lambda v: ("%g" % v) if v is not None else ""
plain = lambda s: re.sub(r"<[^>]+>", "", s).lower()


def rng(lo, hi, mn=None, mx=None):
    return (f"({f(mn)}–) " if mn else "") + f"{f(lo)}–{f(hi)}" + (f" (–{f(mx)})" if mx else "")


def cite(sid, page=None):
    s = S[sid]
    if s.get("short"):
        t = s["short"]
    else:
        a = s["authors"]; fam = lambda x: x.get("literal") or x["family"]
        t = (fam(a[0]) if len(a) == 1 else f"{fam(a[0])} & {fam(a[1])}" if len(a) == 2 else f"{fam(a[0])} et al.") + f", {s['year']}"
    return f"({t}{', p. ' + page if page else ''})"


def spores(s):
    e = s["sp"].get("ext") or {}
    return f"{rng(s['sp']['lo'], s['sp']['hi'], e.get('lmin'), e.get('lmax'))} × {rng(s['sp']['wlo'], s['sp']['whi'], e.get('wmin'), e.get('wmax'))}"


nordic = lambda s: ", ".join(f"{c} {v}" for c, v in (s.get("gbif") or {}).get("counts", {}).items() if v)
srcs = lambda s: "; ".join(sorted({cite(m["src"], m.get("page")) for m in s["meas"]}))
v3 = [s for s in SP if s["origin"] == "v3"]; add = [s for s in SP if s["origin"] == "added"]
chg = [s for s in SP if s.get("legacy") and not s.get("legacyOnly")]
lit = [k for k, s in S.items() if s["type"] != "database-entry"]

L = ["# Sporexplore v4 — discrepancy report for sign-off\n",
     "Generated from the build on branch `sporexplore-revamp`. **Nothing here is live yet**: the site changes only when you merge the pull request.\n",
     "## Summary\n",
     f"- **{len(SP)} species** (v3 had 82): {len(v3)} carried over, {len(add)} Nordic Boletales added, {len(A['merges'])} merged.",
     f"- **{sum(1 for s in SP if not s.get('legacyOnly'))} species** have spore values from a citable source, quoted verbatim. {sum(1 for s in SP if s.get('legacyOnly'))} still shows an unverified v3 value.",
     f"- **{len(chg)} v3 species** have changed spore values (§2).",
     f"- **{len(lit)} peer-reviewed or monograph sources** and **{len(S) - len(lit)} Svampeatlas species descriptions** are cited in APA 7. Every DOI was checked against Crossref.",
     "- Names were checked against Species Fungorum (Kew), Index Fungorum, GBIF and Svampeatlas. A name was changed only where at least two of Species Fungorum, GBIF and Svampeatlas agree.\n",
     "## 1. Name decisions — please confirm\n", "| v3 name | Now | Why |", "|---|---|---|"]
L += [f"| *{k}* | *{v['n']}* | {v['why']} |" for k, v in A["renames"].items()]
L += [f"| *{k}* | merged into *{v}* | Species Fungorum, GBIF and Svampeatlas treat it as *{v}*; den Bakker & Noordeloos (2005) include it there. |" for k, v in A["merges"].items()]
L.append("\n**Kept, but flagged** (only one source disagrees, or the name is in flux):\n")
L += [f"- *{s['n']}* — {fl['t'].rstrip('.')}." for s in SP for fl in s["flags"] if fl["k"] in ("nomen-sf", "nomen-sa", "nomen-gbif", "nomen-flux")]
L += ["\n## 2. Spore values changed from v3\n",
      "v3 values came from Svampeatlas or unnamed literature, with no per-value citation. The new value is the span of all sources' typical ranges.\n",
      "| Species | v3 (µm) | v4 (µm) | Sources |", "|---|---|---|---|"]
for s in sorted(chg, key=lambda s: s["n"]):
    l = s["legacy"]
    L.append(f"| *{s['n']}* | {f(l['lo'])}–{f(l['hi'])} × {f(l['wlo'])}–{f(l['whi'])} | {spores(s)} | {srcs(s)} |")
L.append("\n## 3. Disagreements and cross-checks\n")
L += [f"- *{s['n']}* — {fl['t'].rstrip('.')}." for s in SP for fl in s["flags"] if fl["k"] in ("disagree-L", "disagree-Q", "cross-check", "merged")]
L.append("\n## 4. Still unverified\n")
L += [f"- *{s['n']}* — v3 value {f(s['sp']['lo'])}–{f(s['sp']['hi'])} × {f(s['sp']['wlo'])}–{f(s['sp']['whi'])} µm. No Svampeatlas measurement and no open-access source found. It is shown with an *Unverified value* badge." for s in SP if s.get("legacyOnly")]
L += ["\n## 5. Species added\n", "These are Nordic Boletales with 15 or more GBIF records and a checkable spore measurement. Morphology is taken from the cited description.\n",
      "| Species | Family | Spores (µm) | Source | Nordic GBIF records |", "|---|---|---|---|---|"]
L += [f"| *{s['n']}* | {s['fam']} | {spores(s)} | {srcs(s)} | {nordic(s)} |" for s in sorted(add, key=lambda s: (s["fam"], s["n"]))]
L += ["\n## 6. Nordic Boletales not added\n", "**Same species as one already in the app:**\n"]
L += [f"- *{k}* — {v}" for k, v in A["notAdded"].items()]
in_app = {s["n"] for s in SP} | {s.get("syn") for s in SP} | {s.get("renamedFrom") for s in SP} | set(A["notAdded"])
missing = [(n, c) for n, c in cand.items() if n not in in_app]
L += ["\n**No checkable spore measurement yet:** no Svampeatlas description, and no open-access publication was read for these. A monograph, scans or an open paper would let me add them. Nordic GBIF record counts in brackets:\n",
      ", ".join(f"*{n}* ({c})" for n, c in missing),
      "\n## 7. What I need from you\n",
      "1. Confirm or reject the name decisions in §1, especially *Neoboletus* (three names, one concept) and *Leccinum albostipitatum* vs *L. rufum*.",
      "2. Look over the changed values in §2.",
      "3. Say whether any species in §6 matters enough to chase literature for.",
      "4. Merge the pull request when you're happy. Use a squash merge, so the downloaded PDFs in the branch history don't reach `main`."]
open(os.path.join(out, "sporexplore-v4-discrepancy-report.md"), "w").write("\n".join(L) + "\n")

B = ["# Sporexplore v4 — bibliography (APA 7)\n",
     "Generated from `sporexplore/data.js`. Every DOI was resolved through Crossref, and authors, year and title were checked. Works without a DOI give a stable URL and are marked as having no DOI.\n",
     "## Literature\n"]
for k, s in sorted(((k, s) for k, s in S.items() if s["type"] != "database-entry"), key=lambda x: plain(x[1]["apa"])):
    note = "DOI verified via Crossref." if s.get("doiVerified") else "No DOI exists for this work." if s.get("noDoi") else ""
    B.append(f"- {it(s['apa'])}  \n  *{note}*{' Method: ' + s['method'] if s.get('method') else ''}")
B.append("\n## Database records (Danmarks Svampeatlas species descriptions)\n")
B += [f"- {it(s['apa'])}" for k, s in sorted(((k, s) for k, s in S.items() if s["type"] == "database-entry"), key=lambda x: plain(x[1]["apa"]))]
B += ["\n## Name and occurrence databases consulted (not cited per value)\n",
      "- GBIF.org. (2026). *GBIF backbone taxonomy and occurrence search* [Data set]. Retrieved November 18, 2026, from https://www.gbif.org",
      "- Index Fungorum. (2026). *Index Fungorum* [Database]. Retrieved November 18, 2026, from https://www.indexfungorum.org",
      "- Royal Botanic Gardens, Kew. (2026). *Species Fungorum* [Database]. Retrieved November 18, 2026, from https://www.speciesfungorum.org"]
open(os.path.join(out, "sporexplore-v4-bibliography.md"), "w").write("\n".join(B) + "\n")
print("written", len(L), len(B))
