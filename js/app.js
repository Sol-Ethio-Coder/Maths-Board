/* Math Board: whiteboard for recording math lessons.
   The board is a fixed 1920x1080 space, scaled to any screen. Neat-writing helpers:
   smoothing, hold-to-straighten (lines and circles), pinch-zoom (write small, appears neat), typed text with math symbols. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); }, R = document.documentElement;
  var PAL = { dark: ['#FFFFFF', '#FFD43B', '#4ADE80', '#FF6B6B'], light: ['#111827', '#1D4ED8', '#16A34A', '#DC2626'] };
  var NM = ['Given', 'Key step', 'Answer', 'Mistake'];
  var WS = [['Thin', 4], ['Medium', 8], ['Thick', 14]];
  var SM = [['Off', 1], ['Medium', 0.55], ['Strong', 0.3]];
  var BGS = ['grid', 'lines', 'plain'];
  var SYMS = ['²', '³', '√', 'π', 'θ', '∞', '±', '×', '÷', '≤', '≥', '≠', '∈', '∉', '⊆', '⊂', '∪', '∩', '∅', '∑', '∫', '→', '°', '½'];
  var FONT = '"Cambria Math","STIX Two Math","Segoe UI Symbol","DejaVu Sans",Calibri,Arial,sans-serif';
  var TYPES = { pen: 1, line: 1, circle: 1, box: 1, text: 1 };
  var cv = $('#ink'), cx = cv.getContext('2d'), bd = $('#board'), bar = $('#bar'), stage = $('#stage');
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('mb.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('mb.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var th = store.get('th', 'dark'), bg = store.get('bg', 'grid'), col = store.get('col', 0), wid = store.get('wid', 8), sm = store.get('sm', 1);
  var tool = 'pen', S = [], hist = [], cur = null, k = 1, dpr = 1, statusTxt = '', installEv = null, more = false;
  var view = { z: 1, ox: 0, oy: 0 }, ptrs = {}, nptr = 0, g = null, pan = null, lock = false, lp = [0, 0], ha = [0, 0], holdT = null, pending = null;

  /* ---------- drawing ---------- */
  function penPath(c, p) {
    c.moveTo(p[0], p[1]);
    if (p.length <= 2) { c.lineTo(p[0] + 0.1, p[1]); return; }
    if (p.length === 4) { c.lineTo(p[2], p[3]); return; }
    for (var i = 2; i < p.length - 2; i += 2) c.quadraticCurveTo(p[i], p[i + 1], (p[i] + p[i + 2]) / 2, (p[i + 1] + p[i + 3]) / 2);
    c.lineTo(p[p.length - 2], p[p.length - 1]);
  }
  function seg(s, c) {
    c = c || cx; c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = s.w; c.strokeStyle = c.fillStyle = PAL[th][s.c];
    var p = s.p;
    if (s.t === 'text') { c.font = s.w + 'px ' + FONT; c.textBaseline = 'top'; c.fillText(s.s, p[0], p[1]); c.restore(); return; }
    c.beginPath();
    if (s.t === 'pen') penPath(c, p);
    else if (s.t === 'line') { c.moveTo(p[0], p[1]); c.lineTo(p[2], p[3]); }
    else if (s.t === 'circle') c.arc(p[0], p[1], Math.hypot(p[2] - p[0], p[3] - p[1]), 0, 7);
    else c.rect(p[0], p[1], p[2] - p[0], p[3] - p[1]);
    c.stroke(); c.restore();
  }
  function live(s, a, b) {               /* fast incremental drawing while the pen is moving */
    cx.save(); cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.lineWidth = s.w; cx.strokeStyle = PAL[th][s.c]; cx.beginPath();
    cx.moveTo(s.p[a], s.p[a + 1]); for (var i = a + 2; i < b; i += 2) cx.lineTo(s.p[i], s.p[i + 1]); cx.stroke(); cx.restore();
  }
  function redraw() {
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height);
    cx.setTransform(k * dpr * view.z, 0, 0, k * dpr * view.z, k * dpr * view.ox, k * dpr * view.oy);
    S.forEach(function (s) { seg(s); }); if (cur) seg(cur);
  }
  function setView(z, ox, oy) {
    z = Math.max(1, Math.min(4, z)); view.z = z;
    view.ox = Math.max(1920 * (1 - z), Math.min(0, ox)); view.oy = Math.max(1080 * (1 - z), Math.min(0, oy));
    bd.style.setProperty('--s', (60 * k * z) + 'px'); bd.style.setProperty('--s2', (90 * k * z) + 'px');
    bd.style.backgroundPosition = (view.ox * k) + 'px ' + (view.oy * k) + 'px'; redraw();
    var zl = $('#zl'); if (zl) zl.textContent = Math.round(z * 100) + '%';
  }
  function zoomAt(f, mx, my) {
    var z = Math.max(1, Math.min(4, view.z * f)), bx = (mx - view.ox) / view.z, by = (my - view.oy) / view.z; setView(z, mx - bx * z, my - by * z);
  }
  var lw = 0, lh = 0;
  function layout(force) {                /* re-fit the board whenever the free space changes (toolbar opened, hidden, rotated...) */
    var sw = stage.clientWidth, sh = stage.clientHeight;
    if (!force && sw === lw && sh === lh) return; lw = sw; lh = sh;
    k = Math.min(sw / 1920, sh / 1080) || 1; dpr = window.devicePixelRatio || 1;
    var w = Math.floor(1920 * k), h = Math.floor(1080 * k);
    bd.style.width = w + 'px'; bd.style.height = h + 'px'; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    cv.width = Math.floor(w * dpr); cv.height = Math.floor(h * dpr); setView(view.z, view.ox, view.oy);
  }
  function sv(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 1920, (e.clientY - r.top) / r.height * 1080]; }
  function pt(e) { var s = sv(e); return [Math.round((s[0] - view.ox) / view.z), Math.round((s[1] - view.oy) / view.z)]; }

  /* ---------- board actions (each one is also sent to connected devices) ---------- */
  function send(m) { Sync.send(m); }
  function add(s) { S.push(s); hist.push('add'); if (hist.length > 60) hist.shift(); send({ op: 'add', s: s }); redraw(); }
  function undo() {
    var h = hist.pop(); if (!h) return;
    if (h === 'add') { S.pop(); send({ op: 'undo' }); } else { S = h.prev; send({ op: 'full', S: S }); }
    redraw();
  }
  function eraseAll() {                       /* Eraser = clear the whole board. Undo brings it back. */
    if (!S.length) return; hist.push({ prev: S }); if (hist.length > 60) hist.shift(); S = []; send({ op: 'clear' }); redraw();
  }
  function tmpl(n) {
    var b = function (t, p) { add({ t: t, c: 0, w: 5, p: p }); };
    if (n === 'venn') { b('circle', [760, 540, 760, 240]); b('circle', [1160, 540, 1160, 240]); }
    if (n === 'line') { b('line', [160, 540, 1760, 540]); for (var i = 0; i <= 10; i++) b('line', [160 + i * 160, 515, 160 + i * 160, 565]); }
    if (n === 'axes') { b('line', [960, 100, 960, 980]); b('line', [160, 540, 1760, 540]); }
  }
  function validStroke(s) {
    if (!s || typeof s !== 'object' || !TYPES[s.t] || !(s.c >= 0 && s.c <= 3) || !(s.w > 0 && s.w <= 300) || !Array.isArray(s.p) || s.p.length > 2000) return false;
    if (s.t === 'text') return typeof s.s === 'string' && s.s.length <= 200 && s.p.length === 2;
    return s.p.every(function (n) { return typeof n === 'number' && isFinite(n); });
  }

  /* ---------- neat-writing helper: hold still at the end of a stroke to straighten it ---------- */
  function armHold() { clearTimeout(holdT); if (cur && cur.t === 'pen' && cur.p.length >= 8) holdT = setTimeout(snap, 550); }
  function snap() {
    if (!cur || cur.t !== 'pen') return;
    var p = cur.p, n = p.length / 2, sx = p[0], sy = p[1], ex = p[p.length - 2], ey = p[p.length - 1], i;
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (i = 0; i < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); }
    var diag = Math.hypot(x1 - x0, y1 - y0) || 1, L = Math.hypot(ex - sx, ey - sy), ok = false;
    if (L < diag * 0.25) {                    /* closed shape: circle? */
      var cx0 = (x0 + x1) / 2, cy0 = (y0 + y1) / 2, m = 0, v = 0, d;
      for (i = 0; i < p.length; i += 2) m += Math.hypot(p[i] - cx0, p[i + 1] - cy0); m /= n;
      for (i = 0; i < p.length; i += 2) { d = Math.hypot(p[i] - cx0, p[i + 1] - cy0) - m; v += d * d; }
      if (Math.sqrt(v / n) / m < 0.22) { cur.t = 'circle'; cur.p = [cx0, cy0, cx0 + m, cy0]; ok = true; }
    } else {                                  /* open shape: straight line? */
      var dev = 0; for (i = 0; i < p.length; i += 2) dev = Math.max(dev, Math.abs((ex - sx) * (sy - p[i + 1]) - (sx - p[i]) * (ey - sy)) / L);
      if (dev < L * 0.08) {
        var x2 = ex, y2 = ey; if (Math.abs(ey - sy) < L * 0.07) y2 = sy; else if (Math.abs(ex - sx) < L * 0.07) x2 = sx;
        cur.t = 'line'; cur.p = [sx, sy, x2, y2]; ok = true;
      }
    }
    if (ok) redraw();
  }

  /* ---------- input (mouse, touch, pen; pinch to zoom; two fingers to move) ---------- */
  cv.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    ptrs[e.pointerId] = sv(e); nptr = Object.keys(ptrs).length;
    try { cv.setPointerCapture(e.pointerId); } catch (x) {}
    if (nptr === 2) {
      if (cur) { cur = null; clearTimeout(holdT); redraw(); } pan = null;
      var ids = Object.keys(ptrs), a = ptrs[ids[0]], b = ptrs[ids[1]];
      g = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, mx: (a[0] + b[0]) / 2, my: (a[1] + b[1]) / 2, z: view.z, ox: view.ox, oy: view.oy }; lock = true; return;
    }
    if (nptr > 2 || lock) return;
    var p = pt(e), x = p[0], y = p[1];
    if (tool === 'pan') { var s0 = ptrs[e.pointerId]; pan = { sx: s0[0], sy: s0[1], ox: view.ox, oy: view.oy }; return; }
    if (tool === 'text') { openText(x, y); return; }
    cur = { t: tool, c: col, w: wid, p: tool === 'pen' ? [x, y] : [x, y, x, y] }; lp = [x, y]; ha = [x, y]; redraw();
  });
  cv.addEventListener('pointermove', function (e) {
    if (!ptrs[e.pointerId]) return; ptrs[e.pointerId] = sv(e);
    if (g) {
      var ids = Object.keys(ptrs), a = ptrs[ids[0]], b = ptrs[ids[1]]; if (!a || !b) return;
      var d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      var z = Math.max(1, Math.min(4, g.z * d / g.d)), bx = (g.mx - g.ox) / g.z, by = (g.my - g.oy) / g.z; setView(z, mx - bx * z, my - by * z); return;
    }
    if (pan) { var s1 = ptrs[e.pointerId]; setView(view.z, pan.ox + s1[0] - pan.sx, pan.oy + s1[1] - pan.sy); return; }
    if (!cur || nptr !== 1) return;
    var p = pt(e), x = p[0], y = p[1], q = cur.p;
    if (cur.t === 'pen') {
      var al = SM[sm][1]; lp = [lp[0] + (x - lp[0]) * al, lp[1] + (y - lp[1]) * al];
      var fx = Math.round(lp[0]), fy = Math.round(lp[1]), n = q.length;
      if (Math.hypot(fx - q[n - 2], fy - q[n - 1]) < 1.5) return;
      q.push(fx, fy); live(cur, n - 2, n + 2);
      if (Math.hypot(x - ha[0], y - ha[1]) > 8) { ha = [x, y]; armHold(); }
      if (q.length >= 800) { var c = cur; cur = { t: c.t, c: c.c, w: c.w, p: [fx, fy] }; S.push(c); send({ op: 'add', s: c }); }
    } else { q[2] = x; q[3] = y; redraw(); }
  });
  function up(e) {
    if (!ptrs[e.pointerId]) return; delete ptrs[e.pointerId]; nptr = Object.keys(ptrs).length;
    if (g && nptr < 2) g = null; pan = null;
    if (nptr === 0) {
      lock = false; clearTimeout(holdT);
      if (cur) {
        if (cur.t === 'pen') { var p = pt(e), q = cur.p; if (Math.hypot(p[0] - q[q.length - 2], p[1] - q[q.length - 1]) > 1.5) q.push(p[0], p[1]); }
        var c = cur; cur = null; add(c);
      }
    }
  }
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  cv.addEventListener('wheel', function (e) { e.preventDefault(); var s = sv(e); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, s[0], s[1]); }, { passive: false });

  /* ---------- typed text with math symbols (always neat) ---------- */
  function openText(x, y) { pending = [x, y]; $('#tp').hidden = false; var t = $('#ti'); t.value = ''; setTimeout(function () { t.focus(); }, 0); }
  function closeText() { $('#tp').hidden = true; pending = null; }
  function fix(s) {
    return s.replace(/\^2/g, '²').replace(/\^3/g, '³').replace(/<=/g, '≤').replace(/>=/g, '≥').replace(/!=/g, '≠').replace(/->/g, '→')
      .replace(/\bsqrt\b/gi, '√').replace(/\bpi\b/gi, 'π').replace(/\btheta\b/gi, 'θ').replace(/\binf\b/gi, '∞');
  }
  function placeText() {
    var v = fix($('#ti').value.trim()); if (v && pending) add({ t: 'text', c: col, w: wid * 6 + 32, p: pending, s: v.slice(0, 200) }); closeText();
  }
  (function () {
    var sy = $('#sym'), ti = $('#ti');
    SYMS.forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = c;
      b.onmousedown = function (e) { e.preventDefault(); };
      b.onclick = function () { var a = ti.selectionStart || 0, z = ti.selectionEnd || 0; ti.value = ti.value.slice(0, a) + c + ti.value.slice(z); ti.focus(); ti.setSelectionRange(a + 1, a + 1); };
      sy.appendChild(b);
    });
    $('#tok').onclick = placeText; $('#tcn').onclick = closeText;
    ti.addEventListener('keydown', function (e) { if (e.key === 'Enter') placeText(); else if (e.key === 'Escape') closeText(); });
  })();

  /* ---------- sync with other devices ---------- */
  Sync.onStatus = function (t) { statusTxt = t; var el = $('#st'); if (el) el.textContent = t; };
  Sync.onMsg = function (d, c) {
    if (!d || typeof d !== 'object') return;
    if (d.op === 'peer-joined') { Sync.sendTo(c, { op: 'full', S: S }); return; }
    if (d.op === 'add' && validStroke(d.s)) S.push(d.s);
    else if (d.op === 'undo') S.pop();
    else if (d.op === 'clear') S = [];
    else if (d.op === 'full' && Array.isArray(d.S)) S = d.S.filter(validStroke).slice(0, 3000);
    else return;
    redraw();
  };
  function copyLink() {
    if (!Sync.code) return; var l = Sync.link();
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(l).catch(function () { window.prompt('Copy this link', l); });
    else window.prompt('Copy this link', l);
  }
  function joinPrompt() { var c = window.prompt('Enter the room code from your other device'); if (c) location.search = '?room=' + c.trim().toUpperCase(); }

  /* ---------- extras ---------- */
  function savePNG() {
    var o = document.createElement('canvas'); o.width = 1920; o.height = 1080; var x = o.getContext('2d');
    x.fillStyle = getComputedStyle(bd).backgroundColor; x.fillRect(0, 0, 1920, 1080); S.forEach(function (s) { seg(s, x); });
    var a = document.createElement('a'); a.download = 'math-board.png'; a.href = o.toDataURL('image/png'); a.click();
  }
  function fullscreen() { if (document.fullscreenElement) document.exitFullscreen(); else if (R.requestFullscreen) R.requestFullscreen().catch(function () {}); }
  function keepAwake() { try { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(function () {}); } catch (e) {} }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') keepAwake(); });
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEv = e; ui(); });
  function setBg(v) { bd.className = v; store.set('bg', v); }

  /* ---------- toolbar ---------- */
  function ui() {
    bar.innerHTML = '';
    var B = function (t, f, on, cls, host) {
      var b = document.createElement('button'); b.innerHTML = t; b.type = 'button';
      b.onclick = function () { f(); ui(); }; if (on) b.className = 'on'; if (cls) b.className += ' ' + cls; (host || bar).appendChild(b);
    }, sp = function (h) { (h || bar).appendChild(document.createElement('i')); };
    PAL[th].forEach(function (c, i) { B('<span class="d" style="background:' + c + '"></span>' + NM[i], function () { col = i; store.set('col', i); }, col === i); }); sp();
    [['Pen', 'pen'], ['Line', 'line'], ['Circle', 'circle'], ['Box', 'box'], ['Text', 'text'], ['Move', 'pan']].forEach(function (a) { B(a[0], function () { tool = a[1]; closeText(); }, tool === a[1]); }); sp();
    WS.forEach(function (a) { B(a[0], function () { wid = a[1]; store.set('wid', wid); }, wid === a[1]); }); sp();
    B('Undo', undo); B('Eraser (clear all)', eraseAll, false, 'danger'); sp();
    B('Zoom −', function () { zoomAt(1 / 1.4, 960, 540); }); B('Zoom +', function () { zoomAt(1.4, 960, 540); }); B('Fit', function () { setView(1, 0, 0); });
    var zl = document.createElement('span'); zl.id = 'zl'; zl.textContent = Math.round(view.z * 100) + '%'; zl.style.fontSize = '12px'; bar.appendChild(zl); sp();
    B(more ? 'Less ▴' : 'More ▾', function () { more = !more; }, more); B('Hide bar', hide);
    var st = document.createElement('span'); st.id = 'st'; st.textContent = statusTxt; bar.appendChild(st);
    if (more) {
      var sub = document.createElement('div'); sub.className = 'sub'; bar.appendChild(sub);
      SM.forEach(function (a, i) { B('Smooth: ' + a[0], function () { sm = i; store.set('sm', i); }, sm === i, '', sub); }); sp(sub);
      B('Background: ' + bg, function () { bg = BGS[(BGS.indexOf(bg) + 1) % 3]; setBg(bg); }, false, '', sub);
      B(th === 'dark' ? 'Light board' : 'Dark board', function () { th = th === 'dark' ? 'light' : 'dark'; R.dataset.t = th; store.set('th', th); redraw(); }, false, '', sub); sp(sub);
      B('Venn', function () { tmpl('venn'); }, false, '', sub); B('Number line', function () { tmpl('line'); }, false, '', sub); B('Axes', function () { tmpl('axes'); }, false, '', sub); sp(sub);
      B('Save PNG', savePNG, false, '', sub); B('Copy link', copyLink, false, '', sub); B('Join', joinPrompt, false, '', sub); B('Sync now', function () { send({ op: 'full', S: S }); }, false, '', sub);
      if (document.fullscreenEnabled) B('Full screen', fullscreen, false, '', sub);
      if (installEv) B('Install app', function () { installEv.prompt(); installEv = null; }, false, '', sub);
    }
    var dv = document.createElement('a'); dv.id = 'dev'; dv.href = 'https://sol-ethio-coder.netlify.app'; dv.target = '_blank'; dv.rel = 'noopener noreferrer';
    dv.title = 'Developer: Sol Ethio Coder'; dv.innerHTML = '<img src="/icons/dev-logo.svg" alt="" width="22" height="22"><span>Developer: Sol Ethio Coder</span>'; bar.appendChild(dv);
    layout();                              /* the toolbar height may have changed: fit the board into what is left */
  }
  function hide() { bar.style.display = 'none'; $('#show').style.display = 'block'; layout(); }
  function show() { bar.style.display = 'flex'; $('#show').style.display = 'none'; layout(); ui(); }
  $('#show').onclick = show;
  addEventListener('keydown', function (e) {
    if (e.target && e.target.tagName === 'INPUT') return;
    var c = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && c === 'z') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (c >= '1' && c <= '4') col = +c - 1;
    else if (c === 'p') tool = 'pen'; else if (c === 'l') tool = 'line'; else if (c === 'c') tool = 'circle'; else if (c === 'b') tool = 'box';
    else if (c === 'x') tool = 'text'; else if (c === 'm') tool = 'pan';
    else if (c === 'e') eraseAll();
    else if (c === 'g') { bg = BGS[(BGS.indexOf(bg) + 1) % 3]; setBg(bg); }
    else if (c === '+' || c === '=') zoomAt(1.4, 960, 540); else if (c === '-') zoomAt(1 / 1.4, 960, 540); else if (c === '0') setView(1, 0, 0);
    else if (c === 'h') { if (bar.style.display === 'none') show(); else hide(); return; }
    else return;
    ui();
  });
  addEventListener('resize', function () { layout(true); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', function () { layout(); });
  if (window.ResizeObserver) new ResizeObserver(function () { window.requestAnimationFrame(function () { layout(); }); }).observe(stage);

  /* ---------- start ---------- */
  R.dataset.t = th; setBg(BGS.indexOf(bg) < 0 ? 'grid' : bg); ui(); layout(); keepAwake();
  var room = (new URLSearchParams(location.search).get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  Sync.start(room || undefined);
})();
