(function () {
  "use strict";

  const DEBUG = true;

  function log(...args) {
    if (DEBUG) console.log("[CleanUp]", ...args);
  }

  function hide(el) {
    if (!el) return;
    el.style.display = "none";
    el.setAttribute("aria-hidden", "true");
  }

  function hideProductCode() {
    document.querySelectorAll("[data-product-code]").forEach((el) => {
      hide(el);
      log("Hid product code container", el);
    });
  }

  function hideConfigPrice() {
    document.querySelectorAll("strong, div, p, span, label").forEach((el) => {
      const txt = (el.textContent || "").replace(/\s+/g, " ").trim().toUpperCase();

      if (txt === "CONFIG_PRICE:" || txt === "CONFIG_PRICE") {
        const wrap = el.closest(".flex.flex-wrap") || el.parentElement || el;
        hide(wrap);
        log("Hid CONFIG_PRICE wrapper", wrap);
      }
    });

    document.querySelectorAll("select").forEach((select) => {
      const optionText = Array.from(select.options).map(o => o.textContent || "").join(" ").toUpperCase();
      if (optionText.includes("CALCULATED PRICE")) {
        const wrap =
          select.closest(".flex.flex-wrap") ||
          select.closest(".w-100") ||
          select.parentElement ||
          select;
        hide(wrap);
        log("Hid CONFIG_PRICE select wrapper", wrap);
      }
    });
  }

  function cleanPriceLabel() {
    document.querySelectorAll(".ProductPrice_Name, #ProductPrice_Name").forEach((el) => {
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

  function run() {
    hideProductCode();
    hideConfigPrice();
    cleanPriceLabel();
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
