(function () {
  const RULES_URL = 'https://bodovera.github.io/volusion-configurator/volusion-option-rules.json?v=1';
  let OPTION_RULES = {};
  let isRefreshing = false;

  function normalizeText(str) {
    return String(str || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function titleCase(str) {
    return String(str || '').replace(/\b\w/g, function (m) {
      return m.toUpperCase();
    });
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

  function styleSwatchWrapper(sw) {
    sw.style.display = 'inline-flex';
    sw.style.flexDirection = 'column';
    sw.style.alignItems = 'center';
    sw.style.justifyContent = 'flex-start';
    sw.style.width = '88px';
    sw.style.minHeight = '96px';
    sw.style.padding = '8px 6px';
    sw.style.margin = '0';
    sw.style.border = '2px solid #cfcfcf';
    sw.style.borderRadius = '10px';
    sw.style.background = '#fff';
    sw.style.cursor = 'pointer';
    sw.style.boxSizing = 'border-box';
    sw.style.textAlign = 'center';
  }

  function styleSwatchImage(img) {
    img.style.maxWidth = '52px';
    img.style.maxHeight = '52px';
    img.style.width = 'auto';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.margin = '0 0 6px 0';
  }

  function getSwatchLabel(sw) {
    const img = sw.querySelector('img');
    return (
      sw.getAttribute('data-doogma-value') ||
      (img && (img.getAttribute('alt') || img.getAttribute('title'))) ||
      ''
    );
  }

  function buildNativeSwatchBoxes() {
    const swatches = Array.from(document.querySelectorAll('.swatchWrapper[data-doogma-value]'));
    if (!swatches.length) return;

    swatches.forEach(function (sw) {
      styleSwatchWrapper(sw);

      const img = sw.querySelector('img');
      if (img) styleSwatchImage(img);

      if (!sw.querySelector('.option-box-text')) {
        const label = document.createElement('div');
        label.className = 'option-box-text';
        label.textContent = titleCase(getSwatchLabel(sw));
        label.style.display = 'block';
        label.style.fontSize = '12px';
        label.style.lineHeight = '1.2';
        label.style.color = '#1f2937';
        label.style.whiteSpace = 'normal';
        label.style.textAlign = 'center';
        sw.appendChild(label);
      }

      const cell = sw.parentElement;
      if (cell) {
        cell.style.paddingRight = '0';
        cell.style.marginRight = '10px';
        cell.style.marginBottom = '10px';
      }

      const row = sw.closest('.flex.flex-wrap');
      if (row) {
        row.style.display = 'flex';
        row.style.flexWrap = 'wrap';
        row.style.gap = '10px';
        row.style.alignItems = 'flex-start';
      }
    });
  }

  function hideDuplicateInputRows() {
    Array.from(document.querySelectorAll('strong[role="heading"]')).forEach(function (heading) {
      const parent = heading.parentElement;
      if (!parent) return;

      const children = Array.from(parent.children);
      const idx = children.indexOf(heading);
      if (idx < 0) return;

      let swatchArea = null;
      let rowsWrap = null;

      for (let i = idx + 1; i < children.length; i++) {
        const el = children[i];

        if (el.matches && el.matches('strong[role="heading"]')) break;

        if (!swatchArea && el.querySelector && el.querySelector('.swatchWrapper[data-doogma-value]')) {
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
        rowsWrap.style.display = 'none';
      }
    });
  }

  function syncNativeSwatchSelection() {
    Array.from(document.querySelectorAll('.swatchWrapper[data-doogma-value]')).forEach(function (sw) {
      sw.classList.remove('selected');
      sw.classList.remove('active');
      sw.style.borderColor = '#cfcfcf';
      sw.style.boxShadow = 'none';
    });

    Array.from(
      document.querySelectorAll('input[type="radio"][name^="SELECT_"]:checked, input[type="checkbox"][name^="SELECT_"]:checked')
    ).forEach(function (input) {
      let labelText = '';
      if (input.id) {
        const label = document.querySelector('label[for="' + input.id + '"]');
        labelText = label ? normalizeText(label.textContent) : '';
      }

      if (!labelText) return;

      Array.from(document.querySelectorAll('.swatchWrapper[data-doogma-value]')).forEach(function (sw) {
        const key = normalizeText(sw.getAttribute('data-doogma-value'));
        if (key === labelText) {
          sw.classList.add('selected');
          sw.classList.add('active');
          sw.style.borderColor = '#5850ec';
          sw.style.boxShadow = '0 0 0 2px rgba(88, 80, 236, 0.14)';
        }
      });
    });
  }

  function enhanceSwatches() {
    buildNativeSwatchBoxes();
    hideDuplicateInputRows();
    syncNativeSwatchSelection();
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
      setTimeout(refreshAll, 200);
      setTimeout(refreshAll, 500);

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
    setTimeout(refreshAll, 300);
  });
})();
