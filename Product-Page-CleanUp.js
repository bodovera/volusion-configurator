(function () {
  function isProductPage() {
    return !!document.querySelector('[data-product-code], [data-product-base-price]');
  }

  function hideProductBits() {
    document.querySelectorAll('[data-product-base-price]').forEach(function (el) {
      el.style.setProperty('display', 'none', 'important');
    });

    document.querySelectorAll('[data-product-code]').forEach(function (el) {
      el.style.setProperty('display', 'none', 'important');
    });
  }

  function runCleanupPasses() {
    let count = 0;
    const maxRuns = 20;

    const timer = setInterval(function () {
      hideProductBits();
      count += 1;

      if (count >= maxRuns) {
        clearInterval(timer);
      }
    }, 250);
  }

  function init() {
    runCleanupPasses();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
