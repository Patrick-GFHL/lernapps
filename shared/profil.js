/* Gemeinsames Spielerprofil für alle Lern-Apps im Lern-Hub.
   XP, Rang, Name, Lern-Serie und ALLE Erfolge liegen hier – eine neue App startet also nicht bei null.
   Jede App bindet diese Datei mit <script src="../shared/profil.js"></script> ein und nutzt window.LernHub. */
(function(){
  'use strict';
  var KEY = 'lernhub_profil_v1';
  var RANKS = [
    ['Holz',0,'#a0703c'],['Stein',150,'#8a8a8a'],['Kupfer',400,'#d07a45'],['Eisen',800,'#d8d8d8'],
    ['Gold',1400,'#f2c94c'],['Diamant',2200,'#4ee6e0'],['Smaragd',3500,'#3fd07a'],['Amethyst',5000,'#a46be0'],
    ['Obsidian',7000,'#5b4a86'],['Legende',10000,'#ff8a3d']
  ];
  function def(){ return {name:'', xp:0, xpByApp:{}, streak:{last:'',days:0}, ach:{}}; }
  function load(){
    try{ var r = localStorage.getItem(KEY); if(r){ var o = JSON.parse(r); var d = def(); for(var k in o) d[k] = o[k]; return d; } }catch(e){}
    return def();
  }
  var P = load();
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(P)); }catch(e){} }
  function rankIdx(xp){ var r = 0; RANKS.forEach(function(k,i){ if(xp >= k[1]) r = i; }); return r; }
  function day(d){ d = d || new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function appCount(){ return Object.keys(P.xpByApp).filter(function(k){ return P.xpByApp[k] > 0; }).length; }
  function achCount(){ return Object.keys(P.ach).filter(function(k){ return k.indexOf('hub:') !== 0; }).length; }

  /* App-übergreifende Erfolge */
  var GLOBAL = [
    ['apps2','🧭','Allrounder','In 2 verschiedenen Lern-Apps XP gesammelt.',function(){ return appCount() >= 2; }],
    ['apps3','🎓','Universalgenie','In 3 verschiedenen Lern-Apps XP gesammelt.',function(){ return appCount() >= 3; }],
    ['iron','🛡️','Eisenhart','Rang Eisen erreicht.',function(){ return rankIdx(P.xp) >= 3; }],
    ['dia','💎','Diamant!','Rang Diamant erreicht.',function(){ return rankIdx(P.xp) >= 5; }],
    ['obs','🌑','Obsidian','Rang Obsidian erreicht.',function(){ return rankIdx(P.xp) >= 8; }],
    ['leg','👑','Legende','Höchsten Rang erreicht.',function(){ return rankIdx(P.xp) >= 9; }],
    ['str3','📅','Dranbleiber','3 Tage hintereinander gelernt.',function(){ return P.streak.days >= 3; }],
    ['str7','🗓️','Wochen-Held','7 Tage hintereinander gelernt.',function(){ return P.streak.days >= 7; }],
    ['str14','🏅','Eiserner Wille','14 Tage hintereinander gelernt.',function(){ return P.streak.days >= 14; }],
    ['ach25','🏆','Trophäenjäger','25 Erfolge insgesamt (alle Apps zusammen).',function(){ return achCount() >= 25; }]
  ];

  var listeners = [];
  function emit(ev){ listeners.forEach(function(f){ try{ f(ev); }catch(e){} }); }
  function checkGlobal(){
    var news = [];
    GLOBAL.forEach(function(g){
      var id = 'hub:'+g[0];
      if(!P.ach[id] && g[4]()){ P.ach[id] = {t:Date.now(), app:'hub', icon:g[1], name:g[2], desc:g[3]}; news.push(P.ach[id]); }
    });
    if(news.length){ save(); news.forEach(function(a){ emit({type:'ach', ach:a}); }); }
    return news;
  }

  window.LernHub = {
    RANKS: RANKS, GLOBAL: GLOBAL,
    get: function(){ return P; },
    rankIdx: rankIdx,
    rank: function(){ var i = rankIdx(P.xp); return {i:i, cur:RANKS[i], next:RANKS[i+1]||null}; },
    on: function(f){ listeners.push(f); },
    setName: function(n){ P.name = n; save(); },
    addXP: function(app, n){
      var before = rankIdx(P.xp);
      P.xp += n; P.xpByApp[app] = (P.xpByApp[app]||0) + n; save();
      var after = rankIdx(P.xp);
      if(after > before) emit({type:'rank', rank:RANKS[after]});
      checkGlobal();
    },
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
    countApp: function(app){ return Object.keys(P.ach).filter(function(k){ return k.indexOf(app+':') === 0; }).length; },
    achCount: achCount,
    checkGlobal: checkGlobal,
    exportData: function(){ return JSON.parse(JSON.stringify(P)); },
    importData: function(o){ var d = def(); for(var k in o) d[k] = o[k]; P = d; save(); },
    reset: function(){ P = def(); save(); }
  };
})();
