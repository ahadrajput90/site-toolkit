# SiteWise Toolkit

**Plan smarter. Build with confidence.**

A tool-first website with three working planning tools for website projects. Plain HTML, CSS and vanilla JavaScript. No build step, no dependencies.

## Run it

Open `index.html` in a modern browser. That's it.

(Fonts — Manrope and DM Sans — load from Google Fonts. Offline, the site falls back to system fonts.)

## Structure

```
index.html
assets/
  css/style.css
  js/main.js
README.md
```

## The tools

1. **Website Budget Planner** — type, page count, design approach, optional features and timeline produce a low–high USD range, a cost breakdown, effort in hours and typical duration.
2. **Scope Gap Checklist** — 16 items across goals, content, technical and process. Shows a readiness percentage and the top open gaps.
3. **Project Brief Builder** — live preview that combines your form answers, the budget estimate and open checklist gaps. Copy to clipboard or download as `.txt`.

Everything runs in the browser. Nothing is sent to a server and nothing is stored.

## Customizing the estimate

All pricing assumptions live at the top of the planner section in `assets/js/main.js`:

- `TYPE` — base low/high cost and hours per site type
- `PAGES` — multiplier per page range
- `DESIGN` — multiplier per design approach
- `FEATURES` — flat low/high cost and hours per feature
- `TIMELINE` — multiplier for flexible / standard / rushed

Adjust the numbers to match your market or your own rates. The estimates are planning aids, not quotes.

## Design tokens

Colors, radii and fonts are CSS variables at the top of `assets/css/style.css` (`--bg`, `--ink`, `--lav`, `--green`, `--orange`).

## Notes on content

The hero dashboard is labeled as an illustrative example. The site contains no testimonials, customer logos or usage statistics.

## Packaging

If you need to zip it yourself, from the folder that contains `sitewise-toolkit/`:

```
zip -r sitewise-toolkit.zip sitewise-toolkit
```

On Windows, right-click the folder and choose **Send to → Compressed (zipped) folder**.

## Deploying to WordPress

The static files can be uploaded as-is to any host. To use the design in WordPress, move the CSS and JS into a theme or child theme, enqueue them with `wp_enqueue_style` / `wp_enqueue_script`, and convert the sections of `index.html` into template parts or a custom page template.
