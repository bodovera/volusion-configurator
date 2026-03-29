(function () {
  'use strict';

  const DEBUG = true;

  // CHANGE THESE
  const TRIGGER_ID = '31005';
  const DEPENDENT_SELECT_NAME = 'SELECT__10005001__3520';
  const DEPENDENT_OPTION_IDS = ['35202', '35203', '35204', '35205', '35206'];

  function log() {
    if (DEBUG) console.log('[Configurator]', ...arguments);
  }

  function getSelectedIds() {
    const ids = [];

    document.querySelectorAll('select[name^="SELECT__"]').forEach(function (select) {
      if (select.value) ids.push(String(select.value).trim());
    });

    document.querySelectorAll('input[type="radio"][name^="RADIO__"]:checked').forEach(function (radio) {
      if (radio.value) ids.push(String(radio.value).trim());
    });

    return ids;
  }

  function runTest() {
    const selectedIds = getSelectedIds();
    const triggerOn = selectedIds.includes(TRIGGER_ID);
    const select = document.querySelector(`select[name="${DEPENDENT_SELECT_NAME}"]`);

    log('selectedIds:', selectedIds);
    log('triggerOn:', triggerOn);
    log('dependent select found:', !!select);

    if (!select) return;

    Array.from(select.options).forEach(function (opt) {
      const id = String(opt.value || '').trim();

      if (!DEPENDENT_OPTION_IDS.includes(id)) return;

      if (triggerOn) {
        opt.hidden = false;
        opt.disabled = false;
      } else {
        opt.hidden = true;
        opt.disabled = true;

        if (opt.selected) {
          select.selectedIndex = 0;
        }
      }

      log('option', id, 'hidden=', opt.hidden, 'disabled=', opt.disabled);
    });
  }

  function init() {
    if (!document.querySelector('select[name^="SELECT__"]')) return;

    document.addEventListener('change', function () {
      setTimeout(runTest, 50);
    });

    setTimeout(runTest, 300);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
