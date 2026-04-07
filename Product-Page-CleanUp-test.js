(function () {
  "use strict";

  const SWATCH_SCALE = 6.67; // 30px * 6.67 ≈ 200px visual size
  const DEBUG = true;

  function log() {
    if (DEBUG) console.log("[SwatchCSSOnly]", ...arguments);
  }

  function styleImage(img) {
    if (!img) return;
    if (img.dataset.swatchStyled === "1") return;

    const src = img.getAttribute("src") || "";
    if (!src.includes("cloudinary") || !src.includes("photos/options")) return;

    img.dataset.swatchStyled = "1";

    // Leave the real element and src alone.
    // Only visually enlarge it.
    img.style.transform = `scale(${SWATCH_SCALE})`;
    img.style.transformOrigin = "top left";
    img.style.borderRadius = "0";
    img.style.clipPath = "none";
    img.style.webkitClipPath = "none";
    img.style.mask = "none";
    img.style.webkitMask = "none";
    img.style.objectFit = "unset";
    img.style.imageRendering = "auto";
    img.style.position = "relative";
    img.style.zIndex = "1";

    log("Styled existing option image only:", src);
  }

  function fixBasePriceLabel() {
    document.querySelectorAll("[data-product-base-price]").forEach((el) => {
      const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!txt) return;

      if (/starting at/i.test(txt)) {
        const priceMatch = txt.match(/\$\s*[\d,]+(?:\.\d{2})?/);
        const pricePart = priceMatch ? priceMatch[0].replace(/\s+/g, "") : "";
        el.textContent = pricePart ? `Product Price: ${pricePart}` : "Product Price";
      }
    });
  }

  function hideProductCode() {
    document.querySelectorAll("[data-product-code]").forEach((el) => {
      el.style.display = "none";
      el.setAttribute("aria-hidden", "true");
    });
  }

  function run() {
    const images = document.querySelectorAll(
      '[data-smartmatchids] img[src*="photos/options"]'
    );

    images.forEach(styleImage);
    fixBasePriceLabel();
    hideProductCode();
  }

  function init() {
    run();
    setTimeout(run, 300);
    setTimeout(run, 800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
