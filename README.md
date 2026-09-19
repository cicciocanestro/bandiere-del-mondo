# Bandiere del Mondo

Un viaggio interattivo tra gli Stati del mondo: seleziona un continente e scopri bandiere, capitali, abitanti e superficie. App statica in **Vanilla JavaScript**, senza build step, con dati caricati in tempo reale da API REST gratuite.

## Demo

[Apri l'app](https://deluxe-biscochitos-1752f7.netlify.app/)

## Funzionalità

- **Esplorazione per continente** — Europa, Americhe, Asia, Africa, Oceania e Territori dipendenti/oltremare.
- **Schede nazione** — bandiera, capitale, abitanti (formattati in `mln`/`mld`) e superficie (km²).
- **Ricerca istantanea** — filtra per nome o capitale, case- e accent-insensitive, con scorciatoia `⌘K` / `Ctrl K` o `/`.
- **Design glassmorphic** — sfondo animato, tilt 3D delle card, transizioni fluide, layout responsive.
- **Dati live con fallback** — se le API non sono raggiungibili l'app usa un dataset locale e mostra un badge con pulsante *Riprova*.

## Stack

- **HTML5 / CSS3** — struttura semantica, CSS custom properties, Grid, animazioni, media query.
- **JavaScript (Vanilla)** — DOM, eventi, filtro di ricerca, `Intl.DisplayNames` per la localizzazione in italiano.
- **API — [Countries Now](https://countriesnow.space)** — nomi, capitali e codici ISO (gratuita, senza chiave, CORS aperto).
- **API — [World Bank](https://api.worldbank.org)** — abitanti (`SP.POP.TOTL`) e superficie (`AG.SRF.TOTL.K2`).
- **[FlagCDN](https://flagcdn.com)** — bandiere SVG ad alta qualità.
- **[Lucide](https://lucide.dev)** e **Google Fonts (Plus Jakarta Sans)** — icone e tipografia.

> Il classico REST Countries v3.1 è deprecato (v5 richiede una chiave), per questo il progetto usa Countries Now.

## Come funziona il flusso dati

1. Al caricamento vengono eseguite in parallelo:
   ```
   GET https://countriesnow.space/api/v0.1/countries/capital
   GET https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=400&mrnev=1
   GET https://api.worldbank.org/v2/country/all/indicator/AG.SRF.TOTL.K2?format=json&per_page=400&mrnev=1
   ```
2. Le risposte vengono validate e indicizzate per codice ISO-3166 alpha-2 (`iso2`), eliminando i duplicati.
3. Le API restituiscono i dati in inglese: i nomi vengono **localizzati in italiano** con `Intl.DisplayNames` (più un dizionario per le capitali), e ogni codice viene **categorizzato per continente**.
4. Abitanti e superficie vengono uniti dai payload della World Bank; `EXTRA_STATS` copre gli Stati assenti (es. Città del Vaticano).
5. Se la World Bank non risponde, le statistiche mostrano `—`; se le API sono irraggiungibili del tutto, l'app usa il dataset locale `FALLBACK_DATA`.

Ogni stato renderizzato ha la forma `{ nome, capitale, codice, abitanti, superficie }`.

## Avvio in locale

Non serve alcun build step. Apri `index.html` nel browser, oppure usa un piccolo server statico:

```bash
python3 -m http.server 8000
# oppure
npx serve
```

Serve connessione internet per le API e FlagCDN; senza rete l'app continua a funzionare con i dati di fallback.

## Deploy

L'app è online su **Netlify** ed è collegata al repository GitHub: ogni push su `main` pubblica automaticamente in produzione.

```bash
git add -A
git commit -m "descrizione della modifica"
git push
```

La directory pubblicata è la radice del repo (`netlify.toml` → `publish = "."`) senza build command. Essendo un sito statico può essere ospitato anche su GitHub Pages, Vercel o Cloudflare Pages.

## Struttura del progetto

```
.
├── index.html      # Markup e struttura della pagina
├── style.css       # Tema, layout e animazioni (Vanilla CSS)
├── app.js          # Fetch API, logica e rendering
├── netlify.toml    # Configurazione deploy Netlify
└── GEMINI.md       # Documentazione tecnica di dettaglio
```

---

Dati forniti da Countries Now e World Bank · Bandiere da FlagCDN · Sviluppato in Vanilla JS & CSS3 Grid.
