/* Math Board: whiteboard for recording math lessons.
   The board is a fixed 1920x1080 space, scaled to any screen.
   Neat writing: smoothing, hold-to-straighten, pinch-zoom, typed text with maths symbols, graph plotter.
   Teaching: pages, laser pointer, highlighter, arrows, object eraser, countdown timer, live view link, autosave, save/open files. */
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
  var TYPES = { pen: 1, line: 1, arrow: 1, circle: 1, ellipse: 1, box: 1, text: 1 };
  var SHAPE = { line: 1, arrow: 1, circle: 1, ellipse: 1, box: 1 };
  var MAXP = 40;
  var cv = $('#ink'), cx = cv.getContext('2d'), fx = $('#fx'), fcx = fx.getContext('2d'), bd = $('#board'), bar = $('#bar'), stage = $('#stage');
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('mb.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('mb.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var qs = new URLSearchParams(location.search);
  var room = (qs.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8), VIEW = !!room && qs.get('view') === '1';
  var th = store.get('th', 'dark'), bg = store.get('bg', 'grid'), col = store.get('col', 0), wid = store.get('wid', 8), sm = store.get('sm', 1);
  var tool = 'pen', P = [[]], pg = 0, S = P[0], hist = [], cur = null, k = 1, dpr = 1, statusTxt = '', installEv = null, more = false;
  var view = { z: 1, ox: 0, oy: 0 }, ptrs = {}, nptr = 0, g = null, pan = null, lock = false, lp = [0, 0], ha = [0, 0], holdT = null, pending = null;
  var rubbed = 0, prevS = null, lasering = false;

  function uid() { return Math.random().toString(36).slice(2, 8); }

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
    if (s.h) c.globalAlpha = 0.38;
    var p = s.p;
    if (s.t === 'text') { c.font = s.w + 'px ' + FONT; c.textBaseline = 'top'; c.fillText(s.s, p[0], p[1]); c.restore(); return; }
    c.beginPath();
    if (s.t === 'pen') penPath(c, p);
    else if (s.t === 'line') { c.moveTo(p[0], p[1]); c.lineTo(p[2], p[3]); }
    else if (s.t === 'arrow') {
      var a = Math.atan2(p[3] - p[1], p[2] - p[0]), L = Math.min(Math.hypot(p[2] - p[0], p[3] - p[1]) * 0.5, 22 + s.w * 2.5);
      c.moveTo(p[0], p[1]); c.lineTo(p[2], p[3]);
      c.moveTo(p[2] - L * Math.cos(a - 0.45), p[3] - L * Math.sin(a - 0.45)); c.lineTo(p[2], p[3]); c.lineTo(p[2] - L * Math.cos(a + 0.45), p[3] - L * Math.sin(a + 0.45));
    }
    else if (s.t === 'circle') c.arc(p[0], p[1], Math.hypot(p[2] - p[0], p[3] - p[1]), 0, 7);
    else if (s.t === 'ellipse') c.ellipse((p[0] + p[2]) / 2, (p[1] + p[3]) / 2, Math.abs(p[2] - p[0]) / 2 + 0.01, Math.abs(p[3] - p[1]) / 2 + 0.01, 0, 0, 7);
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
    bd.style.width = w + 'px'; bd.style.height = h + 'px';
    [cv, fx].forEach(function (c) { c.style.width = w + 'px'; c.style.height = h + 'px'; c.width = Math.floor(w * dpr); c.height = Math.floor(h * dpr); });
    setView(view.z, view.ox, view.oy);
  }
  function sv(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 1920, (e.clientY - r.top) / r.height * 1080]; }
  function pt(e) { var s = sv(e); return [Math.round((s[0] - view.ox) / view.z), Math.round((s[1] - view.oy) / view.z)]; }

  /* ---------- strokes, pages and sync messages ---------- */
  function validStroke(s) {
    if (!s || typeof s !== 'object' || !TYPES[s.t] || !(s.c >= 0 && s.c <= 3) || !(s.w > 0 && s.w <= 300) || !Array.isArray(s.p) || s.p.length > 2000) return false;
    if (s.id !== undefined && (typeof s.id !== 'string' || s.id.length > 16)) return false;
    if (s.t === 'text') return typeof s.s === 'string' && s.s.length <= 200 && s.p.length === 2 && s.p.every(isFinite);
    return s.p.length >= 2 && s.p.every(function (n) { return typeof n === 'number' && isFinite(n); });
  }
  function accept(s) { if (!validStroke(s)) return null; if (!s.id) s.id = uid(); return s; }
  function send(m) { if (m.p === undefined) m.p = pg; Sync.send(m); }
  function setS(a) { P[pg] = S = a; }
  var saveT = null;
  function persist() { clearTimeout(saveT); saveT = setTimeout(function () { store.set('board', { v: 2, P: P, pg: pg }); }, 700); }
  function pushHist(h) { hist.push(h); if (hist.length > 60) hist.shift(); }
  function sendPage(p) {                      /* send one page in small parts */
    var a = P[p] || [], i = 0, first = true;
    do {
      var gg = [], n = 0;
      while (i < a.length && (!gg.length || n < 12000)) { var j = JSON.stringify(a[i]).length; if (gg.length && n + j > 12000) break; gg.push(a[i++]); n += j; }
      Sync.send({ op: 'batch', p: p, reset: first, g: gg }); first = false;
    } while (i < a.length);
  }
  function sendAll() { Sync.send({ op: 'reset', n: P.length, cur: pg }); for (var p = 0; p < P.length; p++) sendPage(p); }
  function commit(s) { if (!s.id) s.id = uid(); S.push(s); send({ op: 'add', s: s }); persist(); }
  function add(s) { commit(s); pushHist({ k: 'add', n: 1 }); redraw(); }
  function addMany(a) { a.forEach(commit); pushHist({ k: 'add', n: a.length }); redraw(); }
  function undo() {
    var h = hist.pop(); if (!h) return;
    if (h.k === 'add') { S.splice(S.length - h.n, h.n); send({ op: 'undo', n: h.n }); } else { setS(h.prev); sendPage(pg); }
    redraw(); persist();
  }
  function eraseAll() {                       /* Eraser = clear the whole page. Undo brings it back. */
    if (!S.length) return; pushHist({ k: 'clear', prev: S }); setS([]); send({ op: 'clear' }); redraw(); persist();
  }
  function pageUi() { var l = $('#pl'); if (l) l.textContent = (pg + 1) + '/' + P.length; }
  function goPage(n, quiet) {
    n = Math.max(0, Math.min(P.length - 1, n)); if (n === pg) return;
    pg = n; S = P[pg]; hist = []; cur = null; redraw(); if (!quiet) send({ op: 'goto', p: n }); pageUi(); persist();
  }
  function newPage() { if (P.length >= MAXP) return; P.push([]); pg = P.length - 1; S = P[pg]; hist = []; send({ op: 'addpage' }); redraw(); pageUi(); persist(); }
  function delPage() {
    if (P.length === 1) { eraseAll(); return; }
    var di = pg; P.splice(di, 1); pg = Math.min(di, P.length - 1); S = P[pg]; hist = []; send({ op: 'delpage', p: di, cur: pg }); redraw(); pageUi(); persist();
  }
  function newBoard() {
    if (!window.confirm('Start a new board? All pages will be cleared (you can save the board to a file first).')) return;
    P = [[]]; pg = 0; S = P[0]; hist = []; send({ op: 'reset', n: 1, cur: 0 }); redraw(); pageUi(); persist();
  }
  function tmpl(n) {
    var b = function (t, p) { return { t: t, c: 0, w: 5, p: p }; }, a = [];
    if (n === 'venn') a.push(b('circle', [760, 540, 760, 240]), b('circle', [1160, 540, 1160, 240]));
    if (n === 'line') { a.push(b('line', [160, 540, 1760, 540])); for (var i = 0; i <= 10; i++) a.push(b('line', [160 + i * 160, 515, 160 + i * 160, 565])); }
    if (n === 'axes') a.push(b('line', [960, 100, 960, 980]), b('line', [160, 540, 1760, 540]));
    addMany(a);
  }

  /* ---------- object eraser ("Rub out") ---------- */
  function dseg(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l)) : 0;
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }
  function hit(s, x, y, r) {
    var p = s.p, w = s.w / 2 + r, i;
    if (s.t === 'text') { var wd = s.s.length * s.w * 0.55; return x >= p[0] - r && x <= p[0] + wd + r && y >= p[1] - r && y <= p[1] + s.w * 1.2 + r; }
    if (s.t === 'pen') { if (p.length < 4) return Math.hypot(x - p[0], y - p[1]) <= w; for (i = 0; i < p.length - 2; i += 2) if (dseg(x, y, p[i], p[i + 1], p[i + 2], p[i + 3]) <= w) return true; return false; }
    if (s.t === 'line' || s.t === 'arrow') return dseg(x, y, p[0], p[1], p[2], p[3]) <= w;
    if (s.t === 'circle') return Math.abs(Math.hypot(x - p[0], y - p[1]) - Math.hypot(p[2] - p[0], p[3] - p[1])) <= w;
    if (s.t === 'ellipse') { var ex = (p[0] + p[2]) / 2, ey = (p[1] + p[3]) / 2, rx = Math.abs(p[2] - p[0]) / 2 || 1, ry = Math.abs(p[3] - p[1]) / 2 || 1; return Math.abs(Math.hypot((x - ex) / rx, (y - ey) / ry) - 1) * Math.min(rx, ry) <= w; }
    var x0 = Math.min(p[0], p[2]), x1 = Math.max(p[0], p[2]), y0 = Math.min(p[1], p[3]), y1 = Math.max(p[1], p[3]);
    return dseg(x, y, x0, y0, x1, y0) <= w || dseg(x, y, x1, y0, x1, y1) <= w || dseg(x, y, x1, y1, x0, y1) <= w || dseg(x, y, x0, y1, x0, y0) <= w;
  }
  function rubAt(x, y) {
    var r = 16 / view.z, gone = S.filter(function (s) { return hit(s, x, y, r); });
    if (!gone.length) return;
    setS(S.filter(function (s) { return gone.indexOf(s) < 0; })); rubbed += gone.length;
    send({ op: 'del', ids: gone.map(function (s) { return s.id; }) }); redraw(); persist();
  }

  /* ---------- laser pointer (not saved) ---------- */
  var trail = [], raf = 0, lastL = 0;
  function laserAt(x, y, remote) {
    trail.push({ x: x, y: y, t: Date.now() }); if (trail.length > 90) trail.shift(); if (!raf) raf = requestAnimationFrame(frame);
    if (!remote) { var n = Date.now(); if (n - lastL > 45) { lastL = n; Sync.send({ op: 'laser', x: x, y: y }); } }
  }
  function frame() {
    raf = 0; var now = Date.now(); trail = trail.filter(function (d) { return now - d.t < 900; });
    fcx.setTransform(1, 0, 0, 1, 0, 0); fcx.clearRect(0, 0, fx.width, fx.height);
    fcx.setTransform(k * dpr * view.z, 0, 0, k * dpr * view.z, k * dpr * view.ox, k * dpr * view.oy);
    trail.forEach(function (d) { var a = 1 - (now - d.t) / 900; fcx.beginPath(); fcx.fillStyle = 'rgba(255,60,60,' + (a * 0.85).toFixed(2) + ')'; fcx.arc(d.x, d.y, 7 + 9 * a, 0, 7); fcx.fill(); });
    if (trail.length) raf = requestAnimationFrame(frame);
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
    if (VIEW) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    ptrs[e.pointerId] = sv(e); nptr = Object.keys(ptrs).length;
    try { cv.setPointerCapture(e.pointerId); } catch (x) {}
    if (nptr === 2) {
      if (cur) { cur = null; clearTimeout(holdT); redraw(); } pan = null; lasering = false;
      var ids = Object.keys(ptrs), a = ptrs[ids[0]], b = ptrs[ids[1]];
      g = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, mx: (a[0] + b[0]) / 2, my: (a[1] + b[1]) / 2, z: view.z, ox: view.ox, oy: view.oy }; lock = true; return;
    }
    if (nptr > 2 || lock) return;
    var p = pt(e), x = p[0], y = p[1];
    if (tool === 'pan') { var s0 = ptrs[e.pointerId]; pan = { sx: s0[0], sy: s0[1], ox: view.ox, oy: view.oy }; return; }
    if (tool === 'text') { openText(x, y); return; }
    if (tool === 'laser') { lasering = true; laserAt(x, y); return; }
    if (tool === 'rub') { prevS = S.slice(); rubbed = 0; rubAt(x, y); return; }
    if (tool === 'hl') cur = { t: 'pen', c: col, w: wid * 3, h: 1, p: [x, y] };
    else cur = { t: tool, c: col, w: wid, p: tool === 'pen' ? [x, y] : [x, y, x, y] };
    lp = [x, y]; ha = [x, y]; redraw();
  });
  cv.addEventListener('pointermove', function (e) {
    if (VIEW) return;
    if (tool === 'laser' && nptr < 2) { var lq = pt(e); laserAt(lq[0], lq[1]); return; }   /* the laser follows the pointer even without pressing */
    if (!ptrs[e.pointerId]) return; ptrs[e.pointerId] = sv(e);
    if (g) {
      var ids = Object.keys(ptrs), a = ptrs[ids[0]], b = ptrs[ids[1]]; if (!a || !b) return;
      var d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      var z = Math.max(1, Math.min(4, g.z * d / g.d)), bx = (g.mx - g.ox) / g.z, by = (g.my - g.oy) / g.z; setView(z, mx - bx * z, my - by * z); return;
    }
    if (pan) { var s1 = ptrs[e.pointerId]; setView(view.z, pan.ox + s1[0] - pan.sx, pan.oy + s1[1] - pan.sy); return; }
    if (tool === 'rub' && nptr === 1) { var rq = pt(e); rubAt(rq[0], rq[1]); return; }
    if (!cur || nptr !== 1) return;
    var p = pt(e), x = p[0], y = p[1], q = cur.p;
    if (cur.t === 'pen') {
      var al = SM[sm][1]; lp = [lp[0] + (x - lp[0]) * al, lp[1] + (y - lp[1]) * al];
      var fx0 = Math.round(lp[0]), fy0 = Math.round(lp[1]), n = q.length;
      if (Math.hypot(fx0 - q[n - 2], fy0 - q[n - 1]) < 1.5) return;
      q.push(fx0, fy0); if (cur.h) redraw(); else live(cur, n - 2, n + 2);
      if (Math.hypot(x - ha[0], y - ha[1]) > 8) { ha = [x, y]; armHold(); }
      if (q.length >= 800) { var c = cur; cur = { t: c.t, c: c.c, w: c.w, h: c.h, p: [fx0, fy0] }; commit(c); }
    } else { q[2] = x; q[3] = y; redraw(); }
  });
  function up(e) {
    if (VIEW || !ptrs[e.pointerId]) return; delete ptrs[e.pointerId]; nptr = Object.keys(ptrs).length;
    if (g && nptr < 2) g = null; pan = null;
    if (nptr === 0) {
      lock = false; lasering = false; clearTimeout(holdT);
      if (tool === 'rub' && rubbed) { pushHist({ k: 'del', prev: prevS }); rubbed = 0; }
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
  function openText(x, y) { pending = [x, y]; closeGraph(); $('#tp').hidden = false; var t = $('#ti'); t.value = ''; setTimeout(function () { t.focus(); }, 0); }
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

  /* ---------- graph plotter ---------- */
  function niceStep(r) { if (!(r > 0)) return 1; var e = Math.pow(10, Math.floor(Math.log10(r))), f = r / e; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * e; }
  function fmtNum(v) { return String(+v.toFixed(6)).replace('-', '−'); }
  function openGraph() { closeText(); $('#gp').hidden = false; $('#gerr').textContent = ''; setTimeout(function () { $('#gf').focus(); }, 0); }
  function closeGraph() { $('#gp').hidden = true; }
  function plotGraph() {
    var err = $('#gerr'), f; err.textContent = '';
    try { f = MathExpr.compile($('#gf').value); } catch (e) { err.textContent = e.message; return; }
    var x0 = parseFloat($('#gx0').value), x1 = parseFloat($('#gx1').value), y0 = parseFloat($('#gy0').value), y1 = parseFloat($('#gy1').value);
    if (!(x1 > x0) || !(y1 > y0) || [x0, x1, y0, y1].some(function (n) { return !isFinite(n); })) { err.textContent = 'Check the ranges: “to” must be larger than “from”.'; return; }
    var X0 = 160, X1 = 1760, Y0 = 100, Y1 = 980;
    var mx = function (x) { return Math.round(X0 + (x - x0) / (x1 - x0) * (X1 - X0)); }, my = function (y) { return Math.round(Y1 - (y - y0) / (y1 - y0) * (Y1 - Y0)); };
    var out = [];
    if ($('#gax').checked) {
      var ax = (y0 <= 0 && y1 >= 0) ? my(0) : Y1, ay = (x0 <= 0 && x1 >= 0) ? mx(0) : X0, st = niceStep((x1 - x0) / 8), sy = niceStep((y1 - y0) / 6), v, u;
      out.push({ t: 'line', c: 0, w: 4, p: [X0, ax, X1, ax] }, { t: 'line', c: 0, w: 4, p: [ay, Y0, ay, Y1] });
      for (v = Math.ceil(x0 / st) * st; v <= x1 + 1e-9; v += st) { if (Math.abs(v) < 1e-9) continue; var px = mx(v); out.push({ t: 'line', c: 0, w: 3, p: [px, ax - 9, px, ax + 9] }, { t: 'text', c: 0, w: 24, p: [px - 10, ax + 12], s: fmtNum(v) }); }
      for (u = Math.ceil(y0 / sy) * sy; u <= y1 + 1e-9; u += sy) { if (Math.abs(u) < 1e-9) continue; var py = my(u); out.push({ t: 'line', c: 0, w: 3, p: [ay - 9, py, ay + 9, py] }, { t: 'text', c: 0, w: 24, p: [ay + 14, py - 12], s: fmtNum(u) }); }
      out.push({ t: 'text', c: 0, w: 30, p: [X1 - 14, ax - 44], s: 'x' }, { t: 'text', c: 0, w: 30, p: [ay + 16, Y0 - 4], s: 'y' });
    }
    var N = 500, run = [], pad = (y1 - y0) * 0.04, prevY = null;
    var flush = function () { if (run.length >= 4) out.push({ t: 'pen', c: col, w: wid, p: run.slice(0, 1998) }); run = []; };
    for (var i = 0; i <= N; i++) {
      var x = x0 + (x1 - x0) * i / N, y = f(x);
      if (!isFinite(y) || y < y0 - pad || y > y1 + pad) { flush(); prevY = null; continue; }
      var q = my(y); if (prevY !== null && Math.abs(q - prevY) > (Y1 - Y0) * 0.7) flush();
      prevY = q; run.push(mx(x), q); if (run.length >= 1900) { var last = run.slice(-2); flush(); run = last; }
    }
    flush();
    if (!out.length) { err.textContent = 'Nothing to draw in this range. Try changing the ranges.'; return; }
    addMany(out); closeGraph();
  }
  (function () {
    $('#gok').onclick = plotGraph; $('#gcn').onclick = closeGraph;
    $('#gp').addEventListener('keydown', function (e) { if (e.key === 'Enter') plotGraph(); else if (e.key === 'Escape') closeGraph(); });
  })();

  /* ---------- countdown timer (for the “pause and try” step) ---------- */
  var tmr = null, tEnd = 0;
  function beep() { try { var A = window.AudioContext || window.webkitAudioContext, a = new A(), o = a.createOscillator(), gn = a.createGain(); o.frequency.value = 880; gn.gain.value = 0.15; o.connect(gn); gn.connect(a.destination); o.start(); setTimeout(function () { o.stop(); a.close(); }, 500); } catch (e) {} }
  function tick() {
    var left = Math.max(0, Math.ceil((tEnd - Date.now()) / 1000)), el = $('#timer'); el.textContent = Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2);
    if (left <= 0) { clearInterval(tmr); tmr = null; el.textContent = 'Time!'; el.classList.add('done'); beep(); setTimeout(function () { if (!tmr) el.hidden = true; }, 2500); }
  }
  function startTimer(sec) { stopTimer(); tEnd = Date.now() + sec * 1000; var el = $('#timer'); el.hidden = false; el.classList.remove('done'); tmr = setInterval(tick, 200); tick(); }
  function stopTimer() { clearInterval(tmr); tmr = null; $('#timer').hidden = true; }

  /* ---------- sync with other devices ---------- */
  Sync.onStatus = function (t) { statusTxt = t; var el = $('#st'); if (el) el.textContent = t; };
  Sync.onMsg = function (d) {
    if (!d || typeof d !== 'object') return;
    if (d.op === 'peer-joined') { sendAll(); return; }
    if (d.op === 'laser') { if (isFinite(d.x) && isFinite(d.y)) laserAt(+d.x, +d.y, true); return; }
    var p = (typeof d.p === 'number' && d.p >= 0 && d.p < MAXP) ? Math.floor(d.p) : pg;
    var arr = function (i) { while (P.length <= i) P.push([]); return P[i]; }, a, n, s;
    if (d.op === 'add') { s = accept(d.s); if (!s) return; arr(p).push(s); }
    else if (d.op === 'undo') { a = arr(p); n = Math.min(Math.max(parseInt(d.n, 10) || 1, 1), a.length); a.splice(a.length - n, n); }
    else if (d.op === 'clear') { arr(p); P[p] = []; }
    else if (d.op === 'del' && Array.isArray(d.ids)) { var ids = {}; d.ids.forEach(function (i) { ids[i] = 1; }); P[p] = arr(p).filter(function (x) { return !ids[x.id]; }); }
    else if (d.op === 'batch' && Array.isArray(d.g)) { arr(p); if (d.reset) P[p] = []; P[p] = P[p].concat(d.g.map(accept).filter(Boolean)).slice(0, 3000); }
    else if (d.op === 'reset') { n = Math.max(1, Math.min(MAXP, parseInt(d.n, 10) || 1)); P = []; for (var i = 0; i < n; i++) P.push([]); pg = Math.max(0, Math.min(n - 1, parseInt(d.cur, 10) || 0)); hist = []; }
    else if (d.op === 'goto') { pg = Math.max(0, Math.min(P.length - 1, p)); hist = []; }
    else if (d.op === 'addpage') { if (P.length < MAXP) { P.push([]); pg = P.length - 1; hist = []; } }
    else if (d.op === 'delpage') { if (P.length > 1 && p < P.length) { P.splice(p, 1); pg = Math.max(0, Math.min(P.length - 1, parseInt(d.cur, 10) || 0)); hist = []; } }
    else return;
    S = P[pg]; cur = null; redraw(); pageUi(); persist();
  };
  function copyText(l) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(l).catch(function () { window.prompt('Copy this link', l); });
    else window.prompt('Copy this link', l);
  }
  function copyLink() { if (Sync.code) copyText(Sync.link()); }
  function copyViewLink() { if (Sync.code) copyText(Sync.link() + '&view=1'); }
  function joinPrompt() { var c = window.prompt('Enter the room code from your other device'); if (c) location.search = '?room=' + c.trim().toUpperCase(); }

  /* ---------- files and extras ---------- */
  function download(name, href) { var a = document.createElement('a'); a.download = name; a.href = href; document.body.appendChild(a); a.click(); a.remove(); }
  function savePNG() {
    var o = document.createElement('canvas'); o.width = 1920; o.height = 1080; var x = o.getContext('2d');
    x.fillStyle = getComputedStyle(bd).backgroundColor; x.fillRect(0, 0, 1920, 1080); S.forEach(function (s) { seg(s, x); });
    download('math-board-page-' + (pg + 1) + '.png', o.toDataURL('image/png'));
  }
  function saveFile() {
    var blob = new Blob([JSON.stringify({ app: 'math-board', v: 2, P: P, pg: pg })], { type: 'application/json' }), url = URL.createObjectURL(blob);
    download('math-board-' + new Date().toISOString().slice(0, 10) + '.json', url); setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }
  function openFile() {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = function () {
      var f = inp.files && inp.files[0]; if (!f) return; var rd = new FileReader();
      rd.onload = function () {
        try {
          var d = JSON.parse(rd.result); if (!d || !Array.isArray(d.P)) throw new Error('bad');
          P = d.P.slice(0, MAXP).map(function (a) { return (Array.isArray(a) ? a : []).map(accept).filter(Boolean).slice(0, 3000); }); if (!P.length) P = [[]];
          pg = Math.max(0, Math.min(P.length - 1, parseInt(d.pg, 10) || 0)); S = P[pg]; hist = []; sendAll(); redraw(); pageUi(); persist();
        } catch (e) { window.alert('This file is not a Math Board file.'); }
      };
      rd.readAsText(f);
    };
    inp.click();
  }
  function fullscreen() { if (document.fullscreenElement) document.exitFullscreen(); else if (R.requestFullscreen) R.requestFullscreen().catch(function () {}); }
  function keepAwake() { try { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(function () {}); } catch (e) {} }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') keepAwake(); });
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEv = e; ui(); });
  function setBg(v) { bd.className = v; store.set('bg', v); }

  /* ---------- toolbar ---------- */
  var TOOLS = [['Pen', 'pen'], ['Highlight', 'hl'], ['Line', 'line'], ['Arrow', 'arrow'], ['Circle', 'circle'], ['Oval', 'ellipse'], ['Box', 'box'], ['Text', 'text'], ['Rub out', 'rub'], ['Laser', 'laser'], ['Move', 'pan']];
  function ui() {
    bar.innerHTML = '';
    var B = function (t, f, on, cls, host) {
      var b = document.createElement('button'); b.innerHTML = t; b.type = 'button';
      b.onclick = function () { f(); ui(); }; if (on) b.className = 'on'; if (cls) b.className += ' ' + cls; (host || bar).appendChild(b); return b;
    }, sp = function (h) { (h || bar).appendChild(document.createElement('i')); };
    PAL[th].forEach(function (c, i) { B('<span class="d" style="background:' + c + '"></span>' + NM[i], function () { col = i; store.set('col', i); }, col === i); }); sp();
    TOOLS.forEach(function (a) { B(a[0], function () { tool = a[1]; closeText(); closeGraph(); }, tool === a[1]); });
    B('Graph', openGraph); sp();
    WS.forEach(function (a) { B(a[0], function () { wid = a[1]; store.set('wid', wid); }, wid === a[1]); }); sp();
    B('Undo', undo); B('Eraser (clear all)', eraseAll, false, 'danger'); sp();
    B('‹', function () { goPage(pg - 1); }); var pl = document.createElement('span'); pl.id = 'pl'; pl.textContent = (pg + 1) + '/' + P.length; pl.title = 'Page'; bar.appendChild(pl);
    B('›', function () { goPage(pg + 1); }); B('+ Page', newPage); sp();
    B('Zoom −', function () { zoomAt(1 / 1.4, 960, 540); }); B('Zoom +', function () { zoomAt(1.4, 960, 540); }); B('Fit', function () { setView(1, 0, 0); });
    var zl = document.createElement('span'); zl.id = 'zl'; zl.textContent = Math.round(view.z * 100) + '%'; zl.style.fontSize = '12px'; bar.appendChild(zl); sp();
    var ln = document.createElement('a'); ln.href = '/lessons.html'; ln.className = 'btn'; ln.textContent = 'Lessons'; ln.title = 'Study notes and quizzes'; bar.appendChild(ln); sp();
    B(more ? 'Less ▴' : 'More ▾', function () { more = !more; }, more); B('Hide bar', hide);
    var st = document.createElement('span'); st.id = 'st'; st.textContent = statusTxt; bar.appendChild(st);
    if (more) {
      var sub = document.createElement('div'); sub.className = 'sub'; bar.appendChild(sub), S2 = function (t, f) { return B(t, f, false, '', sub); };
      SM.forEach(function (a, i) { B('Smooth: ' + a[0], function () { sm = i; store.set('sm', i); }, sm === i, '', sub); }); sp(sub);
      S2('Background: ' + bg, function () { bg = BGS[(BGS.indexOf(bg) + 1) % 3]; setBg(bg); });
      S2(th === 'dark' ? 'Light board' : 'Dark board', function () { th = th === 'dark' ? 'light' : 'dark'; R.dataset.t = th; store.set('th', th); redraw(); }); sp(sub);
      S2('Venn', function () { tmpl('venn'); }); S2('Number line', function () { tmpl('line'); }); S2('Axes', function () { tmpl('axes'); }); sp(sub);
      S2('Timer 30 s', function () { startTimer(30); }); S2('Timer 1 min', function () { startTimer(60); }); S2('Timer 2 min', function () { startTimer(120); }); S2('Stop timer', stopTimer); sp(sub);
      S2('Delete page', delPage); S2('New board', newBoard); sp(sub);
      S2('Save PNG', savePNG); S2('Save board file', saveFile); S2('Open board file', openFile); sp(sub);
      S2('Copy link', copyLink); S2('Copy viewer link', copyViewLink); S2('Join', joinPrompt); S2('Sync now', sendAll);
      if (document.fullscreenEnabled) S2('Full screen', fullscreen);
      if (installEv) S2('Install app', function () { installEv.prompt(); installEv = null; });
    }
    var dv = document.createElement('a'); dv.id = 'dev'; dv.href = 'https://sol-ethio-coder.netlify.app'; dv.target = '_blank'; dv.rel = 'noopener noreferrer';
    dv.title = 'Developer: Sol Ethio Coder'; dv.innerHTML = '<img src="/icons/dev-logo.svg" alt="" width="22" height="22"><span>Developer: Sol Ethio Coder</span>'; bar.appendChild(dv);
    layout();                              /* the toolbar height may have changed: fit the board into what is left */
  }
  var S2;
  function hide() { bar.style.display = 'none'; if (!VIEW) $('#show').style.display = 'block'; layout(); }
  function show() { bar.style.display = 'flex'; $('#show').style.display = 'none'; layout(); ui(); }
  $('#show').onclick = show;
  addEventListener('keydown', function (e) {
    if (e.target && e.target.tagName === 'INPUT') return;
    var c = e.key.toLowerCase();
    if (VIEW) return;
    if ((e.ctrlKey || e.metaKey) && c === 'z') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (c >= '1' && c <= '4') col = +c - 1;
    else if (c === 'p') tool = 'pen'; else if (c === 'u') tool = 'hl'; else if (c === 'l') tool = 'line'; else if (c === 'a') tool = 'arrow'; else if (c === 'c') tool = 'circle';
    else if (c === 'o') tool = 'ellipse'; else if (c === 'b') tool = 'box'; else if (c === 'x') tool = 'text'; else if (c === 'r') tool = 'rub'; else if (c === 'k') tool = 'laser'; else if (c === 'm') tool = 'pan';
    else if (c === 'e') eraseAll();
    else if (c === 'f') { e.preventDefault(); openGraph(); return; }
    else if (c === 't') { if (tmr) stopTimer(); else startTimer(30); }
    else if (c === '[' || e.key === 'PageUp') goPage(pg - 1); else if (c === ']' || e.key === 'PageDown') goPage(pg + 1); else if (c === 'n') newPage();
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
  if (!room) {                                /* the host (or a single device) restores the last saved board */
    var saved = store.get('board', null);
    if (saved && Array.isArray(saved.P) && saved.P.length) {
      P = saved.P.slice(0, MAXP).map(function (a) { return (Array.isArray(a) ? a : []).map(accept).filter(Boolean).slice(0, 3000); });
      pg = Math.max(0, Math.min(P.length - 1, parseInt(saved.pg, 10) || 0)); S = P[pg];
    }
  }
  R.dataset.t = th; setBg(BGS.indexOf(bg) < 0 ? 'grid' : bg); ui(); layout(); keepAwake();
  if (VIEW) { bar.style.display = 'none'; $('#show').style.display = 'none'; $('#vchip').hidden = false; layout(); }
  Sync.start(room || undefined);
})();
