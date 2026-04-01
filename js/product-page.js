(function () {
  var path = window.location.pathname.toLowerCase();
  if (!path.includes('/product-p/')) return;

  function getNumber(val) {
    return parseFloat(val) || 0;
  }

  function getDimensions() {
    var selects = document.querySelectorAll('select');

    var width = 0;
    var height = 0;

    selects.forEach(function (sel) {
      var label = sel.closest('div')?.innerText?.toLowerCase() || '';

      if (label.includes('width')) {
        width += getNumber(sel.value);
      }

      if (label.includes('length') || label.includes('height')) {
        height += getNumber(sel.value);
      }
    });

    return { width: width, height: height };
  }

  function calculatePrice(width, height) {
    // TEMP TEST LOGIC — replace with table lookup later
    if (!width || !height) return 0;

    return (width * height) * 0.05; // simple sqft test
  }

  function updatePrice() {
    var el = document.querySelector('[data-product-base-price]');
    if (!el) return;

    var dims = getDimensions();
    var price = calculatePrice(dims.width, dims.height);

    if (price <= 0) return;

    el.innerHTML = 'Product Price: $' + price.toFixed(2);
  }

  function hookEvents() {
    document.querySelectorAll('select').forEach(function (sel) {
      sel.addEventListener('change', function () {
        setTimeout(updatePrice, 50);
      });
    });
  }

  function forceControl() {
    updatePrice();

    // 🔥 THIS IS THE KEY — keep overriding Volusion
    setInterval(updatePrice, 500);
  }

  function init() {
    hookEvents();
    forceControl();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
