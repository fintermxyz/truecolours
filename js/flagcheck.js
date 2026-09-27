/* flagcheck.js - a dev-only tool for playing through every flag in the game,
   one after another, to check regions/pre-fill behave correctly. Not linked
   from the game itself; open flagcheck.html directly. Progress ("fine" marks)
   is kept in this browser's localStorage only. */
(function () {
  const C = window.Color, Assets = window.FlagAssets;
  const $ = id => document.getElementById(id);
  const STORE_KEY = 'tc:flagcheck';

  function loadStatus() {
    try {
      const v = JSON.parse(localStorage.getItem(STORE_KEY));
      return v && v.fine ? v : { fine: {}, index: 0 };
    } catch (e) { return { fine: {}, index: 0 }; }
  }
  function saveStatus() { try { localStorage.setItem(STORE_KEY, JSON.stringify(status)); } catch (e) { /* private mode */ } }

  // Same scoring rule as the real game (js/game.js) - duplicated rather than
  // shared so this tool never depends on game.js's screen-wiring init().
  function scoreAttempt(meta, fills) {
    const groups = new Map();
    for (const r of meta.regions) {
      if (!groups.has(r.hex)) groups.set(r.hex, { hex: r.hex, regions: [] });
      groups.get(r.hex).regions.push(r);
    }
    const out = [];
    for (const g of groups.values()) {
      let totalArea = 0, weighted = 0, best = null;
      for (const r of g.regions) {
        const yours = fills.get(r.id) || '#f4f4f1';
        const pts = C.pointsFor(C.hexDistance(yours, g.hex));
        weighted += pts * r.area; totalArea += r.area;
        if (!best || r.area > best.area) best = { area: r.area, hex: yours };
      }
      out.push({ hex: g.hex, yours: best.hex, points: Math.round(weighted / totalArea), verdict: C.verdict(Math.round(weighted / totalArea)) });
    }
    out.sort((a, b) => b.points - a.points);
    const points = Math.round(out.reduce((s, g) => s + g.points, 0) / out.length);
    return { points, groups: out };
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

    await load(idx);
  }

  function fineCount() { return Object.keys(status.fine).length; }

  function buildSelect() {
    const sel = $('fc-select');
    sel.innerHTML = order.map((f, i) => `<option value="${i}">${status.fine[f.code] ? '✓ ' : ''}${f.name}</option>`).join('');
    $('fc-fine-count').textContent = fineCount();
  }

  async function load(i) {
    idx = i; status.index = i; saveStatus();
    const meta = order[idx];
    $('fc-country').textContent = meta.name.toUpperCase();
    $('fc-progress').textContent = `${idx + 1} / ${order.length}`;
    $('fc-select').value = idx;
    const done = !!status.fine[meta.code];
    $('fc-fine').classList.toggle('is-done', done);
    $('fc-fine').textContent = done ? '✓ Marked fine' : '✓ Flag is fine';
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
    el.innerHTML = `<div class="fc-score-total">${result.points} <small>/ 1000</small></div>` + result.groups.map(g => `
      <div class="bd-row">
        <div class="bd-swatches">
          <span class="sw" style="background:${g.yours}" title="Yours ${g.yours}"></span>
          <span class="sw-arrow">→</span>
          <span class="sw" style="background:${g.hex}" title="Actual ${g.hex}"></span>
        </div>
        <div class="bd-name">${C.describe(g.hex)}<small>${g.yours.toUpperCase()} vs ${g.hex.toUpperCase()}</small></div>
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
    if (!confirm('Clear every "flag is fine" mark on this device and start the review over?')) return;
    status = { fine: {}, index: 0 };
    saveStatus();
    buildSelect();
    load(0);
  }

  init().catch(err => { console.error(err); alert('Failed to load: ' + err.message); });
})();
