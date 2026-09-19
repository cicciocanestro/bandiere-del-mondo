// ==========================================================================
// BANDIERE DEL MONDO — APP PILOTATA DA API REST
// --------------------------------------------------------------------------
// I dati vengono caricati in tempo reale tramite fetch()
// da due API REST gratuite (senza chiave, CORS aperto):
//
//   1. Countries Now (https://countriesnow.space) — nomi, capitali, codici ISO
//   2. World Bank (https://api.worldbank.org)     — abitanti e superficie (km²)
//
// - I nomi italiani vengono generati tramite l'API nativa Intl.DisplayNames.
// - Se un'API non è raggiungibile, l'app ripiega sui dati locali parziali
//   (FALLBACK_DATA) e mostra un avviso.
// ==========================================================================

// --------------------------------------------------------------------------
// CONFIGURAZIONE API REST
// --------------------------------------------------------------------------
const API_URL = "https://countriesnow.space/api/v0.1/countries/capital";

const STATS_POP_URL = "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=400&mrnev=1";
const STATS_AREA_URL = "https://api.worldbank.org/v2/country/all/indicator/AG.SRF.TOTL.K2?format=json&per_page=400&mrnev=1";

const EXTRA_STATS = {
    VA: { abitanti: 764, superficie: 0.49 },
    XK: { superficie: 10887 }
};

// Mappatura ISO -> Continenti (inclusi i Territori)
const CONTINENT_CODES = {
    "Europa": ['AX', 'AL', 'AD', 'AT', 'BY', 'BE', 'BA', 'BG', 'HR', 'CZ', 'DK', 'EE', 'FO', 'FI', 'FR', 'DE', 'GI', 'GR', 'GG', 'VA', 'HU', 'IS', 'IE', 'IM', 'IT', 'JE', 'LV', 'LI', 'LT', 'LU', 'MT', 'MD', 'MC', 'ME', 'NL', 'MK', 'NO', 'PL', 'PT', 'RO', 'RU', 'SM', 'RS', 'SK', 'SI', 'ES', 'SJ', 'SE', 'CH', 'UA', 'GB', 'XK'],
    "Asia": ['AF', 'AM', 'AZ', 'BH', 'BD', 'BT', 'BN', 'KH', 'CN', 'CY', 'GE', 'HK', 'IN', 'ID', 'IR', 'IQ', 'IL', 'JP', 'JO', 'KZ', 'KP', 'KR', 'KW', 'KG', 'LA', 'LB', 'MO', 'MY', 'MV', 'MN', 'MM', 'NP', 'OM', 'PK', 'PS', 'PH', 'QA', 'SA', 'SG', 'LK', 'SY', 'TJ', 'TH', 'TL', 'TR', 'TM', 'AE', 'UZ', 'VN', 'YE', 'TW'],
    "Africa": ['DZ', 'AO', 'BJ', 'BW', 'IO', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD', 'KM', 'CG', 'CD', 'CI', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'TF', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'YT', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RE', 'RW', 'SH', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG', 'EH', 'ZM', 'ZW'],
    "Oceania": ['AS', 'AU', 'CX', 'CC', 'CK', 'FJ', 'PF', 'GU', 'HM', 'KI', 'MH', 'FM', 'NR', 'NC', 'NZ', 'NU', 'NF', 'MP', 'PW', 'PG', 'PN', 'WS', 'SB', 'TK', 'TO', 'TV', 'UM', 'VU', 'WF'],
    "Americhe": ['AI', 'AG', 'AR', 'AW', 'BS', 'BB', 'BZ', 'BM', 'BO', 'BQ', 'BV', 'BR', 'CA', 'KY', 'CL', 'CO', 'CR', 'CU', 'CW', 'DM', 'DO', 'EC', 'SV', 'FK', 'GF', 'GL', 'GD', 'GP', 'GT', 'GY', 'HT', 'HN', 'JM', 'MQ', 'MX', 'MS', 'NI', 'PA', 'PY', 'PE', 'PR', 'BL', 'KN', 'LC', 'MF', 'PM', 'VC', 'SX', 'GS', 'SR', 'TT', 'TC', 'US', 'UY', 'VE', 'VG', 'VI'],
    "Territori": [
        'AW', 'AI', 'AX', 'AS', 'BM', 'VG', 'IO', 'KY', 'FK', 'FO', 
        'GF', 'PF', 'TF', 'GI', 'GL', 'GP', 'GU', 'HK', 'MO', 'MQ', 
        'YT', 'MS', 'NC', 'NU', 'NF', 'MP', 'PN', 'PR', 'RE', 'BL', 
        'SH', 'MF', 'PM', 'SX', 'GS', 'TC', 'VI', 'WF', 'EH', 'CX', 
        'CC', 'HM', 'UM', 'SJ', 'AQ', 'BV', 'CW', 'BQ', 'JE', 'GG', 'IM'
    ]
};

// I codici dei territori da escludere dai continenti principali per evitare duplicati
const TERRITORY_CODES_SET = new Set(CONTINENT_CODES["Territori"]);

// Filtriamo i territori dai continenti principali per evitare duplicati
Object.keys(CONTINENT_CODES).forEach(continent => {
    if (continent !== "Territori") {
        CONTINENT_CODES[continent] = CONTINENT_CODES[continent].filter(code => !TERRITORY_CODES_SET.has(code));
    }
});

const CONTINENT_INFO = [
    { id: "Europa", icon: "euro", desc: "Scopri il Vecchio Continente" },
    { id: "Americhe", icon: "earth", desc: "Nord, Centro e Sud America" },
    { id: "Asia", icon: "mountain-snow", desc: "Il continente più vasto" },
    { id: "Africa", icon: "sun", desc: "Culla dell'umanità" },
    { id: "Oceania", icon: "waves", desc: "Tra isole e oceani" },
    { id: "Territori", icon: "map", desc: "Territori dipendenti e oltremare" }
];

const ITALIAN_CAPITALS = {
    BE: "Bruxelles", HR: "Zagabria", DK: "Copenaghen", FR: "Parigi",
    DE: "Berlino", GR: "Atene", IE: "Dublino", IS: "Reykjavík",
    IT: "Roma", LU: "Lussemburgo", MT: "La Valletta", MD: "Chișinău",
    PL: "Varsavia", PT: "Lisbona", GB: "Londra", CZ: "Praga",
    RO: "Bucarest", RU: "Mosca", RS: "Belgrado", SI: "Lubiana",
    SE: "Stoccolma", CH: "Berna", VA: "Città del Vaticano"
};

// Fallback (rimasto concentrato sull'Europa come dataset di base offline)
const FALLBACK_DATA = [
    { nome: "Italia", capitale: "Roma", codice: "it", abitanti: 58915656, superficie: 302070 },
    { nome: "Francia", capitale: "Parigi", codice: "fr", abitanti: 68720337, superficie: 606410 },
    { nome: "Spagna", capitale: "Madrid", codice: "es", abitanti: 49355143, superficie: 505976 },
    { nome: "Germania", capitale: "Berlino", codice: "de", abitanti: 83491249, superficie: 357680 },
    { nome: "Giappone", capitale: "Tokyo", codice: "jp", abitanti: 125100000, superficie: 377975 },
    { nome: "Stati Uniti", capitale: "Washington, D.C.", codice: "us", abitanti: 331900000, superficie: 9833517 },
    { nome: "Australia", capitale: "Canberra", codice: "au", abitanti: 25690000, superficie: 7692024 },
    { nome: "Sudafrica", capitale: "Pretoria", codice: "za", abitanti: 60140000, superficie: 1221037 }
];

// Traduzione nativa dei nomi degli Stati
const regionNames = new Intl.DisplayNames(['it'], { type: 'region' });

function getItalianName(isoCode, defaultName) {
    try {
        if (isoCode === 'XK') return "Kosovo"; // XK non standard in Intl
        return regionNames.of(isoCode) || defaultName;
    } catch {
        return defaultName;
    }
}

// ==========================================================================
// LOGICA API
// ==========================================================================
async function fetchCountriesFromAPI() {
    const response = await fetch(API_URL, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Errore HTTP ${response.status} dall'API REST`);

    const payload = await response.json();
    if (!payload || payload.error || !Array.isArray(payload.data)) {
        throw new Error("Risposta API REST non valida");
    }

    // Deduplica i risultati: l'API a volte restituisce duplicati (es. due record per "VA")
    const uniqueCountries = new Map();
    
    payload.data.forEach(c => {
        if (c.iso2 && !uniqueCountries.has(c.iso2)) {
            uniqueCountries.set(c.iso2, c);
        }
    });

    const countries = Array.from(uniqueCountries.values()).map(c => {
        return {
            nome: getItalianName(c.iso2, c.name),
            capitale: ITALIAN_CAPITALS[c.iso2] || c.capital || "—",
            codice: c.iso2.toLowerCase()
        };
    }).filter(Boolean);

    return countries;
}

async function fetchStatsFromAPI() {
    const stats = new Map();

    // Inseriamo prima i dati di fallback per gli stati non presenti nella World Bank
    Object.entries(EXTRA_STATS).forEach(([code, extra]) => {
        stats.set(code, { ...extra });
    });

    try {
        const [popRes, areaRes] = await Promise.all([
            fetch(STATS_POP_URL),
            fetch(STATS_AREA_URL)
        ]);
        
        if (!popRes.ok || !areaRes.ok) throw new Error("Errore World Bank API");

        const [popPayload, areaPayload] = await Promise.all([popRes.json(), areaRes.json()]);
        const popRows = Array.isArray(popPayload) && popPayload[1] ? popPayload[1] : [];
        const areaRows = Array.isArray(areaPayload) && areaPayload[1] ? areaPayload[1] : [];

        popRows.forEach(r => {
            if (r && r.country && r.country.id && typeof r.value === "number") {
                const entry = stats.get(r.country.id) || {};
                entry.abitanti = Math.round(r.value);
                stats.set(r.country.id, entry);
            }
        });

        areaRows.forEach(r => {
            if (r && r.country && r.country.id && typeof r.value === "number") {
                const entry = stats.get(r.country.id) || {};
                entry.superficie = r.value;
                stats.set(r.country.id, entry);
            }
        });
    } catch (error) {
        console.warn("Impossibile recuperare i dati della World Bank, verranno usati solo i dati parziali (EXTRA_STATS).", error);
    }

    return stats;
}

function formatPopulation(n) {
    if (n === null || n === undefined || Number.isNaN(n)) return "—";
    if (n >= 1e9) return `${(n / 1e9).toLocaleString("it-IT", { maximumFractionDigits: 1 })} mld`;
    if (n >= 1e6) return `${(n / 1e6).toLocaleString("it-IT", { maximumFractionDigits: 1 })} mln`;
    return Math.round(n).toLocaleString("it-IT");
}

function formatArea(n) {
    if (n === null || n === undefined || Number.isNaN(n)) return "—";
    const rounded = n >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
    return `${rounded.toLocaleString("it-IT", { maximumFractionDigits: 1 })} km²`;
}

// ==========================================================================
// ELEMENTI DEL DOM E STATO
// ==========================================================================
const continentSelector = document.getElementById("continent-selector");
const flagsGrid = document.getElementById("flags-grid");
const searchWrapper = document.getElementById("search-wrapper");
const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search");
const backBtn = document.getElementById("back-btn");
const activeCountEl = document.getElementById("active-count");
const totalCountEl = document.getElementById("total-count");
const sourceBadge = document.getElementById("data-source-badge");
const sourceBadgeText = document.getElementById("data-source-text");
const retryBtn = document.getElementById("retry-fetch");
const mainTitle = document.getElementById("main-title");
const mainSubtitle = document.getElementById("main-subtitle");

let globalCountries = []; // Tutti gli stati scaricati dall'API
let currentContinentCountries = []; // Gli stati del continente selezionato
let activeContinent = null; // Il continente attualmente visualizzato

// ==========================================================================
// INIZIALIZZAZIONE & RENDERING
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Configura i listener degli eventi
    searchInput.addEventListener("input", handleSearch);
    clearSearchBtn.addEventListener("click", clearSearch);
    backBtn.addEventListener("click", showContinentsView);
    retryBtn.addEventListener("click", () => {
        clearSearch();
        loadGlobalData();
    });

    document.addEventListener("click", () => {
        document.querySelectorAll(".country-card").forEach(c => c.classList.remove("active"));
    });

    initCardTilt();
    setupKeyboardShortcuts();

    // Avvia il precaricamento silenzioso dei dati di tutto il mondo
    loadGlobalData();
});

async function loadGlobalData() {
    try {
        const [countries, stats] = await Promise.all([
            fetchCountriesFromAPI(),
            fetchStatsFromAPI().catch(() => null)
        ]);

        globalCountries = countries.map(country => {
            const code = country.codice.toUpperCase();
            const s = stats ? stats.get(code) : null;
            return {
                ...country,
                abitanti: s && s.abitanti !== undefined ? s.abitanti : null,
                superficie: s && s.superficie !== undefined ? s.superficie : null
            };
        });
        showSourceBadge("online");
    } catch (error) {
        console.error("API REST non raggiungibile, uso i dati locali:", error);
        globalCountries = FALLBACK_DATA;
        showSourceBadge("offline");
    }

    // Renderizza i bottoni/card dei continenti
    renderContinents();
    if (activeContinent) {
        selectContinent(activeContinent);
    }
}

function renderContinents() {
    continentSelector.innerHTML = "";
    CONTINENT_INFO.forEach((c, index) => {
        const card = document.createElement("div");
        card.className = "continent-card";
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.innerHTML = `
            <div class="continent-icon-wrapper">
                <i data-lucide="${c.icon}"></i>
            </div>
            <h2 class="continent-title">${c.id}</h2>
            <p class="continent-desc">${c.desc}</p>
        `;
        
        card.addEventListener("click", () => selectContinent(c.id));
        continentSelector.appendChild(card);
    });
    
    if (window.lucide) window.lucide.createIcons();
}

function selectContinent(continentId) {
    activeContinent = continentId;
    
    // Filtra la lista globale in base ai codici del continente
    const codes = CONTINENT_CODES[continentId] || [];
    currentContinentCountries = globalCountries
        .filter(c => codes.includes(c.codice.toUpperCase()) || codes.length === 0)
        .sort((a, b) => a.nome.localeCompare(b.nome, "it"));
    
    // Se siamo in fallback e non ci sono risultati per questo continente
    if (currentContinentCountries.length === 0 && globalCountries === FALLBACK_DATA) {
        currentContinentCountries = globalCountries; // Mostra fallback
    }
    
    // Aggiorna UI
    mainTitle.textContent = `Bandiere: ${continentId}`;
    mainSubtitle.style.display = "none";
    continentSelector.hidden = true;
    flagsGrid.hidden = false;
    searchWrapper.hidden = false;
    
    // Renderizza
    animateCount(totalCountEl, currentContinentCountries.length);
    clearSearch();
}

function showContinentsView() {
    activeContinent = null;
    mainTitle.textContent = "Bandiere del Mondo";
    mainSubtitle.style.display = "block";
    continentSelector.hidden = false;
    flagsGrid.hidden = true;
    searchWrapper.hidden = true;
}

// ==========================================================================
// MICRO-INTERAZIONI
// ==========================================================================
function initCardTilt() {
    const canTilt = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canTilt) return;

    let currentTiltedCard = null;

    flagsGrid.addEventListener("mousemove", (e) => {
        const card = e.target.closest(".country-card");
        
        if (currentTiltedCard && currentTiltedCard !== card) {
            const oldTilt = currentTiltedCard.querySelector(".card-tilt");
            if (oldTilt) oldTilt.style.transform = "";
        }
        
        currentTiltedCard = card;

        if (!card) return;

        const tilt = card.querySelector(".card-tilt");
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        const rotateX = (-py * 8).toFixed(2);
        const rotateY = (px * 10).toFixed(2);
        if(tilt) tilt.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    flagsGrid.addEventListener("mouseleave", () => {
        if (currentTiltedCard) {
            const tilt = currentTiltedCard.querySelector(".card-tilt");
            if (tilt) tilt.style.transform = "";
            currentTiltedCard = null;
        }
    });
}

function animateCount(el, target, duration = 600) {
    const from = parseInt(el.textContent, 10) || 0;
    if (from === target) return;

    const start = performance.now();
    const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(from + (target - from) * eased);
        if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

function setupKeyboardShortcuts() {
    const kbdHint = document.getElementById("kbd-hint");
    if (kbdHint) {
        const isMac = /Mac|iPhone|iPad/.test(navigator.platform || "");
        kbdHint.innerHTML = isMac ? '<span class="kbd-key">⌘</span>K' : "Ctrl K";
    }

    document.addEventListener("keydown", (e) => {
        if (!searchWrapper.hidden) {
            const target = document.activeElement;
            const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");

            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            } else if (e.key === "/" && !isTyping) {
                e.preventDefault();
                searchInput.focus();
            }
        }
    });
}

// ==========================================================================
// RENDERING CARD
// ==========================================================================
function renderCountries(countries) {
    flagsGrid.innerHTML = "";

    if (countries.length === 0) {
        renderNoResults();
        animateCount(activeCountEl, 0);
        return;
    }

    animateCount(activeCountEl, countries.length);

    countries.forEach((country, index) => {
        const card = document.createElement("article");
        card.className = "country-card";
        card.style.animationDelay = `${(index % 20) * 0.02}s`; // Limitato il delay massimo

        const flagUrl = `https://flagcdn.com/${country.codice}.svg`;

        card.innerHTML = `
            <div class="country-code-badge">${country.codice}</div>
            <div class="card-tilt">
                <div class="flag-wrapper">
                    <img
                        src="${flagUrl}"
                        alt="Bandiera di ${country.nome}"
                        class="flag-img"
                        loading="lazy"
                        onerror="this.src='https://placehold.co/300x200/1e293b/ffffff?text=${encodeURIComponent(country.nome)}'"
                    >
                </div>
                <div class="info-overlay">
                    <h2 class="country-name">${country.nome}</h2>
                    <div class="capital-info">
                        <i data-lucide="map-pin"></i>
                        <span>Capitale: ${country.capitale}</span>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-row">
                        <i data-lucide="users" class="stat-icon"></i>
                        <span class="stat-label">Abitanti</span>
                        <span class="stat-value">${formatPopulation(country.abitanti)}</span>
                    </div>
                    <div class="stat-row">
                        <i data-lucide="ruler" class="stat-icon"></i>
                        <span class="stat-label">Superficie</span>
                        <span class="stat-value">${formatArea(country.superficie)}</span>
                    </div>
                </div>
            </div>
        `;

        card.addEventListener("click", (e) => {
            document.querySelectorAll(".country-card").forEach(c => {
                if (c !== card) c.classList.remove("active");
            });
            card.classList.toggle("active");
            e.stopPropagation();
        });

        flagsGrid.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
}

function renderNoResults() {
    flagsGrid.innerHTML = `
        <div class="no-results">
            <i data-lucide="compass" class="no-results-icon"></i>
            <h3>Nessuno stato trovato</h3>
            <p>Prova a digitare un nome diverso o controlla l'ortografia.</p>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();
}

// ==========================================================================
// BADGE E RICERCA
// ==========================================================================
function showSourceBadge(mode) {
    sourceBadge.classList.toggle("online", mode === "online");
    sourceBadge.classList.toggle("offline", mode === "offline");
    sourceBadgeText.textContent = mode === "online" ? "Dati live dall'API REST" : "API non raggiungibile — dati locali";
    retryBtn.hidden = mode === "online";
    sourceBadge.hidden = false;
    if (window.lucide) window.lucide.createIcons();
}

function hideSourceBadge() {
    sourceBadge.hidden = true;
}

function normalizeText(text) {
    if (!text) return "";
    return String(text).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function applySearch() {
    const query = normalizeText(searchInput.value.trim());
    if (query.length === 0) {
        renderCountries(currentContinentCountries);
        return;
    }
    const filtered = currentContinentCountries.filter(country => {
        return normalizeText(country.nome).includes(query) ||
               normalizeText(country.capitale).includes(query);
    });
    renderCountries(filtered);
}

function handleSearch() {
    clearSearchBtn.style.display = searchInput.value.trim().length > 0 ? "flex" : "none";
    applySearch();
}

function clearSearch() {
    searchInput.value = "";
    clearSearchBtn.style.display = "none";
    applySearch();
}
