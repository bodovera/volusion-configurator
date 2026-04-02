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

  function hideProductCodeByText() {
    const all = document.querySelectorAll("p, div, span, li, td");
    all.forEach((el) => {
      const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (txt.startsWith("Product Code:")) {
        hide(el);
        log("Hid Product Code:", txt);
      }
    });
  }

  function hideConfigPriceRow() {
    const all = document.querySelectorAll("label, div, p, span, li, td");
    all.forEach((el) => {
      const txt = (el.textContent || "").replace(/\s+/g, " ").trim().toUpperCase();

      if (txt === "CONFIG_PRICE:" || txt === "CONFIG_PRICE") {
        const container =
          el.closest("tr") ||
          el.parentElement ||
          el;
        hide(container);
        log("Hid CONFIG_PRICE label/container");
      }

      if (txt.includes("CALCULATED PRICE|+")) {
        const container =
          el.closest("tr") ||
          el.parentElement?.parentElement ||
          el.parentElement ||
          el;
        hide(container);
        log("Hid CONFIG_PRICE dropdown/container");
      }
    });

    document.querySelectorAll("select").forEach((select) => {
      const optionText = Array.from(select.options).map(o => o.textContent || "").join(" ").toUpperCase();
      if (optionText.includes("CALCULATED PRICE|+")) {
        const container =
          select.closest("tr") ||
          select.parentElement?.parentElement ||
          select.parentElement ||
          select;
        hide(container);
        log("Hid CONFIG_PRICE select by option text");
      }
    });
  }

  function run() {
    hideProductCodeByText();
    hideConfigPriceRow();
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
