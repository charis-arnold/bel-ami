# Topografie der Gefühle

Eine literarische Kartografie von Guy de Maupassants «Bel-Ami» (1885).
Projektarbeit im CAS Generative Data Design.

Das Projekt annotiert den Romantext mit der Claude API und legt die
emotionale und sensorische Erfahrung der Hauptfigur Georges Duroy als
Scrollytelling auf einen Pariser Stadtplan. Beim Scrollen wächst Duroys Route
Kapitel für Kapitel; jeder Ort, an dem er etwas empfindet, wird zu einem
Kreisdiagramm, dessen Grösse mit jeder Gefühlsäusserung an diesem Ort
zunimmt. Eine zweite Ansicht («Graph») stellt dieselben Orte als waagrechte
Zeitleiste dar und spielt sie als Tonstück ab.

Zwei Teile, die unabhängig voneinander laufen:

- **Datenaufbereitung** (Python, `data-prep/`): Rohtext → Annotation →
  Quantifizierung → Geocodierung → Routen → kuratierte Kapiteldaten.
- **Darstellung** (Browser, Projektstamm): `index.html` plus zwölf
  p5.js-Skripte in `js/`, die die fertigen JSON-Dateien aus `json/` laden.
  Die Darstellung ruft die Python-Pipeline nie auf; sie liest nur deren
  Ergebnis.

Wer nur die Visualisierung ansehen will, braucht Python nicht — siehe
[Setup](#setup--installation).

> **Verhältnis zum Factsheet.** Das Projekt-Factsheet beschreibt den
> gestalterischen Stand. Diese Datei beschreibt den Code-Stand und weicht an
> einigen Stellen bewusst davon ab; die Abweichungen sind jeweils an Ort und
> Stelle vermerkt.

---

## Datengrundlage

| | |
|---|---|
| Text | Guy de Maupassant, «Bel-Ami» (1885) |
| Übersetzung | Fürst N. Obolensky, Schreitersche Verlagsbuchhandlung Berlin |
| Bezug | Projekt Gutenberg |
| Umfang | 18 Kapitel als Rohtext, zusammen rund 1,02 Mio. Zeichen |
| Ablage | `data-prep/01 texte/kapitel-XX-belami-maupassant.txt` |

`kapitel-00-belami-maupassant.txt` enthält nur Titelei und Verlagsanzeige und
gehört nicht zur Auswertung. **Achtung:** `befehl-01-annotieren.py` ohne
Argument verarbeitet jede Datei, die auf `kapitel-` beginnt — also auch
Kapitel 00. Beim Gesamtlauf die Kapitelnummern deshalb explizit angeben.

### Bestand

Zahlen aus den 18 Dateien in `json/`, also aus dem Stand, den der Browser
tatsächlich zeichnet:

| Grösse | Wert |
|---|---|
| Annotationen | 2902 |
| Routenpunkte | 3017 |
| Annotationen mit Wirkungsrichtung (Kategorie F) | 957 |
| davon negativ / positiv / neutral bewertet | 582 / 332 / 100 |
| ohne Valenz (Tags ohne erlebbare Qualität) | 1888 |
| unterschiedliche Ortsbezeichnungen (`ortBasis`) | 118 |
| Anteil der zehn häufigsten Orte | 58,2 % |

Der Rohstand vor der Kuratierung liegt höher: `data-prep/03 output/` enthält
3374 Annotationen. Die Differenz entsteht beim Zusammenlegen von
Sammelpunkten und beim Deaktivieren von Stellen (Feld `deaktiviert`).

Das Factsheet nennt 947 Stellen mit Wirkungsrichtung; gezählt sind es 957,
davon 956 in den drei offiziellen Richtungen und eine im Sondertyp
`persoenliche_sehnsucht`.

---

## Annotationsschema

Das vollständige Schema steht als Prompt in
`data-prep/02 verarbeitungsskripte/befehl-01-annotieren.py` (Konstante
`SCHEMA_PROMPT`). Es ist die einzige Quelle — es gibt keine separate
Schema-Datei.

### Perspektive

Pflichtfeld, genau ein Wert pro Annotation. Kein Tag, sondern ein eigenes
Feld.

- `figur` — Duroy nimmt wahr, fühlt oder erlebt, von innen.
- `erzaehler` — Maupassant beschreibt von aussen.

Direkte Rede und Wahrnehmung anderer Figuren werden nicht annotiert.

### Kategorien A–E: die Inhalts-Tags

Fünfzehn Tags, vergeben im Array `tags`. Eine Textstelle kann mehrere
Annotationen und eine Annotation mehrere Tags haben.

| | Kategorie | Tags |
|---|---|---|
| A | Figur und Bewegung | `george_duroy`, `move` |
| B | Raum und Ort | `location`, `space`, `historical` |
| C | Sensorische Qualitäten | `material`, `smell`, `sound` |
| D | Zeit und Wetter | `time`, `weather` |
| E | Stimmung und Emotion | `atmosphere`, `social`, `mood`, `koerper_als_akteur`, `location_erinnerung` |

`location` und `historical` sind immer `erzaehler`, die Tags aus A immer
`figur`. `location_erinnerung` hat drei Untertypen: `erinnerung`,
`persoenliche_sehnsucht` und `historisch-politisch`.

Das Factsheet spricht von 20 Inhalts-Tags. Im Code sind es 15 Tags; auf 20
kommt man erst, wenn man die drei Untertypen und die beiden Perspektiven
mitzählt.

### Kategorie F: Topografie der Gefühle

Die namengebende Kategorie ist **kein Tag**, sondern das Feld `richtung` im
Objekt `raum_emotion`. Sie beantwortet, in welche Richtung Ort und Gefühl
aufeinander wirken:

| Wert | Bedeutung | Anzahl | Darstellung |
|---|---|---|---|
| `ort_loest_emotion_aus` | Der Raum löst das Gefühl aus | 710 | Vibraphon Quinte, kleiner Punkt |
| `emotion_faerbt_raum` | Das Gefühl färbt die Raumwahrnehmung | 146 | Vibraphon Terz, mittlerer Punkt |
| `koerper_als_sensor` | Der Körper ist der Wahrnehmungsmodus | 100 | Vibraphon Grundton, grosser Punkt |

Das Verhältnis ist das inhaltliche Ergebnis des Projekts: In drei von vier
Fällen geht die Wirkung vom Ort aus.

Die Tonstufen stehen in `ELEMENT_FWERT_GRAD`
([js/sonifikation.js](js/sonifikation.js)) als Skalenstufen, also 0 für den
Grundton, 2 für die Terz und 4 für die Quinte. Sie stimmen mit dem Factsheet
überein.

### Quantifizierung

Vergeben von `befehl-02-quantifizieren.py`, nicht im ersten Durchgang.

- **Valenz** `-1` negativ, `0` neutral, `+1` positiv, oder `null`.
- **Intensität** `1` angedeutet, `2` beschrieben, `3` dominant.
- **Gewichtete Valenz** = Valenz × Intensität.

Tags ohne erlebbare Qualität bekommen nur Intensität: `location`,
`historical`, `material`, sowie `social` und `time` in der
Erzählerperspektive. `george_duroy` und `move` bekommen weder noch.

### Drei Farbkategorien der Grafik

Die Kreisdiagramme fassen die Tags zu drei Bändern zusammen. Diese Zuordnung
trifft nicht das LLM, sondern deterministisch
`kategorie_fuer_annotation()` in `baue-kapitel-stationen.py`:

| Schlüssel | Band | Klang | Annotationen |
|---|---|---|---|
| `raum_umwelt` | Raum und Umwelt | Marimba | 880 |
| `stimmung_emotion` | Stimmung und Emotion | Harfe | 1052 |
| `gesellschaft_soziales` | Gesellschaft und Soziales | Klavier | 970 |

Die Farben dazu stehen in `KREIS_KATEGORIEN`
([js/datenbereinigung.js:68](js/datenbereinigung.js#L68)) und sind die einzige
Quelle; `CATEGORY_COLORS` wird daraus abgeleitet.

---

## Pipeline

Vier nummerierte Befehlsskripte, danach GeoJSON-Export und Aufbereitung. Die
Skripte lösen ihre Pfade relativ zum eigenen Speicherort auf, lassen sich also
aus jedem Verzeichnis starten. Jedes nimmt Kapitelnummern als Argumente und
verarbeitet ohne Argument alle gefundenen Dateien.

```
01 texte/kapitel-XX-*.txt
        │
        │  befehl-01-annotieren.py          Claude API
        ▼
03 output/kapitel-XX-annotiert.json
        │
        │  befehl-02-quantifizieren.py      Claude API
        ▼
03 output/kapitel-XX-quantifiziert.json
          kapitel-XX-f-verteilung.json
          kapitel-XX-valenz-tags.json
        │
        │  befehl-03-geocodieren.py         Nominatim
        ▼
03 output/kapitel-XX-final.json
        │
        │  befehl-04-routen.py              OSMnx  (schreibt in dieselbe Datei)
        ▼
03 output/kapitel-XX-final.json   + route + poi_labels
        │
        │  belami-pipeline.py               GeoJSON-Export
        ▼
04 geojson.geojson/kapitel-XX.geojson
        │
        │  05 bereinigen/baue-*.py          Kuratierung
        ▼
json/kapitelXX-stationen.json              ← was der Browser lädt
```

### Die vier Befehlsskripte

**`befehl-01-annotieren.py` — Annotation.**
Segmentiert den Kapiteltext an Satzgrenzen in Abschnitte von rund 2000
Zeichen und schickt jeden einzeln mit dem Schema-Prompt an die Claude API.
Gibt pro Annotation Perspektive, Zitat, Tags, eine einsätzige Notiz, ein
Koordinatenobjekt und gegebenenfalls `raum_emotion` zurück. Koordinaten
setzt das Modell nur für eine kleine Liste bekannter Pariser Adressen; alles
andere bleibt `null` mit `geo_unsicher: true`.

**`befehl-02-quantifizieren.py` — Valenz und Intensität.**
Schickt die Annotationen in Paketen zu 15 erneut an die API, diesmal nur mit
`id`, Perspektive, gekürztem Text, Tags und Notiz. Ergänzt die drei
Zahlenfelder und rechnet daraus zwei Auswertungen: die F-Wert-Verteilung je
Ort und die gewichtete Valenz je Tag.

**`befehl-03-geocodieren.py` — Geocodierung.**
Löst Ortsbezeichnungen zu Koordinaten auf. Zuerst gegen eine interne Liste
im Skript — 28 Einträge für 14 Orte, der Rest sind Schreibvarianten —, erst
danach über Nominatim, mit 1,1 s Wartezeit zwischen den Anfragen. Stellen mit `geo_unsicher: true` werden
übersprungen und später über den Kontext interpoliert. Kein API-Key nötig.

**`befehl-04-routen.py` — Fusswege und Beschriftungen.**
Lädt das heutige Pariser Fusswegnetz über OSMnx und berechnet zwischen je
zwei aufeinanderfolgenden `move`-Annotationen den kürzesten Weg. Die Route
wird als Liste von `[lng, lat]` in der Start-Annotation der Etappe abgelegt.
Zusätzlich holt das Skript beschriftbare Strassen, Plätze, Bahnhöfe, Kirchen,
Parks und Denkmäler im Kartenausschnitt, mit eigenem Kontingent je Typ. Das
Skript schreibt in dieselbe `-final.json` zurück, ist also nicht
idempotent-unschädlich — vor einem zweiten Lauf lohnt sich eine Kopie.

Der Cache von OSMnx landet in `data-prep/cache/` und wird von mehreren
Skripten geteilt.

### GeoJSON-Export

`belami-pipeline.py` ist die durchgehende Fassung der Verarbeitung in zwölf
nummerierten Blöcken, von der Paketprüfung über Kartenvorschauen bis zum
GeoJSON-Export. **Sie annotiert nicht selbst** — Block 5 lädt die fertigen
Ergebnisse aus `03 output/`. Praktisch gebraucht wird heute vor allem Block
10, der `04 geojson.geojson/kapitel-XX.geojson` schreibt.

### Kuratierung in `05 bereinigen/`

Hier entsteht, was der Browser lädt. Die Skripte sind Werkzeuge, keine
Kette — sie werden einzeln und gezielt aufgerufen.

| Skript | Aufgabe |
|---|---|
| `baue-kapitel-stationen.py` | Erstentwurf `kapitelXX-stationen.json` aus `-final.json`. Vergibt `category`, legt Annotationen ohne Koordinate auf einen Sammelpunkt je Kapitel. |
| `baue-kapitel-stationen-aus-geojson.py` | Dasselbe, aber aus dem GeoJSON. Bessere Quelle: dort hat fast jede Annotation einen benannten Ort mit Koordinate. |
| `baue-sammelpunkte-handkuriert.py` | Schreibt die von Hand kuratierte Sammelpunkt-Struktur zurück. Kernregel: Die Route steht still, solange die Szene am Ort bleibt, und jede Annotation zählt zu dem Ort, an dem sie gedacht wird, nicht zu dem, von dem sie handelt. |
| `baue-uebersichtsrouten-aus-kapiteln.py` | Baut `kapitel-routen-uebersicht.json`, indem es `routenPfadDetail` aus den Kapiteldateien kopiert. Übersichts- und Kapitelroute können so nicht auseinanderlaufen. |
| `baue-kreisvergleich.py` | Baut `kreisvergleich-orte.json` für acht kapitelübergreifende Orte. |
| `baue-sonifikation.py` | Baut `kapitel01-sonifikation.json` mit den Aggregaten je Station. |
| `rendere-kapitel-karten.py` | Rendert `kapitelXX-karte.png` samt `kapitelXX-bbox.json` über OSMnx. |
| `schneide-kapitelkarten.py` | Schneidet dieselben Ausschnitte stattdessen aus einem georeferenzierten QGIS-Basisbild. Der übliche Weg; Rendern nur noch für Kapitel, deren Route über das Basisbild hinausragt. |
| `ergaenze-orte.py` | Fügt vom Modell übersprungene Textstellen als neue GeoJSON-Features nach. Jede Ergänzung trägt eine Begründung im Skript. |
| `baue-uebersichtsrouten.py` | **Überholt, nicht mehr ausführen.** Baute die Übersichtslinien aus den unkuratierten GeoJSONs; seit der Handkurierung liefen die Linien teils kilometerweit neben der Kapitelroute. Liegt als Dokumentation des früheren Wegs. |

### Ausgabeformat der Kapiteldateien

`json/kapitelXX-stationen.json` hat zehn Schlüssel auf oberster Ebene:
`kapitel`, `route`, `gedanken`, `markierungen`, `routenPunkte`,
`annotationen`, `halteorte`, `zwischenPunkte`, `ortRuns`, `poi_labels`.

Die beiden tragenden sind `annotationen` und `ortRuns`. Eine Annotation sieht
so aus:

```json
{
  "id": 1,
  "text": "Die Kassiererin gab auf sein 5-Francs-Stück das Geld heraus …",
  "revealIndex": 0,
  "ort": "Lokal in der Nähe der Rue Notre-Dame de Lorette",
  "ortBasis": "Lokal in der Nähe der Rue Notre-Dame de Lorette",
  "tags": ["social", "location"],
  "valenz": null,
  "intensitaet": 1,
  "f_wert": null,
  "perspektive": "erzaehler",
  "category": "gesellschaft_soziales",
  "hasFwert": false,
  "fWertType": null,
  "vorRoutenstart": true,
  "station": 0,
  "deaktiviert": true
}
```

`revealIndex` steuert, bei welchem Scrollfortschritt die Annotation
erscheint. `ortBasis` fasst Schreibvarianten desselben Orts zusammen und ist
der Schlüssel, unter dem Kreise wachsen. `ortRuns` hält je Ort die
`bandCounts`, also die Verteilung auf die drei Farbkategorien.

---

## Ordnerstruktur

```
bel-ami/
├── index.html                     Scrollytelling-Seite, lädt die zwölf js-Skripte
├── style.css
├── favicon.svg
│
├── js/                            Zwölf Skripte, Reihenfolge = Reihenfolge in index.html
│   ├── datenbereinigung.js        1 · Datenfunktionen und Konstanten, keine Zeichenaufrufe
│   ├── geo-projektion.js          2 · Bboxen, Projektion lon/lat → Bildschirm
│   ├── kreisgrafik.js             3 · Kreisdiagramme, Legendenaufbau, Register
│   ├── kartendekor.js             4 · Routenzug, Massstab, Fortschrittsleiste
│   ├── ortsveraenderung.js        5 · Ansicht «Ortsvergleich»
│   ├── spine-horizontal.js        6 · Graph-Ansicht und Play-Steuerung
│   ├── fotomarker.js              7 · Foto-Marker und Bild-Popup
│   ├── annotationsbox.js          8 · Positionswahl der Annotationsbox
│   ├── dom-aufbau.js              9 · Kapitelregister und Marker-Ebenen
│   ├── uebersichtsrouten.js      10 · Übersichtsakt und Kapitel-Navigation
│   ├── sketch.js                 11 · Orchestrierung: preload/setup/draw
│   └── sonifikation.js           12 · Tonspur über Strudel
│
├── json/                          Eingangsdaten der Visualisierung
│   ├── kapitel01–18-stationen.json
│   ├── kapitel-routen-uebersicht.json
│   ├── fotomarker.json
│   ├── kreisvergleich-orte.json   Pipeline-Artefakt, wird NICHT geladen
│   └── kapitel01-sonifikation.json  Pipeline-Artefakt, wird NICHT geladen
│
├── bilder-karten/                 Kartenbilder und ihre Georeferenzen
│   ├── paris-startkarte-web.png
│   ├── paris-ueberblickkarte-web.png
│   ├── kapitel01-qgis-karte-web.png
│   └── kapitelXX-karte.png + kapitelXX-bbox.json   (02–18)
│
├── docs/                          Architektur, Protokolle, Farbtafel, Legende
│   ├── architektur.md             Ladereihenfolge, Abhängigkeiten, Konventionen
│   ├── best-practices-review.md   Laufende Prüfung des Codes
│   ├── bugfix-log.md · cleanup-log.md · modularisierung-log.md
│   ├── code-analyse-sketch-js.md  Historische Bestandsaufnahme
│   ├── farbtafel.pdf · Legende.pdf · topografie-der-gefuehle-grafik.pdf
│   └── auftrag-kreisgrafik-ueberarbeitung.md
│
└── data-prep/                     Datenaufbereitung (Python)
    ├── 00 qgis-quellen/           QGIS-Projekte und Exporte
    ├── 01 texte/                  Kapiteltexte als Rohtext
    ├── 02 verarbeitungsskripte/   befehl-01 bis befehl-04
    │   └── korrektur orte/        Variante von befehl-01 mit Zusatzregel
    ├── 03 output/                 Zwischen- und Endstufen je Kapitel
    ├── 04 geojson.geojson/        GeoJSON-Export je Kapitel
    ├── 05 bereinigen/             Kuratierungs- und Kartenskripte
    └── belami-pipeline.py         Durchgehende Fassung in zwölf Blöcken
```

Die 17 `kapitelXX-bbox.json` liegen bewusst neben ihren Bildern in
`bilder-karten/` und nicht in `json/`; die Begründung steht in
[docs/architektur.md](docs/architektur.md).

---

## Setup / Installation

### Nur die Visualisierung ansehen

Kein Build, kein npm, keine Abhängigkeiten ausser den beiden CDN-Skripten.
Ein lokaler Webserver ist trotzdem nötig: p5 lädt JSON und Bilder über
`fetch`, und das scheitert unter `file://` an der Same-Origin-Regel.

```bash
cd "bel-ami"
python3 -m http.server 8000
# http://localhost:8000 im Browser öffnen
```

Ton startet nur per Klick auf «Ton an» — Scrollen zählt im Browser nicht als
Nutzergeste.

### Die Pipeline laufen lassen

Python 3 mit diesen Paketen. Eine `requirements.txt` liegt nicht bei; die
Liste ergibt sich aus den Importen der Skripte.

```bash
pip install anthropic requests osmnx networkx pandas
# zusätzlich nur für belami-pipeline.py:
pip install geopandas shapely rasterio matplotlib
```

| Paket | gebraucht von |
|---|---|
| `anthropic` | befehl-01, befehl-02 |
| `requests` | befehl-03 |
| `osmnx`, `networkx`, `pandas` | befehl-04, `05 bereinigen/` |
| `geopandas`, `shapely`, `rasterio`, `matplotlib` | nur `belami-pipeline.py` |

API-Key für die beiden ersten Schritte:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

Nominatim und OSMnx brauchen keinen Key. Für Nominatim gilt die
Nutzungsbedingung von höchstens einer Anfrage pro Sekunde; `befehl-03`
wartet 1,1 s und schickt einen eigenen User-Agent mit.

---

## Verwendung

Alle vier Skripte nehmen Kapitelnummern mit oder ohne führende Null. Ohne
Argument verarbeiten sie alles, was sie finden.

```bash
cd "data-prep/02 verarbeitungsskripte"

python befehl-01-annotieren.py 03           # nur Kapitel 3
python befehl-02-quantifizieren.py 03
python befehl-03-geocodieren.py 03
python befehl-04-routen.py 03
```

Jedes Skript nennt am Ende den nächsten Schritt. Zwischen den Stufen lohnt
ein Blick in die erzeugte Datei: Der erste Schritt ist der teuerste und der
einzige, der den ganzen Text durch das Modell schickt.

Danach GeoJSON und Kapiteldatei:

```bash
cd "data-prep"
python belami-pipeline.py                   # GeoJSON-Export

cd "05 bereinigen"
python3 baue-kapitel-stationen-aus-geojson.py 03
python3 baue-uebersichtsrouten-aus-kapiteln.py
```

Kartenausschnitt für ein Kapitel:

```bash
python3 schneide-kapitelkarten.py 03        # aus dem QGIS-Basisbild
python3 rendere-kapitel-karten.py 03        # nur wenn die Route darüber hinausragt
```

Ein neues Kapitel erscheint erst in der Visualisierung, wenn seine Nummer in
`WEITERE_KAPITEL_NUMMERN` ([js/sketch.js:26](js/sketch.js#L26)) steht — dort
hängt das Laden in `preload()` daran.

### Kuratieren

Der automatische Erstentwurf ist ausdrücklich grob. Die Verfeinerung —
Sammelpunkte zusammenlegen, Innen und Aussen trennen, Erinnerungen an den
Ort des Denkens binden — passiert von Hand über
`baue-sammelpunkte-handkuriert.py`. Kapitel 1 ist am weitesten kuratiert und
dient als Vorbild für alle anderen.

`korrektur orte/befehl-01-annotieren.py` ist eine Variante des
Annotationsskripts mit einer zusätzlichen Regel: Ein Ort, der nur zum
Vergleich genannt wird, bekommt keinen eigenen `location`-Tag. Nützlich beim
Nachannotieren einzelner Kapitel.

---

## Technischer Stack

**Browser**

| | |
|---|---|
| p5.js 1.9.0 | Canvas, Zeichen-API, Lebenszyklus — über cdnjs |
| Strudel `@strudel/web` 1.0.3 | Klangsynthese — über unpkg |
| Schrift | Source Sans 3 und Source Serif 4 über Google Fonts |

Sonst nichts. **Weder D3.js noch Leaflet sind im Einsatz.** D3 war früher
eingebunden, aus `d3js.org` im Kopf von `index.html`, und wurde an einer
einzigen Stelle benutzt: `d3.group()` in `versetzeKollidierendePunkte()`.
Mit dieser Funktion fiel auch die Abhängigkeit weg, nachzulesen in Schritt 12
von [docs/cleanup-log.md](docs/cleanup-log.md). Das geschah vor dem ersten
Commit dieses Repositorys, die dort genannten Commits liegen nicht in dieser
Historie. In der Python-Pipeline kam D3 nie vor; sie zeichnet ihre
Kontrollkarten mit matplotlib. Die Karten sind statische
PNG-Exporte aus QGIS, und die Projektion von Längen- und Breitengrad auf
Bildschirmpunkte rechnet `lonLatToScreen()` in
[js/geo-projektion.js](js/geo-projektion.js) selbst, per Dreisatz über die
Bbox. Auf dem kleinen Ausschnitt von Paris ist der Unterschied zu Mercator
nicht sichtbar. Es gibt keine Kacheln, keinen Kartenserver und keine
Kartenbibliothek.

Ebenso wenig gibt es ES-Module. Jede der zwölf Dateien ist ein eigenes
`<script>`-Tag, alle Namen liegen im gemeinsamen globalen Scope. Was daraus
folgt — Eindeutigkeit der Top-Level-Namen, die zwei echten
Ladezeit-Abhängigkeiten, die p5-Hooks am `window` — steht ausführlich in
[docs/architektur.md](docs/architektur.md). **Vor jedem Umbau an `js/` diese
Datei lesen.**

**Pipeline**

| | |
|---|---|
| Claude API | Annotation und Quantifizierung, Modell `claude-sonnet-4-6` |
| Nominatim / OpenStreetMap | Geocodierung |
| OSMnx + NetworkX | Fusswegnetz, kürzeste Wege, POI-Beschriftungen |
| QGIS | Kartenexporte, Georeferenz in EPSG:3857 |
| pandas | Auswertung und POI-Auswahl |
| matplotlib, GeoPandas, rasterio | Kontrollkarten in `belami-pipeline.py` |

**Klang**

Drei Instrumente für die drei Gefühlskategorien, ein viertes für die
Wirkungsrichtung; Tonhöhe aus dem Kreisradius. Die Samples kommen von
denselben zwei CDN-Quellen, die auch strudel.cc lädt. Die Tonspur ist
zeitbasiert und läuft synchron zur Play-Animation der Graph-Ansicht, nicht
scrollgekoppelt.

---

## Aktueller Stand

Alle 18 Kapitel sind annotiert, quantifiziert, geocodiert, beroutet und
kuratiert. Die Visualisierung lädt alle 18. Kapitel 1 hat eine eigene
QGIS-Karte mit fest verdrahteter Bbox, die Kapitel 2 bis 18 je ein
Kartenbild mit eigener Bbox-Datei und zusätzlich die Graph-Ansicht.

**Offene Punkte und Fallstricke:**

- **Modellversion.** `MODELL = "claude-sonnet-4-6"` steht doppelt, in
  `befehl-01` und `befehl-02`. Die ID ist gültig, aber die Vorgänger-
  generation; aktuell wäre `claude-sonnet-5`. Wer neu annotiert, ändert
  beide Stellen und rechnet mit leicht anderen Ergebnissen.
- **Keine `requirements.txt`, kein `.gitignore`.** Die Paketliste oben ist
  aus den Importen zusammengetragen, und `.DS_Store` liegt im Repository.
- **`befehl-04-routen.py` schreibt in seine eigene Eingabedatei.** Vor einem
  Wiederholungslauf eine Kopie anlegen.
- **`baue-uebersichtsrouten.py` ist überholt** und liegt nur noch als
  Dokumentation des früheren Wegs.

**Drei Dinge in `docs/`, die absichtlich so sind — nicht «aktualisieren»:**

1. `farbtafel.pdf` enthält die alte Goldreihe als *Korrekturanweisung* unter
   der Überschrift «Legende.pdf — was nachzuziehen ist», nicht als Fehler.
   Die gültige Palette steht daneben.
2. `code-analyse-sketch-js.md` beschreibt eine monolithische `sketch.js`,
   die es in diesem Repository nie gab. Das Dokument ist der Plan, aus dem
   die heutige Dateistruktur entstand. Seine Zeilenverweise sind bewusst
   reiner Text statt Links — nicht neu verlinken.
3. `Legende.pdf` wurde als inkrementeller PDF-Nachtrag gepatcht. Die
   InDesign-Quelldatei liegt nicht im Repository; ein neuer Export macht den
   Patch zunichte.

---

## Credits und Quellen

**Text** — Guy de Maupassant, «Bel-Ami», 1885. Deutsche Übersetzung von
Fürst N. Obolensky, Schreitersche Verlagsbuchhandlung Berlin. Bezogen über
Projekt Gutenberg.

**Fotografien** — DHAAP, Photographies de la Commission du Vieux Paris.
Département d'histoire de l'architecture et d'archéologie, Direction des
Affaires culturelles, Commission du Vieux Paris, 11 rue du Pré, 75018 Paris.
Kontakt: Pauline Rossi, Chargée d'études, Responsable des Archives de la
Commission du Vieux Paris. Die Bilder werden zur Laufzeit von der
Nakala-API geladen, nicht im Repository gehalten.

**Geodaten** — OpenStreetMap-Mitwirkende, über Nominatim für die
Ortsauflösung und OSMnx für das Fusswegnetz. Kartenbilder als eigene
QGIS-Exporte.

**Software** — p5.js, Strudel, Anthropic Claude API, OSMnx, NetworkX,
pandas, GeoPandas, QGIS.

**Schrift** — Source Sans 3 und Source Serif 4 über Google Fonts.

---

CAS Generative Data Design · Charis Arnold · September 2026
