/* Checks lesson content: node tools/validate-content.js   (or: npm run check)
   - every lesson id exists in data/catalog.js, and every catalogue lesson has content
   - notes use known block types; fixed quiz questions have a valid answer index, no duplicate options and an explanation
   - every generator name exists and produces valid questions (200 samples each)
   - a lesson needs at least one generator or at least 3 fixed quiz questions */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const sandbox = { console }; sandbox.window = sandbox; vm.createContext(sandbox);
['js/gen.js', 'data/dsl.js', 'data/catalog.js', 'data/content-g9.js', 'data/content-g9b.js', 'data/content-g10.js', 'data/content-g11.js', 'data/content-g12.js']
  .forEach(f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f }));
const W = sandbox.window, G = W.MB_GEN, ids = new Set();
W.MB_COURSE.grades.forEach(g => g.units.forEach(u => u.lessons.forEach(l => ids.add(l.id))));
const BLOCKS = ['h', 'p', 'def', 'list', 'table', 'ex', 'warn', 'recap'];
let errors = 0, lessons = 0, questions = 0;
const bad = (id, msg) => { errors++; console.log('  ✗ ' + id + ': ' + msg); };
Object.entries(W.MB_CONTENT).forEach(([id, c]) => {
  lessons++;
  if (!ids.has(id)) bad(id, 'id is not in data/catalog.js');
  if (!c.objective) bad(id, 'missing objective');
  if (!Array.isArray(c.notes) || !c.notes.length) bad(id, 'missing notes');
  (c.notes || []).forEach((b, i) => {
    if (BLOCKS.filter(t => t in b).length !== 1) bad(id, 'notes block ' + (i + 1) + ' has an unknown or mixed type');
    if (b.ex && (!b.ex.q || !Array.isArray(b.ex.steps) || !b.ex.a)) bad(id, 'example ' + (i + 1) + ' needs q, steps and a');
    if (b.def && b.def.length !== 2) bad(id, 'def block ' + (i + 1) + ' needs [term, meaning]');
  });
  (c.gen || []).forEach(n => { if (!G[n]) bad(id, 'unknown generator “' + n + '”'); });
  const nfix = (c.quiz || []).length;
  if (!(c.gen && c.gen.length) && nfix < 3) bad(id, 'needs a generator or at least 3 fixed quiz questions (has ' + nfix + ')');
  (c.quiz || []).forEach((q, i) => { questions++;
    if (!q.q || !Array.isArray(q.o) || q.o.length < 2) return bad(id, 'question ' + (i + 1) + ' needs q and at least 2 options');
    if (!Number.isInteger(q.a) || q.a < 0 || q.a >= q.o.length) bad(id, 'question ' + (i + 1) + ': answer index out of range');
    if (new Set(q.o).size !== q.o.length) bad(id, 'question ' + (i + 1) + ' has duplicate options');
    if (!q.why) bad(id, 'question ' + (i + 1) + ' needs an explanation (why)');
  });
});
const missing = [...ids].filter(id => !W.MB_CONTENT[id]);
Object.keys(G).forEach(n => { for (let i = 0; i < 200; i++) { let q; try { q = G[n](); } catch (e) { bad('gen ' + n, 'throws ' + e.message); break; }
  if (!q.q || q.o.length < 3 || new Set(q.o).size !== q.o.length || q.a !== 0 || /NaN|undefined|Infinity/.test(q.q + q.o.join('') + q.why)) { bad('gen ' + n, 'invalid question ' + JSON.stringify(q)); break; } } });
console.log(errors ? errors + ' problem(s) found' : '✓ ' + lessons + ' lessons, ' + questions + ' fixed quiz questions and ' + Object.keys(G).length + ' generators are valid');
console.log('Coverage: ' + (ids.size - missing.length) + ' of ' + ids.size + ' lessons have notes and quizzes' + (missing.length ? ' (missing: ' + missing.slice(0, 5).join(', ') + (missing.length > 5 ? ', …' : '') + ')' : ''));
process.exit(errors ? 1 : 0);
