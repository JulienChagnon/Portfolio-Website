# Portfolio Website

A responsive, bilingual (English/French) personal portfolio site, built from scratch with vanilla HTML, CSS, and JavaScript — no frameworks or build step. It serves as a self-hosted online resume showcasing my projects, work history, education, and certifications.

Live at **[www.julienchagnon.ca](https://www.julienchagnon.ca)**.

## Features

- **Bilingual content** — every text block carries `data-en` / `data-fr` attributes, and a single toggle swaps the entire site between English and French (with its own colour palette per language).
- **CRT header** — a scanline and phosphor-mask background with live grain and flicker (paused when scrolled away); the photo, name and links glow above it.
- **Digital rain effects** — animated Matrix-style glyph rain in the header, sidebar, and content gutters (the latter in dark mode), all sharing a common glyph set.
- **Expandable project cards** — cards open on hover (or "See more" on touch), with an inline media modal for embedded videos and PDFs.
- **Work history timeline** — the older jobs reveal with a height animation and a staggered unblur.
- **Sticky sidebar** with a projects dropdown for quick navigation.
- **Lite mode** — animations are reduced automatically for `prefers-reduced-motion` or data-saver users (force with `?lite=1` / `?lite=0`).
- **Interactive header terminal (currently disabled)** — a command-line emulator with `help`, `ls`, `cat <file>`, `git status`, `ifconfig`, `fortune`, `dark`, and `clear`, including Tab autocompletion and command history. It's commented out at the end of `script.js`; its `dark` command is the only way to reach dark mode.
- **Responsive layout** optimized for both desktop and mobile.
- **Google Analytics** (gtag.js) integration.

## Structure

| File | Purpose |
|------|---------|
| `index.html` | All page content and structure (bilingual via `data-en`/`data-fr`) |
| `style.css` | Design tokens (colours, radius scale, fonts), layout, theming, and animations |
| `script.js` | Language switching, digital rain, project cards, modals, sidebar, custom scrollbar (plus the disabled terminal) |
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
