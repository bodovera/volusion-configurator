(function () {
  var path = (window.location.pathname || '').toLowerCase();
  if (!path.includes('/product-p/')) return;

  var TABLES_URL = 'https://bodovera.github.io/volusion-configurator/pricing/tables.json';

  window.PRODUCT_PRICE_TABLE = null;
  window.PRODUCT_COST_TABLE = null;

  var TABLES = {};
  var TABLES_READY = false;

  function hideEl(el) {
    if (!el) return;
    el.style.setProperty('display', 'none', 'important');
  }

  function showEl(el, displayValue) {
    if (!el) return;
    el.style.setProperty('display', displayValue || 'block', 'important');
    el.style.setProperty('visibility', 'visible', 'important');
    el.style.setProperty('opacity', '1', 'important');
  }

  function cleanText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function extractQuotedValue(text) {
    if (!text) return null;

    text = cleanText(text);

    var q = text.match(/"([^"]+)"/);
    if (q && q[1]) return q[1].trim();

    var c = text.match(/:\s*([A-Z0-9_\-]+)/i);
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
      var label = cleanText(bold.textContent);

      if (label !== 'PriceTable' && label !== 'CostTable') return;

      var target = getHideTarget(bold);
      if (!target) return;

      var fullText = cleanText(target.textContent);
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

  function renamePriceLabel() {
    document.querySelectorAll('[data-product-price-name], .ProductPrice_Name, .product-price-name').forEach(function (el) {
      el.textContent = 'Product Price';
      showEl(el, 'inline');
    });

    document.querySelectorAll('*').forEach(function (el) {
      var txt = cleanText(el.textContent);
      if (txt === '36x60 starting at') {
        el.textContent = 'Product Price';
      }
    });
  }

  function getPriceDisplayElement() {
    return (
      document.querySelector('[data-product-base-price]') ||
      document.querySelector('[data-product-price]') ||
      document.querySelector('.ProductPrice') ||
      document.querySelector('.product-price') ||
      document.querySelector('#product_price') ||
      document.querySelector('.price')
    );
  }

  function hideProductBits() {
    document.querySelectorAll('[data-product-code]').forEach(function (el) {
      hideEl(el);
    });

    processCustomTableFields();
    renamePriceLabel();

    var priceEl = getPriceDisplayElement();
    if (priceEl) showEl(priceEl, 'block');
  }

  function updatePriceDisplay(price) {
    var priceEl = getPriceDisplayElement();
    if (!priceEl) {
      console.warn('No visible price element found.');
      return;
    }

    var formatted = '$' + Number(price).toFixed(2);
    priceEl.textContent = formatted;
    showEl(priceEl, 'block');
    renamePriceLabel();

    console.log('UPDATED PRICE:', formatted);
  }

  function calculate() {
    if (!TABLES_READY) {
      console.log('Tables not ready yet.');
      return;
    }

    if (!window.PRODUCT_PRICE_TABLE) {
      console.log('Price table not found yet.');
      return;
    }

    if (typeof getEffectiveSize !== 'function') {
      console.warn('getEffectiveSize() is not loaded.');
      return;
    }

    if (typeof lookupPrice !== 'function') {
      console.warn('lookupPrice() is not loaded.');
      return;
    }

    var size = getEffectiveSize();

    if (!size || size.width <= 0 || size.height <= 0) {
      console.log('Width/height not ready yet:', size);
      return;
    }

    var price = lookupPrice(
      window.PRODUCT_PRICE_TABLE,
      size.width,
      size.height,
      TABLES
    );

    console.log('CALCULATE:', {
      table: window.PRODUCT_PRICE_TABLE,
      width: size.width,
      height: size.height,
      price: price
    });

    updatePriceDisplay(price);
  }

  function bindEvents() {
    document.addEventListener('change', function () {
      setTimeout(calculate, 50);
      setTimeout(calculate, 200);
      setTimeout(calculate, 500);
    });

    document.addEventListener('input', function () {
      setTimeout(calculate, 50);
      setTimeout(calculate, 200);
      setTimeout(calculate, 500);
    });
  }

  function initPricing() {
    fetch(TABLES_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        TABLES = data || {};
        TABLES_READY = true;

        console.log('TABLES LOADED:', TABLES);

        calculate();
        setTimeout(calculate, 300);
        setTimeout(calculate, 1000);
      })
      .catch(function (err) {
        console.error('JSON LOAD ERROR:', err);
      });
  }

  function init() {
    hideProductBits();
    setTimeout(hideProductBits, 300);
    setTimeout(hideProductBits, 1000);
    setTimeout(hideProductBits, 2000);

    bindEvents();
    initPricing();

    var observer = new MutationObserver(function () {
      hideProductBits();
      calculate();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(function () {
      console.log('Price Table:', window.PRODUCT_PRICE_TABLE);
      console.log('Cost Table:', window.PRODUCT_COST_TABLE);
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
