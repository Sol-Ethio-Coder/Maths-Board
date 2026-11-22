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
  function ready(id) { return !!(CT[id] && CT[id].notes && CT[id].quiz); }

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
        u.lessons.forEach(function (l) { d.appendChild(row(byId[l.id])); }); list.appendChild(d);
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
    var pn = h('div', 'pn');
    var prev = flat[l.idx - 1], next = flat[l.idx + 1];
    pn.appendChild(prev ? link('← ' + prev.title, '#/lesson/' + prev.id) : h('span')); pn.appendChild(next ? link(next.title + ' →', '#/lesson/' + next.id) : h('span'));
    if (!ready(l.id)) {
      nodes.push(h('div', 'obj', 'Notes and a quiz for this lesson are **coming soon**. Meanwhile you can practise on the Math Board.'));
      nodes.push(h('div', 'actions', null, [link('Open Math Board', '/', 'pri'), link('All lessons', '#/grade/' + l.g.g)])); nodes.push(pn); show(nodes); return;
    }
    store.set('notes.' + l.id, 1);
    nodes.push(h('div', 'meta', null, [h('span', 'chip', 'About ' + c.minutes + ' minutes'), h('span', 'chip', c.quiz.length + ' quiz questions'), passed(l.id) ? h('span', 'chip ok', 'Quiz passed ✓') : null]));
    var tabs = h('div', 'tabs');
    tabs.appendChild(btn('Notes', tab === 'notes' ? 'on' : '', function () { location.hash = '#/lesson/' + l.id; }));
    tabs.appendChild(btn('Quiz', tab === 'quiz' ? 'on' : '', function () { location.hash = '#/lesson/' + l.id + '/quiz'; }));
    nodes.push(tabs);
    if (tab === 'quiz') { nodes.push(h('div', null, null, [])); show(nodes); quiz(l, c, app); app.appendChild(pn); return; }
    nodes.push(h('div', 'obj', '**Objective:** ' + c.objective));
    c.notes.forEach(function (b) { nodes.push(block(b)); });
    nodes.push(h('div', 'actions', null, [btn('Take the quiz', 'pri', function () { location.hash = '#/lesson/' + l.id + '/quiz'; }), btn('Print or save as PDF', '', function () { window.print(); }), link('Practise on the Math Board', '/')]));
    nodes.push(pn); show(nodes);
  }

  /* ---------- quiz ---------- */
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function quiz(l, c, host) {
    var qs = shuffle(c.quiz.map(function (q, i) { return i; })), i = 0, score = 0, wrong = [], box = h('div'); host.appendChild(box);
    function ask() {
      box.innerHTML = '';
      var q = c.quiz[qs[i]], order = shuffle(q.o.map(function (t, k) { return k; })), done = false;
      var card = h('div', 'q-card', null, [h('div', 'mut', 'Question ' + (i + 1) + ' of ' + qs.length), h('h2', null, q.q)]), opts = h('div', 'opts'), fb = h('div'), nx = h('div', 'actions');
      function pick(pos) {
        if (done) return; done = true; var right = order[pos] === q.a;
        if (right) score++; else wrong.push(q);
        [].forEach.call(opts.children, function (b, k) { b.disabled = true; if (order[k] === q.a) b.classList.add('good'); else if (k === pos) b.classList.add('wrong'); });
        fb.className = 'fb'; fb.textContent = (right ? 'Correct. ' : 'Not quite. ') + q.why;
        nx.appendChild(btn(i + 1 < qs.length ? 'Next question' : 'See my score', 'pri', function () { i++; if (i < qs.length) ask(); else finish(); })); nx.firstChild.focus();
      }
      order.forEach(function (k, pos) { var b = h('button', 'opt', null, [h('kbd', null, String(pos + 1)), document.createTextNode(q.o[k])]); b.type = 'button'; b.onclick = function () { pick(pos); }; opts.appendChild(b); });
      card.appendChild(opts); card.appendChild(fb); card.appendChild(nx); box.appendChild(card);
      box._key = function (e) { var n = parseInt(e.key, 10); if (n >= 1 && n <= order.length) pick(n - 1); };
    }
    function finish() {
      box._key = null; var total = qs.length, b = best(l.id), nb = Math.max(b ? b.best : 0, score);
      store.set('quiz.' + l.id, { best: nb, total: total, at: new Date().toISOString().slice(0, 10) });
      var ok = score / total >= PASS, card = h('div', 'q-card', null, [h('div', 'score', score + ' / ' + total), h('p', null, ok ? 'Well done. You passed this lesson quiz.' : 'Keep going. Read the notes again and try once more; you need ' + Math.ceil(PASS * total) + ' correct to pass.')]);
      if (wrong.length) { card.appendChild(h('h3', null, 'Review the ones you missed')); wrong.forEach(function (q) { card.appendChild(h('div', 'ex', null, [h('p', 'q', q.q), h('p', 'a', 'Answer: ' + q.o[q.a]), h('p', null, q.why)])); }); }
      var act = h('div', 'actions'); act.appendChild(btn('Try again', 'pri', function () { location.hash = '#/lesson/' + l.id + '/quiz'; route(); }));
      act.appendChild(btn('Back to notes', '', function () { location.hash = '#/lesson/' + l.id; }));
      var nx = flat[l.idx + 1]; if (nx) act.appendChild(link('Next lesson →', '#/lesson/' + nx.id)); card.appendChild(act); box.innerHTML = ''; box.appendChild(card);
    }
    document.onkeydown = function (e) { if (box._key && !e.ctrlKey && !e.metaKey) box._key(e); }; ask();
  }

  /* ---------- routing and theme ---------- */
  function route() {
    document.onkeydown = null;
    var p = location.hash.replace(/^#\/?/, '').split('/');
    if (p[0] === 'lesson' && byId[p[1]]) lessonView(byId[p[1]], p[2] === 'quiz' ? 'quiz' : 'notes');
    else catalog(p[0] === 'grade' ? (+p[1] || 9) : store.get('grade', 9));
    window.scrollTo(0, 0);
  }
  function theme(v) { document.documentElement.dataset.t = v; }
  theme(store.get('th', 'dark'));
  document.getElementById('theme').onclick = function () { var v = document.documentElement.dataset.t === 'dark' ? 'light' : 'dark'; store.set('th', v); theme(v); };
  window.addEventListener('hashchange', route); route();
})();
