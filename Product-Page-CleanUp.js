(function () {
  var path = window.location.pathname.toLowerCase();

  // Only run on actual product detail pages
  if (!path.includes('/product-p/')) return;

  // Expose for pricing engine
  window.PRODUCT_PRICE_TABLE = null;
  window.PRODUCT_COST_TABLE = null;

  // --- Helpers ---

  // Find a node that contains "Label: value", return {el, value}
  function findLabelValue(label) {
    var els = document.querySelectorAll('body *');
    var prefix = label + ':';

    for (var i = 0; i < els.length; i++) {
      var el = els[i];

      // Only consider leaf-ish nodes (avoid big containers)
      if (el.children && el.children.length > 0) continue;

      var txt = (el.textContent || '').trim();
      if (!txt) continue;

      if (txt.startsWith(prefix)) {
        var val = txt.slice(prefix.length).trim();
        return { el: el, value: val };
      }
    }
    return null;
  }

  // Hide the nearest reasonable row/container for a field
  function hideContainer(el) {
    if (!el) return;

    // Try common wrappers first
    var container =
      el.closest('.product-field') ||
      el.closest('.custom-field') ||
      el.closest('tr') ||
      el.closest('li') ||
      el.parentElement;

    if (container) {
      container.style.setProperty('display', 'none', 'important');
    } else {
      el.style.setProperty('display', 'none', 'important');
    }
  }

  function hideProductBits() {
    // Existing hides
    document.querySelectorAll('[data-product-base-price]').forEach(function (el) {
      el.style.setProperty('display', 'none', 'important');
    });

    document.querySelectorAll('[data-product-code]').forEach(function (el) {
      el.style.setProperty('display', 'none', 'important');
    });

    // --- Extract + hide PriceTable ---
    var pt = findLabelValue('PriceTable');
    if (pt && pt.value) {
      window.PRODUCT_PRICE_TABLE = pt.value;
      hideContainer(pt.el);
    }

    // --- Extract + hide CostTable ---
    var ct = findLabelValue('CostTable');
    if (ct && ct.value) {
      window.PRODUCT_COST_TABLE = ct.value;
      hideContainer(ct.el);
    }
  }

  function init() {
    hideProductBits();

    // Run multiple times to catch dynamic rendering
    setTimeout(hideProductBits, 300);
    setTimeout(hideProductBits, 1000);
    setTimeout(hideProductBits, 2000);

    // Debug (remove later)
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
