# SPEC: Wochenplaner „Lernwelt“

## 1. Zweck

Die App hilft dabei, die eigene Woche gut einzuteilen, und zwar beruflich und privat.
Man trägt Aufgaben ein, ordnet sie einem Tag zu und sagt, ob sie **wichtig** und/oder **dringend** sind.
Die App zeigt dann:

- was heute zuerst dran ist,
- ob Beruf und Privat in der Woche gut verteilt sind.

## 2. Nutzer

- Eine Person, die ihre eigene Woche plant.
- Sie arbeitet **in Teilzeit**, also nicht an jedem Tag. An freien Tagen plant sie nur Privates.
- Sie nutzt ein Gerät und einen Browser.
- Es gibt keine Anmeldung, kein Konto und keine anderen Nutzer.
- Technisches Wissen ist nicht nötig.

## 3. Funktionen

### Muss (Kern, ohne das geht es nicht)

1. **Wochenansicht:** 7 Spalten von Montag bis Sonntag für die aktuelle Woche, jeweils mit Datum. Der heutige Tag ist hervorgehoben.
2. **Aufgabe anlegen** mit diesem Formular:
   - Titel (Pflichtfeld)
   - Tag (Montag bis Sonntag der angezeigten Woche). Voreingestellt ist heute, wenn heute in der angezeigten Woche liegt, sonst der Montag.
   - Bereich: **Beruf** oder **Privat**
   - Dauer: 15 Min., 30 Min., 1 Std., 2 Std., 3 Std. oder 4 Std.
   - Häkchen „wichtig“
   - Häkchen „dringend“
3. **Bereich in Farbe:** Berufliche und private Aufgaben haben jeweils eine eigene Farbe.
4. **Arbeitstage (Teilzeit):**
   - In der Zeile „Meine Arbeitstage“ gibt es 7 Häkchen (Mo bis So). Voreingestellt sind **Dienstag, Donnerstag und Freitag**. Die Auswahl wird gespeichert und gilt für jede Woche.
   - Freie Tage sind im Wochenraster sichtbar markiert, z. B. mit dem Etikett „frei“ und einem anderen Hintergrund.
   - **An einem freien Tag ist nur der Bereich „Privat“ planbar.** Wählt man im Formular einen freien Tag, ist „Beruf“ ausgegraut und nicht auswählbar, und „Privat“ wird automatisch gewählt. Einen extra Hinweistext gibt es dazu nicht.
   - Wird ein Tag nachträglich zum freien Tag, bleiben dort vorhandene berufliche Aufgaben erhalten. Sie bekommen den Hinweis „⚠ freier Tag“, damit man sie verschieben oder löschen kann.
5. **Priorität automatisch** (nach der Eisenhower-Idee):

   | wichtig | dringend | Priorität | Anzeige        |
   |---------|----------|-----------|----------------|
   | ja      | ja       | 1         | „Sofort“       |
   | ja      | nein     | 2         | „Einplanen“    |
   | nein    | ja       | 3         | „Kurz halten“  |
   | nein    | nein     | 4         | „Weglassen?“   |

   Innerhalb eines Tages werden Aufgaben nach Priorität sortiert (1 steht oben). Bei gleicher Priorität gilt die Reihenfolge, in der sie angelegt wurden.
6. **Abhaken:** Erledigte Aufgaben werden durchgestrichen und bleiben sichtbar. Ein erneuter Klick hebt das wieder auf.
7. **Löschen:** Eine Aufgabe kann man löschen, vorher fragt die App einmal nach.
8. **Speichern:** Alle Aufgaben und die Arbeitstage bleiben nach dem Neuladen der Seite erhalten.

### Soll (wenn Zeit ist, die zwei Highlights zuerst)

1. **Highlight 1: Balance-Balken.** Oben steht ein Balken, der den Anteil der geplanten Stunden in der angezeigten Woche zeigt: Beruf gegen Privat, in den beiden Bereichsfarben, mit Prozent und Stunden (z. B. „Beruf 70 % · 14 Std. | Privat 30 % · 6 Std.“). Hat die Woche noch keine Aufgaben, steht dort „Noch nichts geplant“.
2. **Highlight 2: Karte „Heute zuerst“.** Sie zeigt die bis zu 3 wichtigsten **offenen** Aufgaben von heute, sortiert nach Priorität und bei gleicher Priorität nach Dauer (die kürzere zuerst). Ist nichts offen, steht dort „Heute ist alles erledigt 🎉“. Gibt es heute gar keine Aufgaben, steht dort „Für heute ist nichts geplant.“ Sind mehr als 3 Aufgaben offen, zeigt ein Hinweis, wie viele es noch gibt (z. B. „+ 2 weitere offene Aufgaben heute“). Die Karte zeigt immer den echten heutigen Tag, auch wenn gerade eine andere Woche angezeigt wird.
3. **Tipp-Kasten:** Ein kurzer Tipp zum Zeitmanagement, nach dem Zufall ausgewählt aus etwa 8 festen Tipps. Bei jedem Neuladen wird neu gelost.
4. **Wochen wechseln:** Mit den Knöpfen „← Vorige Woche“, „Diese Woche“ und „Nächste Woche →“ blättert man durch die Wochen.

### Bewusst nicht

- Keine Anmeldung, keine mehreren Nutzer, kein Server
- Keine genauen Uhrzeiten oder Zeitblöcke, nur Tage
- Keine Tagesansicht und keine Monatsansicht
- Kein Bearbeiten bestehender Aufgaben (stattdessen löschen und neu anlegen)
- Kein Ziehen mit der Maus (Drag & Drop)
- Keine Wiederholungen (z. B. „jeden Montag“)
- Keine Ausnahmen für einzelne Wochen (z. B. Urlaub oder ein getauschter Arbeitstag). Die Arbeitstage gelten immer für alle Wochen.
- Keine Erinnerungen und keine Benachrichtigungen
- Kein Sync zwischen Geräten, kein Export und kein Import
- Keine eigene Eisenhower-Matrix-Ansicht

## 4. Daten

Die Daten werden im Browser gespeichert (`localStorage`) unter dem Schlüssel `lernwelt-wochenplan`, als Liste von Aufgaben:

| Feld       | Typ       | Beispiel                 | Bedeutung                         |
|------------|-----------|--------------------------|-----------------------------------|
| `id`       | Text      | `"a1b2c3"`               | eindeutige Kennung                |
| `titel`    | Text      | `"Bericht schreiben"`    | Name der Aufgabe                  |
| `datum`    | Text      | `"2026-11-16"`           | Tag (Jahr-Monat-Tag)              |
| `bereich`  | Text      | `"beruf"` / `"privat"`   | Bereich                           |
| `dauer`    | Zahl      | `60`                     | geschätzte Dauer in Minuten       |
| `wichtig`  | ja/nein   | `true`                   |                                   |
| `dringend` | ja/nein   | `false`                  |                                   |
| `erledigt` | ja/nein   | `false`                  |                                   |

Die **Arbeitstage** werden unter einem zweiten Schlüssel `lernwelt-arbeitstage` gespeichert, als Liste von Wochentag-Nummern (1 = Montag … 7 = Sonntag). Voreinstellung: `[2, 4, 5]` (Di, Do, Fr).

- Die Priorität wird nicht gespeichert, sondern immer aus `wichtig` und `dringend` berechnet.
- Der Balance-Balken zählt alle Aufgaben der Woche, offene und erledigte, weil er die **geplante** Zeit zeigt.
- Falls der Browser nichts speichern kann (z. B. im privaten Fenster), läuft die App trotzdem weiter. Die Daten gehen dann beim Neuladen verloren.

## 5. Oberfläche

Von oben nach unten:

1. **Kopf:** Titel „Mein Wochenplan“, die Woche (z. B. „16.–22. November 2026“, über einen Monatswechsel hinweg z. B. „30. November – 6. Dezember 2026“) und die Knöpfe zum Wochenwechsel (Soll)
2. **Balance-Balken** (Highlight 1)
3. **Zwei Kästen nebeneinander:** die Karte „Heute zuerst“ (Highlight 2) und der Tipp-Kasten
4. **Zeile „Meine Arbeitstage“** mit 7 kleinen Häkchen (Mo bis So)
5. **Formular** „Neue Aufgabe“ in einer Zeile oder kompakt. An freien Tagen ist „Beruf“ ausgegraut.
6. **Wochenraster** mit 7 Spalten. Freie Tage tragen das Etikett „frei“ und haben einen anderen Hintergrund. Jede Aufgabe ist ein Kärtchen mit:
   - Rand oder Hintergrund in der Bereichsfarbe
   - Titel
   - Dauer
   - Prioritäts-Etikett („Sofort“ usw.)
   - Häkchen zum Abhaken
   - Löschen-Knopf (×)

Außerdem gilt:

- Auf dem Handy liegen die Tage untereinander statt nebeneinander.
- Die Schrift ist gut lesbar, die Kontraste sind ausreichend, und die Farben werden zusätzlich durch das Wort „Beruf“ oder „Privat“ erklärt (nicht nur durch Farbe).
- Alles ist auf Deutsch.

## 6. Technik und Grenzen

- **Nur HTML, CSS und JavaScript** ohne externe Bibliotheken, Frameworks oder CDN-Links (siehe CLAUDE.md).
- Es gibt drei Dateien: `index.html`, `style.css` und `app.js`. Die jetzige `index.html` („Hallo“) wird dabei ersetzt.
- Die App startet ohne Server und ohne Installation: Man öffnet `index.html` mit einem Doppelklick im Browser.
- Keine Passwörter oder Schlüssel in Dateien.
- Die Woche beginnt am Montag. Datumsangaben richten sich nach der Uhrzeit des Computers.
- **Grenze:** Die App muss **in einer Arbeitsrunde baubar** sein. Wird es knapp, gilt diese Reihenfolge: zuerst alle Muss-Punkte, dann Highlight 1, dann Highlight 2, dann Tipps, dann Wochenwechsel.

## 7. Abnahmekriterien

Die App ist fertig, wenn diese Prüfungen klappen. Die Prüfungen 8 bis 11 gehören zu den Soll-Punkten. Wurde ein Soll-Punkt aus Zeitgründen weggelassen, entfällt auch seine Prüfung.

1. `index.html` per Doppelklick öffnen → die aktuelle Woche erscheint, Montag bis Sonntag mit Datum, und der heutige Tag ist hervorgehoben.
2. Aufgabe „Bericht schreiben“, Dienstag (Arbeitstag), Beruf, 1 Std., wichtig + dringend anlegen → sie erscheint am Dienstag in der Beruf-Farbe mit dem Etikett „Sofort“.
3. Ohne Titel auf „Hinzufügen“ klicken → es wird keine Aufgabe angelegt und ein Hinweis erscheint.
4. Am selben Tag eine Aufgabe mit Priorität 4 und eine mit Priorität 2 anlegen → die Aufgabe mit Priorität 2 steht weiter oben.
5. Eine Aufgabe abhaken → sie ist durchgestrichen. Erneut klicken → sie ist wieder normal.
6. Eine Aufgabe löschen → die App fragt nach. Nach „OK“ ist die Aufgabe weg.
7. Seite neu laden → alle Aufgaben, die Erledigt-Häkchen und die Arbeitstage sind noch da.
8. **Balance-Balken:** 3 Std. Beruf und 1 Std. Privat in der Woche → der Balken zeigt 75 % / 25 % mit „3 Std.“ und „1 Std.“. Bei einer leeren Woche steht dort „Noch nichts geplant“.
9. **Heute zuerst:** 4 offene Aufgaben für heute → die Karte zeigt genau 3, die wichtigste oben. Wird eine davon abgehakt, rückt die vierte nach.
10. Der Tipp-Kasten zeigt einen Tipp. Nach mehrmaligem Neuladen erscheinen auch andere Tipps.
11. „Nächste Woche →“ zeigt die Folgewoche. Die Aufgaben dieser Woche sind dort nicht zu sehen, der Balken rechnet nur mit der neuen Woche. „Diese Woche“ führt zurück.
12. Wird das Fenster schmal wie beim Handy, liegen die Tage untereinander und nichts muss seitlich gescrollt werden.
13. Im Code gibt es keine externen Links zu Bibliotheken oder Skripten.
14. **Arbeitstage:** Beim ersten Start sind Di, Do und Fr angehakt. Mo, Mi, Sa und So tragen im Raster das Etikett „frei“.
15. Im Formular den Montag (frei) wählen → „Beruf“ ist ausgegraut und „Privat“ ist gewählt. Den Dienstag wählen → „Beruf“ ist wieder wählbar.
16. Den Mittwoch als Arbeitstag anhaken → er verliert das Etikett „frei“ und „Beruf“ ist dort planbar. Nach dem Neuladen ist das Häkchen noch gesetzt.
17. Dienstag eine berufliche Aufgabe anlegen, dann Dienstag als Arbeitstag abwählen → die Aufgabe bleibt sichtbar und trägt den Hinweis „⚠ freier Tag“.
