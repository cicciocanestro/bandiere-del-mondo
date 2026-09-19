# Project Overview

This is a frontend web application named "Bandiere del Mondo" (Flags of the World). It provides an interactive, visually appealing grid of all global continents, allowing users to explore national flags, territories, and their corresponding capitals. The application features a modern, glassmorphic aesthetic and includes a search function to filter countries by name or capital within their respective continents.

## Main Technologies

- **HTML5:** Semantic structure.
- **CSS3:** Vanilla CSS utilizing custom properties (`:root`), CSS Grid for layout, animations, and responsive media queries.
- **JavaScript (Vanilla JS):** DOM manipulation, event handling, search/filtering logic, native `Intl.DisplayNames` API for localization, and **REST API integration** via the native `fetch()` API.
- **REST API — Countries Now** ([countriesnow.space](https://countriesnow.space)): source of truth for country data (names, capitals, ISO codes). It is free, requires **no API key**, and supports CORS. *Note: the classic REST Countries v3.1 API is deprecated (v5 requires an API key), which is why this project uses Countries Now.*
- **REST API — World Bank** ([api.worldbank.org](https://api.worldbank.org)): secondary source for **population** (`SP.POP.TOTL`) and **surface area in km²** (`AG.SRF.TOTL.K2`). Also free, keyless, and CORS-enabled. A small manual map (`EXTRA_STATS`) covers states absent from the World Bank (e.g. Vatican City).
- **External Assets:**
  - [Google Fonts](https://fonts.google.com/): "Plus Jakarta Sans".
  - [Lucide Icons](https://lucide.dev/): Modern iconography.
  - [FlagCDN](https://flagcdn.com/): Provider for high-quality SVG national flags (URL built from the ISO code returned by the API).

## Data Flow (REST API)

1. On page load, `app.js` runs two fetches **in parallel**:

   ```
   GET https://countriesnow.space/api/v0.1/countries/capital
   GET https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=400&mrnev=1
   GET https://api.worldbank.org/v2/country/all/indicator/AG.SRF.TOTL.K2?format=json&per_page=400&mrnev=1
   ```

2. Each response is validated and indexed by ISO-3166 alpha-2 code (`iso2`). Duplicate entries returned by the API are filtered out.
3. The APIs return the *whole world* in **English**. The app:
   - **Localizes** names to Italian using the native `Intl.DisplayNames` API, with a fallback dictionary for capitals (`ITALIAN_CAPITALS`).
   - **Categorizes** all codes into Continents via the `CONTINENT_CODES` mapping. Non-sovereign dependencies and territories are explicitly grouped into a separate "Territori" category using the `TERRITORY_CODES_SET`.
   - **Joins** population/area from the World Bank payloads; `EXTRA_STATS` fills the gaps.
4. The statistics are **optional enrichment**: if the World Bank is unreachable, the app still renders the countries and shows "—" for missing values.
5. If the APIs are entirely unreachable, the app **falls back** to the embedded `FALLBACK_DATA` dataset, shows an amber "API non raggiungibile" badge, and offers a **"Riprova"** (retry) button.

## Country object shape

Every rendered country has the shape `{ nome, capitale, codice, abitanti, superficie }`, where `abitanti` (population) and `superficie` (km²) are numbers or `null`. Display formatting (`formatPopulation`, `formatArea`) uses the Italian locale: "58,9 mln", "143,5 mln", "302.070 km²", "0,5 km²".

## Building and Running

Since this is a static frontend project utilizing Vanilla HTML, CSS, and JS without a build step or bundler:

- **Run:** You can simply open `index.html` in any modern web browser to view the application. Alternatively, you can use a local static server for a better development experience (e.g., `npx serve`, `python3 -m http.server`, or the Live Server extension in VS Code).
- **Build:** No build process is required.
- **Network:** The app needs internet access to reach the REST API and FlagCDN. Without connectivity it still works using the embedded fallback dataset.

## Development Conventions

- **Styling:** The project uses Vanilla CSS with a strong emphasis on CSS variables (defined in `:root` inside `style.css`) for theming (colors, border radius, transitions). The aesthetic is "ultra-modern" (glassmorphism, glow effects, smooth transitions).
- **JavaScript:** Logic is contained entirely within `app.js`. The file handles global dataset fetching on boot, rendering the continent selector, and switching views when a specific continent (or "Territori") is clicked.
- **Search:** filtering is case- and accent-insensitive (`normalizeText()` strips diacritics) and is scoped to the currently selected continent.
- **Icons:** Lucide icons are used throughout the UI.

## Deployment

**Live Environment:** L'applicazione è attualmente online e ospitata su Netlify a questo indirizzo: [https://deluxe-biscochitos-1752f7.netlify.app/](https://deluxe-biscochitos-1752f7.netlify.app/)

### Deploy continuo da GitHub

Il deploy passa da GitHub: il repo [bandiere-del-mondo](https://github.com/cicciocanestro/bandiere-del-mondo) è collegato al sito Netlify, quindi ogni push sul branch `main` pubblica automaticamente in produzione.

```bash
git add -A
git commit -m "descrizione della modifica"
git push
```

La directory pubblicata è la radice del repo (`netlify.toml` → `publish = "."`) e non c'è nessun build command, coerentemente con l'assenza di build step. `.env`, `.DS_Store` e `.commandcode/` sono esclusi tramite `.gitignore`, quindi non finiscono né nel repo né online.

Since this is a fully static frontend application with no build process, deployment is straightforward. You can host it on any static web hosting service:

- **GitHub Pages:** Push the repository to GitHub, go to the repository Settings > Pages, and select the `main` branch as the source.
- **Vercel / Netlify / Cloudflare Pages:** Link your Git repository or drag-and-drop the project folder into their web dashboard. Leave the "Build Command" empty and set the "Publish directory" to the root (`.` or `/`).

> Note: the free Countries Now API has no SLA; the embedded fallback dataset guarantees the app keeps working even if the API is temporarily unavailable.
