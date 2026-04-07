(function () {
  "use strict";

  const DEBUG = true;
  const SWATCH_WIDTH = 200;

  function log(...args) {
    if (DEBUG) console.log("[CleanUpTest]", ...args);
  }

  function hide(el) {
    if (!el) return;
    el.style.display = "none";
    el.setAttribute("aria-hidden", "true");
  }

  function hideProductCode() {
    document.querySelectorAll("[data-product-code]").forEach(hide);
  }

  function hideConfigPrice() {
    document.querySelectorAll("strong, div, p, span, label").forEach((el) => {
      const txt = (el.textContent || "").toUpperCase().trim();
      if (txt === "CONFIG_PRICE:" || txt === "CONFIG_PRICE") {
        hide(el.closest(".flex.flex-wrap") || el);
      }
    });
  }

  function cleanPriceLabel() {
    document.querySelectorAll(".ProductPrice_Name, #ProductPrice_Name").forEach((el) => {
      const txt = el.textContent || "";
      if (txt.includes("starting at") || /\d+\s*x\s*\d+/i.test(txt)) {
        el.textContent = "Product Price";
      }
    });
  }

  // 🔥 THIS IS THE KEY FIX
  function extractVolusionImage(img) {
    if (!img) return "";

    const dataSrc = img.getAttribute("data-src") || "";

    // pull real Volusion image out of Cloudinary string
    const match = dataSrc.match(/https:\/\/uhgcp-[^"]+/i);
    if (match) return match[0];

    return "";
  }

  function upgradeSwatch(wrap) {
    const img = wrap.querySelector("img");
    if (!img) return;

    const realSrc = extractVolusionImage(img);

    if (realSrc && img.src !== realSrc) {
      img.src = realSrc;
      log("Replaced with real image:", realSrc);
    }

    // force consistent sizing
    wrap.style.width = SWATCH_WIDTH + "px";
    wrap.style.flex = "0 0 " + SWATCH_WIDTH + "px";

    img.style.width = SWATCH_WIDTH + "px";
    img.style.height = "auto";
    img.style.objectFit = "contain";
  }

  function resizeSwatches() {
    const wrappers = document.querySelectorAll('[class*="swatchWrapper"]');
    wrappers.forEach(upgradeSwatch);
  }

  function run() {
    hideProductCode();
    hideConfigPrice();
    cleanPriceLabel();
    resizeSwatches();
  }

  function init() {
    run();

    const observer = new MutationObserver(run);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(run, 300);
    setTimeout(run, 800);
    setTimeout(run, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
