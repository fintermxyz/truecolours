/* flagcheck.js - a dev-only tool for playing through every flag in the game,
   one after another, to check regions/pre-fill behave correctly. Not linked
   from the game itself; open flagcheck.html directly. Progress ("fine" marks
   and free-text notes per flag) is kept in this browser's localStorage only -
   "Copy all notes to clipboard" is the way to get them out for review. */
(function () {
  const C = window.Color, Assets = window.FlagAssets;
  const $ = id => document.getElementById(id);
  const STORE_KEY = 'tc:flagcheck';

  function loadStatus() {
    try {
      const v = JSON.parse(localStorage.getItem(STORE_KEY));
      return v && v.fine ? Object.assign({ fine: {}, notes: {}, index: 0 }, v) : { fine: {}, notes: {}, index: 0 };
    } catch (e) { return { fine: {}, notes: {}, index: 0 }; }
  }
  function saveStatus() { try { localStorage.setItem(STORE_KEY, JSON.stringify(status)); } catch (e) { /* private mode */ } }

  // Same scoring rule as the real game (js/game.js) - duplicated rather than
  // shared so this tool never depends on game.js's screen-wiring init(). Keep
  // this in sync with game.js's scoreAttempt if that one changes.
  function scoreAttempt(meta, fills) {
    const groups = new Map();
    for (const r of meta.regions) {
      if (!groups.has(r.hex)) groups.set(r.hex, { hex: r.hex, regions: [] });
      groups.get(r.hex).regions.push(r);
    }
    const out = [];
    const rows = [];
    for (const g of groups.values()) {
      let totalArea = 0, weighted = 0;
      const byFill = new Map();
      for (const r of g.regions) {
        const yours = fills.get(r.id) || '#f4f4f1';
        const pts = C.pointsFor(C.hexDistance(yours, g.hex));
        weighted += pts * r.area; totalArea += r.area;
        if (!byFill.has(yours)) byFill.set(yours, { yours, points: pts, area: 0, count: 0 });
        const fillGroup = byFill.get(yours);
        fillGroup.area += r.area; fillGroup.count += 1;
      }
      const points = Math.round(weighted / totalArea);
      out.push({ hex: g.hex, points, area: totalArea });
      // One row per distinct fill used within this colour, so a wrongly-coloured
      // region shows up on its own instead of being averaged into the rest.
      for (const fillGroup of [...byFill.values()].sort((a, b) => b.area - a.area)) {
        rows.push({
          hex: g.hex, yours: fillGroup.yours, points: fillGroup.points,
          verdict: C.verdict(fillGroup.points), count: fillGroup.count, groupArea: totalArea, area: fillGroup.area,
        });
      }
    }
    rows.sort((a, b) => b.groupArea - a.groupArea || b.area - a.area);
    const points = Math.round(out.reduce((s, g) => s + g.points, 0) / out.length);
    return { points, rows };
  }

  let manifest, order, status, idx, board, picker;

  async function init() {
    manifest = await Assets.manifestLoad();
    order = manifest.flags.slice().sort((a, b) => a.name.localeCompare(b.name));
    status = loadStatus();
    idx = Math.min(Math.max(status.index || 0, 0), order.length - 1);

    board = new window.FlagBoard($('flag-canvas'));
    picker = new window.Picker($('picker'), { onChange: hex => { board.currentColour = hex; } });
    board.currentColour = picker.hex;
    board.onFill = hex => { picker.remember(hex); updateProgress(); };

    buildSelect();
    $('fc-select').addEventListener('change', e => load(+e.target.value));
    $('fc-skip').addEventListener('click', () => load((idx + 1) % order.length));
    $('fc-fine').addEventListener('click', markFine);
    $('btn-clear').addEventListener('click', () => { board.clear(); updateProgress(); $('fc-score').hidden = true; });
    $('btn-score').addEventListener('click', showScore);
    $('fc-reset').addEventListener('click', resetProgress);
    $('fc-copy-notes').addEventListener('click', copyAllNotes);
    $('fc-notes-input').addEventListener('input', onNoteInput);
    // belt-and-braces: flush the note if the tab is closed/hidden mid-debounce
    document.addEventListener('visibilitychange', () => { if (document.hidden) flushNote(); });

    await load(idx);
  }

  function fineCount() { return Object.keys(status.fine).length; }

  function buildSelect() {
    const sel = $('fc-select');
    sel.innerHTML = order.map((f, i) => {
      const mark = (status.fine[f.code] ? '✓' : '') + (status.notes[f.code] ? '✎' : '');
      return `<option value="${i}">${mark ? mark + ' ' : ''}${f.name}</option>`;
    }).join('');
    $('fc-fine-count').textContent = fineCount();
  }

  async function load(i) {
    flushNote();
    idx = i; status.index = i; saveStatus();
    const meta = order[idx];
    $('fc-country').textContent = meta.name.toUpperCase();
    $('fc-progress').textContent = `${idx + 1} / ${order.length}`;
    $('fc-select').value = idx;
    $('fc-truth-img').src = `flags/${meta.code}.svg`;
    $('fc-truth-img').alt = `${meta.name} flag`;
    const done = !!status.fine[meta.code];
    $('fc-fine').classList.toggle('is-done', done);
    $('fc-fine').textContent = done ? '✓ Marked fine' : '✓ Flag is fine';
    $('fc-notes-input').value = status.notes[meta.code] || '';
    $('fc-notes-status').textContent = '';
    $('prefill-note').hidden = !(meta.prefilled > 0);
    $('fc-score').hidden = true;
    $('flag-loading').hidden = false;
    board.interactive = false;
    picker.clearRecent();
    await board.load(meta);
    board.interactive = true;
    $('flag-loading').hidden = true;
    updateProgress();
  }

  function updateProgress() {
    const n = order[idx].regions.length, f = board.filledCount;
    $('progress-text').textContent = f === n ? `All ${n} regions filled` : `${f} of ${n} region${n === 1 ? '' : 's'} filled`;
    $('progress-fill').style.width = (f / n * 100) + '%';
  }

  function showScore() {
    const meta = order[idx], result = scoreAttempt(meta, board.fills);
    const el = $('fc-score');
    el.hidden = false;
    el.innerHTML = `<div class="fc-score-total">${result.points} <small>/ 1000</small></div>` + result.rows.map(g => `
      <div class="bd-row">
        <div class="bd-swatches">
          <span class="sw" style="background:${g.yours}" title="Yours ${g.yours}"></span>
          <span class="sw-arrow">→</span>
          <span class="sw" style="background:${g.hex}" title="Actual ${g.hex}"></span>
        </div>
        <div class="bd-name">${C.describe(g.hex)}${g.count > 1 ? ` <small>(×${g.count} regions)</small>` : ''}<small>${g.yours.toUpperCase()} vs ${g.hex.toUpperCase()}</small></div>
        <div class="bd-verdict v-${g.verdict.replace(/\s/g, '').toLowerCase()}">${g.verdict}</div>
      </div>`).join('');
  }

  function markFine() {
    status.fine[order[idx].code] = new Date().toISOString();
    saveStatus();
    buildSelect();
    load((idx + 1) % order.length);
  }

  function resetProgress() {
    if (!confirm('Clear every "flag is fine" mark on this device and start the review over? (Your notes are kept.)')) return;
    status = { fine: {}, notes: status.notes, index: 0 };
    saveStatus();
    buildSelect();
    load(0);
  }

  // ----------------------------------------------------------------- notes
  // Autosaved to localStorage as you type (debounced), so there's no explicit
  // save step - just write and move on. flushNote() forces it through
  // immediately when navigating away or hiding the tab, so nothing typed in
  // the last moment before that is lost.
  let noteTimer = null;
  function onNoteInput(e) {
    status.notes[order[idx].code] = e.target.value;
    $('fc-notes-status').textContent = 'Saving…';
    clearTimeout(noteTimer);
    noteTimer = setTimeout(commitNote, 500);
  }
  function commitNote() {
    noteTimer = null;
    const code = order[idx].code;
    if (!status.notes[code]) delete status.notes[code];
    saveStatus();
    buildSelect();
    $('fc-select').value = idx;
    $('fc-notes-status').textContent = 'Saved';
  }
  function flushNote() { if (noteTimer) { clearTimeout(noteTimer); commitNote(); } }

  async function copyAllNotes() {
    flushNote();
    const lines = [`FlagFill notes - exported ${new Date().toISOString()}`, ''];
    let count = 0;
    for (const f of order) {
      const note = (status.notes[f.code] || '').trim();
      if (!note) continue;
      count++;
      lines.push(`[${f.code}] ${f.name}${status.fine[f.code] ? ' (marked fine)' : ''}`, note, '');
    }
    if (!count) lines.push('(no notes written yet)');
    const text = lines.join('\n');
    const btn = $('fc-copy-notes');
    try { await navigator.clipboard.writeText(text); btn.textContent = count ? `Copied ${count} note${count === 1 ? '' : 's'}!` : 'No notes yet'; }
    catch (e) { prompt('Copy your notes:', text); }
    setTimeout(() => { btn.textContent = 'Copy all notes to clipboard'; }, 2200);
  }

  init().catch(err => { console.error(err); alert('Failed to load: ' + err.message); });
})();
