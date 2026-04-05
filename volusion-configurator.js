(function () {
  const RULES_URL = 'https://bodovera.github.io/volusion-configurator/volusion-option-rules.json?v=1';
  let OPTION_RULES = {};
  let isRefreshing = false;

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

  function injectStyles() {
    if (document.getElementById('bod-option-box-styles')) return;

    var css = `
      .option-image-boxes-ready .swatchRowWrap {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 10px !important;
        margin-top: 8px !important;
        margin-bottom: 8px !important;
      }

      .option-image-boxes-ready .swatchWrapper {
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

      .option-image-boxes-ready .swatchWrapper:hover {
        border-color: #666 !important;
      }

      .option-image-boxes-ready .swatchWrapper.selected,
      .option-image-boxes-ready .swatchWrapper.active {
        border-color: #5850ec !important;
        box-shadow: 0 0 0 2px rgba(88, 80, 236, 0.14) !important;
      }

      .option-image-boxes-ready .swatchWrapper img {
        max-width: 52px !important;
        max-height: 52px !important;
        width: auto !important;
        height: auto !important;
        display: block !important;
        margin: 0 0 6px 0 !important;
      }

      .option-image-boxes-ready .option-box-text {
        display: block !important;
        font-size: 12px !important;
        line-height: 1.2 !important;
        color: #1f2937 !important;
        white-space: normal !important;
        text-align: center !important;
      }

      .bod-option-hidden {
        display: none !important;
      }
    `;

    var style = document.createElement('style');
    style.id = 'bod-option-box-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function normalizeText(str) {
    return String(str || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function titleCase(str) {
    return String(str || '').replace(/\b\w/g, function (m) {
      return m.toUpperCase();
    });
  }

  function getOptionSectionHeaders() {
    return Array.from(document.querySelectorAll('strong[role="heading"]')).filter(function (el) {
      var txt = normalizeText(el.textContent);
      return txt && txt !== 'choose your options:';
    });
  }

  function getSectionParts(heading) {
    var parent = heading.parentElement;
    if (!parent) return null;

    var children = Array.from(parent.children);
    var headingIndex = children.indexOf(heading);
    if (headingIndex < 0) return null;

    var swatchArea = null;
    var rowsWrap = null;

    for (var i = headingIndex + 1; i < children.length; i++) {
      var el = children[i];

      if (el.matches && el.matches('strong[role="heading"]')) break;

      if (!swatchArea && el.querySelector && el.querySelector('.swatchWrapper[data-doogma-value] img')) {
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

    if (!swatchArea) return null;

    return {
      heading: heading,
      swatchArea: swatchArea,
      rowsWrap: rowsWrap
    };
  }

  function enhanceSwatchArea(parts) {
    var heading = parts.heading;
    var swatchArea = parts.swatchArea;
    var rowsWrap = parts.rowsWrap;

    if (!swatchArea || heading.dataset.bodOptionBoxesReady === '1') return;

    swatchArea.classList.add('option-image-boxes-ready');

    var firstWrap = swatchArea.querySelector('.flex.flex-wrap');
    if (firstWrap) {
      firstWrap.classList.add('swatchRowWrap');
    }

    Array.from(swatchArea.querySelectorAll('.swatchWrapper[data-doogma-value]')).forEach(function (sw) {
      if (!sw.querySelector('.option-box-text')) {
        var text =
          sw.getAttribute('data-doogma-value') ||
          (sw.querySelector('img') && (sw.querySelector('img').getAttribute('alt') || sw.querySelector('img').getAttribute('title'))) ||
          '';

        var label = document.createElement('div');
        label.className = 'option-box-text';
        label.textContent = titleCase(text);
        sw.appendChild(label);
      }
    });

    if (rowsWrap) {
      rowsWrap.classList.add('bod-option-hidden');
    }

    heading.dataset.bodOptionBoxesReady = '1';
  }

  function syncOptionBoxesVisibility() {
    getOptionSectionHeaders().forEach(function (heading) {
      var parts = getSectionParts(heading);
      if (!parts || !parts.swatchArea) return;

      var swatchArea = parts.swatchArea;
      var rowsWrap = parts.rowsWrap;

      if (!rowsWrap) return;

      var wrappers = Array.from(
        rowsWrap.querySelectorAll('input[type="radio"][name^="SELECT_"], input[type="checkbox"][name^="SELECT_"]')
      );

      var anyVisible = wrappers.some(function (input) {
        var wrap = getFieldWrapper(input);
        return wrap && wrap.style.display !== 'none';
      });

      swatchArea.style.display = anyVisible ? '' : 'none';

      Array.from(swatchArea.querySelectorAll('.swatchWrapper[data-doogma-value]')).forEach(function (sw) {
        sw.classList.remove('selected');
        sw.classList.remove('active');
      });

      Array.from(rowsWrap.querySelectorAll('input[type="radio"][name^="SELECT_"]:checked, input[type="checkbox"][name^="SELECT_"]:checked')).forEach(function (input) {
        var label = '';
        if (input.id) {
          var lab = document.querySelector('label[for="' + input.id + '"]');
          label = lab ? normalizeText(lab.textContent) : '';
        }

        Array.from(swatchArea.querySelectorAll('.swatchWrapper[data-doogma-value]')).forEach(function (sw) {
          var key = normalizeText(sw.getAttribute('data-doogma-value'));
          if (key && label && key === label) {
            sw.classList.add('selected');
            sw.classList.add('active');
          }
        });
      });
    });
  }

  function buildOptionBoxes() {
    injectStyles();

    getOptionSectionHeaders().forEach(function (heading) {
      var parts = getSectionParts(heading);
      if (parts) enhanceSwatchArea(parts);
    });

    syncOptionBoxesVisibility();
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

      syncOptionBoxesVisibility();
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

      refreshAll();
      setTimeout(refreshAll, 50);
      setTimeout(function () {
        buildOptionBoxes();
        syncOptionBoxesVisibility();
      }, 200);
      setTimeout(refreshAll, 400);
      setTimeout(syncOptionBoxesVisibility, 450);

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
    setTimeout(function () {
      refreshAll();
      buildOptionBoxes();
      syncOptionBoxesVisibility();
    }, 150);
  });
})();
