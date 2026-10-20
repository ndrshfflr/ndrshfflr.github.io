#!/usr/bin/env python3
"""Build "Skurð" — the site's rune-carved display face.

Every letter is drawn from straight strokes only, the way runes were cut into
wood and stone (curves are hard to carve across the grain). Capitals are full
height; lowercase letters are rendered as small capitals with the same stroke
weight. The Elder Futhark runes (U+16A0–U+16F0) are included so runic text
looks identical on every device.

    pip install fonttools brotli shapely
    python3 src/fonts/build_skurd.py
"""
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from shapely.geometry import LineString, LinearRing, Polygon, box
from shapely.geometry.polygon import orient
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "assets" / "fonts"

CAP = 700          # cap height
SC = 500           # small-cap height (lowercase)
STROKE = 94        # stroke width
S = STROKE / 2
SIDE = 52          # side bearing, caps
SIDE_SC = 44       # side bearing, small caps
SC_X = 0.86        # small-cap width factor

# ---------------------------------------------------------------------------
# Glyph drawings, in a cap-height frame (y: 0 = baseline, 700 = cap height).
# Coordinates are stroke centre-lines; horizontal bars sit at y=42 / y=658 so
# their outer edges land exactly on the baseline / cap line.
#   ("L", pts)  open stroke          ("R", pts)  closed stroke
#   ("P", pts)  filled shape (dots)  ("X", pts)  open stroke, not clipped
# ---------------------------------------------------------------------------
T, B, M = 658, 42, 350
O_RING = [(130, T), (390, T), (520, 500), (520, 200), (390, B), (130, B), (0, 200), (0, 500)]
DOT = lambda cx, cy, r=60: ("P", [(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)])

G = {
    "A": [("L", [(0, 0), (275, 760), (550, 0)]), ("L", [(118, 205), (432, 290)])],
    "B": [("R", [(0, 0), (0, 700), (360, 525), (0, 350), (400, 175)])],
    "C": [("L", [(450, T), (130, T), (0, 500), (0, 200), (130, B), (450, B)])],
    "D": [("R", [(0, T), (290, T), (440, 480), (440, 220), (290, B), (0, B)])],
    "E": [("L", [(420, T), (0, T), (0, B), (420, B)]), ("L", [(0, M), (330, M)])],
    "F": [("L", [(0, 0), (0, T), (420, T)]), ("L", [(0, 290), (330, 430)])],
    "G": [("L", [(450, T), (130, T), (0, 500), (0, 200), (130, B), (450, B), (450, 330), (250, 330)])],
    "H": [("L", [(0, 0), (0, 700)]), ("L", [(450, 0), (450, 700)]), ("L", [(0, 255), (450, 445)])],
    "I": [("L", [(0, 0), (0, 700)])],
    "J": [("L", [(360, 700), (360, 200), (240, B), (110, B), (0, 170)])],
    "K": [("L", [(0, 0), (0, 700)]), ("L", [(430, 700), (0, 300)]), ("L", [(150, 440), (450, 0)])],
    "L": [("L", [(0, 700), (0, B), (400, B)])],
    "M": [("L", [(0, 0), (0, 700), (275, 360), (550, 700), (550, 0)])],
    "N": [("L", [(0, 0), (0, 700), (470, 0), (470, 700)])],
    "O": [("R", O_RING)],
    "P": [("L", [(0, 0), (0, 700), (390, 515), (0, 330)])],
    "Q": [("R", O_RING), ("L", [(300, 240), (580, 0)])],
    "R": [("L", [(0, 0), (0, 700), (380, 520), (0, 340), (430, 0)])],
    "S": [("L", [(450, T), (110, T), (0, 560), (0, 445), (110, 370), (340, 330), (450, 255), (450, 140), (340, B), (0, B)])],
    "T": [("L", [(0, T), (520, T)]), ("L", [(260, 0), (260, 700)])],
    "U": [("L", [(0, 700), (0, 200), (130, B), (340, B), (470, 200), (470, 700)])],
    "V": [("L", [(0, 700), (265, -60), (530, 700)])],
    "W": [("L", [(0, 700), (165, -60), (345, 520), (525, -60), (690, 700)])],
    "X": [("L", [(0, 700), (480, 0)]), ("L", [(480, 700), (0, 0)])],
    "Y": [("L", [(0, 700), (255, 350), (510, 700)]), ("L", [(255, 350), (255, 0)])],
    "Z": [("L", [(0, T), (460, T), (0, B), (460, B)])],
    "Æ": [("L", [(0, 0), (330, T), (720, T)]), ("L", [(330, T), (330, B), (720, B)]),
          ("L", [(330, M), (640, M)]), ("L", [(120, 240), (330, 240)])],
    "Ø": [("R", O_RING), ("L", [(20, -30), (500, 730)])],
    "Å": [("L", [(0, 0), (275, 760), (550, 0)]), ("L", [(118, 205), (432, 290)]),
          ("PH", [(275, 755), (355, 835), (275, 915), (195, 835)], [(275, 805), (305, 835), (275, 865), (245, 835)])],

    "0": [("R", [(110, T), (310, T), (420, 500), (420, 200), (310, B), (110, B), (0, 200), (0, 500)])],
    "1": [("L", [(30, 520), (230, 710)]), ("L", [(230, 0), (230, 700)])],
    "2": [("L", [(0, 540), (110, T), (310, T), (420, 540), (420, 430), (0, B), (430, B)])],
    "3": [("L", [(0, T), (420, T), (180, 390), (310, 390), (420, 290), (420, 140), (310, B), (0, B)])],
    "4": [("L", [(330, 0), (330, 700), (0, 230), (450, 230)])],
    "5": [("L", [(420, T), (40, T), (0, 380), (310, 400), (420, 300), (420, 140), (310, B), (0, B)])],
    "6": [("L", [(360, 700), (0, 330), (0, 160), (110, B), (310, B), (420, 160), (420, 300), (310, 420), (110, 420), (0, 330)])],
    "7": [("L", [(0, T), (430, T), (140, 0)])],
    "8": [("R", [(110, T), (310, T), (400, 570), (400, 450), (310, 365), (110, 365), (20, 450), (20, 570)]),
          ("R", [(110, 365), (310, 365), (420, 260), (420, 140), (310, B), (110, B), (0, 140), (0, 260)])],
    "9": [("L", [(60, 0), (420, 370), (420, 540), (310, T), (110, T), (0, 540), (0, 400), (110, 280), (310, 280), (420, 370)])],

    ".": [DOT(60, 60)],
    ",": [DOT(60, 60), ("X", [(95, 30), (35, -130)])],
    ":": [DOT(60, 60), DOT(60, 400)],
    ";": [DOT(60, 400), DOT(60, 60), ("X", [(95, 30), (35, -130)])],
    "·": [DOT(60, 350)],
    "!": [("L", [(60, 700), (60, 220)]), DOT(60, 60)],
    "?": [("L", [(0, 560), (110, T), (310, T), (420, 560), (420, 450), (210, 300), (210, 200)]), DOT(210, 60)],
    "-": [("L", [(0, M), (260, M)])],
    "‐": [("L", [(0, M), (260, M)])],
    "–": [("L", [(0, M), (440, M)])],
    "—": [("L", [(0, M), (760, M)])],
    "'": [("L", [(60, 700), (20, 520)])],
    "’": [("L", [(60, 700), (20, 520)])],
    "‘": [("L", [(20, 700), (60, 520)])],
    "“": [("L", [(20, 700), (60, 520)]), ("L", [(150, 700), (190, 520)])],
    "”": [("L", [(60, 700), (20, 520)]), ("L", [(190, 700), (150, 520)])],
    "×": [("L", [(30, 190), (330, 490)]), ("L", [(330, 190), (30, 490)])],
    "+": [("L", [(0, M), (380, M)]), ("L", [(190, 160), (190, 540)])],
    "/": [("X", [(0, -40), (380, 740)])],
    "(": [("X", [(170, 760), (40, 580), (40, 120), (170, -60)])],
    ")": [("X", [(0, 760), (130, 580), (130, 120), (0, -60)])],

    # Elder Futhark
    "ᚠ": [("L", [(0, 0), (0, 700)]), ("L", [(0, 450), (340, 710)]), ("L", [(0, 210), (340, 470)])],          # ᚠ fehu
    "ᚢ": [("L", [(0, 0), (0, 700), (370, 430), (370, 0)])],                                                    # ᚢ uruz
    "ᚦ": [("L", [(0, 0), (0, 700)]), ("L", [(0, 540), (290, 350), (0, 160)])],                                 # ᚦ thurisaz
    "ᚨ": [("L", [(0, 0), (0, 700)]), ("L", [(0, 690), (330, 450)]), ("L", [(0, 450), (330, 210)])],            # ᚨ ansuz
    "ᚱ": [("L", [(0, 0), (0, 700), (350, 520), (0, 340), (390, 0)])],                                          # ᚱ raidō
    "ᚲ": [("L", [(310, 700), (0, 520), (310, 340)])],                                                          # ᚲ kaunan
    "ᚷ": [("L", [(0, 700), (440, 0)]), ("L", [(440, 700), (0, 0)])],                                           # ᚷ gebō
    "ᚹ": [("L", [(0, 0), (0, 700), (330, 520), (0, 340)])],                                                    # ᚹ wunjō
    "ᚺ": [("L", [(0, 0), (0, 700)]), ("L", [(390, 0), (390, 700)]), ("L", [(0, 440), (390, 260)])],           # ᚺ hagalaz
    "ᚾ": [("L", [(180, 0), (180, 700)]), ("L", [(30, 470), (330, 230)])],                                      # ᚾ naudiz
    "ᛁ": [("L", [(0, 0), (0, 700)])],                                                                          # ᛁ isaz
    "ᛃ": [("L", [(170, 700), (0, 530), (170, 360)]), ("L", [(190, 340), (360, 170), (190, 0)])],               # ᛃ jēra
    "ᛇ": [("L", [(160, 0), (160, 700)]), ("L", [(160, 700), (330, 560)]), ("L", [(160, 0), (0, 140)])],        # ᛇ eihwaz
    "ᛈ": [("L", [(0, 0), (0, 700)]), ("L", [(0, 700), (220, 520), (340, 710)]), ("L", [(0, 0), (220, 180), (340, -10)])],  # ᛈ perþ
    "ᛉ": [("L", [(230, 0), (230, 700)]), ("L", [(230, 420), (0, 710)]), ("L", [(230, 420), (460, 710)])],      # ᛉ algiz
    "ᛊ": [("L", [(270, 700), (0, 460), (270, 240), (0, 0)])],                                                  # ᛊ sōwilō
    "ᛏ": [("L", [(240, 0), (240, 700)]), ("L", [(0, 460), (240, 700), (480, 460)])],                           # ᛏ tīwaz
    "ᛒ": [("R", [(0, 0), (0, 700), (340, 525), (0, 350), (340, 175)])],                                        # ᛒ berkanan
    "ᛖ": [("L", [(0, 0), (0, 700), (230, 470), (460, 700), (460, 0)])],                                        # ᛖ ehwaz
    "ᛗ": [("L", [(0, 0), (0, 700), (460, 290)]), ("L", [(460, 0), (460, 700), (0, 290)])],                     # ᛗ mannaz
    "ᛚ": [("L", [(0, 0), (0, 700), (310, 460)])],                                                              # ᛚ laguz
    "ᛜ": [("R", [(180, 540), (360, 350), (180, 160), (0, 350)])],                                              # ᛜ ingwaz
    "ᛞ": [("L", [(0, 0), (0, 700)]), ("L", [(470, 0), (470, 700)]), ("L", [(0, 700), (470, 0)]), ("L", [(470, 700), (0, 0)])],  # ᛞ dagaz
    "ᛟ": [("L", [(0, 0), (410, 430), (205, 690), (0, 430), (410, 0)])],                                        # ᛟ ōþila
    "᛫": [DOT(60, 350)],                                                                                        # ᛫
    "᛬": [DOT(60, 210), DOT(60, 490)],                                                                          # ᛬
    "᛭": [("L", [(0, M), (320, M)]), ("L", [(160, 190), (160, 510)])],                                         # ᛭
}

# Runic letters that share a shape with an existing drawing.
ALIASES = {"ᚡ": "ᚠ", "ᚻ": "ᚺ", "ᚿ": "ᚾ", "ᛋ": "ᛊ", "ᛓ": "ᛒ"}


def ymap(y, height):
    """Map a cap-frame y to a frame of a different height, keeping the
    stroke insets at baseline/cap line unchanged."""
    return S + (y - S) * (height - 2 * S) / (CAP - 2 * S)


def build_shape(spec, height=CAP, xs=1.0):
    clipped, free = [], []
    clip_box = box(-2000, 0, 4000, height)
    for item in spec:
        kind, pts = item[0], item[1]
        pts = [(x * xs, ymap(y, height)) for x, y in pts]
        if kind == "L":
            clipped.append(LineString(pts).buffer(S, cap_style="flat", join_style="mitre", mitre_limit=2.2))
        elif kind == "R":
            clipped.append(LinearRing(pts).buffer(S, cap_style="flat", join_style="mitre", mitre_limit=2.2))
        elif kind == "X":
            free.append(LineString(pts).buffer(S * 0.8, cap_style="flat", join_style="mitre", mitre_limit=2.2))
        elif kind == "P":
            free.append(Polygon(pts))
        elif kind == "PH":
            hole = [(x * xs, ymap(y, height)) for x, y in item[2]]
            free.append(Polygon(pts, [hole]))
    geoms = []
    if clipped:
        geoms.append(unary_union(clipped).intersection(clip_box))
    geoms.extend(free)
    return unary_union(geoms).buffer(0)


def polygons(geom):
    if geom.is_empty:
        return []
    if geom.geom_type == "Polygon":
        return [geom]
    return [g for g in getattr(geom, "geoms", []) if g.geom_type == "Polygon"]


def draw_glyph(geom, side):
    minx = geom.bounds[0] if not geom.is_empty else 0
    dx = side - minx
    pen = TTGlyphPen(None)
    for poly in polygons(geom):
        poly = orient(poly, sign=-1.0)  # TrueType: outer contours clockwise
        rings = [poly.exterior] + list(poly.interiors)
        for ring in rings:
            coords = [(round(x + dx), round(y)) for x, y in list(ring.coords)[:-1]]
            # drop consecutive duplicates created by rounding
            clean = [c for i, c in enumerate(coords) if c != coords[i - 1]]
            if len(clean) < 3:
                continue
            pen.moveTo(clean[0])
            for c in clean[1:]:
                pen.lineTo(c)
            pen.closePath()
    width = (geom.bounds[2] - geom.bounds[0]) if not geom.is_empty else 0
    return pen.glyph(), round(width + 2 * side), round(side)


def gname(ch):
    return "uni%04X" % ord(ch)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    glyphs, metrics, cmap = {}, {}, {}

    empty = TTGlyphPen(None).glyph()
    glyphs[".notdef"] = empty
    metrics[".notdef"] = (500, 0)
    glyphs["space"] = empty
    metrics["space"] = (270, 0)
    cmap[0x20] = "space"
    cmap[0xA0] = "space"

    for ch, spec in G.items():
        geom = build_shape(spec)
        g, adv, lsb = draw_glyph(geom, SIDE)
        name = gname(ch)
        glyphs[name], metrics[name] = g, (adv, lsb)
        cmap[ord(ch)] = name
        # lowercase → small capitals
        if ch.isalpha() and ch.upper() == ch and ch.lower() != ch and len(ch.lower()) == 1:
            lo = ch.lower()
            geom = build_shape(spec, height=SC, xs=SC_X)
            g, adv, lsb = draw_glyph(geom, SIDE_SC)
            name = gname(lo)
            glyphs[name], metrics[name] = g, (adv, lsb)
            cmap[ord(lo)] = name

    for alias, src in ALIASES.items():
        cmap[ord(alias)] = gname(src)

    order = list(glyphs.keys())
    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=920, descent=-230)
    fb.setupNameTable({
        "familyName": "Skurd",
        "styleName": "Regular",
        "uniqueFontIdentifier": "Skurd-Regular-1.0",
        "fullName": "Skurd Regular",
        "psName": "Skurd-Regular",
        "version": "Version 1.000",
        "copyright": "Drawn for Pieter Shiffler Carpentier, 2026",
    })
    fb.setupOS2(sTypoAscender=920, sTypoDescender=-230, sTypoLineGap=0, usWinAscent=940, usWinDescent=250,
                sxHeight=SC, sCapHeight=CAP, achVendID="NONE")
    fb.setupPost()
    fb.font["head"].fontRevision = 1.0

    ttf = Path(__file__).resolve().parent / "skurd.ttf"
    fb.save(ttf)
    fb.font.flavor = "woff2"
    fb.save(OUT_DIR / "skurd.woff2")
    print("wrote", ttf, "and skurd.woff2 —", len(order), "glyphs")


if __name__ == "__main__":
    main()
