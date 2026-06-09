# Portfolio Website

A responsive, bilingual (English/French) personal portfolio site, built from scratch with vanilla HTML, CSS, and JavaScript — no frameworks or build step. It serves as a self-hosted online resume showcasing my projects, work history, education, and certifications.

Live at **[www.julienchagnon.ca](https://www.julienchagnon.ca)**.

## Features

- **Bilingual content** — every text block carries `data-en` / `data-fr` attributes, and a single toggle swaps the entire site between English and French (with its own colour palette per language).
- **Light / dark mode** — theme switch driven by CSS custom properties, with persisted preference.
- **Interactive header terminal** — a working command-line emulator with `help`, `ls`, `cat <file>`, `git status`, `ifconfig`, `fortune`, `dark`, and `clear`. Supports Tab autocompletion and up/down command history.
- **Digital rain effects** — animated Matrix-style glyph rain in the header, sidebar, and content gutters (the latter in dark mode), all sharing a common glyph set.
- **Expandable project cards** — "See more" toggles reveal full project write-ups, with an inline media modal for embedded videos and PDFs.
- **Sticky sidebar** with a projects dropdown for quick navigation.
- **Responsive layout** optimized for both desktop and mobile.
- **Google Analytics** (gtag.js) integration.

## Structure

| File | Purpose |
|------|---------|
| `index.html` | All page content and structure (bilingual via `data-en`/`data-fr`) |
| `style.css` | Layout, theming, terminal styling, and animations |
| `script.js` | Language/theme switching, terminal emulator, digital rain, modals, sidebar |
| `Media/` | Images, videos, PDFs, and logos |
| `CNAME` | Custom domain config for GitHub Pages |

## Development

No dependencies or build tooling — open `index.html` directly in a browser, or serve the folder locally:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## Deployment

Hosted on GitHub Pages with a custom domain (`www.julienchagnon.ca`) configured via the `CNAME` file. Pushing to the default branch publishes the site automatically.
