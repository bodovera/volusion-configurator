(function () {
  var path = window.location.pathname.toLowerCase();
  if (!path.includes('/product-p/')) return;

  window.PRODUCT_PRICE_TABLE = null;
  window.PRODUCT_COST_TABLE = null;

  var TABLES = {};
  var TABLES_URL = 'https://bodovera.github.io/volusion-configurator/pricing/tables.json';

  function hideEl(el) {
    if (!el) return;
    el.style.setProperty('display', 'none', 'important');
  }

  function extractQuotedValue(text) {
    if (!text) return null;

    text = String(text).replace(/\s+/g, ' ').trim();

    var q = text.match(/"([^"]+)"/);
    if (q && q[1]) {
      return q[1].replace(/^:\s*/, '').trim();
    }

    var c = text.match(/:\s*([A-Z0-9_]+)/i);
    if (c && c[1]) {
      return c[1].trim();
    }

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
    // Keep product code hidden
    document.querySelectorAll('[data-product-code]').forEach(function (el) {
      hideEl(el);
    });

    // DO NOT hide [data-product-base-price]
    // We need that visible for calculated pricing

    processCustomTableFields();
  }

  function updatePriceDisplay(price) {
    var basePriceEl = document.querySelector('[data-product-base-price]');

    if (basePriceEl) {
      basePriceEl.textContent = '$' + price.toFixed(2);
      basePriceEl.style.setProperty('display', 'block', 'important');
      basePriceEl.style.setProperty('visibility', 'visible', 'important');
      basePriceEl.style.setProperty('opacity', '1', 'important');
    }

    console.log('PRICE:', price);
  }

  function calculate() {
  if (!window.PRODUCT_PRICE_TABLE) return;
  if (!TABLES || !Object.keys(TABLES).length) return;
  if (typeof getEffectiveSize !== 'function' || typeof lookupPrice !== 'function') return;

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

  console.log({
    table: window.PRODUCT_PRICE_TABLE,
    width: size.width,
    height: size.height,
    price: price
  });
}
  
  function initPricing() {
    fetch(TABLES_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        TABLES = data;
        calculate();
        document.addEventListener('change', calculate);
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

    var observer = new MutationObserver(function () {
      hideProductBits();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    initPricing();

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
