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
    cleaned = cleaned.replace(/\/w_\d+[^/]*,h_\d+[^/]*\//i, "/");
    cleaned = cleaned.replace(/\/h_\d+[^/]*,w_\d+[^/]*\//i, "/");
    cleaned = cleaned.replace(/\/q_auto[^/]*\//i, "/");
    cleaned = cleaned.replace(/\/f_auto[^/]*\//i, "/");

    cleaned = cleaned.replace(/\/{2,}/g, "/");
    cleaned = cleaned.replace(/^https:\//i, "https://");

    return cleaned;
  }

  function upgradeSwatchImage(img) {
    if (!img || img.dataset.cleanupUpgraded === "1") return;

    const original =
      img.getAttribute("data-src") ||
      img.dataset.src ||
      img.getAttribute("src") ||
      "";

    if (!original) return;

    const better = forceBetterCloudinarySrc(original);

    if (better) {
      img.src = better;
      img.dataset.cleanupUpgraded = "1";
      log("Forced better swatch image", { original, better });
    }
  }

  function resizeSwatches() {
    const wrappers = document.querySelectorAll('[class*="swatchWrapper"]');

    wrappers.forEach((wrap) => {
      const img = wrap.querySelector("img");
      if (!img) return;

      upgradeSwatchImage(img);

      wrap.style.width = SWATCH_WIDTH + "px";
      wrap.style.minWidth = SWATCH_WIDTH + "px";
      wrap.style.maxWidth = SWATCH_WIDTH + "px";
      wrap.style.height = "auto";
      wrap.style.display = "inline-flex";
      wrap.style.alignItems = "center";
      wrap.style.justifyContent = "center";
      wrap.style.overflow = "hidden";
      wrap.style.boxSizing = "border-box";
      wrap.style.verticalAlign = "top";
      wrap.style.cursor = "pointer";

      img.style.width = SWATCH_WIDTH + "px";
      img.style.maxWidth = SWATCH_WIDTH + "px";
      img.style.minWidth = SWATCH_WIDTH + "px";
      img.style.height = "auto";
      img.style.display = "block";
      img.style.objectFit = "contain";

      log("Resized swatch", wrap);
    });
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
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
