(function () {
  'use strict';

  // ==============================
  // Volusion Configurator Engine
  // Supports:
  // - Only_Available_With_OptionIDs
  // - OR matching logic
  // - Doogma/Volusion select + radio controls
  // ==============================

  const RULES_URL = 'https://bodovera.github.io/volusion-configurator/volusion-option-rules.json';

  let optionRules = {};
  let rulesLoaded = false;

  function log() {
    console.log('[Volusion Configurator]', ...arguments);
  }

  function isProductPage() {
    return !!document.querySelector(
      'select[name^="SELECT__"], input[type="radio"][name^="RADIO__"], .doogma-motorcontrol'
    );
  }

  function normalizeId(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  function getSelectedOptionIds() {
    const selectedIds = [];

    document.querySelectorAll('select[name^="SELECT__"]').forEach(function (select) {
      const value = normalizeId(select.value);
      if (value) selectedIds.push(value);
    });

    document.querySelectorAll('input[type="radio"][name^="RADIO__"]:checked').forEach(function (radio) {
      const value = normalizeId(radio.value);
      if (value) selectedIds.push(value);
    });

    return selectedIds;
  }

  function getRuleForOption(optionId) {
    const rule = optionRules[optionId];
    if (!rule) return null;

    if (Array.isArray(rule)) {
      return {
        onlyAvailableWith: rule.map(normalizeId).filter(Boolean)
      };
    }

    if (rule && typeof rule === 'object') {
      return {
        onlyAvailableWith: Array.isArray(rule.onlyAvailableWith)
          ? rule.onlyAvailableWith.map(normalizeId).filter(Boolean)
          : []
      };
    }

    return null;
  }

  function shouldShowOption(optionId, selectedIds) {
    const rule = getRuleForOption(optionId);
    if (!rule) return true;

    const requiredIds = rule.onlyAvailableWith || [];
    if (!requiredIds.length) return true;

    return requiredIds.some(function (requiredId) {
      return selectedIds.includes(requiredId);
    });
  }

  function clearHiddenSelectedOptions() {
    document.querySelectorAll('select[name^="SELECT__"]').forEach(function (select) {
      const selectedOption = select.options[select.selectedIndex];
      if (!selectedOption) return;

      if (selectedOption.hidden || selectedOption.disabled) {
        select.selectedIndex = 0;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    document.querySelectorAll('input[type="radio"][name^="RADIO__"]:checked').forEach(function (radio) {
      const optionId = normalizeId(radio.value);
      const selectedIds = getSelectedOptionIds();
      const shouldShow = shouldShowOption(optionId, selectedIds);

      if (!shouldShow) {
        radio.checked = false;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }

  function updateSelectOptions(selectedIds) {
    document.querySelectorAll('select[name^="SELECT__"]').forEach(function (select) {
      let visibleCount = 0;

      Array.from(select.options).forEach(function (option, index) {
        const optionId = normalizeId(option.value);

        // Keep blank/placeholder/first empty option visible
        if (!optionId) {
          option.hidden = false;
          option.disabled = false;
          visibleCount++;
          return;
        }

        const show = shouldShowOption(optionId, selectedIds);

        option.hidden = !show;
        option.disabled = !show;

        if (show) visibleCount++;
      });

      // If current selection is hidden, reset to first visible option
      const selectedOption = select.options[select.selectedIndex];
      if (selectedOption && (selectedOption.hidden || selectedOption.disabled)) {
        let resetIndex = 0;

        for (let i = 0; i < select.options.length; i++) {
          if (!select.options[i].hidden && !select.options[i].disabled) {
            resetIndex = i;
            break;
          }
        }

        select.selectedIndex = resetIndex;
      }

      // Hide entire select row if only one visible option remains and it's placeholder/NA?
      // Leaving row visible for now to avoid layout surprises.
    });
  }

  function updateRadioOptions(selectedIds) {
    document.querySelectorAll('input[type="radio"][name^="RADIO__"]').forEach(function (radio) {
      const optionId = normalizeId(radio.value);
      if (!optionId) return;

      const show = shouldShowOption(optionId, selectedIds);

      const label =
        radio.closest('label') ||
        radio.closest('.form-check') ||
        radio.parentElement;

      if (label) {
        label.style.display = show ? '' : 'none';
      } else {
        radio.style.display = show ? '' : 'none';
      }

      radio.disabled = !show;

      if (!show && radio.checked) {
        radio.checked = false;
      }
    });
  }

  function applyOptionRules() {
    if (!rulesLoaded) return;

    const selectedIds = getSelectedOptionIds();

    updateSelectOptions(selectedIds);
    updateRadioOptions(selectedIds);
    clearHiddenSelectedOptions();
  }

  function bindEvents() {
    document.addEventListener('change', function (event) {
      const target = event.target;
      if (!target) return;

      if (
        target.matches('select[name^="SELECT__"]') ||
        target.matches('input[type="radio"][name^="RADIO__"]')
      ) {
        applyOptionRules();
      }
    });
  }

  function loadRules() {
    return fetch(RULES_URL, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Rules file failed to load: HTTP ' + response.status);
        }
        return response.json();
      })
      .then(function (json) {
        optionRules = json || {};
        rulesLoaded = true;
        log('Rules loaded', optionRules);
      })
      .catch(function (error) {
        console.error('[Volusion Configurator] Failed to load rules:', error);
      });
  }

  function init() {
    if (!isProductPage()) return;

    bindEvents();

    loadRules().then(function () {
      applyOptionRules();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
