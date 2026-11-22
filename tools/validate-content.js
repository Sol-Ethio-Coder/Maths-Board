/* Checks lesson content files: node tools/validate-content.js
   - every lesson id exists in data/catalog.js
   - notes use known block types, quizzes have a valid answer index and no duplicate options */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const sandbox = { window: {} }; vm.createContext(sandbox);
['catalog.js', 'content-g9.js', 'content-g10.js', 'content-g11.js', 'content-g12.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(root, 'data', f), 'utf8'), sandbox, { filename: f }));
const W = sandbox.window, ids = new Set();
W.MB_COURSE.grades.forEach(g => g.units.forEach(u => u.lessons.forEach(l => ids.add(l.id))));
const BLOCKS = ['h', 'p', 'def', 'list', 'table', 'ex', 'warn', 'recap'];
let errors = 0, lessons = 0, questions = 0;
const bad = (id, msg) => { errors++; console.log('  ✗ ' + id + ': ' + msg); };
Object.entries(W.MB_CONTENT).forEach(([id, c]) => {
  lessons++;
  if (!ids.has(id)) bad(id, 'id is not in data/catalog.js');
  if (!c.objective) bad(id, 'missing objective');
  if (!Array.isArray(c.notes) || !c.notes.length) bad(id, 'missing notes');
  (c.notes || []).forEach((b, i) => { const k = BLOCKS.filter(t => t in b); if (k.length !== 1) bad(id, 'notes block ' + (i + 1) + ' has an unknown or mixed type');
    if (b.ex && (!b.ex.q || !Array.isArray(b.ex.steps) || !b.ex.a)) bad(id, 'example ' + (i + 1) + ' needs q, steps and a');
    if (b.def && b.def.length !== 2) bad(id, 'def block ' + (i + 1) + ' needs [term, meaning]'); });
  if (!Array.isArray(c.quiz) || c.quiz.length < 4) bad(id, 'quiz needs at least 4 questions');
  (c.quiz || []).forEach((q, i) => { questions++;
    if (!q.q || !Array.isArray(q.o) || q.o.length < 2) return bad(id, 'question ' + (i + 1) + ' needs q and at least 2 options');
    if (!Number.isInteger(q.a) || q.a < 0 || q.a >= q.o.length) bad(id, 'question ' + (i + 1) + ': answer index out of range');
    if (new Set(q.o).size !== q.o.length) bad(id, 'question ' + (i + 1) + ' has duplicate options');
    if (!q.why) bad(id, 'question ' + (i + 1) + ' needs an explanation (why)'); });
});
console.log(errors ? errors + ' problem(s) found' : '✓ ' + lessons + ' lessons and ' + questions + ' quiz questions are valid (' + ids.size + ' lessons in the catalogue)');
process.exit(errors ? 1 : 0);
