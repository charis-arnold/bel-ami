/* =============================================================================
   ortsveraenderung.js — Ansicht "Ortsvergleich"

   Sieben kapitelübergreifende Orte auf einer waagrechten Linie, in der
   Reihenfolge ihres ersten Auftretens im Buch. Der Play-Knopf zählt die
   Kapitel 1..18 durch: die Orte kommen nacheinander dazu, ihre Kreise wachsen.
   Aufbau wie die Kapitel-Spine, siehe spine-horizontal.js.
============================================================================= */

// --- Vergleichsknoten und Durchlauf ---------------------------------------

const VERGLEICHS_KNOTEN = [
  { label: 'Redaktion La Vie Française',
    text: 'Zwölf Kapitel führen hierher. Hier wird geschrieben, was Paris für wahr hält — und hier misst sich, wer er geworden ist. Der einzige Ort, der ihn weder hebt noch senkt.',
    namen: ['Redaktion La Vie Française'] },
  { label: 'Wohnung Duroy/Madeleine (17 Rue Fontaine)',
    text: 'Er zieht in die Räume des Toten, an seinen Schreibtisch, zu seiner Frau. Was als Erbe beginnt, wird zur Zelle — am Ende zählt dieser Ort nur noch Verletzungen.',
    namen: ['Wohnung Forestier (17 Rue Fontaine)', 'Wohnung Duroy/Madeleine (17 Rue Fontaine)'] },
  { label: 'Rue Constantinople 127',
    text: 'Die Wohnung, die niemand kennt. Erst gehört sie der Lust, dann der Berechnung — dieselben vier Wände, in denen er Clotilde empfängt und Madeleine stellt.',
    namen: ['Rue Constantinople 127', 'Wohnung Du Roy (Rue Constantinople 127)'] },
  { label: 'Palais Walter, Faubourg Saint-Honoré',
    text: 'Der Gipfel, auf den er zielt, zieht selbst um — vom Boulevard ins Palais. Hier wird das Vermögen gemacht, das ihn trägt, und hier bricht Frau Walter vor einem Bild zusammen, das sein Gesicht hat.',
    namen: ['Boulevard Malesherbes (Walters Haus)', 'Palais Walter, Faubourg Saint-Honoré'] },
  { label: 'Georges Duroys Wohnung (Rue Boursault)',
    text: 'Ein Zimmer, das nach Armut riecht. Kein Ort des Romans wird härter empfunden — und keiner verschwindet so vollständig: Nach Kapitel 7 kehrt er nie zurück.',
    namen: ['Georges Duroys Wohnung (Rue Boursault)'] },
  { label: 'Place de la Madeleine',
    text: 'Am Anfang geht er hungrig an den Terrassen vorbei und zählt seine Münzen. Am Ende läutet dieselbe Kirche für seine Hochzeit. Kein zweiter Ort kehrt sein Vorzeichen so vollständig um.',
    namen: ['Place de la Madeleine', 'Église de la Madeleine, Paris'] },
  // Sammelt die kapitelweise verschiedenen Boulevard-Namen zu einer Achse.
  // Label ist als einziges kein Kapitelname — die Gruppe hat keinen.
  { label: 'Grands Boulevards',
    text: 'Die Bühne der Stadt. Erst steht er davor und sieht zu, wie andere sitzen; später sitzt er selbst, bestellt und wird gesehen.',
    namen: ['Boulevard des Italiens', 'Boulevard des Capucines', 'Boulevard Poissonnière',
      'Café Riche, Boulevard des Italiens, Paris', 'Café Tortoni, Boulevard des Italiens',
      'Café am Boulevard (Näherung Boulevard Poissonière)', 'Café-Chantant am Boulevard des Capucines',
      'Théâtre du Vaudeville, Boulevard des Capucines', 'Juwelierladen am Boulevard des Capucines',
      'Boulevard-Cafés (unterwegs), Paris'] },
];

// Kapitel, die der Play-Knopf durchzählt. Auch spine-horizontal.js rechnet
// damit die Abspieldauer aus.
const OV_KAPITEL_ZAHL = 18;

// --- Layout-Masse ---------------------------------------------------------

// Ränder wie bei der Kapitel-Spine: rechts hält der Rand das Kapitelregister
// frei, links steht gleich viel Luft, damit die Linie mittig im Bild bleibt.
const OV_RAND_LINKS = 200;
const OV_RAND_RECHTS = 200;
const OV_RAND_OBEN = 24;
const OV_RAND_UNTEN = 76;    // Play-Knopf und Fortschrittsbalken
const OV_KREIS_LUFT = 1.06;  // Mindestabstand zwischen benachbarten Kreisen

// Ortsbeschriftung unter dem Kreis, darunter die Kapitelzeile.
const OV_LABEL_MAX_BREITE = 200; // ab dieser Breite wird zweizeilig gesetzt
const OV_LABEL_ZEILE = 15;
const OV_LABEL_ABSTAND = 34;     // Luft zwischen Kreisrand und Beschriftung
const OV_KAPITEL_ABSTAND = 16;   // Luft zwischen Beschriftung und Kapitelzeile
const OV_LABEL_REIHEN_LUFT = 10; // Luft zwischen den beiden Beschriftungsreihen
const OV_TEXT_REIHEN_LUFT = 10;  // dasselbe für die Textblöcke über den Kreisen
// Die Kapitelzeile steht zurückgenommen unter dem Ortsnamen.
const OV_KAPITELZEILE_TINTE = hexZuRgb('#5A5A5A');

// Erläuterungstext ÜBER dem Kreis, Serifenschrift wie die Einstiegstexte.
const OV_TEXT_GROESSE = 11;
const OV_TEXT_ZEILE = 16;
const OV_TEXT_BREITE = 180;      // schmaler als die Spalte, sonst stossen sie an
const OV_TEXT_ABSTAND = 30;      // Luft zwischen Kreisrand und Textblock

// Datenzeile im Stil von .annotation-tag: serifenlos, fett, versal, gesperrt.

// --- Vorberechnete Daten je Knoten ----------------------------------------

// Je Knoten und Kapitel vorberechnet — live wären es 126 Scans pro Frame.
let ovProKapitel = null;    // [knoten][kapitelNr] -> { bandCounts, fwerte }
let ovRohradien = null;     // Endstand-Rohradius je Knoten (ohne Deckel)
let ovErstesKapitel = null; // Kapitelnummer des ersten Auftretens, je Knoten
let ovFilter = null;        // Namensmenge je Knoten, für den Scan im laufenden Kapitel
let ovReihenfolge = null;   // Knotenindizes, nach erstem Auftreten sortiert
let ovElemente = null;      // { annotation, kreis, stand } je Element, aufsteigend
let ovLayout = null;        // { breite, hoehe, startX, abstand, kreisSkala, linienY, Zeilen }

// Bricht einen Fliesstext auf eine Maximalbreite um. Setzt voraus, dass
// Schrift und Grösse gesetzt sind (textWidth misst mit dem aktuellen Zustand).
function ovTextUmbruch(text, maxBreite) {
  let zeilen = [];
  let aktuell = '';
  (text || '').split(' ').forEach(wort => {
    let versuch = aktuell ? aktuell + ' ' + wort : wort;
    if (aktuell && textWidth(versuch) > maxBreite) {
      zeilen.push(aktuell);
      aktuell = wort;
    } else {
      aktuell = versuch;
    }
  });
  if (aktuell) zeilen.push(aktuell);
  return zeilen;
}

// Bricht eine lange Ortsbeschriftung auf zwei Zeilen: vor Klammer, sonst nach
// Komma, sonst am mittigsten Leerzeichen. Schrift muss vorher gesetzt sein.
function ovLabelZeilen(text) {
  if (textWidth(text) <= OV_LABEL_MAX_BREITE) return [text];
  let klammer = text.indexOf('(');
  if (klammer > 0) return [text.slice(0, klammer).trim(), text.slice(klammer).trim()];
  let komma = text.indexOf(',');
  if (komma > 0 && komma < text.length - 1) {
    return [text.slice(0, komma + 1).trim(), text.slice(komma + 1).trim()];
  }
  let mitte = text.length / 2, beste = -1, abstand = Infinity;
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== ' ') continue;
    if (Math.abs(i - mitte) < abstand) { abstand = Math.abs(i - mitte); beste = i; }
  }
  if (beste < 0) return [text];
  return [text.slice(0, beste).trim(), text.slice(beste + 1).trim()];
}

function ovAddiere(ziel, quelle) {
  ['raum_umwelt', 'stimmung_emotion', 'gesellschaft_soziales'].forEach(cat => {
    ['neg', 'pos', 'neutral', 'unrated'].forEach(v => { ziel[cat][v] += quelle[cat][v]; });
  });
}

// Datensatz zu einer Kapitelnummer. Kapitel 1 liegt in stationenData, alle
// anderen kommen über datenFuerKapitel() — hier gebündelt, weil ovBaueDaten()
// und ovStand() beide danach greifen.
function ovDatenFuer(nr) {
  return nr === '01' ? stationenData : datenFuerKapitel(nr);
}

// Alle Kapitelnummern in Erzählreihenfolge.
function ovKapitelNummern() {
  return ['01'].concat(Object.keys(uebersichtsRouten || {}).sort());
}

function ovBaueDaten() {
  if (ovProKapitel) return;
  // [Kapitelnummer, Annotationsindex] des ersten Auftretens, je Knoten.
  let ersteStelle = [];
  ovFilter = VERGLEICHS_KNOTEN.map(k => new Set(k.namen));
  ovProKapitel = VERGLEICHS_KNOTEN.map((k, i) => {
    let filter = ovFilter[i];
    let proKapitel = {};
    ovKapitelNummern().forEach(nr => {
      let daten = ovDatenFuer(nr);
      if (!daten || !daten.annotationen || !daten.annotationen.length) return;
      // Ein Scan für beides. Hier unkritisch: ovBaueDaten() läuft nur einmal.
      let treffer = sammleAnnotationenNachOrtBasis(filter, daten.annotationen.length - 1, daten);

      // ACHTUNG Kapitel ohne Treffer NICHT eintragen: ovStand() setzt sonst
      // seine Kapitelnummer auch für Kapitel, in denen der Ort nicht vorkommt
      // — die Zeile unter dem Kreis nennt dann ein falsches Kapitel.
      if (!treffer.length) return;

      proKapitel[nr] = {
        bandCounts: zaehleBandCounts(treffer),
        fwerte: treffer.filter(a => a.hasFwert),
      };
      if (!ersteStelle[i]) {
        let ersterIndex = daten.annotationen.findIndex(
          a => a.category && filter.has(a.ortBasis || a.ort || ''));
        ersteStelle[i] = [parseInt(nr, 10), ersterIndex];
      }
    });
    return proKapitel;
  });

  ovRohradien = ovProKapitel.map(proKapitel => {
    let summe = leereBandCounts();
    Object.values(proKapitel).forEach(k => ovAddiere(summe, k.bandCounts));
    // Infinity statt des 100px-Deckels — sonst wären alle sieben gleich gross,
    // ihr grösstes Band liegt zwischen 45 und 137 Annotationen. Verkleinert
    // wird gemeinsam über kreisSkala.
    return groessterKreisRadius(summe, Infinity);
  });

  // Reihenfolge auf der Linie: erstes Auftreten im Buch, bei gleichem Kapitel
  // die frühere Annotation. Dadurch ist ovErstesKapitel entlang der Achse
  // aufsteigend — die Orte kommen beim Abspielen von links nach rechts dazu.
  ersteStelle = ersteStelle.map(s => s || [OV_KAPITEL_ZAHL + 1, 0]);
  ovErstesKapitel = ersteStelle.map(s => s[0]);
  ovReihenfolge = VERGLEICHS_KNOTEN.map((_, i) => i).sort((a, b) =>
    ersteStelle[a][0] - ersteStelle[b][0] || ersteStelle[a][1] - ersteStelle[b][1]);

  // Jede Annotation der sieben Orte in Erzählreihenfolge, mit dem Kapitelstand,
  // an dem sie im Bild erscheint. Trägt die Zeitachse (ovStandFuer) und die
  // Klangfolge (ortsvergleichAnnotationen) — eine Liste für beide.
  let rangVon = [];
  ovReihenfolge.forEach((knoten, rang) => { rangVon[knoten] = rang; });
  ovElemente = [];
  ovKapitelNummern().forEach(nr => {
    let daten = ovDatenFuer(nr);
    if (!daten || !daten.annotationen || !daten.annotationen.length) return;
    let zahl = daten.annotationen.length;
    daten.annotationen.forEach((a, ai) => {
      if (!a.category) return;
      let knoten = ovFilter.findIndex(filter => filter.has(a.ortBasis || a.ort || ''));
      if (knoten < 0) return;
      ovElemente.push({
        annotation: a,
        kreis: rangVon[knoten],
        stand: (parseInt(nr, 10) - 1) + ai / Math.max(1, zahl - 1),
      });
    });
  });

  ovLayout = null;
}

// Summe bis Kapitel maxNr, plus die Nummer des letzten Kapitels, in dem der
// Ort vorkam (steht unter dem Kreis). anteil (0..1) sagt, wie weit maxNr selbst
// schon gelesen ist — daran wächst der Kreis innerhalb eines Kapitels.
function ovStand(index, maxNr, anteil) {
  let summe = leereBandCounts();
  let fwerte = [];
  let letztes = null;
  Object.keys(ovProKapitel[index]).sort().forEach(nr => {
    let n = parseInt(nr, 10);
    if (n > maxNr) return;

    // Abgeschlossene Kapitel kommen fertig aus der Vorberechnung.
    if (n < maxNr) {
      let k = ovProKapitel[index][nr];
      ovAddiere(summe, k.bandCounts);
      fwerte = fwerte.concat(k.fwerte);
      letztes = nr;
      return;
    }

    // Laufendes Kapitel: nur bis zur erreichten Annotation. Ein Scan über
    // dieses eine Kapitel je Ort und Frame — die Spine macht denselben Scan
    // je Eintrag, hier sind es sieben statt bis zu 27.
    let daten = ovDatenFuer(nr);
    let bis = Math.round(anteil * (daten.annotationen.length - 1));
    let teil = sammleAnnotationenNachOrtBasis(ovFilter[index], bis, daten);
    if (!teil.length) return;
    ovAddiere(summe, zaehleBandCounts(teil));
    fwerte = fwerte.concat(teil.filter(a => a.hasFwert));
    letztes = nr;
  });
  return { bandCounts: summe, fwerte, letztes };
}


// Play-Fortschritt (0..1) -> Kapitelstand: ein gleich langer Schritt je
// Element, nicht je Kapitel.

// ACHTUNG die Zeit hängt an den Elementen, nicht an der Kapitelskala. Auf die
// Kapitel verteilt lägen 44 % der Laufzeit in Lücken ohne Beitrag, und kurze
// Besuche blitzen auf — Madeleines Besuch in Kapitel 1 dauerte 0.84 s statt
// 1.66 s. Reihenfolge und Zuordnung bleiben unberührt. Die Klangfolge zählt
// über denselben Rang, Bild und Ton bleiben synchron.
function ovStandFuer(p) {
  if (!ovElemente.length) return 0;
  let stelle = constrain(p, 0, 1) * (ovElemente.length - 1);
  let i = Math.floor(stelle);
  let j = Math.min(ovElemente.length - 1, i + 1);
  return lerp(ovElemente[i].stand, ovElemente[j].stand, stelle - i);
}

// Linie, Spaltenabstand und die gemeinsame Kreis-Skala. Einmal je Fenster.
function ovBerechneLayout() {
  if (ovLayout && ovLayout.breite === width && ovLayout.hoehe === height) return ovLayout;

  // Jede Zeilenmenge in ihrer eigenen Schrift umbrechen — textWidth misst mit
  // dem gerade gesetzten Zustand.
  textFont(SCHRIFT_SANS);
  textStyle(BOLD);
  textSize(13);
  let labelZeilen = VERGLEICHS_KNOTEN.map(k => ovLabelZeilen(k.label.toUpperCase()));
  textStyle(NORMAL);
  textFont(SCHRIFT_SERIF);
  textSize(OV_TEXT_GROESSE);
  let textZeilen = VERGLEICHS_KNOTEN.map(k => ovTextUmbruch(k.text, OV_TEXT_BREITE));

  let n = VERGLEICHS_KNOTEN.length;
  let startX = OV_RAND_LINKS;
  let abstand = Math.max(1, width - OV_RAND_LINKS - OV_RAND_RECHTS) / (n - 1);

  // Höhe der Blöcke über und unter der Linie, ohne den Kreis selbst.
  // Textblöcke über den Kreisen und Beschriftungen darunter stehen je in zwei
  // Reihen, abwechselnd von Ort zu Ort: auf einer Höhe stiessen die Blöcke
  // benachbarter Kreise aneinander.
  let textBlock = Math.max(...textZeilen.map(z => z.length)) * OV_TEXT_ZEILE;
  let textReihe = textBlock + OV_TEXT_REIHEN_LUFT;
  let textHoehe = OV_TEXT_ABSTAND + textReihe + textBlock;

  let labelBlock = Math.max(...labelZeilen.map(z => z.length)) * OV_LABEL_ZEILE + OV_KAPITEL_ABSTAND;
  let labelReihe = labelBlock + OV_LABEL_REIHEN_LUFT;
  let labelHoehe = OV_LABEL_ABSTAND + labelReihe + labelBlock;

  // Gemeinsame Kreis-Skala, zwei Bedingungen: waagrecht dürfen sich Nachbarn
  // nicht berühren, senkrecht muss der grösste Kreis zwischen Textblock und
  // Beschriftung passen. Die schärfere gewinnt.
  let quer = 1;
  for (let r = 0; r < n - 1; r++) {
    let summe = (ovRohradien[ovReihenfolge[r]] + ovRohradien[ovReihenfolge[r + 1]]) * OV_KREIS_LUFT;
    if (summe > 0) quer = Math.min(quer, abstand / summe);
  }
  let maxRoh = Math.max(...ovRohradien);
  let frei = height - OV_RAND_OBEN - OV_RAND_UNTEN - textHoehe - labelHoehe;
  let kreisSkala = Math.max(0, Math.min(quer, maxRoh > 0 ? frei / (2 * maxRoh) : 1));

  // Linie so legen, dass oben der Textblock und unten die Beschriftung Platz
  // haben; passt beides, bleibt sie mittig.
  let maxRadius = maxRoh * kreisSkala;
  // Beide Grundlinien hängen am GRÖSSTEN Kreis, nicht am eigenen: so stehen
  // Texte und Beschriftungen beim Abspielen still, wie die Labels der Spine.
  let labelBasis = maxRadius + OV_LABEL_ABSTAND;
  let textBasis = maxRadius + OV_TEXT_ABSTAND;
  let linienY = constrain(height / 2,
    OV_RAND_OBEN + maxRadius + textHoehe,
    height - OV_RAND_UNTEN - maxRadius - labelHoehe);

  ovLayout = { breite: width, hoehe: height, startX, abstand, kreisSkala, linienY,
    labelBasis, labelReihe, textBasis, textReihe, labelZeilen, textZeilen };
  return ovLayout;
}

// Abstand eines Blocks von der Linie: gemeinsame Grundlinie, jeder zweite Ort
// eine Reihe weiter weg. Beschriftung, Textblock und ihre Zuführungslinien
// nehmen dieselbe Rechnung.
function ovReihenAbstand(basis, reihe, ort) {
  return basis + ort.reihe * reihe;
}

// p = Fortschritt der Play-Animation (0..1). Er zählt die Kapitel durch: die
// Orte kommen in der Reihenfolge ihres ersten Auftretens dazu, ihre Kreise
// wachsen mit jedem Kapitel weiter.
function zeichneOrtsveraenderung(p) {
  if (!stationenData || !stationenData.annotationen) return;
  ovBaueDaten();
  let layout = ovBerechneLayout();

  // Kapitel n belegt den Abschnitt n-1..n; bei ganzzahligem Stand ist es
  // fertig, dazwischen sagt anteil, wie weit es gelesen ist.
  let kapitelStand = ovStandFuer(p);
  let maxKapitel = Math.max(1, Math.min(OV_KAPITEL_ZAHL, Math.ceil(kapitelStand)));
  let anteil = constrain(kapitelStand - (maxKapitel - 1), 0, 1);
  // Ein Ort blendet über das Kapitel VOR seinem ersten ein und steht, sobald
  // dieses beginnt — danach wächst sein Kreis. Dasselbe Prinzip wie der
  // Playhead der Spine, nur zählt hier das Kapitel statt der Achsenposition.
  // Die drei Orte aus Kapitel 1 sind dadurch von Anfang an da.
  let alphaFuer = (knoten) => constrain(
    map(kapitelStand, ovErstesKapitel[knoten] - 2, ovErstesKapitel[knoten] - 1, 0, 1), 0, 1);

  // Linie wächst bis zum zuletzt eingeblendeten Ort mit.
  let ende = -1;
  ovReihenfolge.forEach((knoten, r) => { if (alphaFuer(knoten) > 0) ende = r - 1 + alphaFuer(knoten); });
  if (ende > 0) {
    stroke(ROUTE_COLOR_RGB.r, ROUTE_COLOR_RGB.g, ROUTE_COLOR_RGB.b, 255);
    strokeWeight(2);
    line(layout.startX, layout.linienY, layout.startX + ende * layout.abstand, layout.linienY);
    noStroke();
  }

  // Stand je sichtbarem Ort einmal berechnen; Reihenfolge auf der Achse.
  let orte = [];
  ovReihenfolge.forEach((knoten, r) => {
    let alphaSkala = alphaFuer(knoten);
    if (alphaSkala <= 0) return;
    let stand = ovStand(knoten, maxKapitel, anteil);
    orte.push({
      knoten, alphaSkala, stand,
      x: layout.startX + r * layout.abstand,
      radius: groessterKreisRadius(stand.bandCounts, Infinity, layout.kreisSkala),
      reihe: r % 2, // abwechselnd obere und untere Beschriftungsreihe
    });
  });

  // ACHTUNG nach Grösse zeichnen, nicht in Achsenreihenfolge: bei engem
  // Abstand deckt ein später gezeichneter kleinerer Kreis sonst einen
  // grösseren Nachbarn an. Gleiche Regel wie in zeichneSpineHorizontal.
  orte.slice().sort((a, b) => b.radius - a.radius).forEach(o => {
    zeichneKreiseFuerRun(o.x, layout.linienY, o.stand.bandCounts, o.alphaSkala,
      PI, layout.kreisSkala, Infinity);
    zeichneFwertPunkte(o.x, layout.linienY, o.radius, o.stand.fwerte, o.alphaSkala);
  });

  textAlign(CENTER, CENTER);
  drawingContext.textAlign = 'center';

  // Ortspunkte und die beiden Zuführungslinien — nach allen Kreisen, damit sie
  // nie unter einem Nachbarkreis verschwinden.
  orte.forEach(o => {
    let rand = o.radius > 0 ? o.radius : 6;
    drawingContext.fillStyle = `rgba(${ROUTE_COLOR_RGB.r}, ${ROUTE_COLOR_RGB.g}, ${ROUTE_COLOR_RGB.b}, ${o.alphaSkala})`;
    drawingContext.beginPath();
    drawingContext.arc(o.x, layout.linienY, 3.5, 0, TWO_PI);
    drawingContext.fill();

    stroke(LABEL_TINTE.r, LABEL_TINTE.g, LABEL_TINTE.b, 110 * o.alphaSkala);
    strokeWeight(1);
    // Nach unten bis kurz vor die feste Beschriftung: die Linie wächst mit dem
    // Kreis, ihr Ende bleibt stehen.
    line(o.x, layout.linienY + rand, o.x,
      layout.linienY + ovReihenAbstand(layout.labelBasis, layout.labelReihe, o) - 8);
    line(o.x, layout.linienY - rand, o.x,
      layout.linienY - ovReihenAbstand(layout.textBasis, layout.textReihe, o) + 8);
    noStroke();
  });

  // Beschriftung und Kapitelzeile unter dem Kreis, auf dem Endradius: sie stehen
  // still, während der Kreis darüber wächst.
  orte.forEach(o => {
    let zeilen = layout.labelZeilen[o.knoten];
    textFont(SCHRIFT_SANS);
    textStyle(BOLD);
    textSize(13);
    // ACHTUNG fillStyle direkt setzen, nicht über fill(): p5 überspringt die
    // Zuweisung bei gleichbleibendem Wert. zeichneFwertPunkte schreibt oben
    // direkt in fillStyle und umgeht den Zwischenspeicher — der Ortsname
    // wurde dadurch rot, sobald sich seine Deckkraft nicht mehr änderte.
    drawingContext.fillStyle = `rgba(${LABEL_TINTE.r}, ${LABEL_TINTE.g}, ${LABEL_TINTE.b}, ${o.alphaSkala})`;
    let labelY = layout.linienY + ovReihenAbstand(layout.labelBasis, layout.labelReihe, o);
    zeilen.forEach((zeile, z) => drawingContext.fillText(zeile, o.x, labelY + z * OV_LABEL_ZEILE));

    textStyle(NORMAL);
    textSize(11);
    drawingContext.fillStyle = `rgba(${OV_KAPITELZEILE_TINTE.r}, ${OV_KAPITELZEILE_TINTE.g}, ${OV_KAPITELZEILE_TINTE.b}, ${o.alphaSkala})`;
    drawingContext.fillText(o.stand.letztes ? `Kapitel ${o.stand.letztes}` : 'Kapitel –',
      o.x, labelY + (zeilen.length - 1) * OV_LABEL_ZEILE + OV_KAPITEL_ABSTAND);
  });

  // Erläuterungstext über dem Kreis, von der Unterkante nach oben gesetzt.
  orte.forEach(o => {
    let erlaeuterung = layout.textZeilen[o.knoten];
    if (!erlaeuterung.length) return;
    let unterkante = layout.linienY - ovReihenAbstand(layout.textBasis, layout.textReihe, o);
    textFont(SCHRIFT_SERIF);
    textSize(OV_TEXT_GROESSE);
    drawingContext.fillStyle = `rgba(${LABEL_TINTE.r}, ${LABEL_TINTE.g}, ${LABEL_TINTE.b}, ${o.alphaSkala * 0.85})`;
    erlaeuterung.forEach((zeile, z) => drawingContext.fillText(
      zeile, o.x, unterkante - (erlaeuterung.length - 1 - z) * OV_TEXT_ZEILE));
  });

  textAlign(LEFT, CENTER); // zurücksetzen — andere Zeichenfunktionen erwarten das
  drawingContext.textAlign = 'left';
  textStyle(NORMAL);
}


// Alle Annotationen der sieben Orte in Erzählreihenfolge, je mit ihrer
// Achsenposition und dem Moment, in dem sie im Bild erscheint. Die
// Sonifikation baut daraus ihre Klangelemente.

// Der Fortschritt ist der Rang in derselben Liste, aus der ovStandFuer() die
// Zeitachse baut — deshalb klingt ein Element genau dann, wenn es im Bild
// erscheint.
function ortsvergleichAnnotationen() {
  ovBaueDaten();
  let letzter = Math.max(1, ovElemente.length - 1);
  return ovElemente.map((e, i) => ({
    annotation: e.annotation,
    kreis: e.kreis,
    fortschritt: i / letzter,
  }));
}
