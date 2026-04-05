(function () {
  const RULES_URL = 'https://bodovera.github.io/volusion-configurator/volusion-option-rules.json?v=1';
  let OPTION_RULES = {};
  let isRefreshing = false;
  let boxesBuilt = false;

  function log() {
    console.log.apply(console, ['[VolusionConfigurator]'].concat([].slice.call(arguments)));
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

  function getGroups() {
    return Array.from(document.querySelectorAll("strong[role='heading']")).map(function (heading) {
      return {
        heading: heading,
        wrap: heading.parentElement
      };
    }).filter(function (x) {
      return x.wrap;
    });
  }

  function getTopSwatchArea(groupWrap) {
    var firstLevelDivs = Array.from(groupWrap.children).filter(function (el) {
      return el.tagName === 'DIV';
    });

    for (var i = 0; i < firstLevelDivs.length; i++) {
      var div = firstLevelDivs[i];
      if (div.querySelector('[data-doogma-value] img')) {
        return div;
      }
    }

    return null;
  }

  function getNativeRowsWrap(groupWrap) {
    return groupWrap.querySelector('.w-100');
  }

  function getInputRows(groupWrap) {
    return Array.from(
      groupWrap.querySelectorAll('input[type="radio"][name^="SELECT_"], input[type="checkbox"][name^="SELECT_"]')
    ).map(function (input) {
      return {
        input: input,
        row: input.closest('.flex.items-center') || getFieldWrapper(input)
      };
    }).filter(function (x) {
      return x.row;
    });
  }

  function getLabelTextForInput(input) {
    if (!input || !input.id) return '';
    var label = document.querySelector('label[for="' + input.id + '"]');
    if (!label) return '';
    return (label.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function getSwatchMap(groupWrap) {
    var map = new Map();

    var swatchNodes = Array.from(groupWrap.querySelectorAll('[data-doogma-value]')).filter(function (el) {
      return !!el.querySelector('img');
    });

    swatchNodes.forEach(function (node) {
      var value = node.getAttribute('data-doogma-value');
      if (!value || map.has(value)) return;

      var img = node.querySelector('img');
      if (!img) return;

      map.set(value, {
        src: img.getAttribute('data-src') || img.getAttribute('src') || '',
        alt: img.getAttribute('alt') || '',
        title: img.getAttribute('title') || ''
      });
    });

    return map;
  }

  function syncGroupState(groupWrap, boxesWrap) {
    var boxes = Array.from(boxesWrap.querySelectorAll('.bod-option-box'));

    boxes.forEach(function (box) {
      var inputId = box.getAttribute('data-input-id');
      if (!inputId) return;

      var input = document.getElementById(inputId);
      if (!input) return;

      if (input.checked) box.classList.add('is-selected');
      else box.classList.remove('is-selected');
    });
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

  function buildGroup(group) {
    var groupWrap = group.wrap;

    if (!groupWrap || groupWrap.dataset.bodOptionBoxesReady === '1') return;

    var inputRows = getInputRows(groupWrap);
    if (!inputRows.length) return;

    var swatchMap = getSwatchMap(groupWrap);
    if (!swatchMap.size) return;

    var topSwatchArea = getTopSwatchArea(groupWrap);
    var nativeRowsWrap = getNativeRowsWrap(groupWrap);

    var matched = inputRows.filter(function (item) {
      var value = item.input.getAttribute('data-doogma-value') || item.input.value;
      return swatchMap.has(value);
    });

    if (!matched.length) return;

    var boxesWrap = document.createElement('div');
    boxesWrap.className = 'bod-option-boxes';

    matched.forEach(function (item) {
      var input = item.input;
      var value = input.getAttribute('data-doogma-value') || input.value;
      var swatch = swatchMap.get(value);
      var text = getLabelTextForInput(input) || (swatch && swatch.alt) || value;

      var box = document.createElement('div');
      box.className = 'bod-option-box';
      box.setAttribute('data-input-id', input.id || '');
      box.setAttribute('data-doogma-value', value || '');
      box.setAttribute('tabindex', '0');
      box.setAttribute('role', 'button');
      box.setAttribute('aria-label', text);

      if (swatch && swatch.src) {
        var img = document.createElement('img');
        img.src = swatch.src;
        img.alt = text;
        box.appendChild(img);
      }

      var textEl = document.createElement('div');
      textEl.className = 'bod-option-box-text';
      textEl.textContent = text;
      box.appendChild(textEl);

      function activate(currentInput) {
        return function (evt) {
          if (evt) evt.preventDefault();

          if (currentInput.type === 'radio') {
            var radios = Array.from(groupWrap.querySelectorAll('input[type="radio"][name="' + currentInput.name + '"]'));
            radios.forEach(function (r) {
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
        if (e.key === 'Enter' || e.key === ' ') {
          handler(e);
        }
      });

      boxesWrap.appendChild(box);
    });

    if (topSwatchArea) topSwatchArea.classList.add('bod-option-hidden');
    if (nativeRowsWrap) nativeRowsWrap.classList.add('bod-option-hidden');

    group.heading.insertAdjacentElement('afterend', boxesWrap);

    syncGroupState(groupWrap, boxesWrap);
    groupWrap.dataset.bodOptionBoxesReady = '1';
  }

  function buildOptionBoxes() {
    injectStyles();
    getGroups().forEach(buildGroup);
    boxesBuilt = true;
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

      if (boxesBuilt) {
        syncOptionBoxesVisibility();
      }
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

      // rules first, immediately
      refreshAll();

      // build boxes after rules have already hidden what needs hiding
      setTimeout(function () {
        buildOptionBoxes();
        refreshAll();
      }, 0);

      // keep your original reload safety passes
      setTimeout(function () {
        refreshAll();
      }, 300);

      setTimeout(function () {
        if (!boxesBuilt) buildOptionBoxes();
        refreshAll();
      }, 1000);

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
      if (!boxesBuilt) buildOptionBoxes();
      refreshAll();
    }, 50);
  });
})();
