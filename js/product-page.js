(function () {
  var path = window.location.pathname.toLowerCase();
  if (!path.includes('/product-p/')) return;

  // -----------------------------
  // CONFIG
  // -----------------------------
  var TABLES_URL = 'https://bodovera.github.io/volusion-configurator/pricing/tables.json';

  // Based on your current product page order:
  // 0 = Fabric Colors
  // 1 = Width
  // 2 = WidthInc
  // 3 = Length / Height
  // 4 = HeightInc
  var WIDTH_INDEX = 1;
  var WIDTH_INC_INDEX = 2;
  var HEIGHT_INDEX = 3;
  var HEIGHT_INC_INDEX = 4;

  // Globals used elsewhere if needed
  window.PRODUCT_PRICE_TABLE = null;
  window.PRODUCT_COST_TABLE = null;

  var TABLES = {};
  var tablesLoaded = false;
  var lastRenderedPrice = null;
  var recalcTimer = null;

  // -----------------------------
  // HELPERS
  // -----------------------------
  function hideEl(el) {
    if (!el) return;
    el.style.setProperty('display', 'none', 'important');
  }

  function text(el) {
    return ((el && el.textContent) || '').replace(/\s+/g, ' ').trim();
  }

  function extractTableValue(rawText) {
    if (!rawText) return null;

    rawText = String(rawText).replace(/\s+/g, ' ').trim();

    // Example patterns seen:
    // PriceTable = $0 " : P_ROLLERSHADE_LF_A"
    // CostTable = $0 " : C_ROLLERSHADE_LF_A"
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

  function getHideTarget(node) {
    if (!node) return null;
    return (
      node.closest('li') ||
      node.closest('div') ||
      node.parentElement
    );
  }

  function processCustomTableFields() {
    document.querySelectorAll('b').forEach(function (bold) {
      var label = text(bold);

      if (label !== 'PriceTable' && label !== 'CostTable') return;

      var target = getHideTarget(bold);
      if (!target) return;

      var value = extractTableValue(text(target));
      if (!value) return;

      if (label === 'PriceTable') {
        window.PRODUCT_PRICE_TABLE = value;
      } else if (label === 'CostTable') {
        window.PRODUCT_COST_TABLE = value;
      }

      hideEl(target);
    });
  }

  function hideProductBits() {
    // Hide product code
    document.querySelectorAll('[data-product-code]').forEach(hideEl);

    // Keep base price element visible; we overwrite its text
    processCustomTableFields();
  }

  function getVisibleSelects() {
    return Array.from(document.querySelectorAll('select')).filter(function (sel) {
      var style = window.getComputedStyle(sel);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  function getSelectValueByIndex(index) {
    var selects = getVisibleSelects();
    if (!selects[index]) return '';
    return selects[index].value || '';
  }

  function getEffectiveSizeSafe() {
    // Use pricing-engine.js if loaded, but read the right selects here
    function localParseFraction(val) {
      if (!val || val === '0') return 0;
      val = String(val).trim();
      if (val.indexOf('/') > -1) {
        var parts = val.split('/');
        if (parts.length === 2) {
          var num = parseFloat(parts[0]);
          var den = parseFloat(parts[1]);
          if (!isNaN(num) && !isNaN(den) && den !== 0) return num / den;
        }
      }
      var parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }

    var width = parseFloat(getSelectValueByIndex(WIDTH_INDEX) || 0);
    var widthInc = localParseFraction(getSelectValueByIndex(WIDTH_INC_INDEX));
    var height = parseFloat(getSelectValueByIndex(HEIGHT_INDEX) || 0);
    var heightInc = localParseFraction(getSelectValueByIndex(HEIGHT_INC_INDEX));

    return {
      width: width + widthInc,
      height: height + heightInc
    };
  }

  function getLookupPrice(tableName, width, height) {
    if (typeof lookupPrice === 'function') {
      return lookupPrice(tableName, width, height, TABLES);
    }

    // Fallback if pricing-engine.js somehow didn't load
    var table = TABLES[tableName];
    if (!table) return 0;

    var w = table.widths.find(function (x) { return x >= width; });
    var h = table.heights.find(function (x) { return x >= height; });

    if (!w || !h) return 0;

    var wIndex = table.widths.indexOf(w);
    if (wIndex === -1) return 0;
    if (!table.values || !table.values[h]) return 0;

    return table.values[h][wIndex] || 0;
  }

  function getPriceEl() {
    return document.querySelector('[data-product-base-price]');
  }

  function renderPrice(price) {
    var el = getPriceEl();
    if (!el) return;

    el.textContent = 'Product Price: $' + price.toFixed(2);
    el.style.setProperty('display', 'block', 'important');
    el.style.setProperty('visibility', 'visible', 'important');
    el.style.setProperty('opacity', '1', 'important');

    lastRenderedPrice = price;
  }

  function calculateAndRender() {
    if (!tablesLoaded) return;
    if (!window.PRODUCT_PRICE_TABLE) return;

    var size = getEffectiveSizeSafe();

    // Don’t overwrite with bad values
    if (!size.width || !size.height) return;

    var price = getLookupPrice(window.PRODUCT_PRICE_TABLE, size.width, size.height);

    if (!price || price <= 0) return;

    renderPrice(price);

    console.log('Pricing:', {
      table: window.PRODUCT_PRICE_TABLE,
      width: size.width,
      height: size.height,
      price: price
    });
  }

  function scheduleRecalc() {
    clearTimeout(recalcTimer);
    recalcTimer = setTimeout(function () {
      hideProductBits();
      calculateAndRender();
    }, 80);
  }

  function bindEvents() {
    document.addEventListener('change', scheduleRecalc, true);
    document.addEventListener('input', scheduleRecalc, true);
    document.addEventListener('click', function () {
      setTimeout(scheduleRecalc, 50);
    }, true);
  }

  function startObserver() {
    var observer = new MutationObserver(function () {
      hideProductBits();

      // Repaint our price if Volusion redraws the block
      if (lastRenderedPrice && getPriceEl()) {
        renderPrice(lastRenderedPrice);
      } else {
        scheduleRecalc();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function loadTablesAndStart() {
    fetch(TABLES_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        TABLES = data || {};
        tablesLoaded = true;

        hideProductBits();
        calculateAndRender();

        // Extra passes for late-rendered product blocks
        setTimeout(calculateAndRender, 300);
        setTimeout(calculateAndRender, 1000);
        setTimeout(calculateAndRender, 2000);
      })
      .catch(function (err) {
        console.error('JSON LOAD ERROR:', err);
      });
  }

  function init() {
    hideProductBits();
    bindEvents();
    startObserver();
    loadTablesAndStart();

    console.log('Product-Page.js loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
