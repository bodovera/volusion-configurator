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

    // only touch option images
    if (!src.includes("cloudinary") || !src.includes("photos/options")) return;

    // upscale image (remove 30px constraint)
    src = src.replace(/w_30,/g, `w_${SWATCH_WIDTH},`);
    src = src.replace(/h_30,/g, "");

    if (img.src !== src) {
      img.src = src;
    }

    // REMOVE ALL FORCED SHAPING
    img.removeAttribute("width");
    img.removeAttribute("height");

    img.style.width = SWATCH_WIDTH + "px";
    img.style.height = "auto"; // <-- THIS is key (natural ratio)
    img.style.maxWidth = "none";

    // kill ALL rounding / masking
    img.style.borderRadius = "0";
    img.style.clipPath = "none";
    img.style.webkitClipPath = "none";
    img.style.mask = "none";
    img.style.webkitMask = "none";

    // ensure no cropping
    img.style.objectFit = "unset";

    log("Image set to natural shape:", src);
  }

  function fixWrapper(wrap) {
    if (!wrap) return;

    wrap.style.width = SWATCH_WIDTH + "px";
    wrap.style.flex = "0 0 " + SWATCH_WIDTH + "px";
    wrap.style.padding = "0";

    // REMOVE any circular container styling
    wrap.style.borderRadius = "0";
    wrap.style.clipPath = "none";
    wrap.style.webkitClipPath = "none";
    wrap.style.overflow = "visible";
  }

  function run() {
    const images = document.querySelectorAll(
      '[data-smartmatchids] img[src*="photos/options"]'
    );

    images.forEach((img) => {
      const wrap = img.parentElement;

      fixImage(img);
      fixWrapper(wrap);

      // sometimes volusion wraps twice
      if (wrap && wrap.parentElement) {
        wrap.parentElement.style.borderRadius = "0";
        wrap.parentElement.style.clipPath = "none";
        wrap.parentElement.style.webkitClipPath = "none";
        wrap.parentElement.style.overflow = "visible";
      }
    });
  }

  function init() {
    run();
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
