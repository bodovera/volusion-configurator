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

    // only touch Cloudinary option images
    if (!src.includes("cloudinary") || !src.includes("photos/options")) return;

    // replace 30px constraint
    src = src.replace(/w_30,/g, `w_${SWATCH_WIDTH},`);
    src = src.replace(/h_30,/g, "");

    img.src = src;

    // remove size constraints
    img.removeAttribute("width");
    img.removeAttribute("height");

    img.style.width = SWATCH_WIDTH + "px";
    img.style.height = "auto";
    img.style.objectFit = "contain";

    log("Updated image:", src);
  }

  function run() {
    const images = document.querySelectorAll(
      '[data-smartmatchids] img[src*="photos/options"]'
    );

    images.forEach((img) => {
      const wrap = img.parentElement;

      fixImage(img);

      if (wrap) {
        wrap.style.width = SWATCH_WIDTH + "px";
        wrap.style.minWidth = SWATCH_WIDTH + "px";
        wrap.style.maxWidth = "none";
        wrap.style.padding = "0";
        wrap.style.flex = "0 0 " + SWATCH_WIDTH + "px";
      }
    });
  }

  function init() {
    run();

    // lightweight re-run (not aggressive)
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
