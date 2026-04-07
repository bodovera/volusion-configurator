(function () {
  "use strict";

  const SWATCH_WIDTH = 200;
  const DEBUG = true;

  function log() {
    if (DEBUG) console.log("[ProductOptionsUI]", ...arguments);
  }

  function hide(el) {
    if (!el) return;
    el.style.display = "none";
    el.setAttribute("aria-hidden", "true");
  }

  function fixImage(img) {
    if (!img) return;

    let src = img.getAttribute("src") || "";

    // only touch Cloudinary option images
    if (!src.includes("cloudinary") || !src.includes("photos/options")) return;

    // replace tiny 30px swatch width
    src = src.replace(/w_30,/g, `w_${SWATCH_WIDTH},`);
    src = src.replace(/h_30,/g, "");

    if (img.src !== src) {
      img.src = src;
    }

    img.removeAttribute("width");
    img.removeAttribute("height");

    // show image as-is
    img.style.width = SWATCH_WIDTH + "px";
    img.style.height = "auto";
    img.style.maxWidth = "none";
    img.style.objectFit = "unset";
    img.style.display = "block";

    // remove circle / oval styling
    img.style.borderRadius = "0";
    img.style.clipPath = "none";
    img.style.webkitClipPath = "none";
    img.style.mask = "none";
    img.style.webkitMask = "none";
    img.style.overflow = "visible";

    log("Updated option image:", src);
  }

  function fixWrapper(wrap) {
    if (!wrap) return;

    wrap.style.width = SWATCH_WIDTH + "px";
    wrap.style.minWidth = SWATCH_WIDTH + "px";
    wrap.style.maxWidth = "none";
    wrap.style.flex = "0 0 " + SWATCH_WIDTH + "px";
    wrap.style.padding = "0";
    wrap.style.display = "inline-block";

    // remove circle / oval styling
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
        wrap.parentElement.style.mask = "none";
        wrap.parentElement.style.webkitMask = "none";
        wrap.parentElement.style.overflow = "visible";
      }
    });
  }

  function hideProductCode() {
    document.querySelectorAll("[data-product-code]").forEach((el) => {
      hide(el);
      log("Hid product code container", el);
    });

    document.querySelectorAll(".ProductCode, #ProductCode").forEach((el) => {
      const wrap = el.closest(".flex.flex-wrap") || el.parentElement || el;
      hide(wrap);
      log("Hid ProductCode wrapper", wrap);
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
        log("Changed ProductPrice_Name to Product Price", el);
      }
    });
  }

  function run() {
    fixSwatches();
    hideProductCode();
    cleanPriceLabel();
  }

  function init() {
    run();

    setTimeout(run, 300);
    setTimeout(run, 800);
    setTimeout(run, 1500);

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
