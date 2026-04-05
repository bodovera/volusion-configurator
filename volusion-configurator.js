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
      .bod-option-boxes {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 8px;
        margin-bottom: 8px;
      }

      .bod-option-box {
        width: 88px;
        min-height: 96px;
        border: 2px solid #cfcfcf;
        border-radius: 10px;
        background: #fff;
        padding: 8px 6px;
        box-sizing: border-box;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        text-align: center;
        cursor: pointer;
        user-select: none;
      }

      .bod-option-box:hover {
        border-color: #666;
      }

      .bod-option-box.is-selected {
        border-color: #5850ec;
        box-shadow: 0 0 0 2px rgba(88, 80, 236, 0.14);
      }

      .bod-option-box img {
        max-width: 52px;
        max-height: 52px;
        width: auto;
        height: auto;
        display: block;
        margin: 0 0 6px 0;
      }

      .bod-option-box-text {
        display: block;
        font-size: 12px;
        line-height: 1.2;
        color: #1f2937;
        white-space: normal;
        text-align: center;
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

    if (!swatchArea || !rowsWrap) return null;

    return {
      heading: heading,
      swatchArea: swatchArea,
      rowsWrap: rowsWrap
    };
  }

  function getInputLabelText(input) {
    if (!input || !input.id) return '';
    var label = document.querySelector('label[for="' + input.id + '"]');
    return label ? normalizeText(label.textContent) : '';
  }

  function getInputsFromRowsWrap(rowsWrap) {
    return Array.from(
      rowsWrap.querySelectorAll('input[type="radio"][name^="SELECT_"], input[type="checkbox"][name^="SELECT_"]')
    );
  }

  function getSwatchesFromArea(swatchArea) {
    return Array.from(swatchArea.querySelectorAll('.swatchWrapper[data-doogma-value]')).map(function (node) {
      var img = node.querySelector('img');
      var key =
        normalizeText(node.getAttribute('data-doogma-value')) ||
        normalizeText(img && img.getAttribute('alt')) ||
        normalizeText(img && img.getAttribute('title'));

      return {
        node: node,
        key: key,
        src: img ? (img.getAttribute('data-src') || img.getAttribute('src') || '') : '',
        alt: img ? (img.getAttribute('alt') || '') : ''
      };
    }).filter(function (x) {
      return x.key;
    });
  }

  function buildBoxesForSection(parts) {
    var heading = parts.heading;
    var swatchArea = parts.swatchArea;
    var rowsWrap = parts.rowsWrap;

    if (heading.dataset.bodOptionBoxesReady === '1') return;

    var inputs = getInputsFromRowsWrap(rowsWrap);
    var swatches = getSwatchesFromArea(swatchArea);

    if (!inputs.length || !swatches.length) return;

    var swatchMap = {};
    swatches.forEach(function (s) {
      swatchMap[s.key] = s;
    });

    var matched = inputs.map(function (input) {
      var labelText = getInputLabelText(input);
      var swatch = swatchMap[labelText];
      if (!swatch) return null;

      return {
        input: input,
        labelText: labelText,
        swatch: swatch
      };
    }).filter(Boolean);

    if (!matched.length) return;

    var boxesWrap = document.createElement('div');
    boxesWrap.className = 'bod-option-boxes';
    boxesWrap.setAttribute('data-heading-text', normalizeText(heading.textContent));

    matched.forEach(function (item) {
      var input = item.input;
      var labelText = item.labelText;
      var swatch = item.swatch;

      var box = document.createElement('div');
      box.className = 'bod-option-box';
      box.setAttribute('data-input-id', input.id || '');
      box.setAttribute('tabindex', '0');
      box.setAttribute('role', 'button');
      box.setAttribute('aria-label', labelText);

      if (swatch.src) {
        var img = document.createElement('img');
        img.src = swatch.src;
        img.alt = labelText;
        box.appendChild(img);
      }

      var textEl = document.createElement('div');
      textEl.className = 'bod-option-box-text';
      textEl.textContent = titleCase(labelText);
      box.appendChild(textEl);

      function activate(currentInput) {
        return function (evt) {
          if (evt) evt.preventDefault();

          if (currentInput.type === 'radio') {
            Array.from(document.querySelectorAll('input[type="radio"][name="' + currentInput.name + '"]')).forEach(function (r) {
              r.checked = false;
            });
            currentInput.checked = true;
          } else {
            currentInput.checked = !currentInput.checked;
          }

          currentInput.dispatchEvent(new Event('click', { bubbles: true }));
          currentInput.dispatchEvent(new Event('change', { bubbles: true }));
        };
      }

      var handler = activate(input);

      box.addEventListener('click', handler);
      box.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') handler(e);
      });

      boxesWrap.appendChild(box);
    });

    swatchArea.classList.add('bod-option-hidden');
    rowsWrap.classList.add('bod-option-hidden');
    heading.insertAdjacentElement('afterend', boxesWrap);
    heading.dataset.bodOptionBoxesReady = '1';
  }

  function syncOptionBoxesVisibility() {
    document.querySelectorAll('.bod-option-boxes').forEach(function (boxesWrap) {
      var visibleCount = 0;

      Array.from(boxesWrap.querySelectorAll('.bod-option-box')).forEach(function (box) {
        var inputId = box.getAttribute('data-input-id');
        var input = inputId ? document.getElementById(inputId) : null;

        if (!input) {
          box.style.display = 'none';
          return;
        }

        var wrapper = getFieldWrapper(input);
        var show = !!wrapper && wrapper.style.display !== 'none';

        box.style.display = show ? '' : 'none';
        if (show) visibleCount++;

        if (input.checked) box.classList.add('is-selected');
        else box.classList.remove('is-selected');
      });

      boxesWrap.style.display = visibleCount > 0 ? 'flex' : 'none';
    });
  }

  function buildOptionBoxes() {
    injectStyles();

    getOptionSectionHeaders().forEach(function (heading) {
      var parts = getSectionParts(heading);
      if (parts) buildBoxesForSection(parts);
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
