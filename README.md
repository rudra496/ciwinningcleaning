# Fly Cleaner — Official Website

Professional website for **Fly Cleaner** — *Professional Cleaning Services for All
Facilities*. Seven specialist cleaning services for **homes and businesses across
the UK**: domestic, end of tenancy, deep cleaning, commercial & office, carpet &
upholstery, Airbnb & holiday lets, plus additional extras.

**Live site:** https://rudra496.github.io/flycleaner/

## Pages
| File | Purpose |
|------|---------|
| `index.html` | Home — hero, live price strip, 7 services, how-it-works, why-us, service areas, FAQ |
| `services.html` | All 7 services detailed: description, checklist, indicative starting price (anchor-linked) |
| `booking.html` | Free-quote booking form — property type, bedrooms, postcode, preferred date, frequency |
| `about.html` | Story, standards, stats, service areas |

## Tech
- Pure **HTML5 + CSS3 + vanilla JavaScript** — no frameworks, no build step, no backend
- Custom SVG logo/favicon, generated social-share image (og-image.png)
- Photos: Unsplash License — free for commercial use
- Fonts: Manrope + Inter via Google Fonts (system fallbacks included)
- SEO: per-page meta/OG tags, JSON-LD LocalBusiness schema, `sitemap.xml`, `robots.txt`
- Accessibility: skip links, ARIA labels, `prefers-reduced-motion` + print safety

## Booking form wiring (ONE file to update)
The booking form validates, builds a request summary, and can send it via
WhatsApp or email. Channels are configured in **`js/config.js`**:

```js
window.FLY_CONFIG = {
  whatsapp: "",   // international format, digits only, e.g. "447700900123"
  email: ""       // e.g. "bookings@flycleaner.co.uk"
};
```

Until these are filled, the form shows the booking summary with
"channels go live shortly" buttons (tested and verified). The moment the real
WhatsApp number and/or email are added, the send buttons activate automatically.

## Content notes
- **Prices** are indicative starting rates (as supplied) — every page states the
  exact quote depends on location, property size and condition, and every booking
  gets a free quote first.
- **Service areas** are deliberately generic ("selected areas across the UK") —
  add specific towns/postcodes to the areas sections when coverage is confirmed.
- **Social links** are placeholders (`#`, marked coming soon).
- Deliberately NOT claimed anywhere: insurance, DBS/vetting, guarantees, founding
  year, customer counts — add only what the business can evidence.

## Run locally
Open `index.html` in a browser, or:
```
python -m http.server 8080
```

## Deployment
Hosted free on **GitHub Pages** (repo root, `main` branch). For a custom domain
later: Settings → Pages, update canonical/OG/sitemap/robots URLs, add a CNAME.

## QA
`tools/static_audit.py` — validates links, cross-page anchors, assets, tag
balance, required content and a banned-claims list (no unverified insurance/
vetting/guarantee claims can ship). Run: `python tools/static_audit.py`

---
© Fly Cleaner. All rights reserved.
