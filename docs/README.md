# job_seeker_ro_spider

**job_seeker_ro_spider** — scraper pentru job-urile TEC SOFTWARE SOLUTIONS SRL din România.

Extrage anunțurile de pe [TEC Agency Careers](https://tecss.bamboohr.com/careers/) și le publică în [peviitor.ro](https://peviitor.ro) prin API-ul Peviitor.

## Identificare

Toate request-urile HTTP folosesc User-Agent-ul:

```
job_seeker_ro_spider
```

## Ce face

1. **Validează compania** — interoghează API-ul public ANAF ([demoanaf.ro](https://demoanaf.ro)) după CIF-ul 32971419 și verifică:
   - Denumirea oficială: TEC SOFTWARE SOLUTIONS SRL
   - Status: activ/inactiv/radiat
   - Adresa completă din registrul comerțului
2. **Cross-validează cu Peviitor** — verifică existența companiei în API-ul Peviitor
3. **Scrape-uiește job-urile** — extrage lista completă de job-uri din API-ul public BambooHR JSON (`/list`)
4. **Transformă datele** — normalizează locațiile (doar orașe românești), tag-urile (lowercase), workmode-ul (remote/on-site/hybrid)
5. **Stochează prin Peviitor API** — upsert pentru job-uri și datele companiei
6. **Generează docs/jobs.md** — fișier markdown cu informații companie + toate job-urile curente, publicat pe GitHub Pages

## Structură proiect

```
├── scraper/
│   ├── config/company.json         # Sursa unică de adevăr (id, brand, URL-uri)
│   ├── config/company.js           # Loader ESM pentru config/company.json
│   ├── config/scraper.json         # Config scraper (apiBase, apiListPath)
│   ├── index.js                    # Orchestrator principal (BambooHR JSON scraping)
│   ├── company.js                  # Validare companie (ANAF + Peviitor)
│   ├── anaf.js                     # Modul ANAF API
│   ├── api.js                      # Operații Peviitor API (query, upsert, delete)
│   ├── markdown-generator.js       # Generează docs/jobs.md
│   ├── job-validator.js            # Validare job URL (HEAD/content/browser)
│   ├── validate-jobs.js            # Validator deep (CLI)
│   └── demoanaf.js                 # CLI ANAF
├── tmp/company.json                # Cache ANAF (gitignored, TTL 7 zile)
├── company.json                    # Cache ANAF committed (TTL 7 zile)
├── ai/                             # Documentație proiect (INSTRUCTIONS, models, etc.)
├── docs/
│   ├── jobs.md                     # Job-uri generate după fiecare scrape
│   └── test-results/               # Rapoarte teste HTML
├── tests/
│   ├── unit/                       # Teste unitare
│   ├── integration/                # Teste de integrare (ANAF + Peviitor live)
│   ├── e2e/                        # Teste end-to-end (BambooHR JSON real)
│   └── consistency/                # Teste config repo
└── .github/workflows/
    ├── job-seeker-ro-spider.yml    # Rulează zilnic la 6 AM UTC
    ├── automation-testing.yml      # Teste automate la fiecare push/PR
    └── job-recovery-from-disaster.yml  # Restaurare company core
```

## API-uri folosite

| API | URL | Autentificare |
|---|---|---|
 BambooHR Jobs | `https://tecss.bamboohr.com/careers/list` | Public (JSON) 
| ANAF (demoanaf) | `https://demoanaf.ro/api/...` | Public |
| ANOFM | `https://mediere.anofm.ro/api/entity/vw_public_job_posting` | Public |
| Peviitor | `https://api.peviitor.ro/v1` | Public (fără auth) |

## Robots.txt

BambooHR [robots.txt](https://tecss.bamboohr.com/robots.txt) permite `/careers/list` (doar `/jobs/embed.php`, `/jobs/embed2.php` sunt disallowed). Scraper-ul face o singură cerere la list per scrape.

Pentru analiza completă, vezi [ROBOTS.md](../ai/ROBOTS.md).

## Testare

```bash
# Toate testele
npm test

# Doar unitare
npm run test:unit

# Doar integrare (ANAF live, Peviitor conditional)
npm run test:integration

# Doar E2E (BambooHR JSON real + ANAF + Peviitor)
npm run test:e2e
```

Testele se auto-skip dacă API-urile externe nu sunt disponibile. Nu e nevoie de `SOLR_AUTH` — toate operațiile merg prin Peviitor API.
