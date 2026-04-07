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
      const optionText = Array.from(select.options)
        .map((o) => o.textContent || "")
        .join(" ")
        .toUpperCase();

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
        log("Cleaned ProductPrice_Name label");
      }
    });
  }

  function forceBetterCloudinarySrc(url) {
    if (!url) return url;

    let cleaned = url;

    cleaned = cleaned.replace(/\/c_limit[^/]*\//i, "/");
    cleaned = cleaned.replace(/\/w_\d+,h_\d+[^/]*\//i, "/");
    cleaned = cleaned.replace(/\/h_\d+,w_\d+[^/]*\//i, "/");
    cleaned = cleaned.replace(/\/w_\d+[^/]*\//i, "/");
    cleaned = cleaned.replace(/\/h_\d+[^/]*\//i, "/");

    cleaned = cleaned.replace(/\/{2,}/g, "/");
    cleaned = cleaned.replace(/^https:\//i, "https://");

    return cleaned;
  }

  function getBestImageSrc(img) {
    if (!img) return "";

    const candidates = [
      img.getAttribute("data-src"),
      img.getAttribute("data-original"),
      img.getAttribute("data-lazy-src"),
      img.dataset ? img.dataset.src : "",
      img.dataset ? img.dataset.original : "",
      img.getAttribute("src")
    ].filter(Boolean);

    for (const src of candidates) {
      const better = forceBetterCloudinarySrc(src);
      if (better) return better;
    }

    return "";
  }

  function sizeSwatchWrapper(wrap) {
    wrap.style.width = SWATCH_WIDTH + "px";
    wrap.style.minWidth = SWATCH_WIDTH + "px";
    wrap.style.maxWidth = SWATCH_WIDTH + "px";
    wrap.style.flex = "0 0 " + SWATCH_WIDTH + "px";
    wrap.style.height = "auto";
    wrap.style.display = "inline-flex";
    wrap.style.alignItems = "center";
    wrap.style.justifyContent = "center";
    wrap.style.overflow = "hidden";
    wrap.style.boxSizing = "border-box";
    wrap.style.verticalAlign = "top";
    wrap.style.cursor = "pointer";
  }

  function sizeSwatchImage(img) {
    img.style.width = SWATCH_WIDTH + "px";
    img.style.minWidth = SWATCH_WIDTH + "px";
    img.style.maxWidth = SWATCH_WIDTH + "px";
    img.style.height = "auto";
    img.style.display = "block";
    img.style.objectFit = "contain";
  }

  function upgradeOneSwatch(wrap) {
    const img = wrap.querySelector("img");
    if (!img) return;

    const bestSrc = getBestImageSrc(img);
    if (bestSrc && img.getAttribute("src") !== bestSrc) {
      img.setAttribute("src", bestSrc);
    }

    sizeSwatchWrapper(wrap);
    sizeSwatchImage(img);
  }

  function resizeSwatches() {
    const wrappers = document.querySelectorAll('[class*="swatchWrapper"]');
    wrappers.forEach(upgradeOneSwatch);

    // Some Volusion layouts keep sibling wrappers inside a flex row that also needs help
    const rows = new Set();
    wrappers.forEach((wrap) => {
      const row = wrap.closest(".flex.flex-wrap.items-center") || wrap.parentElement;
      if (row) rows.add(row);
    });

    rows.forEach((row) => {
      row.style.display = "flex";
      row.style.flexWrap = "wrap";
      row.style.alignItems = "flex-start";
      row.style.gap = "8px";
    });

    log("Processed swatches:", wrappers.length);
  }

  function run() {
    hideProductCode();
    hideConfigPrice();
    cleanPriceLabel();
    resizeSwatches();
  }

  function init() {
    run();

    const observer = new MutationObserver(() => {
      run();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "class", "style"]
    });

    // Volusion sometimes re-renders after page load
    setTimeout(run, 250);
    setTimeout(run, 750);
    setTimeout(run, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
