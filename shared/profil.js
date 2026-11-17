/* Gemeinsames Profil für den Lern-Hub.
   Jede App hat ihren EIGENEN Rang, eigene Sterne und eigene Erfolge (Neustart-Gefühl in jeder App).
   Hier liegen nur: Name, Lern-Serie, Gesamt-XP, die Trophäen-Vitrine (alle Erfolge aller Apps)
   und die Meta-Erfolge, die sich automatisch aus Fach und Klassenstufe der Apps ergeben.
   Einbinden mit <script src="../shared/profil.js"></script>, dann window.LernHub nutzen. */
(function(){
  'use strict';
  var KEY = 'lernhub_profil_v1';
  /* Letzter Schultag je Klassenstufe (Baden-Württemberg). Ab diesem Tag kann der versteckte Erfolg
     „Klasse X abgeschlossen“ freigeschaltet werden. Für ein neues Schuljahr einfach eine Zeile ergänzen. */
  var SCHULJAHRESENDE = { 9: '2027-07-28' };
  function def(){ return {name:'', xp:0, xpByApp:{}, streak:{last:'',days:0}, ach:{}, apps:{}, log:[]}; }
  function load(){
    try{ var r = localStorage.getItem(KEY); if(r){ var o = JSON.parse(r); var d = def(); for(var k in o) d[k] = o[k]; if(!d.apps) d.apps = {}; if(!d.log) d.log = []; return d; } }catch(e){}
    return def();
  }
  var P = load();
  ['hub:kl9','hub:fach-chemie'].forEach(function(k){ delete P.ach[k]; });
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(P)); }catch(e){} }
  function day(d){ d = d || new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

  function appIds(){ return Object.keys(P.apps); }
  function played(){ return appIds().filter(function(id){ return (P.xpByApp[id]||0) > 0; }); }
  function achOf(id){ return Object.keys(P.ach).filter(function(k){ return k.indexOf(id+':') === 0; }).length; }
  function complete(id){ var a = P.apps[id]; return a && a.achTotal > 0 && achOf(id) >= a.achTotal; }
  function appAchCount(){ return Object.keys(P.ach).filter(function(k){ return k.indexOf('hub:') !== 0; }).length; }
  function starsAll(){ return appIds().reduce(function(s,id){ return s + (P.apps[id].stars||0); }, 0); }
  function uniq(arr){ return arr.filter(function(v,i){ return arr.indexOf(v) === i; }); }

  /* Meta-Erfolge: feste + automatisch aus den registrierten Apps (je Klassenstufe und je Fach) */
  function globalList(){
    var L = [
      ['apps2','🧭','Allrounder','In 2 verschiedenen Lern-Apps gelernt.',function(){ return played().length >= 2; }],
      ['apps3','🎓','Universalgenie','In 3 verschiedenen Lern-Apps gelernt.',function(){ return played().length >= 3; }],
      ['subj2','🔀','Fächer-Mix','In 2 verschiedenen Fächern gelernt.',function(){ return uniq(played().map(function(id){ return P.apps[id].fach; })).length >= 2; }],
      ['comp1','💯','Komplettist','Alle Erfolge einer App gesammelt.',function(){ return appIds().filter(complete).length >= 1; }],
      ['comp3','🏛️','Sammler-Legende','In 3 Apps alle Erfolge gesammelt.',function(){ return appIds().filter(complete).length >= 3; }],
      ['str3','📅','Dranbleiber','3 Tage hintereinander gelernt.',function(){ return P.streak.days >= 3; }],
      ['str7','🗓️','Wochen-Held','7 Tage hintereinander gelernt.',function(){ return P.streak.days >= 7; }],
      ['str14','🏅','Eiserner Wille','14 Tage hintereinander gelernt.',function(){ return P.streak.days >= 14; }],
      ['ach25','🏆','Trophäenjäger','25 Erfolge in allen Apps zusammen.',function(){ return appAchCount() >= 25; }],
      ['ach100','👑','Trophäenkönig','100 Erfolge in allen Apps zusammen.',function(){ return appAchCount() >= 100; }],
      ['st50','🌌','Sternenhimmel','50 Sterne in allen Apps zusammen.',function(){ return starsAll() >= 50; }]
    ];
    /* Stufen statt „alles komplett“: so bleibt ein Ziel bestehen, auch wenn später neue Apps dazukommen */
    var KL = [[2,'🥉','Bronze'],[4,'🥈','Silber'],[6,'🥇','Gold']];
    uniq(appIds().map(function(id){ return P.apps[id].klasse; }).filter(Boolean)).sort().forEach(function(k){
      var ids = appIds().filter(function(id){ return P.apps[id].klasse === k; });
      KL.forEach(function(t){
        L.push(['kl'+k+'-'+t[0],t[1],'Klasse '+k+' '+t[2],t[0]+' Lern-Apps der Klasse '+k+' komplett (alle Erfolge).',function(){ return ids.filter(complete).length >= t[0]; }]);
      });
    });
    /* Versteckter Erfolg zum Schuljahresende: alle Apps der Klassenstufe komplett */
    Object.keys(SCHULJAHRESENDE).forEach(function(k){
      var end = SCHULJAHRESENDE[k];
      var ids = appIds().filter(function(id){ return String(P.apps[id].klasse) === String(k); });
      if(!ids.length) return;
      L.push(['kl'+k+'-abschluss','🎓','Klasse '+k+' abgeschlossen','Zum Schuljahresende alle Lern-Apps der Klasse '+k+' komplett gesammelt.',
        function(){ return day() >= end && ids.every(complete); }, true]);
    });
    var FA = [[2,'Profi'],[3,'Meister']];
    uniq(appIds().map(function(id){ return P.apps[id].fach; }).filter(Boolean)).sort().forEach(function(f){
      var ids = appIds().filter(function(id){ return P.apps[id].fach === f; });
      FA.forEach(function(t){
        L.push(['fach-'+f.toLowerCase()+'-'+t[0],t[0]===2?'🧪':'🔬',f+'-'+t[1],t[0]+' '+f+'-Apps komplett (alle Erfolge).',function(){ return ids.filter(complete).length >= t[0]; }]);
      });
    });
    return L;
  }

  var listeners = [];
  function emit(ev){ listeners.forEach(function(f){ try{ f(ev); }catch(e){} }); }
  function checkGlobal(){
    var news = [];
    globalList().forEach(function(g){
      var id = 'hub:'+g[0];
      if(!P.ach[id] && g[4]()){ P.ach[id] = {t:Date.now(), app:'hub', icon:g[1], name:g[2], desc:g[3]}; news.push(P.ach[id]); }
    });
    if(news.length){ save(); news.forEach(function(a){ emit({type:'ach', ach:a}); }); }
    return news;
  }

  window.LernHub = {
    get: function(){ return P; },
    on: function(f){ listeners.push(f); },
    globalList: globalList,
    setName: function(n){ P.name = n; save(); },
    /* Jede App meldet sich an: {id, name, icon, fach, klasse, achTotal, maxStars, stars} */
    registerApp: function(info){ var a = P.apps[info.id] || {}; for(var k in info) a[k] = info[k]; P.apps[info.id] = a; save(); checkGlobal(); },
    addXP: function(app, n){ P.xp += n; P.xpByApp[app] = (P.xpByApp[app]||0) + n; save(); checkGlobal(); },
    touchStreak: function(){
      var t = day(); if(P.streak.last === t) return;
      var y = new Date(); y.setDate(y.getDate()-1);
      P.streak.days = (P.streak.last === day(y)) ? P.streak.days + 1 : 1; P.streak.last = t; save(); checkGlobal();
    },
    has: function(app, id){ return !!P.ach[app+':'+id]; },
    unlock: function(app, id, icon, name, desc){
      var k = app+':'+id; if(P.ach[k]) return false;
      P.ach[k] = {t:Date.now(), app:app, icon:icon, name:name, desc:desc}; save(); checkGlobal(); return true;
    },
    /* Lernprotokoll: eine Zeile pro Runde (auch abgebrochene). Wird nur auf diesem Gerät gespeichert. */
    logRound: function(e){ e.t = Date.now(); P.log.push(e); if(P.log.length > 1500) P.log = P.log.slice(-1500); save(); },
    getLog: function(){ return P.log.slice(); },
    countApp: achOf,
    checkGlobal: checkGlobal,
    exportData: function(){ return JSON.parse(JSON.stringify(P)); },
    importData: function(o){ var d = def(); for(var k in o) d[k] = o[k]; if(!d.apps) d.apps = {}; P = d; save(); },
    reset: function(){ P = def(); save(); }
  };
})();
