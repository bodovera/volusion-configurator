(function () {
  "use strict";

  const SWATCH_WIDTH = 200;
  const DEBUG = true;

  function log() {
    if (DEBUG) console.log("[SwatchCloneFix]", ...arguments);
  }

  function buildLargeSrc(src) {
    if (!src) return src;
    if (!src.includes("cloudinary") || !src.includes("photos/options")) return src;

    let out = src;
    out = out.replace(/w_30,/g, `w_${SWATCH_WIDTH},`);
    out = out.replace(/h_30,/g, "");
    return out;
  }

  function processImage(img) {
    if (!img) return;
    if (img.dataset.swatchCloneProcessed === "1") return;

    const src = img.getAttribute("src") || "";
    if (!src.includes("cloudinary") || !src.includes("photos/options")) return;

    const wrap = img.parentElement;
    if (!wrap) return;

    img.dataset.swatchCloneProcessed = "1";

    // Keep the ORIGINAL image/node intact for Volusion logic
    // Just make it visually invisible while preserving layout/click behavior.
    img.style.opacity = "0";
    img.style.position = "relative";
    img.style.zIndex = "2";

    // Prepare wrapper for overlay display
    wrap.style.position = "relative";
    wrap.style.display = "inline-block";
    wrap.style.width = SWATCH_WIDTH + "px";
    wrap.style.padding = "0";
    wrap.style.borderRadius = "0";
    wrap.style.clipPath = "none";
    wrap.style.webkitClipPath = "none";
    wrap.style.overflow = "visible";
    wrap.style.verticalAlign = "top";

    if (wrap.parentElement) {
      wrap.parentElement.style.borderRadius = "0";
      wrap.parentElement.style.clipPath = "none";
      wrap.parentElement.style.webkitClipPath = "none";
      wrap.parentElement.style.overflow = "visible";
    }

    // Build a DISPLAY-ONLY clone
    const clone = document.createElement("img");
    clone.src = buildLargeSrc(src);
    clone.alt = img.alt || "";
    clone.setAttribute("aria-hidden", "true");

    clone.style.position = "absolute";
    clone.style.left = "0";
    clone.style.top = "0";
    clone.style.width = SWATCH_WIDTH + "px";
    clone.style.height = "auto";
    clone.style.maxWidth = "none";
    clone.style.display = "block";
    clone.style.objectFit = "unset";
    clone.style.borderRadius = "0";
    clone.style.clipPath = "none";
    clone.style.webkitClipPath = "none";
    clone.style.mask = "none";
    clone.style.webkitMask = "none";
    clone.style.pointerEvents = "none";
    clone.style.zIndex = "3";

    wrap.appendChild(clone);

    log("Created safe display clone for:", src);
  }

  function run() {
    const images = document.querySelectorAll(
      '[data-smartmatchids] img[src*="photos/options"]'
    );

    images.forEach(processImage);
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
