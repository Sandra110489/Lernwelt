"use strict";

// ---------- Feste Werte ----------

const SCHLUESSEL_AUFGABEN = "lernwelt-wochenplan";
const SCHLUESSEL_ARBEITSTAGE = "lernwelt-arbeitstage";
const STANDARD_ARBEITSTAGE = [2, 4, 5]; // Di, Do, Fr

const TAG_KURZ = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const TAG_LANG = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli",
  "August", "September", "Oktober", "November", "Dezember"];

const PRIO_TEXT = { 1: "Sofort", 2: "Einplanen", 3: "Kurz halten", 4: "Weglassen?" };

const TIPPS = [
  "Wichtig vor dringend: Plane wichtige Aufgaben fest ein, bevor Dringendes den Tag füllt.",
  "Das Schwierigste zuerst: Erledige die unangenehmste Aufgabe am Anfang des Tages.",
  "Plane Puffer ein: Verplane nur etwa zwei Drittel deiner Zeit.",
  "Pausen gehören dazu: Nach 45–60 Minuten Konzentration hilft eine kurze Pause.",
  "Nein sagen schützt deine Zeit. Aufgaben mit „Weglassen?“ darfst du wirklich streichen.",
  "Teile große Aufgaben in kleine Schritte von höchstens 1–2 Stunden.",
  "Freie Tage sind für dich: Plane Erholung genauso bewusst ein wie Arbeit.",
  "Bündle Ähnliches: E-Mails, Anrufe oder Besorgungen am Stück erledigen."
];

// ---------- Zustand ----------

let aufgaben = [];
let arbeitstage = STANDARD_ARBEITSTAGE.slice();
let wochenVersatz = 0; // 0 = diese Woche, -1 = vorige, +1 = nächste
let neueAufgabeId = null; // gerade angelegte Aufgabe: ihr Kärtchen leuchtet einmal kurz auf
let okTimer = null;

// ---------- Speichern und Laden ----------

function laden() {
  try {
    const roh = localStorage.getItem(SCHLUESSEL_AUFGABEN);
    const liste = roh ? JSON.parse(roh) : [];
    if (Array.isArray(liste)) {
      aufgaben = liste.filter(function (a) {
        return a && typeof a.titel === "string" && typeof a.datum === "string";
      });
    }
  } catch (e) {
    aufgaben = [];
  }

  try {
    const roh = localStorage.getItem(SCHLUESSEL_ARBEITSTAGE);
    if (roh !== null) {
      const liste = JSON.parse(roh);
      if (Array.isArray(liste)) {
        arbeitstage = liste.filter(function (n) {
          return Number.isInteger(n) && n >= 1 && n <= 7;
        });
      }
    }
  } catch (e) {
    arbeitstage = STANDARD_ARBEITSTAGE.slice();
  }
}

function speichern() {
  try {
    localStorage.setItem(SCHLUESSEL_AUFGABEN, JSON.stringify(aufgaben));
    localStorage.setItem(SCHLUESSEL_ARBEITSTAGE, JSON.stringify(arbeitstage));
  } catch (e) {
    // Speichern nicht möglich (z. B. privates Fenster). Die App läuft trotzdem weiter.
  }
}

// ---------- Datum ----------

// Datum als Text "JJJJ-MM-TT" nach der Uhrzeit des Computers (nicht UTC).
function datumText(d) {
  const j = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const t = String(d.getDate()).padStart(2, "0");
  return j + "-" + m + "-" + t;
}

// Wochentag-Nummer: 1 = Montag ... 7 = Sonntag
function wochentagNr(d) {
  const n = d.getDay(); // 0 = Sonntag
  return n === 0 ? 7 : n;
}

function plusTage(d, anzahl) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + anzahl);
}

// Montag der Woche, in der "datum" liegt
function wochenMontag(datum) {
  return plusTage(datum, 1 - wochentagNr(datum));
}

// Die 7 Tage der gerade angezeigten Woche
function angezeigteTage() {
  const montag = plusTage(wochenMontag(new Date()), wochenVersatz * 7);
  const tage = [];
  for (let i = 0; i < 7; i++) {
    tage.push(plusTage(montag, i));
  }
  return tage;
}

function wochenUeberschrift(tage) {
  const a = tage[0];
  const b = tage[6];
  if (a.getFullYear() !== b.getFullYear()) {
    return a.getDate() + ". " + MONATE[a.getMonth()] + " " + a.getFullYear() +
      " – " + b.getDate() + ". " + MONATE[b.getMonth()] + " " + b.getFullYear();
  }
  if (a.getMonth() !== b.getMonth()) {
    return a.getDate() + ". " + MONATE[a.getMonth()] +
      " – " + b.getDate() + ". " + MONATE[b.getMonth()] + " " + b.getFullYear();
  }
  return a.getDate() + ".–" + b.getDate() + ". " + MONATE[b.getMonth()] + " " + b.getFullYear();
}

function istArbeitstag(datumAlsText) {
  const teile = datumAlsText.split("-").map(Number);
  const d = new Date(teile[0], teile[1] - 1, teile[2]);
  return arbeitstage.indexOf(wochentagNr(d)) !== -1;
}

// ---------- Priorität ----------

function prioritaet(a) {
  if (a.wichtig && a.dringend) return 1;
  if (a.wichtig) return 2;
  if (a.dringend) return 3;
  return 4;
}

function sortiere(liste) {
  return liste.slice().sort(function (x, y) {
    return (prioritaet(x) - prioritaet(y)) || ((x.erstellt || 0) - (y.erstellt || 0));
  });
}

function dauerText(minuten) {
  if (minuten < 60) return minuten + " Min.";
  return (minuten / 60) + " Std.";
}

// Minuten als Stunden-Text, z. B. 90 -> "1,5 Std."
function stundenText(minuten) {
  return (minuten / 60).toLocaleString("de-DE", { maximumFractionDigits: 2 }) + " Std.";
}

function neueId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- Elemente ----------

const el = {
  wochenText: document.getElementById("wochen-text"),
  arbeitstage: document.getElementById("arbeitstage"),
  formular: document.getElementById("formular"),
  titel: document.getElementById("f-titel"),
  tag: document.getElementById("f-tag"),
  beruf: document.getElementById("f-beruf"),
  privat: document.getElementById("f-privat"),
  dauer: document.getElementById("f-dauer"),
  wichtig: document.getElementById("f-wichtig"),
  dringend: document.getElementById("f-dringend"),
  hinweisTitel: document.getElementById("hinweis-titel"),
  hinweisOk: document.getElementById("hinweis-ok"),
  raster: document.getElementById("raster"),
  balken: document.getElementById("balance-balken"),
  balkenBeruf: document.getElementById("balance-beruf"),
  balkenPrivat: document.getElementById("balance-privat"),
  balanceText: document.getElementById("balance-text"),
  heuteDatum: document.getElementById("heute-datum"),
  heuteListe: document.getElementById("heute-liste"),
  heuteText: document.getElementById("heute-text"),
  tippText: document.getElementById("tipp-text")
};

// ---------- Anzeige ----------

function zeichneKopf() {
  el.wochenText.textContent = wochenUeberschrift(angezeigteTage());
}

function zeichneArbeitstage() {
  el.arbeitstage.textContent = "";
  for (let nr = 1; nr <= 7; nr++) {
    const label = document.createElement("label");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.value = String(nr);
    box.checked = arbeitstage.indexOf(nr) !== -1;
    box.addEventListener("change", arbeitstagGeaendert);
    label.appendChild(box);
    label.appendChild(document.createTextNode(" " + TAG_KURZ[nr - 1]));
    label.title = TAG_LANG[nr - 1];
    el.arbeitstage.appendChild(label);
  }
}

function zeichneTagAuswahl() {
  const tage = angezeigteTage();
  const heute = datumText(new Date());
  const vorher = el.tag.value;
  el.tag.textContent = "";

  let auswahl = datumText(tage[0]);
  tage.forEach(function (d, i) {
    const wert = datumText(d);
    const opt = document.createElement("option");
    opt.value = wert;
    opt.textContent = TAG_KURZ[i] + " " + d.getDate() + "." + (d.getMonth() + 1) + ".";
    el.tag.appendChild(opt);
    if (wert === heute) auswahl = wert;
  });
  // Bleibt man in derselben Woche, bleibt der gewählte Tag erhalten
  if (tage.some(function (d) { return datumText(d) === vorher; })) auswahl = vorher;
  el.tag.value = auswahl;
}

function zeichneRaster() {
  const heute = datumText(new Date());
  el.raster.textContent = "";

  angezeigteTage().forEach(function (d, i) {
    const wert = datumText(d);
    const frei = !istArbeitstag(wert);

    const spalte = document.createElement("article");
    spalte.className = "tag" + (frei ? " frei" : "") + (wert === heute ? " heute" : "");

    const kopf = document.createElement("div");
    kopf.className = "tag-kopf";
    const name = document.createElement("span");
    name.className = "tag-name";
    name.textContent = TAG_LANG[i];
    const datum = document.createElement("span");
    datum.className = "tag-datum";
    datum.textContent = d.getDate() + "." + (d.getMonth() + 1) + ".";
    kopf.appendChild(name);
    kopf.appendChild(datum);
    if (wert === heute) {
      const h = document.createElement("span");
      h.className = "etikett-heute";
      h.textContent = "heute";
      kopf.appendChild(h);
    }
    if (frei) {
      const f = document.createElement("span");
      f.className = "etikett-frei";
      f.textContent = "frei";
      kopf.appendChild(f);
    }
    spalte.appendChild(kopf);

    const liste = sortiere(aufgaben.filter(function (a) { return a.datum === wert; }));
    if (liste.length === 0) {
      const leer = document.createElement("p");
      leer.className = "leer";
      leer.textContent = "Keine Aufgaben";
      spalte.appendChild(leer);
    } else {
      const ul = document.createElement("ul");
      ul.className = "aufgaben";
      liste.forEach(function (a) { ul.appendChild(karte(a, frei)); });
      spalte.appendChild(ul);
    }

    el.raster.appendChild(spalte);
  });

  zeichneBalance();
  zeichneHeute();
}

// Highlight 2: die bis zu 3 wichtigsten offenen Aufgaben von heute (immer der echte heutige Tag)
function zeichneHeute() {
  const jetzt = new Date();
  const heute = datumText(jetzt);
  el.heuteDatum.textContent = "– " + TAG_LANG[wochentagNr(jetzt) - 1] + ", " +
    jetzt.getDate() + "." + (jetzt.getMonth() + 1) + ".";

  const vonHeute = aufgaben.filter(function (a) { return a.datum === heute; });
  const offen = vonHeute.filter(function (a) { return !a.erledigt; }).sort(function (x, y) {
    return (prioritaet(x) - prioritaet(y)) ||
      ((Number(x.dauer) || 0) - (Number(y.dauer) || 0)) ||
      ((x.erstellt || 0) - (y.erstellt || 0));
  });

  const frei = !istArbeitstag(heute);
  el.heuteListe.textContent = "";
  offen.slice(0, 3).forEach(function (a) { el.heuteListe.appendChild(karte(a, frei)); });
  el.heuteListe.hidden = offen.length === 0;

  const rest = offen.length - 3;
  if (vonHeute.length === 0) {
    el.heuteText.textContent = "Für heute ist nichts geplant.";
  } else if (offen.length === 0) {
    el.heuteText.textContent = "Heute ist alles erledigt 🎉";
  } else if (rest > 0) {
    el.heuteText.textContent = "+ " + rest + (rest === 1 ? " weitere offene Aufgabe heute" : " weitere offene Aufgaben heute");
  } else {
    el.heuteText.textContent = "";
  }
  el.heuteText.hidden = el.heuteText.textContent === "";
}

function zeigeTipp() {
  el.tippText.textContent = TIPPS[Math.floor(Math.random() * TIPPS.length)];
}

// Highlight 1: Verteilung der geplanten Stunden (Beruf / Privat) in der angezeigten Woche
function zeichneBalance() {
  const woche = angezeigteTage().map(datumText);
  let beruf = 0;
  let privat = 0;
  aufgaben.forEach(function (a) {
    if (woche.indexOf(a.datum) === -1) return;
    const minuten = Number(a.dauer) || 0;
    if (a.bereich === "beruf") beruf += minuten;
    else privat += minuten;
  });

  el.balanceText.textContent = "";
  const summe = beruf + privat;
  if (summe === 0) {
    el.balken.hidden = true;
    el.balken.setAttribute("aria-label", "Noch nichts geplant");
    el.balanceText.textContent = "Noch nichts geplant";
    return;
  }

  const prozentBeruf = Math.round(beruf / summe * 100);
  const prozentPrivat = 100 - prozentBeruf;
  el.balken.hidden = false;
  el.balkenBeruf.style.width = prozentBeruf + "%";
  el.balkenPrivat.style.width = prozentPrivat + "%";

  const teil = function (bereich, wort, prozent, minuten) {
    const span = document.createElement("span");
    const name = document.createElement("span");
    name.className = "bereich-text " + bereich;
    name.textContent = wort;
    span.appendChild(name);
    span.appendChild(document.createTextNode(" " + prozent + " % · " + stundenText(minuten)));
    return span;
  };
  const trenner = document.createElement("span");
  trenner.className = "trenner";
  trenner.textContent = "|";

  el.balanceText.appendChild(teil("beruf", "Beruf", prozentBeruf, beruf));
  el.balanceText.appendChild(trenner);
  el.balanceText.appendChild(teil("privat", "Privat", prozentPrivat, privat));
  el.balken.setAttribute("aria-label",
    "Beruf " + prozentBeruf + " % · " + stundenText(beruf) + " | Privat " + prozentPrivat + " % · " + stundenText(privat));
}

function karte(a, tagIstFrei) {
  const li = document.createElement("li");
  li.className = "karte " + a.bereich + (a.erledigt ? " erledigt" : "") + (a.id === neueAufgabeId ? " neu" : "");

  const haken = document.createElement("input");
  haken.type = "checkbox";
  haken.checked = !!a.erledigt;
  haken.setAttribute("aria-label", "„" + a.titel + "“ erledigt");
  haken.addEventListener("change", function () { umschalten(a.id); });

  const titel = document.createElement("span");
  titel.className = "karte-titel";
  titel.textContent = a.titel;

  const weg = document.createElement("button");
  weg.type = "button";
  weg.className = "loeschen";
  weg.textContent = "×";
  weg.title = "Löschen";
  weg.setAttribute("aria-label", "„" + a.titel + "“ löschen");
  weg.addEventListener("click", function () { loeschen(a.id); });

  const info = document.createElement("div");
  info.className = "karte-info";

  const bereich = document.createElement("span");
  bereich.className = "bereich-text " + a.bereich;
  bereich.textContent = a.bereich === "beruf" ? "Beruf" : "Privat";

  const dauer = document.createElement("span");
  dauer.className = "dauer";
  dauer.textContent = dauerText(a.dauer);

  const p = prioritaet(a);
  const prio = document.createElement("span");
  prio.className = "prio prio-" + p;
  prio.textContent = PRIO_TEXT[p];

  info.appendChild(bereich);
  info.appendChild(dauer);
  info.appendChild(prio);

  if (a.bereich === "beruf" && tagIstFrei) {
    const warn = document.createElement("span");
    warn.className = "warn-frei";
    warn.textContent = "⚠ freier Tag";
    info.appendChild(warn);
  }
  info.appendChild(weg);

  li.appendChild(haken);
  li.appendChild(titel);
  li.appendChild(info);
  return li;
}

// An freien Tagen ist nur "Privat" wählbar
function pruefeBereich() {
  const frei = el.tag.value !== "" && !istArbeitstag(el.tag.value);
  el.beruf.disabled = frei;
  if (frei) el.privat.checked = true;
}

function zeichneAlles() {
  zeichneKopf();
  zeichneTagAuswahl();
  zeichneRaster();
  pruefeBereich();
}

// ---------- Ereignisse ----------

function aufgabeAnlegen(ereignis) {
  ereignis.preventDefault();
  const titel = el.titel.value.trim();
  if (titel === "") {
    el.hinweisOk.hidden = true;
    el.hinweisTitel.hidden = false;
    el.titel.focus();
    return;
  }
  el.hinweisTitel.hidden = true;

  const datum = el.tag.value;
  const tagText = el.tag.options[el.tag.selectedIndex].textContent;
  let bereich = el.privat.checked ? "privat" : "beruf";
  if (!istArbeitstag(datum)) bereich = "privat";

  const id = neueId();
  aufgaben.push({
    id: id,
    titel: titel,
    datum: datum,
    bereich: bereich,
    dauer: Number(el.dauer.value),
    wichtig: el.wichtig.checked,
    dringend: el.dringend.checked,
    erledigt: false,
    erstellt: Date.now()
  });
  speichern();
  neueAufgabeId = id;
  zeichneRaster();
  neueAufgabeId = null;
  zeigeOk("✓ „" + titel + "“ für " + tagText + " eingeplant");

  el.titel.value = "";
  el.wichtig.checked = false;
  el.dringend.checked = false;
  el.titel.focus();
}

// Kurze Bestätigung unter dem Formular, verschwindet nach 4 Sekunden
function zeigeOk(text) {
  el.hinweisOk.textContent = text;
  el.hinweisOk.hidden = false;
  clearTimeout(okTimer);
  okTimer = setTimeout(function () { el.hinweisOk.hidden = true; }, 4000);
}

function arbeitstagGeaendert() {
  arbeitstage = Array.prototype.slice
    .call(el.arbeitstage.querySelectorAll("input:checked"))
    .map(function (box) { return Number(box.value); });
  speichern();
  zeichneRaster();
  pruefeBereich();
}

function umschalten(id) {
  const a = aufgaben.find(function (x) { return x.id === id; });
  if (!a) return;
  a.erledigt = !a.erledigt;
  speichern();
  zeichneRaster();
}

function loeschen(id) {
  const a = aufgaben.find(function (x) { return x.id === id; });
  if (!a) return;
  if (!confirm("Aufgabe „" + a.titel + "“ löschen?")) return;
  aufgaben = aufgaben.filter(function (x) { return x.id !== id; });
  speichern();
  zeichneRaster();
}

function blaettern(schritt) {
  wochenVersatz = schritt === 0 ? 0 : wochenVersatz + schritt;
  zeichneAlles();
}

// ---------- Start ----------

laden();
zeigeTipp();
zeichneArbeitstage();
zeichneAlles();

el.formular.addEventListener("submit", aufgabeAnlegen);
el.tag.addEventListener("change", pruefeBereich);
el.titel.addEventListener("input", function () {
  if (el.titel.value.trim() !== "") el.hinweisTitel.hidden = true;
});
document.getElementById("btn-vorige").addEventListener("click", function () { blaettern(-1); });
document.getElementById("btn-diese").addEventListener("click", function () { blaettern(0); });
document.getElementById("btn-naechste").addEventListener("click", function () { blaettern(1); });
