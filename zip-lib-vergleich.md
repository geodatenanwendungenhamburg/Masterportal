# Vergleich client-seitiger ZIP-Bibliotheken

Stand: 18.05.2026
Zeitraum für Monatsmetriken: 18.04.2026 bis 18.05.2026
Verglichene Bibliotheken: zip.js, fflate, jszip

## Kurzfazit

- **fflate:** *schlank und schnell*, 12 KB gzipped, sehr performant.
- **zip.js:** *umfangreiche Funktionen*, aber größer im Bundle.
- **jszip:** *einfach und etabliert*, aber mit Wartungsbedenken (letztes Release 4 Jahre alt, trotz aktiver PRs).

## Kennzahlenvergleich

| Kriterium | zip.js | fflate | jszip |
|---|---:|---:|---:|
| Lizenz | BSD-3-Clause (MIT-kompatibel) | MIT | MIT oder GPLv3 (wahlweise) |
| Contributors | 35 | 8 | 54 |
| GitHub Stars | 3.8k | 2.9k | 10.3k |
| Active Issues im letzten Monat | 1 | 1 | 0 |
| Closed Issues im letzten Monat | 0 | 12 | 0 |
| Getaggte Fragen auf StackOverflow | 25 | 7 | 390 |
| Package-Größe minifiziert | 171.9 kB | 31.1 kB | 93.8 kB |
| Package-Größe minifiziert + gzip | 69.1 kB | 11.8 kB | 27.3 kB |
| npm-Downloads letzter Monat | 14,392,064 | 165,650,571 | 143,775,756 |

Hinweis: Active Issues hier als aktuell offene, im Monatsfenster erstellte Issues interpretiert.

## Funktionsumfang

### zip.js
- Lesen und Schreiben von ZIP-Archiven mit vielen Extra-Funktionen: große Archive (>4GB, Zip64), Verschlüsselung.

### fflate
- Lesen und Schreiben von ZIP, zusätzlich Unterstützung für deflate, gzip und zlib.
- Sehr schnell und sehr klein, sowohl für Sync- als auch Async/Worker-Pfade.
- API bietet gute Steuerung, nur etwas technischer als die anderen APIs.

### jszip
- Solider Standardumfang für ZIP lesen/schreiben.
- Wartungsbedenken: Letztes Release 4 Jahre alt, trotz aktiver PRs und Issues.
- Wird in CoSI verwendet.

## Qualitative Bewertung (1-10)

Skala: 1 = schwach, 10 = sehr stark, o.A. = keine belastbare Einordnung.

| Kriterium | zip.js | fflate | jszip | Begründung kurz |
|---|---:|---:|---:|---|
| Dokumentation/Community | 8 | 7 | 9 | jszip hat die meiste historische Community-Sichtbarkeit und die umfangreichste Dokumentation; zip.js und fflate sind ausreichend dokumentiert, aber weniger auf StackOverflow präsent. |
| Syntax einfach | 8 | 7 | 9 | jszip ist am einsteigerfreundlichsten; zip.js baut auf modernen API-Konzepten wie Streams auf; fflate ist für Standardfälle ausreichend einfach, nur etwas weniger "Syntax-Zucker" für TypedArrays o.ä. |
| Nachhaltigkeit (Zukunftsfähigkeit) | 8 | 9 | 6 | zip.js und fflate werden aktiv weiterentwickelt; fflate hat zusätzlich sehr hohe Verbreitung (npm-Downloads) bei schlanker Architektur. jszip ist bedenklich wegen fehlender Releases seit Jahren. |
| Universalität und Stabilität (inkl. Package-Größe) | 8 | 9 | 6 | fflate ist deutlich kleiner (11,8 kB gzipped) und stabil; zip.js hat umfangreiche Funktionalität, aber groß (69,1 kB); jszip ist mittelgroß (27,3 kB), aber als einzige der drei Libraries mit zusätzlichen Dependencies, was Stabilität und Wartbarkeit verschlechtern kann. |

## Empfehlung

1. **fflate**
- Am passendsten für die aktuellen Anforderungen im StoryCreator (Lesen/Schreiben + kleine Bundle-Größe).
- Weit verbreitet und aktiv gepflegt.

2. **zip.js**
- Großer Funktionsumfang und aktive Weiterentwicklung.
- Empfehlenswert, wenn später erweiterte Features (z.B. Verschlüsslung, große Archive) wichtiger werden als Bundle-Größe.

3. **jszip**
- Gute Dokumentation und hohe (historische) Sichtbarkeit auf StackOverflow.
- Einfache Verwendung
- Hohe Verbreitung, aber erhebliche Wartungsbedenken aufgrund des fehlenden Releases seit 4 Jahren, trotz aktiver PRs und Issues.
- Als einzige verglichene Library mit zusätzlichen Runtime-Dependencies, was das Risiko in Stabilität und Wartbarkeit erhöht.

