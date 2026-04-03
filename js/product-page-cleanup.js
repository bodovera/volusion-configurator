(function () {
  "use strict";

  const DEBUG = true;

  function log() {
    if (DEBUG) console.log("[CleanUp]", ...arguments);
  }

  function hide(el) {
    if (!el) return;
    el.style.display = "none";
    el.setAttribute("aria-hidden", "true");
  }

  function textOf(el) {
    return ((el && el.textContent) || "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  function matchesPriceText(str) {
    if (!str) return false;
    return (
      str === "CONFIG_PRICE" ||
      str === "CONFIG_PRICE:" ||
      str.includes("CALCULATED PRICE") ||
      str.startsWith("PRICE_") ||
      str.includes(" PRICE_")
    );
  }

  function isPriceClassName(className) {
    const c = String(className || "").toLowerCase();
    return (
      c.includes("doogma-price_") ||
      c.includes("config_price") ||
      c.includes("calculated_price")
    );
  }

  function isPriceName(name) {
    const n = String(name || "").toUpperCase();
    return (
      n.includes("PRICE_") ||
      n.includes("CONFIG_PRICE") ||
      n.includes("CALCULATED_PRICE")
    );
  }

  function isPriceValue(value) {
    const v = String(value || "").toUpperCase();
    return (
      v.includes("PRICE_") ||
      v.includes("CONFIG_PRICE") ||
      v.includes("CALCULATED_PRICE")
    );
  }

  function findOptionRow(el) {
    if (!el) return null;

    return (
      el.closest(".flex.flex-wrap.items-center") ||
      el.closest(".flex.items-center") ||
      el.closest(".w-100.flex.pt2.items-center") ||
      el.closest(".w-100") ||
      el.parentElement
    );
  }

  function hideProductCode() {
    document.querySelectorAll("[data-product-code]").forEach((el) => {
      hide(el);
      log("Hid product code container", el);
    });
  }

  function hideConfigPrice() {
    // 1) Hide obvious text wrappers
    document.querySelectorAll("strong, div, p, span, label").forEach((el) => {
      const txt = textOf(el);
      if (matchesPriceText(txt)) {
        const wrap = findOptionRow(el) || el;
        hide(wrap);
        log("Hid price text wrapper", wrap);
      }
    });

    // 2) Hide dropdowns whose class/name marks them as PRICE
    document.querySelectorAll("select").forEach((select) => {
      const className = select.className || "";
      const name = select.name || "";
      const doogmaValue = select.getAttribute("data-doogma-value") || "";
      const optionText = Array.from(select.options)
        .map((o) => (o.textContent || "").trim())
        .join(" ")
        .toUpperCase();

      if (
        isPriceClassName(className) ||
        isPriceName(name) ||
        isPriceValue(doogmaValue) ||
        optionText.includes("CALCULATED PRICE")
      ) {
        const wrap = findOptionRow(select) || select;
        hide(wrap);
        log("Hid price select wrapper", wrap);
      }
    });

    // 3) Hide checkbox/radio/text inputs tied to PRICE options
    document.querySelectorAll("input, textarea").forEach((input) => {
      const className = input.className || "";
      const name = input.name || "";
      const value = input.value || "";
      const doogmaValue = input.getAttribute("data-doogma-value") || "";
      const id = input.id || "";

      let relatedLabelText = "";
      if (id) {
        const label = document.querySelector('label[for="' + CSS.escape(id) + '"]');
        if (label) relatedLabelText = textOf(label);
      }

      const parentLabel = input.closest("label");
      const parentLabelText = textOf(parentLabel);

      if (
        isPriceClassName(className) ||
        isPriceName(name) ||
        isPriceValue(value) ||
        isPriceValue(doogmaValue) ||
        matchesPriceText(relatedLabelText) ||
        matchesPriceText(parentLabelText)
      ) {
        const wrap =
          findOptionRow(input) ||
          findOptionRow(parentLabel) ||
          input;
        hide(wrap);
        log("Hid price input wrapper", wrap);
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
        log("Cleaned ProductPrice_Name", el);
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
