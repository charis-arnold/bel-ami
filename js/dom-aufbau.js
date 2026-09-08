/* =============================================================================
   dom-aufbau.js — Aufbau der HTML-Bedienelemente

   Alles, was beim Start EINMAL an DOM-Knoten erzeugt wird: das Kapitelregister
   und die drei Marker-Ebenen der Kapitel-1-Ansicht. Hier wird nur gebaut — die
   Bildschirmposition bekommen die Knoten erst in draw().
============================================================================= */

// Kapitelregister links: Plan/Graph, Leerzeile, "Alle", dann 01–18.
// 01 springt zurück in die Hauptgeschichte statt in einen Kapitel-Zoom.
// Plan/Graph gehen über waehleAnsichtsModus (uebersichtsrouten.js): was sie
// umschalten, hängt davon ab, ob gerade ein Kapitel oder die Übersicht läuft.
function baueKapitelRegister() {
  // Lokal, gehen als Rückgabewert hinaus; gehalten werden sie in sketch.js.
  let modusZeile = document.createElement('div');
  modusZeile.className = 'kapitel-register-modus-zeile';

  let planEintrag = document.createElement('button');
  planEintrag.type = 'button';
  planEintrag.className = 'kapitel-register-modus-item';
  planEintrag.textContent = 'Plan';
  planEintrag.addEventListener('click', () => waehleAnsichtsModus('karte'));
  modusZeile.appendChild(planEintrag);

  let graphEintrag = document.createElement('button');
  graphEintrag.type = 'button';
  graphEintrag.className = 'kapitel-register-modus-item';
  graphEintrag.textContent = 'Graph';
  graphEintrag.addEventListener('click', () => waehleAnsichtsModus('grafik'));
  modusZeile.appendChild(graphEintrag);

  kapitelRegister.appendChild(modusZeile);

  let leerzeile = document.createElement('div');
  leerzeile.className = 'kapitel-register-leerzeile';
  kapitelRegister.appendChild(leerzeile);

  let alleEintrag = document.createElement('button');
  alleEintrag.type = 'button';
  alleEintrag.className = 'kapitel-register-item';
  alleEintrag.textContent = 'Alle';
  alleEintrag.addEventListener('click', springeZurUebersicht);
  kapitelRegister.appendChild(alleEintrag);

  let alleNummern = ['01', '03', ...WEITERE_KAPITEL_NUMMERN].sort();

  alleNummern.forEach(nr => {
    let eintrag = document.createElement('button');
    eintrag.type = 'button';
    eintrag.className = 'kapitel-register-item';
    eintrag.textContent = 'Kapitel ' + parseInt(nr, 10);
    eintrag.addEventListener('click', nr === '01' ? scrolleZuKapitel1 : () => springeZuKapitelZoom(nr));
    kapitelRegister.appendChild(eintrag);
    // Wird nur befüllt, nie neu zugewiesen — die Referenz bleibt stabil.
    kapitelRegisterEintraege[nr] = eintrag;
  });

  return { modusZeile, planEintrag, graphEintrag, leerzeile, alleEintrag };
}

// Ein Markerknoten: Punkt und Beschriftung in einem Wrapper, gleich an die
// Markerebene gehängt. Die drei baue*-Funktionen unterscheiden sich nur in
// Datenquelle, CSS-Klasse, Beschriftungsfeld und Zielliste.
function baueMarkerKnoten(klasse, beschriftung) {
  let wrap = document.createElement('div');
  wrap.className = klasse;
  let dot = document.createElement('div');
  dot.className = 'ortspunkt';
  let label = document.createElement('div');
  label.className = 'label';
  label.textContent = beschriftung;
  wrap.appendChild(dot);
  wrap.appendChild(label);
  kartenMarkierungenEl.appendChild(wrap);
  return wrap;
}

function baueKartenMarkierungen() {
  stationenData.markierungen.filter(m => !m.deaktiviert).forEach(m => {
    let wrap = baueMarkerKnoten('karten-markierung', m.ort);
    markierungsEintraege.push({ el: wrap, lon: m.lon, lat: m.lat, revealIndex: m.revealIndex });
  });
}

function baueStationsMarker() {
  stationenData.route.forEach((station, i) => {
    if (i === 0) return;
    if (station.deaktiviert) return;
    let wrap = baueMarkerKnoten('karten-markierung stations-marker', station.ort);
    stationsMarker.push({ el: wrap, lon: station.lon, lat: station.lat, revealIndex: station.revealIndex });
  });
}

function baueZwischenMarker() {
  (stationenData.zwischenPunkte || []).filter(z => !z.deaktiviert).forEach(z => {
    let wrap = baueMarkerKnoten('karten-markierung zwischen-marker', z.name);
    zwischenMarker.push({ el: wrap, lon: z.lon, lat: z.lat, revealIndex: z.revealIndex });
  });
}
