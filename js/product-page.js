(function () {
  var path = window.location.pathname.toLowerCase();
  if (!path.includes('/product-p/')) return;

  var TABLES_URL = 'https://bodovera.github.io/volusion-configurator/pricing/tables.json';

  window.PRODUCT_PRICE_TABLE = null;
  window.PRODUCT_COST_TABLE = null;

  var TABLES = {};
  var tablesLoaded = false;
  var recalcTimer = null;

  function hideEl(el) {
    if (!el) return;
    el.style.setProperty('display', 'none', 'important');
  }

  function cleanText(str) {
    return String(str || '').replace(/\s+/g, ' ').trim();
  }

  function extractTableValue(rawText) {
    rawText = cleanText(rawText);
    if (!rawText) return null;

    var quoted = rawText.match(/"([^"]+)"/);
    if (quoted && quoted[1]) {
      return quoted[1].replace(/^:\s*/, '').trim();
    }

    var colon = rawText.match(/:\s*([A-Z0-9_]+)/i);
    if (colon && colon[1]) {
      return colon[1].trim();
    }

    return null;
  }

  function processCustomTableFields() {
    document.querySelectorAll('b').forEach(function (bold) {
      var label = cleanText(bold.textContent);
      if (label !== 'PriceTable' && label !== 'CostTable') return;

      var target = bold.closest('li') || bold.closest('div') || bold.parentElement;
      if (!target) return;

      var value = extractTableValue(target.textContent);
      if (!value) return;

      if (label === 'PriceTable') window.PRODUCT_PRICE_TABLE = value;
      if (label === 'CostTable') window.PRODUCT_COST_TABLE = value;

      hideEl(target);
    });
  }

  function hideProductBits() {
    document.querySelectorAll('[data-product-code]').forEach(hideEl);
    processCustomTableFields();
  }

  function parseFraction(val) {
    val = cleanText(val);
    if (!val || val === '0') return 0;

    if (val.indexOf('/') > -1) {
      var parts = val.split('/');
      if (parts.length === 2) {
        var num = parseFloat(parts[0]);
        var den = parseFloat(parts[1]);
        if (!isNaN(num) && !isNaN(den) && den !== 0) {
          return num / den;
        }
      }
    }

    var parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  }

  function getBreakpoint(value, list) {
    return list.find(function (x) {
      return x >= value;
    });
  }

  function lookupPrice(tableName, width, height, tables) {
    var table = tables[tableName];
    if (!table) return 0;

    var w = getBreakpoint(width, table.widths);
    var h = getBreakpoint(height, table.heights);

    if (!w || !h) return 0;

    var wIndex = table.widths.indexOf(w);
    if (wIndex === -1) return 0;
    if (!table.values || !table.values[h]) return 0;

    return table.values[h][wIndex] || 0;
  }

  function getOptionGroupSelects(labelText) {
    var headings = Array.from(document.querySelectorAll('strong, label, h1, h2, h3, h4, h5, h6, div, span'));
    for (var i = 0; i < headings.length; i++) {
      var txt = cleanText(headings[i].textContent);
      if (txt !== labelText) continue;

      var row = headings[i].closest('div');
      if (!row) continue;

      // find the next sibling div that contains the selects for this group
      var next = row.nextElementSibling;
      while (next) {
        var selects = next.querySelectorAll('select');
        if (selects.length) return Array.from(selects);
        next = next.nextElementSibling;
      }
    }
    return [];
  }

  function getEffectiveSize() {
    var widthSelects = getOptionGroupSelects('Width');
    var heightSelects = getOptionGroupSelects('Length');

    var width = parseFloat((widthSelects[0] && widthSelects[0].value) || 0);
    var widthInc = parseFraction((widthSelects[1] && widthSelects[1].value) || 0);

    var height = parseFloat((heightSelects[0] && heightSelects[0].value) || 0);
    var heightInc = parseFraction((heightSelects[1] && heightSelects[1].value) || 0);

    return {
      width: width + widthInc,
      height: height + heightInc
    };
  }

  function updatePriceDisplay(price) {
    var el = document.querySelector('[data-product-base-price]');
    if (!el) return;

    el.textContent = 'Product Price: $' + price.toFixed(2);
    el.style.setProperty('display', 'block', 'important');
    el.style.setProperty('visibility', 'visible', 'important');
    el.style.setProperty('opacity', '1', 'important');
  }

  function calculateAndRender() {
    if (!tablesLoaded) return;
    if (!window.PRODUCT_PRICE_TABLE) return;

    var size = getEffectiveSize();
    if (!size.width || !size.height) return;

    var price = lookupPrice(
      window.PRODUCT_PRICE_TABLE,
      size.width,
      size.height,
      TABLES
    );

    if (!price || price <= 0) return;

    updatePriceDisplay(price);

    console.log('Pricing', {
      table: window.PRODUCT_PRICE_TABLE,
      width: size.width,
      height: size.height,
      price: price
    });
  }

  function scheduleRecalc() {
    clearTimeout(recalcTimer);
    recalcTimer = setTimeout(calculateAndRender, 100);
  }

  function bindEvents() {
    document.addEventListener('change', scheduleRecalc, true);
    document.addEventListener('input', scheduleRecalc, true);
  }

  function startObserver() {
    var observer = new MutationObserver(function () {
      hideProductBits();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function loadTables() {
    fetch(TABLES_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        TABLES = data || {};
        tablesLoaded = true;

        calculateAndRender();
        setTimeout(calculateAndRender, 300);
        setTimeout(calculateAndRender, 1000);
      })
      .catch(function (err) {
        console.error('JSON LOAD ERROR:', err);
      });
  }

  function init() {
    hideProductBits();
    bindEvents();
    startObserver();
    loadTables();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
