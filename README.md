# Lern-Hub

Lern-Apps mit Sternen, XP und Erfolgen. Läuft über GitHub Pages: https://patrick-gfhl.github.io/lernapps/

Neue App: eigenen Ordner anlegen, in `index.html` (Liste `APPS`) eintragen und in `sw.js` (Liste `FILES`) ergänzen, Cache-Version hochzählen. Jede App hat eigenen Rang/Sterne/Erfolge. `shared/profil.js` einbinden, mit `LernHub.registerApp({id,name,icon,fach,klasse,achTotal,maxStars,stars})` anmelden und Erfolge per `LernHub.unlock(...)` melden – daraus entstehen automatisch Meta-Erfolge (z. B. „Klasse 9 komplett“, „Chemie-Meister“).
