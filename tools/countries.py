# ISO 3166-1 alpha-2 codes for the 193 UN member states plus a few widely
# recognised extras (Vatican City, Palestine, Kosovo, Taiwan).
CODES = """
af al dz ad ao ag ar am au at az bs bh bd bb by be bz bj bt bo ba bw br bn bg bf bi
kh cm ca cv cf td cl cn co km cg cd cr ci hr cu cy cz dk dj dm do ec eg sv gq er ee sz et
fj fi fr ga gm ge de gh gr gd gt gn gw gy ht hn hu is in id ir iq ie il it jm jp jo kz ke ki
kp kr kw kg la lv lb ls lr ly li lt lu mg mw my mv ml mt mh mr mu mx fm md mc mn me ma mz mm
na nr np nl nz ni ne ng mk no om pk pw pa pg py pe ph pl pt qa ro ru rw kn lc vc ws sm st sa
sn rs sc sl sg sk si sb so za ss es lk sd sr se ch sy tj tz th tl tg to tt tn tr tm tv ug ua ae
gb us uy uz vu ve vn ye zm zw
va ps xk tw
""".split()

# Friendlier display names where flag-icons' names are awkward.
NAME_OVERRIDES = {
    "cd": "DR Congo",
    "cg": "Republic of the Congo",
    "ci": "Ivory Coast",
    "fm": "Micronesia",
    "gb": "United Kingdom",
    "us": "United States",
    "va": "Vatican City",
    "ps": "Palestine",
    "xk": "Kosovo",
    "tw": "Taiwan",
    "kp": "North Korea",
    "kr": "South Korea",
    "la": "Laos",
    "sy": "Syria",
    "ir": "Iran",
    "ru": "Russia",
    "vn": "Vietnam",
    "bo": "Bolivia",
    "ve": "Venezuela",
    "tz": "Tanzania",
    "md": "Moldova",
    "mk": "North Macedonia",
    "cz": "Czechia",
    "bn": "Brunei",
    "tl": "Timor-Leste",
    "sz": "Eswatini",
    "cv": "Cabo Verde",
    "st": "Sao Tome and Principe",
    "vc": "St Vincent and the Grenadines",
    "kn": "St Kitts and Nevis",
    "lc": "St Lucia",
    "ba": "Bosnia and Herzegovina",
    "ae": "United Arab Emirates",
    "tt": "Trinidad and Tobago",
    "ag": "Antigua and Barbuda",
    "mm": "Myanmar",
    "bs": "The Bahamas",
    "gm": "The Gambia",
    "nl": "Netherlands",
    "ph": "Philippines",
    "mh": "Marshall Islands",
    "sb": "Solomon Islands",
    "cf": "Central African Republic",
    "do": "Dominican Republic",
    "gq": "Equatorial Guinea",
    "gw": "Guinea-Bissau",
    "pg": "Papua New Guinea",
    "ss": "South Sudan",
    "za": "South Africa",
    "lk": "Sri Lanka",
    "ky": "Cayman Islands",
}

# Per-country overrides for the pre-fill rules (tools/build_flags.py).
#   STRICT      - only the plain "at least PREFILL_THRESHOLD" rule applies: small
#                 shapes are never rescued as fillable (use for busy emblems).
#   THRESHOLDS  - a custom minimum region size for that country (fraction of the
#                 flag), replacing PREFILL_THRESHOLD. Raise it to pre-fill more,
#                 lower it to let the player fill more.
STRICT = set("""

""".split())

THRESHOLDS = {
    # "hr": 0.02,
}

# ---------------------------------------------------------------------------
# GROUPS - hand-tuned region grouping, applied after the automatic rules.
# Each entry selects pixels of one colour and makes them behave as ONE region.
#   hex     colour to select (nearest colour in the flag's palette is used)
#   select  (optional filters, combined)
#     boxes   [(x0, y0, x1, y1), ...]  only pieces WHOLLY inside one of these boxes
#                                      (fractions of the flag width / height)
#     points  [(x, y), ...]            only the pieces containing these points
#     minor   True                     only pieces under PREFILL_THRESHOLD
#     major   True                     only pieces of at least PREFILL_THRESHOLD
#     small   True                     only pieces that are currently pre-filled
#     rect    [(x0, y0, x1, y1), ...]  pixels of this colour inside these boxes,
#                                      regardless of which connected piece they
#                                      belong to - use this (instead of boxes/points)
#                                      when the thing you want has no colour
#                                      boundary from its neighbour at all (e.g. a
#                                      figure's trousers drawn as a gap in the
#                                      outline, left as the same fill as the
#                                      background behind it) so per-piece selection
#                                      can't isolate it. Skips boxes/points/minor/
#                                      major/small - it's a separate, simpler path.
#   into    where the selected pixels go:
#     absent      -> they become one new fillable region (merged together)
#     (x, y)      -> they join the fillable region that contains this point
#     "nearest"   -> each piece joins the nearest fillable region of the same colour
#     "prefill"   -> they become pre-filled (removed from play) - for turning a
#                    region that is currently fillable (or a small piece that would
#                    otherwise qualify) into fixed detail
# Typical uses: stripes of one colour fill together; stars fill together; an
# emblem drawn with black linework fills as one piece; a pre-filled sliver that
# gives a background colour away is absorbed into that background.
# ---------------------------------------------------------------------------
GROUPS = {
    # New Zealand: red star centres fill together
    "nz": [dict(hex="#c8102e", boxes=[(0.55, 0, 1, 1)])],
    # Venezuela: stars fill together
    "ve": [dict(hex="#ffffff", minor=True)],
    # Algeria: the white sliver by the star belongs to the white half
    "dz": [dict(hex="#ffffff")],
    # Zambia: eagle is one piece (linework stays); green between its legs is background
    "zm": [dict(hex="#ef7d00", minor=True), dict(hex="#198a00")],
    # Zimbabwe: star pieces cut by the bird are one star; bird is one piece
    "zw": [dict(hex="#d40000", points=[(0.24, 0.39), (0.11, 0.49), (0.26, 0.59)]), dict(hex="#ffcc00")],
    # Angola: machete blade + handle are one piece (cog and star stay separate)
    "ao": [dict(hex="#ffec00", points=[(0.39, 0.63), (0.55, 0.76)])],
    # Liechtenstein: crown gold is one piece
    "li": [dict(hex="#ffd83d")],
    # Mongolia: soyombo is one piece; the yin-yang holes belong to the left stripe
    "mn": [dict(hex="#ffd900"), dict(hex="#da2032", boxes=[(0, 0, 0.35, 1)])],
    # Liberia / Malaysia / USA: stripes of a colour fill together
    "lr": [dict(hex="#bf0a30"), dict(hex="#ffffff")],
    "my": [dict(hex="#cc0001"), dict(hex="#ffffff"), dict(hex="#ffcc00")],
    "us": [dict(hex="#bd3d44"), dict(hex="#ffffff", major=True), dict(hex="#ffffff", minor=True)],   # stripes; stars
    # Slovenia: mountain and rivers are one white piece
    "si": [dict(hex="#ffffff", boxes=[(0.1, 0.1, 0.4, 0.45)])],
    # Cabo Verde: stars fill together; each white stripe is one piece incl. the bits under stars
    "cv": [dict(hex="#ffce08"), dict(hex="#ffffff")],   # (the SVG joins both white stripes at the left, so they fill together)
    # Lesotho: white inside the hat belongs to the white stripe
    "ls": [dict(hex="#ffffff")],
    # Marshall Islands: blue slivers by the sun belong to the upper background
    "mh": [dict(hex="#3b5aa3", minor=True, into=(0.75, 0.25))],
    # Australia: stars fill together
    "au": [dict(hex="#ffffff", boxes=[(0.5, 0, 1, 1), (0.1, 0.55, 0.4, 1)])],
    # Azerbaijan / Malaysia: crescent + star are one piece
    "az": [dict(hex="#ffffff")],
    # Portugal: emblem greens/reds absorb into their backgrounds; yellow and white are single pieces
    "pt": [dict(hex="#006600", minor=True, into=(0.15, 0.5)), dict(hex="#ff0000", minor=True, into=(0.75, 0.5)),
           dict(hex="#ffff00"), dict(hex="#ffffff")],
    # Burundi: star outlines join the left green sector; star centres fill together
    "bi": [dict(hex="#18b637", minor=True, into=(0.12, 0.5)), dict(hex="#cf0921", minor=True)],
    # Sri Lanka: lion + sword one piece; four bo leaves one piece; red behind the lion is background
    "lk": [dict(hex="#ffb700", boxes=[(0.44, 0.25, 0.9, 0.75)]),
           dict(hex="#ffb700", boxes=[(0.33, 0.04, 0.46, 0.2), (0.86, 0.04, 0.99, 0.2), (0.33, 0.8, 0.46, 0.97), (0.86, 0.8, 0.99, 0.97)]),
           dict(hex="#8d2029", minor=True, into="nearest")],
    # Samoa: stars fill together
    "ws": [dict(hex="#ffffff")],
    # Ghana: the yellow sliver by the star belongs to the middle stripe
    "gh": [dict(hex="#fcd116")],
    # Israel: only the bits inside/around the star join the centre background -
    # the top and bottom white margins stay their own fillable regions
    "il": [dict(hex="#ffffff", boxes=[(0.0, 0.15, 1.0, 0.85)])],
    # Taiwan: sun rays and disc are one piece
    "tw": [dict(hex="#ffffff")],
    # Cyprus: olive branches are one piece
    "cy": [dict(hex="#435125")],
    # Honduras: stars fill together
    "hn": [dict(hex="#18c3df", minor=True)],
    # Ethiopia: all yellow (star, rays and both halves of the stripe) is one piece
    "et": [dict(hex="#ffc621")],
    # Brunei: emblem yellow joins the lower yellow band; emblem red is one piece
    "bn": [dict(hex="#f7e017", minor=True, into=(0.37, 0.84)), dict(hex="#cf1126")],
    # Moldova: the eagle (all brown) is one piece; the olive branch in its talon
    # (green, plus its darker shading) is a separate single piece
    "md": [dict(hex="#a77b3b"), dict(hex="#008f00"), dict(hex="#008500", into=(0.273, 0.479))],
    # Belize: the wreath's leaves (both greens used around the ring and in the
    # tree) fill together; the grass tufts under the men's feet (same green as
    # the tree) are pre-filled instead of playable; each man's trousers are drawn
    # as a gap in the outline with no colour boundary from the background behind
    # them, so they're carved out by position and pre-filled
    "bz": [
        dict(hex="#289400", boxes=[(0.30, 0.15, 0.70, 0.42)]),
        dict(hex="#289400", boxes=[(0.25, 0.55, 0.75, 0.75)], into="prefill"),
        dict(hex="#ffffff", rect=[(0.3225, 0.43, 0.425, 0.64), (0.58125, 0.43, 0.68125, 0.64)], into="prefill"),
    ],
    # Tuvalu: the nine stars fill together
    "tv": [dict(hex="#fff40d")],
    # Bhutan: the whole orange half and the whole yellow half are each a single
    # piece - no sliver of either colour is cut off and pre-filled by the dragon
    "bt": [dict(hex="#ffd520"), dict(hex="#ff4e12")],
    # Comoros: the four stars fill together (the crescent and the white stripe
    # stay as they are)
    "km": [dict(hex="#ffffff", points=[(0.2125, 0.343), (0.2125, 0.445), (0.2125, 0.547), (0.2125, 0.65)])],
    # Papua New Guinea: the red bird-of-paradise background is one piece (no
    # pre-filled sliver); all five Southern Cross stars fill together
    "pg": [dict(hex="#ff0000"), dict(hex="#ffffff")],
    # Iran: the whole national emblem (the two side crescents and the small
    # flourish above, as well as the central sword shape) is one piece - the
    # background red stripe is untouched
    "ir": [dict(hex="#da0000", boxes=[(0.35, 0.30, 0.65, 0.70)])],
    # China: all five stars fill together
    "cn": [dict(hex="#ffff00")],
    # Saudi Arabia: the shahada text and sword are one white piece; the green
    # background (including any sliver the script would otherwise cut off) is
    # the other - two regions total, no pre-fill
    "sa": [dict(hex="#165d31"), dict(hex="#ffffff")],
}
