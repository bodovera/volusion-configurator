(function () {
  const RULES_URL = 'https://bodovera.github.io/volusion-configurator/volusion-option-rules.json?v=3';
  let OPTION_RULES = {};
  let isRefreshing = false;
  let swatchObserverStarted = false;

  function normalizeText(str) {
    return String(str || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function titleCase(str) {
    return String(str || '').replace(/\b\w/g, function (m) {
      return m.toUpperCase();
    });
  }

  function hide(el) {
    if (!el) return;
    el.style.display = 'none';
    el.setAttribute('aria-hidden', 'true');
  }

  function getSelectedOptionIds() {
    const ids = [];

    document.querySelectorAll('select[name^="SELECT_"]').forEach(function (sel) {
      const v = parseInt(sel.value, 10);
      if (!isNaN(v)) ids.push(v);
    });

    document.querySelectorAll('input[type="radio"][name^="SELECT_"]:checked').forEach(function (input) {
      const v = parseInt(input.value, 10);
      if (!isNaN(v)) ids.push(v);
    });

    document.querySelectorAll('input[type="checkbox"][name^="SELECT_"]:checked').forEach(function (input) {
      const v = parseInt(input.value, 10);
      if (!isNaN(v)) ids.push(v);
    });

    return ids;
  }

  function optionAllowed(optionId, selectedIds) {
    const rule = OPTION_RULES[String(optionId)];
    if (!rule) return true;

    if (Array.isArray(rule.only) && rule.only.length) {
      const ok = rule.only.some(function (parentId) {
        return selectedIds.includes(parentId);
      });
      if (!ok) return false;
    }

    if (Array.isArray(rule.not) && rule.not.length) {
      const blocked = rule.not.some(function (blockedId) {
        return selectedIds.includes(blockedId);
      });
      if (blocked) return false;
    }

    return true;
  }

  function getFieldWrapper(el) {
    return (
      el.closest('.w-100.flex.pt2.items-center') ||
      el.closest('.flex.items-center') ||
      el.closest('.w-100') ||
      el.closest('label') ||
      el.parentElement
    );
  }

  function refreshSelect(sel, selectedIds) {
    let visibleCount = 0;
    let selectedStillValid = false;

    Array.from(sel.options).forEach(function (opt, index) {
      const optionId = parseInt(opt.value, 10);

      if (isNaN(optionId)) {
        opt.hidden = false;
        if (index === sel.selectedIndex) selectedStillValid = true;
        return;
      }

      const show = optionAllowed(optionId, selectedIds);
      opt.hidden = !show;

      if (show) visibleCount++;
      if (show && opt.selected) selectedStillValid = true;
    });

    if (!selectedStillValid) {
      sel.selectedIndex = 0;
    }

    const wrapper = getFieldWrapper(sel);
    if (wrapper) {
      wrapper.style.display = visibleCount > 0 ? '' : 'none';
    }
  }

  function refreshRadioGroup(radios, selectedIds) {
    let visibleCount = 0;

    radios.forEach(function (radio) {
      const optionId = parseInt(radio.value, 10);
      const show = !isNaN(optionId) ? optionAllowed(optionId, selectedIds) : true;

      const wrapper = getFieldWrapper(radio);
      if (wrapper) wrapper.style.display = show ? '' : 'none';

      if (!show && radio.checked) {
        radio.checked = false;
      }

      if (show) visibleCount++;
    });

    const groupWrapper = getFieldWrapper(radios[0]);
    if (groupWrapper) {
      groupWrapper.style.display = visibleCount > 0 ? '' : 'none';
    }
  }

  function refreshCheckboxGroup(checkboxes, selectedIds) {
    let visibleCount = 0;

    checkboxes.forEach(function (checkbox) {
      const optionId = parseInt(checkbox.value, 10);
      const show = !isNaN(optionId) ? optionAllowed(optionId, selectedIds) : true;

      const wrapper = getFieldWrapper(checkbox);
      if (wrapper) wrapper.style.display = show ? '' : 'none';

      if (!show && checkbox.checked) {
        checkbox.checked = false;
      }

      if (show) visibleCount++;
    });

    const groupWrapper = getFieldWrapper(checkboxes[0]);
    if (groupWrapper) {
      groupWrapper.style.display = visibleCount > 0 ? '' : 'none';
    }
  }

  function injectSwatchStyles() {
    if (document.getElementById('bod-swatch-box-styles')) return;

    var css = `
      .bod-swatch-enhanced-row {
        display: flex !important;
        flex-wrap: wrap !important;
        align-items: flex-start !important;
        gap: 10px !important;
      }

      .bod-swatch-enhanced-cell {
        padding-right: 0 !important;
        margin-right: 0 !important;
        margin-bottom: 0 !important;
      }

      .bod-swatch-enhanced {
        display: inline-flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: flex-start !important;
        width: 88px !important;
        min-height: 96px !important;
        padding: 8px 6px !important;
        margin: 0 !important;
        border: 2px solid #cfcfcf !important;
        border-radius: 10px !important;
        background: #fff !important;
        cursor: pointer !important;
        box-sizing: border-box !important;
        text-align: center !important;
      }

      .bod-swatch-enhanced:hover {
        border-color: #666 !important;
      }

      .bod-swatch-enhanced img {
        max-width: 52px !important;
        max-height: 52px !important;
        width: auto !important;
        height: auto !important;
        display: block !important;
        margin: 0 0 6px 0 !important;
        border-style: none !important;
      }

      .bod-swatch-label {
        display: block !important;
        font-size: 12px !important;
        line-height: 1.2 !important;
        color: #1f2937 !important;
        white-space: normal !important;
        text-align: center !important;
      }

      .bod-swatch-enhanced.bod-swatch-selected,
      .bod-swatch-enhanced.active,
      .bod-swatch-enhanced.selected {
        border-color: #5850ec !important;
        box-shadow: 0 0 0 2px rgba(88, 80, 236, 0.14) !important;
      }

      .bod-option-hidden {
        display: none !important;
      }
    `;

    var style = document.createElement('style');
    style.id = 'bod-swatch-box-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function getSwatchValue(sw) {
    const img = sw.querySelector('img');
    return (
      sw.getAttribute('data-doogma-value') ||
      (img && (img.getAttribute('alt') || img.getAttribute('title'))) ||
      ''
    );
  }

  function enhanceAllSwatches() {
    injectSwatchStyles();

    var swatches = Array.from(document.querySelectorAll('[data-doogma-value].swatchWrapper'));
    if (!swatches.length) return;

    swatches.forEach(function (sw) {
      sw.classList.add('bod-swatch-enhanced');

      var img = sw.querySelector('img');
      if (img) {
        img.removeAttribute('width');
        img.removeAttribute('height');
      }

      var cell = sw.parentElement;
      if (cell) {
        cell.classList.add('bod-swatch-enhanced-cell');
      }

      var row = sw.closest('.flex.flex-wrap');
      if (row) {
        row.classList.add('bod-swatch-enhanced-row');
      }

      if (!sw.querySelector('.bod-swatch-label')) {
        var label = document.createElement('div');
        label.className = 'bod-swatch-label';
        label.textContent = titleCase(getSwatchValue(sw));
        sw.appendChild(label);
      }
    });
  }

  function hideDuplicateInputRowsForSwatches() {
    Array.from(document.querySelectorAll('strong[role="heading"]')).forEach(function (heading) {
      var parent = heading.parentElement;
      if (!parent) return;

      var children = Array.from(parent.children);
      var idx = children.indexOf(heading);
      if (idx < 0) return;

      var swatchArea = null;
      var rowsWrap = null;

      for (var i = idx + 1; i < children.length; i++) {
        var el = children[i];

        if (el.matches && el.matches('strong[role="heading"]')) break;

        if (!swatchArea && el.querySelector && el.querySelector('[data-doogma-value].swatchWrapper')) {
          swatchArea = el;
          continue;
        }

        if (
          !rowsWrap &&
          el.querySelector &&
          el.querySelector('input[type="radio"][name^="SELECT_"], input[type="checkbox"][name^="SELECT_"]')
        ) {
          rowsWrap = el;
          continue;
        }
      }

      if (swatchArea && rowsWrap) {
        rowsWrap.classList.add('bod-option-hidden');
      }
    });
  }

  function syncSwatchSelectionFromInputs() {
    Array.from(document.querySelectorAll('[data-doogma-value].swatchWrapper')).forEach(function (sw) {
      sw.classList.remove('bod-swatch-selected');
      sw.classList.remove('selected');
      sw.classList.remove('active');
    });

    Array.from(
      document.querySelectorAll('input[type="radio"][name^="SELECT_"]:checked, input[type="checkbox"][name^="SELECT_"]:checked')
    ).forEach(function (input) {
      var labelText = '';
      if (input.id) {
        var label = document.querySelector('label[for="' + input.id + '"]');
        labelText = label ? normalizeText(label.textContent) : '';
      }

      if (!labelText) return;

      Array.from(document.querySelectorAll('[data-doogma-value].swatchWrapper')).forEach(function (sw) {
        var swatchText = normalizeText(sw.getAttribute('data-doogma-value'));
        if (swatchText && swatchText === labelText) {
          sw.classList.add('bod-swatch-selected');
          sw.classList.add('selected');
          sw.classList.add('active');
        }
      });
    });
  }

  function hideProductCode() {
    document.querySelectorAll('[data-product-code]').forEach(function (el) {
      hide(el);
    });

    document.querySelectorAll('strong, div, p, span, label').forEach(function (el) {
      const txt = String(el.textContent || '').replace(/\s+/g, ' ').trim().toUpperCase();

      if (
        txt === 'PRODUCTCODE:' ||
        txt === 'PRODUCT CODE:' ||
        txt === 'PRODUCTCODE' ||
        txt === 'PRODUCT CODE'
      ) {
        const wrap =
          el.closest('.flex.flex-wrap') ||
          el.closest('.w-100') ||
          el.parentElement ||
          el;

        hide(wrap);
      }
    });
  }

  function cleanProductPriceName() {
    document.querySelectorAll('.ProductPrice_Name, #ProductPrice_Name').forEach(function (el) {
      const txt = String(el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!txt) return;

      if (
        /starting at/i.test(txt) ||
        /productprice_name/i.test(txt) ||
        /\d+\s*x\s*\d+/i.test(txt)
      ) {
        el.textContent = 'Product Price';
      }
    });
  }

  function runProductCleanup() {
    hideProductCode();
    cleanProductPriceName();
  }

  function enhanceSwatches() {
    enhanceAllSwatches();
    hideDuplicateInputRowsForSwatches();
    syncSwatchSelectionFromInputs();
  }

  function startSwatchObserver() {
    if (swatchObserverStarted) return;
    swatchObserverStarted = true;

    var observer = new MutationObserver(function () {
      enhanceSwatches();
      runProductCleanup();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }

  function refreshAll() {
    if (isRefreshing) return;
    isRefreshing = true;

    try {
      const selectedIds = getSelectedOptionIds();

      document.querySelectorAll('select[name^="SELECT_"]').forEach(function (sel) {
        refreshSelect(sel, selectedIds);
      });

      const radioGroups = {};
      document.querySelectorAll('input[type="radio"][name^="SELECT_"]').forEach(function (radio) {
        if (!radioGroups[radio.name]) radioGroups[radio.name] = [];
        radioGroups[radio.name].push(radio);
      });

      Object.keys(radioGroups).forEach(function (name) {
        refreshRadioGroup(radioGroups[name], selectedIds);
      });

      const checkboxGroups = {};
      document.querySelectorAll('input[type="checkbox"][name^="SELECT_"]').forEach(function (checkbox) {
        if (!checkboxGroups[checkbox.name]) checkboxGroups[checkbox.name] = [];
        checkboxGroups[checkbox.name].push(checkbox);
      });

      Object.keys(checkboxGroups).forEach(function (name) {
        refreshCheckboxGroup(checkboxGroups[name], selectedIds);
      });

      enhanceSwatches();
      runProductCleanup();
    } finally {
      isRefreshing = false;
    }
  }

  function bindEvents() {
    document.addEventListener('change', function (e) {
      if (
        e.target.matches('select[name^="SELECT_"]') ||
        e.target.matches('input[type="radio"][name^="SELECT_"]') ||
        e.target.matches('input[type="checkbox"][name^="SELECT_"]')
      ) {
        refreshAll();
      }
    });
  }

  async function init() {
    try {
      const res = await fetch(RULES_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load rules JSON: ' + res.status);

      OPTION_RULES = await res.json();
      bindEvents();
      startSwatchObserver();

      refreshAll();
      setTimeout(refreshAll, 50);
      setTimeout(refreshAll, 250);
      setTimeout(refreshAll, 750);
      setTimeout(refreshAll, 1500);

      console.log('Volusion rules loaded', OPTION_RULES);
    } catch (err) {
      console.error('Volusion rules failed to load:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', function () {
    setTimeout(refreshAll, 100);
    setTimeout(refreshAll, 500);
    setTimeout(refreshAll, 1200);
  });
})();
