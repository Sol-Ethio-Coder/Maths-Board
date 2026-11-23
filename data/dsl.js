/* Short-hand for writing lessons. Load this file before the content files.
   L(id, objective, keyIdeas[], examples[[question, "step | step", answer]], commonMistake, generators[], extraQuestions[[q, [options], answerIndex, why]], minutes)
   - generators: names from js/gen.js. They create fresh, auto-checked questions for the quiz and the practice tab.
   - extraQuestions: your own multiple-choice questions (use these for ideas that a generator cannot test). */
window.MB_CONTENT = window.MB_CONTENT || {};
window.L = function (id, obj, keys, exs, slip, gens, qs, mins) {
  window.MB_CONTENT[id] = {
    minutes: mins || 10, objective: obj, gen: gens || [],
    notes: [{ h: 'Key ideas' }, { list: keys }, { h: 'Worked examples' }]
      .concat(exs.map(function (e) { return { ex: { q: e[0], steps: String(e[1]).split(' | '), a: e[2] } }; }))
      .concat([{ warn: slip }, { recap: keys.slice(0, 3) }]),
    quiz: (qs || []).map(function (q) { return { q: q[0], o: q[1], a: q[2], why: q[3] }; })
  };
};
