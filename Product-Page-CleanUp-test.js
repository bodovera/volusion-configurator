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

  function cleanCloudinaryUrl(url) {
    if (!url) return url;

    let cleaned = url;

    cleaned = cleaned.replace(/\/c_limit[^/]*\//i, "/");
    cleaned = cleaned.replace(/\/c_fit[^/]*\//i, "/");
    cleaned = cleaned.replace(/\/c_fill[^/]*\//i, "/");
    cleaned = cleaned.replace(/\/w_\d+,h_\d+[^/]*\//i, "/");
    cleaned = cleaned.replace(/\/h_\d+,w_\d+[^/]*\//i, "/");
    cleaned = cleaned.replace(/\/w_\d+[^/]*\//i, "/");
    cleaned = cleaned.replace(/\/h_\d+[^/]*\//i, "/");

    cleaned = cleaned.replace(/\/{2,}/g, "/");
    cleaned = cleaned.replace(/^https:\//i, "https://");

    return cleaned;
  }

  function extractUrlFromBackground(bg) {
    if (!bg || bg === "none") return "";
    const match = bg.match(/url\((['"]?)(.*?)\1\)/i);
    return match ? match[2] : "";
  }

  function getBestUrlFromElement(el) {
    if (!el) return "";

    const candidates = [
      el.getAttribute && el.getAttribute("data-src"),
      el.getAttribute && el.getAttribute("data-original"),
      el.getAttribute && el.getAttribute("data-lazy-src"),
      el.getAttribute && el.getAttribute("src"),
      el.dataset && el.dataset.src,
      el.dataset && el.dataset.original,
      el.style && el.style.backgroundImage ? extractUrlFromBackground(el.style.backgroundImage) : "",
      window.getComputedStyle ? extractUrlFromBackground(getComputedStyle(el).backgroundImage) : ""
    ].filter(Boolean);

    for (const candidate of candidates) {
      const cleaned = cleanCloudinaryUrl(candidate);
      if (cleaned) return cleaned;
    }

    return "";
  }

  function setElementImage(el, url) {
    if (!el || !url) return;

    if (el.tagName && el.tagName.toLowerCase() === "img") {
      el.src = url;
      if (el.hasAttribute("data-src")) el.setAttribute("data-src", url);
      if (el.dataset) el.dataset.src = url;
      return;
    }

    el.style.backgroundImage = 'url("' + url + '")';
  }

  function sizeWrapper(wrap) {
    wrap.style.width = SWATCH_WIDTH + "px";
    wrap.style.minWidth = SWATCH_WIDTH + "px";
    wrap.style.maxWidth = SWATCH_WIDTH + "px";
    wrap.style.flex = "0 0 " + SWATCH_WIDTH + "px";
    wrap.style.display = "inline-flex";
    wrap.style.alignItems = "center";
    wrap.style.justifyContent = "center";
    wrap.style.boxSizing = "border-box";
    wrap.style.overflow = "hidden";
    wrap.style.cursor = "pointer";
    wrap.style.verticalAlign = "top";
  }

  function sizeImg(img) {
    img.style.width = SWATCH_WIDTH + "px";
    img.style.minWidth = SWATCH_WIDTH + "px";
    img.style.maxWidth = SWATCH_WIDTH + "px";
    img.style.height = "auto";
    img.style.display = "block";
    img.style.objectFit = "contain";
  }

  function sizeBackgroundBox(el) {
    el.style.width = SWATCH_WIDTH + "px";
    el.style.minWidth = SWATCH_WIDTH + "px";
    el.style.maxWidth = SWATCH_WIDTH + "px";
    el.style.height = "auto";
    el.style.backgroundSize = "contain";
    el.style.backgroundRepeat = "no-repeat";
    el.style.backgroundPosition = "center center";
  }

  function processSwatchWrapper(wrap) {
    if (!wrap) return;

    sizeWrapper(wrap);

    const img = wrap.querySelector("img");
    if (img) {
      const best = getBestUrlFromElement(img) || getBestUrlFromElement(wrap);
      if (best) setElementImage(img, best);
      sizeImg(img);
      return;
    }

    const bestWrapUrl = getBestUrlFromElement(wrap);
    if (bestWrapUrl) {
      setElementImage(wrap, bestWrapUrl);
      sizeBackgroundBox(wrap);
      return;
    }

    const childWithBg = wrap.querySelector("div, span, a");
    if (childWithBg) {
      const bestChildUrl = getBestUrlFromElement(childWithBg);
      if (bestChildUrl) {
        setElementImage(childWithBg, bestChildUrl);
        sizeBackgroundBox(childWithBg);
      }
    }
  }

  function resizeSwatches() {
    const wrappers = document.querySelectorAll('[class*="swatchWrapper"]');

    wrappers.forEach((wrap) => {
      processSwatchWrapper(wrap);
    });

    document.querySelectorAll(".flex.flex-wrap.items-center").forEach((row) => {
      if (row.querySelector('[class*="swatchWrapper"]')) {
        row.style.display = "flex";
        row.style.flexWrap = "wrap";
        row.style.alignItems = "flex-start";
        row.style.gap = "8px";
      }
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
      attributeFilter: ["src", "style", "class", "data-src"]
    });

    setTimeout(run, 200);
    setTimeout(run, 700);
    setTimeout(run, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
