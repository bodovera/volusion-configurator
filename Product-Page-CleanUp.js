(function () {
  var path = window.location.pathname.toLowerCase();

  // Only run on actual product detail pages
  if (!path.includes('/product-p/')) return;

  function hideProductBits() {
    document.querySelectorAll('[data-product-base-price]').forEach(function (el) {
      el.style.setProperty('display', 'none', 'important');
    });

    document.querySelectorAll('[data-product-code]').forEach(function (el) {
      el.style.setProperty('display', 'none', 'important');
    });
  }

  function init() {
    hideProductBits();
    setTimeout(hideProductBits, 300);
    setTimeout(hideProductBits, 1000);
    setTimeout(hideProductBits, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
