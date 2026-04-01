(function () {
  var path = window.location.pathname.toLowerCase();
  if (!path.includes('/product-p/')) return;

  var TABLES = {};
  var TABLES_URL = 'https://cdn.jsdelivr.net/gh/bodovera/volusion-configurator/pricing/tables.json';

  function updatePriceDisplay(price) {
    console.log('PRICE:', price);

    var el = document.querySelector('[data-product-price]');
    if (el) {
      el.innerText = '$' + price.toFixed(2);
    }
  }

  function calculate() {
    if (!window.PRODUCT_PRICE_TABLE) return;

    var size = getEffectiveSize();

    var price = lookupPrice(
      window.PRODUCT_PRICE_TABLE,
      size.width,
      size.height,
      TABLES
    );

    // OPTIONAL: example flat option (for testing)
    // price += lookupPrice("REMOTE_5CH", size.width, size.height, TABLES);

    updatePriceDisplay(price);
  }

  function init() {
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
