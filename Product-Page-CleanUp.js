(function () {
  var path = window.location.pathname.toLowerCase();

  if (!path.includes('/product-p/')) return;

  window.PRODUCT_PRICE_TABLE = null;
  window.PRODUCT_COST_TABLE = null;

  function hideEl(el) {
    if (!el) return;
    el.style.setProperty('display', 'none', 'important');
  }

  function extractQuotedValue(text) {
    if (!text) return null;

    var m = text.match(/"([^"]+)"/);
    if (m && m[1]) return m[1].trim();

    var parts = text.split(':');
    if (parts.length > 1) return parts.slice(1).join(':').trim();

    return null;
  }

  function processCustomTableFields() {
    document.querySelectorAll('li, div').forEach(function (node) {
      var bold = node.querySelector('b');
      if (!bold) return;

      var label = (bold.textContent || '').trim();

      if (label !== 'PriceTable' && label !== 'CostTable') return;

      var fullText = (node.textContent || '').trim();
      var value = extractQuotedValue(fullText);

      if (label === 'PriceTable' && value) {
        window.PRODUCT_PRICE_TABLE = value;
      }

      if (label === 'CostTable' && value) {
        window.PRODUCT_COST_TABLE = value;
      }

      var li = node.closest('li');
      hideEl(li || node);
    });
  }

  function hideProductBits() {
    document.querySelectorAll('[data-product-base-price]').forEach(function (el) {
      hideEl(el);
    });

    document.querySelectorAll('[data-product-code]').forEach(function (el) {
      hideEl(el);
    });

    processCustomTableFields();
  }

  function init() {
    hideProductBits();
    setTimeout(hideProductBits, 300);
    setTimeout(hideProductBits, 1000);
    setTimeout(hideProductBits, 2000);

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
