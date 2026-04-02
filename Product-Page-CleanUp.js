(function () {
  "use strict";

  const DEBUG = false;

  const TEXT_MATCHES_TO_HIDE = [
    "ProductCode",
    "ProductPrice",
    "ProductPrice_Name",
    "CONFIG_PRICE",
    "Calculated Price"
  ];

  const DIRECT_SELECTORS_TO_HIDE = [
    '[name="ProductCode"]',
    '[name="ProductPrice"]',
    '[name="ProductPrice_Name"]',
    '#ProductCode',
    '#ProductPrice',
    '#ProductPrice_Name',
    '.ProductCode',
    '.ProductPrice_Name'
  ];

  function log(...args) {
    if (DEBUG) console.log("[CleanUp]", ...args);
  }

  function hide(el) {
    if (!el) return;
    el.style.display = "none";
    el.setAttribute("aria-hidden", "true");
  }

  function cleanPriceLabel() {
    const els = document.querySelectorAll(".ProductPrice_Name, #ProductPrice_Name, [name='ProductPrice_Name']");
    els.forEach((el) => {
      const txt = (el.textContent || "").trim();
      if (!txt) return;
      if (
        txt.includes("starting at") ||
        txt.includes("ProductPrice_Name") ||
        /\d+\s*x\s*\d+/i.test(txt)
      ) {
        el.textContent = "Product Price";
      }
    });
  }

  function hideDirectSelectors() {
    DIRECT_SELECTORS_TO_HIDE.forEach((selector) => {
      document.querySelectorAll(selector).forEach(hide);
    });
  }

  function hideRowsByText() {
    const rows = document.querySelectorAll("tr, li, p, div, .form-row, .option-row");
    rows.forEach((row) => {
      const txt = (row.textContent || "").replace(/\s+/g, " ").trim();
      if (!txt) return;

      const shouldHide = TEXT_MATCHES_TO_HIDE.some((needle) => txt.includes(needle));
      if (shouldHide) hide(row);
    });
  }

  function hideConfigPriceField() {
    const selects = document.querySelectorAll("select");
    selects.forEach((select) => {
      const name = (select.name || "").toUpperCase();
      const id = (select.id || "").toUpperCase();
      const row = select.closest("tr, li, p, div, .form-row, .option-row");
      const rowText = (row?.textContent || "").toUpperCase();

      if (
        name.includes("CONFIG_PRICE") ||
        id.includes("CONFIG_PRICE") ||
        rowText.includes("CONFIG_PRICE") ||
        rowText.includes("CALCULATED PRICE")
      ) {
        hide(row || select);
      }
    });
  }

  function run() {
    hideDirectSelectors();
    hideRowsByText();
    hideConfigPriceField();
    cleanPriceLabel();
    log("cleanup complete");
  }

  function init() {
    run();

    const observer = new MutationObserver(() => run());
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
