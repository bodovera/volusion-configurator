(function () {
  var path = window.location.pathname.toLowerCase();
  if (!path.includes('/product-p/')) return;

  var TABLES = {};
  var TABLES_URL = 'https://bodovera.github.io/volusion-configurator/pricing/tables.json';

  function updatePriceDisplay(price) {
    console.log('PRICE:', price);

    var basePriceEl = document.querySelector('[data-product-base-price]');
    if (basePriceEl) {
      basePriceEl.textContent = '$' + price.toFixed(2);
      basePriceEl.style.setProperty('display', 'block', 'important');
    }
  }
  

  function calculate() {
    if (!window.PRODUCT_PRICE_TABLE) return;
    if (!TABLES || !Object.keys(TABLES).length) return;

    var size = getEffectiveSize();

    var price = lookupPrice(
      window.PRODUCT_PRICE_TABLE,
      size.width,
      size.height,
      TABLES
    );

    updatePriceDisplay(price);

    console.log({
      table: window.PRODUCT_PRICE_TABLE,
      width: size.width,
      height: size.height,
      price: price
    });
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
