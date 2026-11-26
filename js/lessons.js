/* Math Board: lessons page (catalogue, study notes and quizzes). Progress is saved in this browser only. */
(function () {
  'use strict';
  var COURSE = window.MB_COURSE, CT = window.MB_CONTENT || {}, app = document.getElementById('app');
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('mb.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('mb.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var PASS = 0.7, flat = [], byId = {}, query = '';

  COURSE.grades.forEach(function (g) { g.units.forEach(function (u) { u.lessons.forEach(function (l, i) {
    var o = { id: l.id, title: l.title, n: i + 1, g: g, u: u, idx: flat.length }; flat.push(o); byId[l.id] = o;
  }); }); });

  /* ---------- tiny DOM helpers (all text is inserted as text, never as HTML) ---------- */
  function h(tag, cls, text, kids) {
    var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) fmt(e, text);
    (kids || []).forEach(function (k) { if (k) e.appendChild(k); }); return e;
  }
  function fmt(e, s) {                       /* **bold** support */
    String(s).split(/\*\*(.+?)\*\*/).forEach(function (part, i) { if (!part) return; if (i % 2) { var b = document.createElement('b'); b.textContent = part; e.appendChild(b); } else e.appendChild(document.createTextNode(part)); });
  }
  function link(text, href, cls) { var a = h('a', cls, text); a.href = href; return a; }
  function btn(text, cls, fn) { var b = h('button', cls, text); b.type = 'button'; b.onclick = fn; return b; }
  function show(nodes) { app.innerHTML = ''; nodes.forEach(function (n) { app.appendChild(n); }); }
  function best(id) { return store.get('quiz.' + id, null); }
  function passed(id) { var b = best(id); return !!b && b.best / b.total >= PASS; }
  var GEN_FOR = { 'g9-u1-l03': ['subsets'], 'g9-u1-l04': ['venn2'], 'g9-u1-l06': ['venn2'] };
  function gensFor(id) { var c = CT[id]; return ((c && c.gen) || GEN_FOR[id] || []).filter(function (n) { return window.MB_GEN && window.MB_GEN[n]; }); }
  function ready(id) { var c = CT[id]; return !!(c && c.notes && ((c.quiz && c.quiz.length) || gensFor(id).length)); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function genQ(id) { var g = gensFor(id); return g.length ? window.MB_GEN[g[Math.floor(Math.random() * g.length)]]() : null; }
  function questions(ids, n) {              /* fixed questions first, then fresh generated ones */
    var out = [], seen = {}, add = function (q) { if (q && !seen[q.q]) { seen[q.q] = 1; out.push(q); } };
    var fixed = []; ids.forEach(function (id) { ((CT[id] && CT[id].quiz) || []).forEach(function (q) { fixed.push(q); }); });
    shuffle(fixed).slice(0, Math.ceil(n / 2)).forEach(add);
    var tries = 0, k = 0; while (out.length < n && tries++ < 200) { var id = ids[k++ % ids.length], g = genQ(id); if (g) add(g); else if (tries > 50) { var f = fixed[Math.floor(Math.random() * fixed.length)]; add(f); } }
    shuffle(fixed).forEach(function (q) { if (out.length < n) add(q); });
    return shuffle(out).slice(0, n);
  }

  /* ---------- catalogue ---------- */
  function row(l, ctx) {
    var a = link('', '#/lesson/' + l.id, 'row'), b = best(l.id);
    a.appendChild(h('span', 'n', ctx ? '' : String(l.n)));
    a.appendChild(h('span', 't', ctx ? l.title + '  ·  ' + l.g.name + ', Unit ' + l.u.n : l.title));
    if (b) a.appendChild(h('span', 'chip' + (passed(l.id) ? ' ok' : ''), b.best + '/' + b.total + (passed(l.id) ? ' ✓' : '')));
    a.appendChild(h('span', 'chip' + (ready(l.id) ? ' ready' : ''), ready(l.id) ? 'Notes + quiz' : 'Coming soon'));
    return a;
  }
  function catalog(gnum) {
    var nodes = [h('h1', null, 'Lessons, notes and quizzes')], nready = 0, npass = 0;
    flat.forEach(function (l) { if (ready(l.id)) { nready++; if (passed(l.id)) npass++; } });
    var pc = nready ? Math.round(npass / nready * 100) : 0, bar = h('div', 'bar', null, [h('i')]); bar.firstChild.style.width = pc + '%';
    nodes.push(h('div', 'prog', null, [h('div', null, 'Quizzes passed (70% or more): **' + npass + ' of ' + nready + '** lessons that are ready'), bar]));
    var s = document.createElement('input'); s.type = 'search'; s.placeholder = 'Search all lessons, for example “union” or “quadratic”'; s.value = query; s.setAttribute('aria-label', 'Search lessons'); nodes.push(s);
    var list = h('div'); nodes.push(list);
    function paint() {
      list.innerHTML = '';
      var q = query.trim().toLowerCase();
      if (q) {
        var hits = flat.filter(function (l) { return (l.title + ' ' + l.u.title).toLowerCase().indexOf(q) > -1; });
        list.appendChild(h('p', 'mut', hits.length + ' lesson' + (hits.length === 1 ? '' : 's') + ' found'));
        var box = h('details'); box.open = true; box.appendChild(h('summary', null, 'Search results'));
        hits.slice(0, 60).forEach(function (l) { box.appendChild(row(l, true)); }); list.appendChild(box); return;
      }
      var tabs = h('div', 'tabs'); COURSE.grades.forEach(function (g) { tabs.appendChild(btn(g.name, g.g === gnum ? 'on' : '', function () { store.set('grade', g.g); location.hash = '#/grade/' + g.g; })); }); list.appendChild(tabs);
      var g = COURSE.grades.filter(function (x) { return x.g === gnum; })[0] || COURSE.grades[0];
      g.units.forEach(function (u) {
        var nr = u.lessons.filter(function (l) { return ready(l.id); }).length, d = h('details'); d.open = nr > 0;
        d.appendChild(h('summary', null, null, [h('span', null, 'Unit ' + u.n + ' · ' + u.title + (u.track ? '  (' + u.track + ' track)' : '')), h('small', null, nr + ' of ' + u.lessons.length + ' ready')]));
        u.lessons.forEach(function (l) { d.appendChild(row(byId[l.id])); });
        if (nr) { var ub = best('unit-g' + g.g + '-u' + u.n); d.appendChild(link('Take the unit test (10 mixed questions)' + (ub ? '  ·  best ' + ub.best + '/' + ub.total : ''), '#/unit/g' + g.g + '-u' + u.n, 'row')); }
        list.appendChild(d);
      });
    }
    s.oninput = function () { query = s.value; paint(); }; paint(); show(nodes);
  }

  /* ---------- notes ---------- */
  function block(b) {
    if (b.h) return h('h3', null, b.h);
    if (b.p) return h('p', null, b.p);
    if (b.def) return h('div', 'def', null, [h('b', null, b.def[0]), h('p', null, b.def[1])]);
    if (b.list) return h('ul', null, null, b.list.map(function (t) { return h('li', null, t); }));
    if (b.table) {
      var t = h('table'), th = h('thead'), tb = h('tbody'); b.table.forEach(function (r, i) { var tr = h('tr'); r.forEach(function (c) { tr.appendChild(h(i ? 'td' : 'th', null, c)); }); (i ? tb : th).appendChild(tr); });
      t.appendChild(th); t.appendChild(tb); return h('div', 'wrap', null, [t]);
    }
    if (b.ex) return h('div', 'ex', null, [h('p', 'q', 'Example: ' + b.ex.q), h('ol', null, null, b.ex.steps.map(function (s) { return h('li', null, s); })), h('p', 'a', 'Answer: ' + b.ex.a)]);
    if (b.warn) return h('div', 'warn', '**Common mistake.** ' + b.warn);
    if (b.recap) return h('div', 'recap', null, [h('h4', null, 'Remember'), h('ul', null, null, b.recap.map(function (t) { return h('li', null, t); }))]);
    return null;
  }

  /* ---------- lesson page ---------- */
  function lessonView(l, tab) {
    var c = CT[l.id], nodes = [];
    nodes.push(h('div', 'crumb', l.g.name + ' › Unit ' + l.u.n + ' · ' + l.u.title + ' › Lesson ' + l.n));
    nodes.push(h('h1', null, l.title));
    var pn = h('div', 'pn'), prev = flat[l.idx - 1], next = flat[l.idx + 1];
    pn.appendChild(prev ? link('← ' + prev.title, '#/lesson/' + prev.id) : h('span')); pn.appendChild(next ? link(next.title + ' →', '#/lesson/' + next.id) : h('span'));
    if (!ready(l.id)) {
      nodes.push(h('div', 'obj', 'Notes and a quiz for this lesson are **coming soon**. Meanwhile you can practise on the Math Board.'));
      nodes.push(h('div', 'actions', null, [link('Open Math Board', '/', 'pri'), link('All lessons', '#/grade/' + l.g.g)])); nodes.push(pn); show(nodes); return;
    }
    store.set('notes.' + l.id, 1);
    var nq = (c.quiz ? c.quiz.length : 0), hasGen = gensFor(l.id).length > 0;
    nodes.push(h('div', 'meta', null, [h('span', 'chip', 'About ' + c.minutes + ' minutes'), h('span', 'chip', hasGen ? 'Unlimited practice questions' : nq + ' quiz questions'), passed(l.id) ? h('span', 'chip ok', 'Quiz passed ✓') : null]));
    var tabs = h('div', 'tabs noprint');
    [['notes', 'Notes'], ['quiz', 'Quiz'], ['practice', 'Practice'], ['script', 'Teach script']].forEach(function (t) {
      tabs.appendChild(btn(t[1], tab === t[0] ? 'on' : '', function () { location.hash = '#/lesson/' + l.id + (t[0] === 'notes' ? '' : '/' + t[0]); }));
    });
    nodes.push(tabs);
    if (tab === 'quiz') { show(nodes); runQuiz(app, questions([l.id], 6), 'quiz.' + l.id, next, '#/lesson/' + l.id + '/quiz', '#/lesson/' + l.id); app.appendChild(pn); return; }
    if (tab === 'practice') { show(nodes); practice(app, l); app.appendChild(pn); return; }
    if (tab === 'script') { nodes.push(scriptView(l, c, next)); nodes.push(pn); show(nodes); return; }
    nodes.push(h('div', 'obj', '**Objective:** ' + c.objective));
    c.notes.forEach(function (b) { nodes.push(block(b)); });
    nodes.push(h('div', 'actions', null, [btn('Take the quiz', 'pri', function () { location.hash = '#/lesson/' + l.id + '/quiz'; }), btn('More practice', '', function () { location.hash = '#/lesson/' + l.id + '/practice'; }), btn('Print or save as PDF', '', function () { window.print(); }), link('Practise on the Math Board', '/')]));
    nodes.push(pn); show(nodes);
  }

  /* ---------- 30-second question timer (on by default; learners can switch it off) ---------- */
  var tIds = [];
  function timerOn() { return store.get('timer', true) !== false; }
  function makeTimer(onEnd) {
    var total = window.MB_TIMER_SECONDS || 30, end = Date.now() + total * 1000, id = null,
        el = h('div', 'timer', null, [h('span', 'tt'), h('div', 'tbar', null, [h('i')])]), txt = el.firstChild, fill = el.lastChild.firstChild;
    function stop() { clearInterval(id); }
    function tick() {
      var left = Math.max(0, (end - Date.now()) / 1000);
      txt.textContent = '⏱ ' + Math.ceil(left) + ' s'; fill.style.width = (left / total * 100) + '%'; el.classList.toggle('low', left <= 10);
      if (left <= 0) { stop(); el.classList.add('out'); txt.textContent = '⏱ Time is up'; onEnd(); }
    }
    id = setInterval(tick, 200); tIds.push(id); tick();
    return { el: el, stop: stop };
  }
  function timerSwitch(onChange) {
    var b = btn('', '', function () { store.set('timer', !timerOn()); paint(); onChange(); });
    function paint() { b.textContent = timerOn() ? '⏱ Timer on: ' + (window.MB_TIMER_SECONDS || 30) + ' seconds per question (tap to turn off)' : '⏱ Timer off (tap to turn on)'; }
    paint(); return h('div', 'actions noprint', null, [b]);
  }

  /* ---------- quiz engine (used for lesson quizzes and unit tests) ---------- */
  function runQuiz(host, qlist, saveKey, nextL, retryHash, backHash) {
    var i = 0, score = 0, late = 0, wrong = [], qt = { start: null, stop: null }, box = h('div');
    host.appendChild(timerSwitch(function () { if (timerOn()) { if (qt.start) qt.start(); } else if (qt.stop) qt.stop(); })); host.appendChild(box);
    function ask() {
      box.innerHTML = '';
      var q = qlist[i], order = shuffle(q.o.map(function (t, k) { return k; })), done = false;
      var card = h('div', 'q-card', null, [h('div', 'mut', 'Question ' + (i + 1) + ' of ' + qlist.length), h('h2', null, q.q)]), opts = h('div', 'opts'), fb = h('div'), nx = h('div', 'actions');
      function pick(pos) {
        if (done) return; done = true; if (qt.stop) qt.stop(); var right = pos >= 0 && order[pos] === q.a; if (right) score++; else wrong.push(q); if (pos < 0) late++;
        [].forEach.call(opts.children, function (b, k) { b.disabled = true; if (order[k] === q.a) b.classList.add('good'); else if (k === pos) b.classList.add('wrong'); });
        fb.className = 'fb'; fb.textContent = (pos < 0 ? 'Time is up. ' : right ? 'Correct. ' : 'Not quite. ') + q.why;
        nx.appendChild(btn(i + 1 < qlist.length ? 'Next question' : 'See my score', 'pri', function () { i++; if (i < qlist.length) ask(); else finish(); })); nx.firstChild.focus();
      }
      order.forEach(function (k, pos) { var b = h('button', 'opt', null, [h('kbd', null, String(pos + 1)), document.createTextNode(q.o[k])]); b.type = 'button'; b.onclick = function () { pick(pos); }; opts.appendChild(b); });
      card.appendChild(opts); card.appendChild(fb); card.appendChild(nx); box.appendChild(card);
      box._key = function (e) { var n = parseInt(e.key, 10); if (n >= 1 && n <= order.length) pick(n - 1); };
      var tm = null;
      qt.stop = function () { if (tm) { tm.stop(); if (tm.el.parentNode && !done) tm.el.parentNode.removeChild(tm.el); tm = null; } };
      qt.start = function () { if (done || tm || !timerOn()) return; tm = makeTimer(function () { pick(-1); }); card.insertBefore(tm.el, card.children[1]); };
      qt.start();                              /* the 30 seconds start as soon as the question appears */
    }
    function finish() {
      box._key = null; qt.start = qt.stop = null; var total = qlist.length, b = best(saveKey.slice(5)), nb = Math.max(b ? b.best : 0, score);
      store.set(saveKey, { best: nb, total: total, at: new Date().toISOString().slice(0, 10) });
      var ok = score / total >= PASS, card = h('div', 'q-card', null, [h('div', 'score', score + ' / ' + total), h('p', null, ok ? 'Well done. You passed.' : 'Keep going. Read the notes again and try once more; you need ' + Math.ceil(PASS * total) + ' correct to pass.')]);
      if (late) card.insertBefore(h('p', 'mut', 'Time ran out on ' + late + ' question' + (late > 1 ? 's' : '') + '.'), card.children[2]);
      if (wrong.length) { card.appendChild(h('h3', null, 'Review the ones you missed')); wrong.forEach(function (q) { card.appendChild(h('div', 'ex', null, [h('p', 'q', q.q), h('p', 'a', 'Answer: ' + q.o[q.a]), h('p', null, q.why)])); }); }
      var act = h('div', 'actions'); act.appendChild(btn('Try again', 'pri', function () { route(); }));
      act.appendChild(btn('Back', '', function () { location.hash = backHash; })); if (nextL) act.appendChild(link('Next lesson →', '#/lesson/' + nextL.id)); card.appendChild(act); box.innerHTML = ''; box.appendChild(card);
    }
    document.onkeydown = function (e) { if (box._key && !e.ctrlKey && !e.metaKey) box._key(e); }; ask();
  }
  function unitView(u, g) {
    var ids = u.lessons.map(function (l) { return l.id; }).filter(ready), nodes = [h('div', 'crumb', g.name + ' › Unit ' + u.n), h('h1', null, 'Unit test: ' + u.title)];
    if (!ids.length) { nodes.push(h('div', 'obj', 'The unit test opens when at least one lesson in this unit is ready.')); nodes.push(link('Back to lessons', '#/grade/' + g.g, 'pri')); show(nodes); return; }
    nodes.push(h('p', 'mut', '10 mixed questions from ' + ids.length + ' ready lesson' + (ids.length > 1 ? 's' : '') + '. Questions change every time. You need 7 correct to pass.')); show(nodes);
    runQuiz(app, questions(ids, 10), 'quiz.unit-g' + g.g + '-u' + u.n, null, '', '#/grade/' + g.g);
  }

  /* ---------- practice: unlimited generated questions ---------- */
  function practice(host, l) {
    var box = h('div'), tot = 0, ok = 0, streak = 0, pt = { start: null, stop: null };
    host.appendChild(timerSwitch(function () { if (timerOn()) { if (pt.start) pt.start(); } else if (pt.stop) pt.stop(); })); host.appendChild(box);
    if (!gensFor(l.id).length) box.appendChild(h('div', 'obj', 'This lesson has no question generator yet, so practice uses the lesson quiz questions. Add a generator name to the lesson to get unlimited questions.'));
    function next() {
      var q = genQ(l.id) || shuffle((CT[l.id].quiz || []).slice())[0]; if (!q) return;
      var order = shuffle(q.o.map(function (t, k) { return k; })), done = false;
      var stats = h('div', 'mut', 'Answered: ' + tot + ' · Correct: ' + ok + ' · Streak: ' + streak), card = h('div', 'q-card', null, [stats, h('h2', null, q.q)]), opts = h('div', 'opts'), fb = h('div'), nx = h('div', 'actions');
      function answer(pos) {
        if (done) return; done = true; if (pt.stop) pt.stop(); tot++; var right = pos >= 0 && order[pos] === q.a; if (right) { ok++; streak++; } else streak = 0;
        [].forEach.call(opts.children, function (x, z) { x.disabled = true; if (order[z] === q.a) x.classList.add('good'); else if (z === pos) x.classList.add('wrong'); });
        fb.className = 'fb'; fb.textContent = (pos < 0 ? 'Time is up. ' : right ? 'Correct. ' : 'Not quite. ') + q.why; nx.appendChild(btn('New question', 'pri', next)); nx.firstChild.focus();
      }
      order.forEach(function (k, pos) {
        var b = h('button', 'opt', null, [h('kbd', null, String(pos + 1)), document.createTextNode(q.o[k])]); b.type = 'button';
        b.onclick = function () { answer(pos); }; opts.appendChild(b);
      });
      card.appendChild(opts); card.appendChild(fb); card.appendChild(nx); box.innerHTML = ''; box.appendChild(card);
      var tm = null;
      pt.stop = function () { if (tm) { tm.stop(); if (tm.el.parentNode && !done) tm.el.parentNode.removeChild(tm.el); tm = null; } };
      pt.start = function () { if (done || tm || !timerOn()) return; tm = makeTimer(function () { answer(-1); }); card.insertBefore(tm.el, card.children[1]); };
      pt.start();
      box._key = function (e) { var n = parseInt(e.key, 10); if (n >= 1 && n <= order.length) opts.children[n - 1].click(); };
    }
    document.onkeydown = function (e) { if (box._key && !e.ctrlKey && !e.metaKey) box._key(e); }; next();
  }

  /* ---------- teach script: the S.P.A.R.K. plan for recording this lesson ---------- */
  function scriptView(l, c, next) {
    var root = h('div', 'script'), u = l.u, step = function (letter, name, time, kids) { var d = h('div', 'step', null, [h('h3', null, letter + '  ' + name + '   ' + time)]); kids.forEach(function (k) { if (k) d.appendChild(k); }); d.dataset.k = letter; return d; };
    var low = c.objective.charAt(0).toLowerCase() + c.objective.slice(1), steps = [], timerTxt = h('span', 'timer', '0:00'), t0 = 0, run = null, secs = 0;
    var tools = h('div', 'actions noprint', null, [h('span', null, 'Timer: '), timerTxt]);
    var tb = btn('Start', 'pri', function () { if (run) { clearInterval(run); run = null; tb.textContent = 'Resume'; } else { tb.textContent = 'Pause'; run = setInterval(tick, 1000); } });
    tools.appendChild(tb); tools.appendChild(btn('Reset', '', function () { clearInterval(run); run = null; secs = 0; tb.textContent = 'Start'; tick(true); }));
    tools.appendChild(btn('Text smaller', '', function () { size(-2); })); tools.appendChild(btn('Text bigger', '', function () { size(2); }));
    tools.appendChild(link('Open Math Board', '/', 'pri'));
    var sz = store.get('script.size', 20); function size(d) { sz = Math.max(14, Math.min(40, sz + d)); store.set('script.size', sz); root.style.fontSize = sz + 'px'; } root.style.fontSize = sz + 'px';
    var limits = [0, 45, 180, 420, 540, 9999];
    function tick(reset) { if (!reset) secs++; timerTxt.textContent = Math.floor(secs / 60) + ':' + ('0' + secs % 60).slice(-2); var k = 0; limits.forEach(function (x, i) { if (secs >= x && i < 5) k = i; }); steps.forEach(function (d, i) { d.classList.toggle('now', secs > 0 && i === k); }); }
    root.appendChild(tools);
    root.appendChild(h('p', 'mut noprint', 'Read the SAY lines in your own words. Write the WRITE lines on the board. Use the colour code: given, key step, answer, mistake.'));
    steps.push(step('S', 'Spark', '0:00 – 0:45', [h('p', null, '**SAY:** Open with a real-life question. Course idea for this unit: ' + u.activity), h('p', 'wr', '**WRITE:** the title “' + l.title + '” and one picture.')]));
    steps.push(step('P', 'Present', '0:45 – 3:00', [h('p', null, '**SAY:** “By the end of this lesson you will be able to ' + low.replace(/\.$/, '') + '.”'), h('p', null, '**TEACH:** one idea at a time.'), h('ul', null, null, c.notes.filter(function (b) { return b.list; }).reduce(function (a, b) { return a.concat(b.list); }, []).map(function (t) { return h('li', null, t); })), h('p', 'wr', '**WRITE:** the definitions (yellow) and the formulas.')]));
    var exs = c.notes.filter(function (b) { return b.ex; });
    steps.push(step('A', 'Apply', '3:00 – 7:00', exs.map(function (b, i) { return h('div', 'ex', null, [h('p', 'q', 'Example ' + (i + 1) + ': ' + b.ex.q), h('ol', null, null, b.ex.steps.map(function (t) { return h('li', null, t); })), h('p', 'a', 'Answer: ' + b.ex.a)]); }).concat([h('p', 'wr', '**SAY:** think aloud, and say why you choose each step. Pause 2 seconds after each line you write.')])));
    var rq = genQ(l.id) || (c.quiz && c.quiz[0]), rbox = h('div');
    function showRun(q) { rbox.innerHTML = ''; if (!q) return; var ans = h('p', 'a', 'Answer: ' + q.o[q.a]), why = h('p', null, q.why); ans.hidden = why.hidden = true;
      rbox.appendChild(h('p', 'q', 'Pause and try (30-second timer on screen): ' + q.q)); rbox.appendChild(h('p', 'mut', 'Choices: ' + q.o.join('   |   ')));
      rbox.appendChild(btn('Show answer', 'noprint', function () { ans.hidden = why.hidden = false; })); rbox.appendChild(btn('New problem', 'noprint', function () { showRun(genQ(l.id) || q); })); rbox.appendChild(ans); rbox.appendChild(why); }
    showRun(rq);
    steps.push(step('R', 'Run', '7:00 – 9:00', [h('p', null, '**SAY:** “Pause the video and try this. You have thirty seconds.”'), rbox]));
    steps.push(step('K', 'Keep', '9:00 – 10:00', [h('p', null, '**SAY (recap):** ' + c.notes.filter(function (b) { return b.recap; }).map(function (b) { return b.recap.join('  •  '); }).join('')), h('p', null, '**COMMON MISTAKE:** ' + c.notes.filter(function (b) { return b.warn; }).map(function (b) { return b.warn; }).join('')), h('p', null, '**NEXT:** ' + (next ? '“Next lesson: ' + next.title + '.”' : 'Thank the learners and point to the practice sheet.'))]));
    steps.forEach(function (d) { root.appendChild(d); });
    root.appendChild(h('div', 'warn noprint', '**Recording tip:** open the Math Board in one window to record with OBS, and open this script on your phone or a second window.'));
    return root;
  }

  /* ---------- routing and theme ---------- */
  function route() {
    document.onkeydown = null; tIds.forEach(clearInterval); tIds = [];
    var p = location.hash.replace(/^#\/?/, '').split('/');
    if (p[0] === 'lesson' && byId[p[1]]) lessonView(byId[p[1]], ['quiz', 'practice', 'script'].indexOf(p[2]) > -1 ? p[2] : 'notes');
    else if (p[0] === 'unit' && /^g\d+-u\d+$/.test(p[1] || '')) { var m = p[1].match(/^g(\d+)-u(\d+)$/), gg = COURSE.grades.filter(function (x) { return x.g === +m[1]; })[0], uu = gg && gg.units.filter(function (x) { return x.n === +m[2]; })[0]; if (uu) unitView(uu, gg); else catalog(9); }
    else catalog(p[0] === 'grade' ? (+p[1] || 9) : store.get('grade', 9));
    window.scrollTo(0, 0);
  }
  function theme(v) { document.documentElement.dataset.t = v; }
  theme(store.get('th', 'dark'));
  document.getElementById('theme').onclick = function () { var v = document.documentElement.dataset.t === 'dark' ? 'light' : 'dark'; store.set('th', v); theme(v); };
  window.addEventListener('hashchange', route); route();
})();
