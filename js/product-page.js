(function () {
  var path = window.location.pathname.toLowerCase();
  if (!path.includes('/product-p/')) return;

  var TABLES_URL = 'https://bodovera.github.io/volusion-configurator/pricing/tables.json';

  window.PRODUCT_PRICE_TABLE = null;
  window.PRODUCT_COST_TABLE = null;

  var TABLES = {};

  function hideEl(el) {
    if (!el) return;
    el.style.setProperty('display', 'none', 'important');
  }

  function extractQuotedValue(text) {
    if (!text) return null;

    text = String(text).replace(/\s+/g, ' ').trim();

    var q = text.match(/"([^"]+)"/);
    if (q && q[1]) return q[1].trim();

    var c = text.match(/:\s*([A-Z0-9_]+)/i);
    if (c && c[1]) return c[1].trim();

    return null;
  }

  function getHideTarget(node) {
    if (!node) return null;

    return (
      node.closest('li') ||
      node.closest('[data-product-custom-fields] li') ||
      node.closest('ul li') ||
      node.closest('div')
    );
  }

  function processCustomTableFields() {
    document.querySelectorAll('b').forEach(function (bold) {
      var label = (bold.textContent || '').replace(/\s+/g, ' ').trim();

      if (label !== 'PriceTable' && label !== 'CostTable') return;

      var target = getHideTarget(bold);
      if (!target) return;

      var fullText = (target.textContent || '').replace(/\s+/g, ' ').trim();
      var value = extractQuotedValue(fullText);

      if (label === 'PriceTable' && value) {
        window.PRODUCT_PRICE_TABLE = value;
      }

      if (label === 'CostTable' && value) {
        window.PRODUCT_COST_TABLE = value;
      }

      hideEl(target);
    });
  }

  function hideProductBits() {
    document.querySelectorAll('[data-product-code]').forEach(function (el) {
      hideEl(el);
    });

    processCustomTableFields();
  }

  function cleanPriceLabel() {
    document.querySelectorAll('*').forEach(function (el) {
      var txt = (el.textContent || '').trim();

      if (txt.includes('starting at')) {
        el.textContent = 'Product Price';
      }
    });
  }

  function getPriceEl() {
    return document.querySelector('[data-product-base-price]');
  }

  function updatePrice(price) {
    var el = getPriceEl();
    if (!el) return;

    el.textContent = '$' + Number(price).toFixed(2);
    el.style.display = 'block';
  }

  function calculate() {
    if (!window.PRODUCT_PRICE_TABLE) return;
    if (!TABLES[window.PRODUCT_PRICE_TABLE]) return;
    if (typeof getEffectiveSize !== 'function') return;
    if (typeof lookupPrice !== 'function') return;

    var size = getEffectiveSize();

    if (!size.width || !size.height) return;

    var price = lookupPrice(
      window.PRODUCT_PRICE_TABLE,
      size.width,
      size.height,
      TABLES
    );

    // ignore zero until valid
    if (!price || price === 0) return;

    updatePrice(price);
  }

  function init() {
    hideProductBits();
    cleanPriceLabel();

    fetch(TABLES_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        TABLES = data || {};
        calculate();
      });

    document.addEventListener('change', function () {
      setTimeout(calculate, 50);
      setTimeout(calculate, 200);
      setTimeout(calculate, 500);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
