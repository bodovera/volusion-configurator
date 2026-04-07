(function () {
  "use strict";

  const DEBUG = true;

  function log() {
    if (DEBUG) console.log("[SwatchNaturalFull]", ...arguments);
  }

  function getFullResSrc(src) {
    if (!src) return src;

    // only touch option images
    if (!src.includes("cloudinary") || !src.includes("photos/options")) {
      return src;
    }

    let out = src;

    // remove tiny forced Cloudinary dimensions
    out = out.replace(/w_30,/g, "");
    out = out.replace(/h_30,/g, "");

    // clean up possible double commas left behind
    out = out.replace(/,,+/g, ",");
    out = out.replace(/\/,/, "/");
    out = out.replace(/,\//, "/");

    return out;
  }

  function fixImage(img) {
    if (!img) return;

    const originalSrc = img.getAttribute("src") || "";
    if (!originalSrc.includes("cloudinary") || !originalSrc.includes("photos/options")) {
      return;
    }

    const fullSrc = getFullResSrc(originalSrc);

    if (img.src !== fullSrc) {
      img.src = fullSrc;
      log("Updated image src to full-res:", fullSrc);
    }

    // remove forced constraints
    img.removeAttribute("width");
    img.removeAttribute("height");

    // show image as loaded
    img.style.width = "auto";
    img.style.height = "auto";
    img.style.maxWidth = "none";
    img.style.objectFit = "unset";
    img.style.display = "block";

    // remove round / oval effect
    img.style.borderRadius = "0";
    img.style.clipPath = "none";
    img.style.webkitClipPath = "none";
    img.style.mask = "none";
    img.style.webkitMask = "none";

    log("Image displayed at natural full size:", fullSrc);
  }

  function fixWrapper(wrap) {
    if (!wrap) return;

    // let wrapper follow image naturally
    wrap.style.width = "auto";
    wrap.style.minWidth = "0";
    wrap.style.maxWidth = "none";
    wrap.style.flex = "0 0 auto";
    wrap.style.padding = "0";

    // remove circular shaping
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
