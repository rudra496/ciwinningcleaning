"""Static integrity audit for CI Winning Cleaning site — parses real artifacts (L-118)."""
import re, os, sys
from html.parser import HTMLParser

ROOT = r"E:\zcode-data\ciwinningcleaning-website"
PAGES = ["index.html", "services.html", "booking.html", "about.html"]
fails, warns = [], []

class AttrParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.hrefs, self.srcs, self.ids = [], [], set()
        self.aria_current = []
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if "href" in d: self.hrefs.append((tag, d["href"]))
        if "src" in d: self.srcs.append((tag, d["src"]))
        if "id" in d: self.ids.add(d["id"])
        if "aria-current" in d: self.aria_current.append(d["aria-current"])

page_data = {}
for page in PAGES:
    path = os.path.join(ROOT, page)
    with open(path, encoding="utf-8") as f:
        html = f.read()
    p = AttrParser(); p.feed(html)
    page_data[page] = p
    html_text = html
    for t in ["div", "section", "header", "footer", "main", "form", "a", "ul", "li", "details", "summary", "svg", "nav", "table", "tr", "td", "th"]:
        o = len(re.findall(rf"<{t}[\s>]", html_text))
        c = len(re.findall(rf"</{t}>", html_text))
        if o != c:
            fails.append(f"{page}: <{t}> open={o} close={c} MISMATCH")

# ---- 1. internal links + anchors ----
id_index = {pg: page_data[pg].ids for pg in PAGES}
for pg in PAGES:
    for tag, href in page_data[pg].hrefs:
        if href.startswith(("http://", "https://", "mailto:", "tel:")) or href == "#":
            continue
        if href.startswith("#"):
            target = href[1:]
            if target and target not in id_index[pg]:
                fails.append(f"{pg}: broken same-page anchor #{target}")
            continue
        file_part, _, anchor = href.partition("#")
        fp = os.path.join(ROOT, file_part)
        if not os.path.exists(fp):
            fails.append(f"{pg}: broken link -> {href}")
        elif anchor and file_part.endswith(".html"):
            if anchor not in id_index.get(file_part, set()):
                fails.append(f"{pg}: broken cross-page anchor {href}")

# ---- 2. asset refs ----
for pg in PAGES:
    for tag, src in page_data[pg].srcs:
        if src.startswith("http"): continue
        if not os.path.exists(os.path.join(ROOT, src)):
            fails.append(f"{pg}: missing asset -> {src}")

# ---- 3. CSS url() + HTML bg images ----
with open(os.path.join(ROOT, "css", "style.css"), encoding="utf-8") as f:
    css = f.read()
for m in re.findall(r"url\('([^']+)'\)", css):
    if not os.path.exists(os.path.join(ROOT, "css", m)):
        fails.append(f"style.css: missing asset -> {m}")
for pg in PAGES:
    html = open(os.path.join(ROOT, pg), encoding="utf-8").read()
    for m in re.findall(r"background-image:url\('([^']+)'\)", html):
        if not os.path.exists(os.path.join(ROOT, m)):
            fails.append(f"{pg}: missing bg image -> {m}")

# ---- 4. aria-current ----
for pg in PAGES:
    n = len(page_data[pg].aria_current)
    if n != 1:
        warns.append(f"{pg}: aria-current count = {n} (expected 1)")

# ---- 5. required content ----
must_have = {
    "index.html": ["CI Winning Cleaning", "Domestic Cleaning", "End of Tenancy", "Deep Cleaning",
                   "Commercial", "Carpet", "Airbnb", "From £18/hr", "booking.html",
                   "£120", "£30/room", "£40", "£100", "Bonanza", "Scotland", "data-promo-end",
                   "CI WINNING LTD", "+44 7397 267592", "wa.me/447397267592",
                   "ciwinningltd@gmail.com"],
    "booking.html": ["booking-form", "bf-property", "bf-bedrooms", "bf-postcode", "bf-date",
                     "summary-list", "send-whatsapp", "send-email", "channel-note",
                     "+44 7397 267592", "ciwinningltd@gmail.com"],
    "services.html": ["domestic", "end-of-tenancy", "deep-cleaning", "commercial",
                      "carpet", "airbnb", "additional",
                      "£18–£25 per hour", "£120–£350+", "£25–£40", "£20–£35", "£30–£60", "£40–£100+"],
    "booking.html": ["booking-form", "bf-property", "bf-bedrooms", "bf-postcode", "bf-date",
                     "summary-list", "send-whatsapp", "send-email", "channel-note"],
    "about.html": ["CI Winning Cleaning", "areas", "booking.html"],
}
for pg, needles in must_have.items():
    html = open(os.path.join(ROOT, pg), encoding="utf-8").read()
    for n in needles:
        if n not in html:
            fails.append(f"{pg}: missing required content -> {n}")

# ---- 6. banned strings ----
banned = ["insured", "vetted", "dbs", "background-checked", "police checked",
          "10 years of experience", "since 2015", "guaranteed deposit", "100% satisfaction",
          "ciwinningcleaning.co.uk", "@ciwinningcleaning", "cleaner@example",
          "447700900123"]
for pg in PAGES:
    html = open(os.path.join(ROOT, pg), encoding="utf-8").read()
    html = re.sub(r"<path[^>]*>", " ", html)  # svg path coords are not content
    html = html.lower()
    for b in banned:
        if b in html:
            fails.append(f"{pg}: contains banned string -> {b}")

# ---- 7. contact channels configured (live since 2026-10-29) ----
cfg = open(os.path.join(ROOT, "js", "config.js"), encoding="utf-8").read()
if 'whatsapp: "447397267592"' not in cfg or 'email: "ciwinningltd@gmail.com"' not in cfg:
    fails.append("js/config.js: expected live channels missing/modified")

print("=" * 60)
if fails:
    print(f"FAIL ({len(fails)}):")
    for f_ in fails: print("  ✗", f_)
else:
    print("ALL STATIC CHECKS PASS ✓")
if warns:
    print(f"WARN ({len(warns)}):")
    for w in warns: print("  ⚠", w)
sys.exit(1 if fails else 0)
