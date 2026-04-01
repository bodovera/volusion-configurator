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

    var observer = new MutationObserver(function () {
      hideProductBits();
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
