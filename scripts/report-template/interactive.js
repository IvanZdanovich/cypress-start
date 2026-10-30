/* global document, window */
// Browser-side behaviour of the HTML sign-off report: manual results that cycle not checked → passed → failed,
// notes and sign-off fields persisted in localStorage, progress counters and print helpers.
// Filtering is plain CSS (see render.js); without scripts the manual box falls back to a plain tick box.
(function signoffReport() {
  const storageKey = `signoff-report:${document.body.dataset.reportId}`;
  const NEXT_STATE = { '': 'pass', pass: 'fail', fail: '' };
  const MANUAL_LABELS = { '': 'not checked', pass: 'passed', fail: 'failed' };
  let state = {};
  try {
    state = JSON.parse(window.localStorage.getItem(storageKey)) || {};
  } catch {
    state = {};
  }

  const save = () => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Storage can be unavailable (private mode, file:// restrictions); entries then last for the page session.
    }
  };

  const fields = () => document.querySelectorAll('[data-key]');
  const isManual = (el) => el.classList.contains('manual');
  const markFilled = (el) => el.classList.toggle('filled', Boolean(el.value));

  const setManual = (box, value) => {
    box.checked = Boolean(value);
    box.dataset.state = value;
    box.setAttribute('aria-label', `Manual result for ${box.dataset.title}: ${MANUAL_LABELS[value]}`);
    const row = box.closest('li');
    if (value) row.dataset.manual = value;
    else delete row.dataset.manual;
  };

  const setProgress = (el, passed, failed, total) => {
    if (!el) return;
    const width = (count) => `${total ? (count / total) * 100 : 0}%`;
    el.querySelector('[data-done]').textContent = String(passed + failed);
    el.querySelector('[data-failed]').textContent = String(failed);
    el.querySelector('[data-failed-wrap]').hidden = failed === 0;
    el.querySelector('[data-fill]').style.width = width(passed);
    el.querySelector('[data-fill-fail]').style.width = width(failed);
  };

  const updateProgress = () => {
    const totals = { passed: 0, failed: 0, total: 0 };
    for (const spec of document.querySelectorAll('details.spec')) {
      const boxes = [...spec.querySelectorAll('input.manual')];
      const passed = boxes.filter((box) => box.dataset.state === 'pass').length;
      const failed = boxes.filter((box) => box.dataset.state === 'fail').length;
      setProgress(spec.querySelector('[data-progress]'), passed, failed, boxes.length);
      spec.classList.toggle('complete', boxes.length > 0 && passed === boxes.length);
      spec.classList.toggle('manual-failed', failed > 0);
      totals.passed += passed;
      totals.failed += failed;
      totals.total += boxes.length;
    }
    setProgress(document.querySelector('#coverage [data-progress]'), totals.passed, totals.failed, totals.total);
  };

  for (const el of fields()) {
    const value = state[el.dataset.key];
    if (isManual(el)) {
      // Reports saved before the three-state box stored `true` for a ticked check.
      setManual(el, value === true ? 'pass' : value || '');
    } else {
      if (value !== undefined) el.value = value;
      markFilled(el);
    }
  }

  document.addEventListener('change', (event) => {
    const box = event.target;
    if (!box.dataset?.key || !isManual(box)) return;
    const value = NEXT_STATE[box.dataset.state || ''];
    setManual(box, value);
    state[box.dataset.key] = value;
    save();
    updateProgress();
  });

  document.addEventListener('input', (event) => {
    const el = event.target;
    if (!el.dataset?.key || isManual(el)) return;
    state[el.dataset.key] = el.value;
    markFilled(el);
    save();
  });

  const setAllOpen = (open) => {
    for (const spec of document.querySelectorAll('details.spec')) spec.open = open;
  };

  document.addEventListener('click', (event) => {
    const action = event.target.closest('button[data-action]')?.dataset.action;
    if (action === 'expand') setAllOpen(true);
    if (action === 'collapse') setAllOpen(false);
    if (action === 'print') window.print();
    if (action === 'reset' && window.confirm('Clear all manual results, notes and sign-off entries in this report?')) {
      state = {};
      save();
      for (const el of fields()) {
        if (isManual(el)) {
          setManual(el, '');
        } else {
          el.value = '';
          markFilled(el);
        }
      }
      updateProgress();
    }
  });

  window.addEventListener('beforeprint', () => setAllOpen(true));
  updateProgress();
})();
