# Bel-Ami v2

Dieses Projekt visualisiert die Route von Georges Duroy aus «Bel-Ami» als generative Kartografie. Die Struktur ist bewusst schlank gehalten:

- Darstellung: index.html, style.css, js/sketch.js
- Datenaufbereitung: js/datenbereinigung.js
- Datenquellen: json/kapitelXX-stationen.json, json/kapitel-routen-uebersicht.json, json/kreisvergleich-orte.json
- Optional: js/sonifikation.js und json/kapitel01-sonifikation.json

Die Arbeit folgt einem CAS-Setup: klar, reduziert und nachvollziehbar.

## Ordnerstruktur
- js/: die zwölf Skripte, in der Ladereihenfolge aus index.html
- json/: die Eingangsdaten der Visualisierung, dazu zwei Artefakte der Pipeline (kreisvergleich-orte.json, kapitel01-sonifikation.json), die der Browser nicht lädt
- bilder-karten/: die Kartenbilder und ihre Georeferenzen (kapitelXX-bbox.json)
- docs/: Architektur, Logs und die Farbtafel
- data-prep/: Textgrundlagen und Verarbeitungsschritte (Python-Pipeline)

