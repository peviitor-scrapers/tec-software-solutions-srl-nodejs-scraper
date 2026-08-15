# Robots.txt Analysis — TEC BambooHR Careers

Sursa: https://tecss.bamboohr.com/robots.txt

## Reguli

```
User-agent: *
Disallow: /jobs/embed.php
Disallow: /jobs/embed2.php
```

## Interpretare

| Cale | Accesibil? | Ce conține |
|---|---|---|
| `/careers/list` | ✅ Allowed | API-ul JSON de la care scraper-ul extrage job-urile |
| `/careers/{id}` | ✅ Allowed | Paginile individuale de job (verificate în teste) |
| `/jobs/embed.php`, `/jobs/embed2.php` | 🚫 Disallowed | Widget-uri embedded — nu le accesăm |

## Recomandare

robots.txt permite căile de job-uri (doar widget-urile embedded sunt disallowed).

- `GET https://tecss.bamboohr.com/careers/list` răspunde cu 200 OK cu `User-Agent` normal, fără autentificare.
- Paginile individuale de job sunt accesibile; noi le verificăm accesibilitatea în teste.
- Scraperul face o singură cerere la list pentru toate job-urile — comportament rezonabil, nu agresiv.

**Concluzie**: Risc minim. `/careers/list` e permis de robots.txt, API-ul e public, iar scraperul e politicos (rate limiting, User-Agent standard).
