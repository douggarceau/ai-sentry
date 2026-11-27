# Future Watch

A standalone static site (HTML, CSS, JavaScript; no build step). It has four dropdown menus with 35 topic links. Every link opens a short section with sources on one of four category pages.

- `menu.js`: the one list (`MENU`) that sets every menu label and destination, plus the dropdown behaviour for mouse, touch and keyboard.
- `index.html`: the homepage.
- `data-centers.html`, `consumer-financial-security.html`, `ai-cybersecurity.html`, `ai-surveillance-tracking.html`: the topic sections.
- `styles.css`: the shared styles.

Run locally:

```bash
cd future-watch && python3 -m http.server 8080
```

Then open http://localhost:8080/.
