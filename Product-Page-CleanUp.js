(function () {

  function isProductPage() {
    return document.querySelector('[name="ProductCode"]');
  }

  if (!isProductPage()) return;

  function hideFieldByName(fieldName) {
    document.querySelectorAll('[name="' + fieldName + '"]').forEach(function (el) {
      const wrapper =
        el.closest('.w-100.flex.pt2.items-center') ||
        el.closest('.w-100') ||
        el.closest('div') ||
        el.parentElement;

      if (wrapper) {
        wrapper.style.display = 'none';
      } else {
        el.style.display = 'none';
      }
    });
  }

  function cleanProductPage() {
    hideFieldByName('ProductCode');
    hideFieldByName('ProductPrice');
    hideFieldByName('ProductPrice_Name');
  }

  function init() {
    cleanProductPage();

    // Volusion delayed render protection
    setTimeout(cleanProductPage, 300);
    setTimeout(cleanProductPage, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
