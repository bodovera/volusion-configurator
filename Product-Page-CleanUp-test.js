(function () {
  "use strict";

  const SWATCH_WIDTH = 200;
  const DEBUG = true;

  function log() {
    if (DEBUG) console.log("[OptionsUI]", ...arguments);
  }

  function isProductPage() {
    return /\/product-p\//i.test(window.location.pathname);
  }

  function hide(el) {
    if (!el) return;
    el.style.display = "none";
    el.setAttribute("aria-hidden", "true");
  }

  // =========================
  // SWATCH IMAGE FIX
  // =========================
  function fixImage(img) {
    if (!img) return;

    let src = img.getAttribute("src") || "";
    if (!src.includes("cloudinary") || !src.includes("photos/options")) return;

    src = src.replace(/w_30,/g, `w_${SWATCH_WIDTH},`);
    src = src.replace(/h_30,/g, "");

    if (img.src !== src) {
      img.src = src;
    }

    img.removeAttribute("width");
    img.removeAttribute("height");

    img.style.width = SWATCH_WIDTH + "px";
    img.style.height = "auto";
    img.style.maxWidth = "none";
    img.style.objectFit = "unset";
    img.style.display = "block";
    img.style.borderRadius = "0";
    img.style.clipPath = "none";
    img.style.webkitClipPath = "none";
    img.style.mask = "none";
    img.style.webkitMask = "none";
    img.style.overflow = "visible";
  }

  function fixWrapper(wrap) {
    if (!wrap) return;

    wrap.style.width = SWATCH_WIDTH + "px";
    wrap.style.flex = "0 0 " + SWATCH_WIDTH + "px";
    wrap.style.padding = "0";
    wrap.style.display = "inline-block";
    wrap.style.borderRadius = "0";
    wrap.style.clipPath = "none";
    wrap.style.webkitClipPath = "none";
    wrap.style.mask = "none";
    wrap.style.webkitMask = "none";
    wrap.style.overflow = "visible";
  }

  function fixSwatches() {
    const images = document.querySelectorAll(
      '[data-smartmatchids] img[src*="photos/options"]'
    );

    images.forEach((img) => {
      const wrap = img.parentElement;

      fixImage(img);
      fixWrapper(wrap);

      if (wrap && wrap.parentElement) {
        wrap.parentElement.style.borderRadius = "0";
        wrap.parentElement.style.clipPath = "none";
        wrap.parentElement.style.webkitClipPath = "none";
        wrap.parentElement.style.overflow = "visible";
      }
    });
  }

  // =========================
  // CLEANUP
  // =========================
  function hideProductCode() {
    document.querySelectorAll("[data-product-code]").forEach((el) => {
      hide(el);
      log("Hid product code", el);
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
        log("Updated ProductPrice_Name label", el);
      }
    });
  }

  function fixBasePriceLabel() {
    document.querySelectorAll("[data-product-base-price]").forEach((el) => {
      const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!txt) return;

      if (/starting at/i.test(txt)) {
        const priceMatch = txt.match(/\$\s*[\d,]+(?:\.\d{2})?/);
        const pricePart = priceMatch ? priceMatch[0].replace(/\s+/g, "") : "";
        el.textContent = pricePart ? `Product Price: ${pricePart}` : "Product Price";
        log("Updated [data-product-base-price]", el);
      }
    });
  }

  function fixVisibleStartingAtText() {
    document.querySelectorAll("div, span, p, strong, label").forEach((el) => {
      if (el.children.length > 0) return;

      const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!txt) return;

      if (/^starting at\s*:/i.test(txt)) {
        const priceMatch = txt.match(/\$\s*[\d,]+(?:\.\d{2})?/);
        const pricePart = priceMatch ? priceMatch[0].replace(/\s+/g, "") : "";
        el.textContent = pricePart ? `Product Price: ${pricePart}` : "Product Price";
        log("Updated visible Starting at text", el);
      }
    });
  }

  // =========================
  // RUNNER
  // =========================
  function run() {
    if (!isProductPage()) return;

    fixSwatches();
    hideProductCode();
    cleanPriceLabel();
    fixBasePriceLabel();
    fixVisibleStartingAtText();
  }

  function init() {
    if (!isProductPage()) return;

    run();

    setTimeout(run, 300);
    setTimeout(run, 800);
    setTimeout(run, 1500);
    setTimeout(run, 2500);

    const observer = new MutationObserver(() => run());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
