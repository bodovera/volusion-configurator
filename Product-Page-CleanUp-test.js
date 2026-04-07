(function () {
  "use strict";

  const SWATCH_WIDTH = 200;
  const DEBUG = true;

  function log() {
    if (DEBUG) console.log("[SwatchFix]", ...arguments);
  }

  function fixImage(img) {
    if (!img) return;

    let src = img.getAttribute("src") || "";

    // Only touch Cloudinary option images
    if (!src.includes("cloudinary") || !src.includes("photos/options")) {
      return;
    }

    // Replace the tiny 30px width constraint
    src = src.replace(/w_30,/g, `w_${SWATCH_WIDTH},`);
    src = src.replace(/h_30,/g, "");

    img.src = src;

    // Remove hard size attributes
    img.removeAttribute("width");
    img.removeAttribute("height");

    // Enlarge display
    img.style.width = SWATCH_WIDTH + "px";
    img.style.height = "auto";
    img.style.objectFit = "contain";

    log("Updated image:", src);
  }

  function fixWrapper(wrap) {
    if (!wrap) return;

    wrap.style.width = SWATCH_WIDTH + "px";
    wrap.style.minWidth = SWATCH_WIDTH + "px";
    wrap.style.maxWidth = "none";
    wrap.style.padding = "0";
    wrap.style.flex = "0 0 " + SWATCH_WIDTH + "px";
  }

  function run() {
    const images = document.querySelectorAll(
      '[data-smartmatchids] img[src*="photos/options"]'
    );

    images.forEach((img) => {
      const wrap = img.parentElement;

      fixImage(img);
      fixWrapper(wrap);
    });
  }

  function init() {
    run();

    // Lightweight re-runs only
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
