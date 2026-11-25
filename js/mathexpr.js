/* A small, safe maths-expression parser for the graph tool (no eval). MathExpr.compile("x^2 - 4") returns a function f(x).
   Supports + - * / ^, brackets, x, pi, e, implicit multiplication (2x, 3(x+1), x sin(x)),
   and the functions sin cos tan asin acos atan sinh cosh tanh sqrt abs ln log exp floor ceil sign. Angles are in radians. */
(function () {
  var FUNCS = { sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    sqrt: Math.sqrt, abs: Math.abs, ln: Math.log, log: Math.log10, exp: Math.exp, floor: Math.floor, ceil: Math.ceil, sign: Math.sign };
  var NAMES = Object.keys(FUNCS).concat(['pi', 'e', 'x']).sort(function (a, b) { return b.length - a.length; });
  function clean(s) {
    s = String(s).toLowerCase().replace(/−|–/g, '-').replace(/×|·/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi').replace(/\*\*/g, '^')
      .replace(/²/g, '^2').replace(/³/g, '^3').replace(/√\s*\(/g, 'sqrt(').replace(/√\s*([a-z0-9.]+)/g, 'sqrt($1)');
    return s.replace(/^\s*(y|f\s*\(\s*x\s*\))\s*=\s*/, '');
  }
  function tokenize(s) {
    var t = [], i = 0, m;
    while (i < s.length) {
      var ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      if ((m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i)))) { t.push({ k: 'n', v: parseFloat(m[1]) }); i += m[1].length; continue; }
      if (/[a-z]/.test(ch)) {
        var rest = s.slice(i), name = NAMES.filter(function (n) { return rest.indexOf(n) === 0; })[0];
        if (!name) throw new Error('I do not understand “' + (/^[a-z]+/.exec(rest)[0]) + '”');
        t.push({ k: 'i', v: name }); i += name.length; continue;
      }
      if ('+-*/^(),'.indexOf(ch) > -1) { t.push({ k: ch }); i++; continue; }
      throw new Error('I do not understand “' + ch + '”');
    }
    return t;
  }
  function compile(src) {
    var t = tokenize(clean(src)), pos = 0;
    if (!t.length) throw new Error('Type a function, for example x^2 − 4');
    var peek = function () { return t[pos]; }, take = function () { return t[pos++]; };
    function expr() { var a = term(); while (peek() && (peek().k === '+' || peek().k === '-')) { var op = take().k, b = term(), l = a; a = op === '+' ? (function (l, b) { return function (x) { return l(x) + b(x); }; })(l, b) : (function (l, b) { return function (x) { return l(x) - b(x); }; })(l, b); } return a; }
    function startsFactor(k) { return k && (k.k === 'n' || k.k === 'i' || k.k === '('); }
    function term() {
      var a = unary();
      for (;;) {
        var p = peek(); if (!p) break; var b, l = a;
        if (p.k === '*') { take(); b = unary(); a = (function (l, b) { return function (x) { return l(x) * b(x); }; })(l, b); }
        else if (p.k === '/') { take(); b = unary(); a = (function (l, b) { return function (x) { return l(x) / b(x); }; })(l, b); }
        else if (startsFactor(p)) { b = unary(); a = (function (l, b) { return function (x) { return l(x) * b(x); }; })(l, b); }   /* implicit multiplication */
        else break;
      }
      return a;
    }
    function unary() {
      var p = peek();
      if (p && p.k === '-') { take(); var u = unary(); return function (x) { return -u(x); }; }
      if (p && p.k === '+') { take(); return unary(); }
      return power();
    }
    function power() {
      var base = primary();
      if (peek() && peek().k === '^') { take(); var ex = unary(); return function (x) { return Math.pow(base(x), ex(x)); }; }
      return base;
    }
    function primary() {
      var p = take(); if (!p) throw new Error('The expression ends too early');
      if (p.k === 'n') { var v = p.v; return function () { return v; }; }
      if (p.k === '(') { var e = expr(); if (!peek() || take().k !== ')') throw new Error('A bracket is not closed'); return e; }
      if (p.k === 'i') {
        if (p.v === 'x') return function (x) { return x; };
        if (p.v === 'pi') return function () { return Math.PI; };
        if (p.v === 'e') return function () { return Math.E; };
        var f = FUNCS[p.v];
        if (!peek() || peek().k !== '(') throw new Error('Use brackets after ' + p.v + ', for example ' + p.v + '(x)');
        take(); var arg = expr(); if (!peek() || take().k !== ')') throw new Error('A bracket is not closed');
        return function (x) { return f(arg(x)); };
      }
      throw new Error('Unexpected “' + p.k + '”');
    }
    var fn = expr(); if (pos < t.length) throw new Error('Unexpected “' + (t[pos].v !== undefined ? t[pos].v : t[pos].k) + '”');
    return fn;
  }
  window.MathExpr = { compile: compile };
})();
