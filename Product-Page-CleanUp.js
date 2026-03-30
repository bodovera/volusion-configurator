(function () {
  function isProductPage() {
    return !!document.querySelector('[data-product-code], [data-product-base-price]');
  }

  if (!isProductPage()) return;

  function hide(el) {
    if (el) el.style.display = 'none';
  }

  function cleanProductPage() {
    document.querySelectorAll('[data-product-base-price]').forEach(hide);
    document.querySelectorAll('[data-product-code]').forEach(hide);
  }

  function init() {
    cleanProductPage();
    setTimeout(cleanProductPage, 300);
    setTimeout(cleanProductPage, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
