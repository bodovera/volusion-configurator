(function () {
  'use strict';

  const RULES_URL = 'https://bodovera.github.io/volusion-configurator/volusion-option-rules.json';

  let optionRules = {};
  let rulesLoaded = false;

  function log() {
    console.log('[Configurator]', ...arguments);
  }

  function isProductPage() {
    return !!document.querySelector('select[name^="SELECT__"]');
  }

  function getSelectedIds() {
    const ids = [];

    document.querySelectorAll('select[name^="SELECT__"]').forEach(s => {
      if (s.value) ids.push(s.value);
    });

    return ids;
  }

  function shouldShow(optionId, selectedIds) {
    const rule = optionRules[optionId];
    if (!rule) return true;

    const required = rule.onlyAvailableWith || [];

    return required.some(id => selectedIds.includes(id));
  }

  function applyRules() {
    if (!rulesLoaded) return;

    const selectedIds = getSelectedIds();

    document.querySelectorAll('option').forEach(opt => {
      const id = opt.value;
      if (!id) return;

      const show = shouldShow(id, selectedIds);

      opt.hidden = !show;
      opt.disabled = !show;

      if (!show && opt.selected) {
        opt.selected = false;
      }
    });
  }

  function loadRules() {
    return fetch(RULES_URL)
      .then(r => r.json())
      .then(data => {
        optionRules = data;
        rulesLoaded = true;
        log('Rules loaded');
      })
      .catch(err => {
        console.error('Rules failed', err);
      });
  }

  function init() {
    if (!isProductPage()) return;

    document.addEventListener('change', applyRules);

    loadRules().then(() => {
      applyRules();
    });
  }

  document.addEventListener('DOMContentLoaded', init);

})();
