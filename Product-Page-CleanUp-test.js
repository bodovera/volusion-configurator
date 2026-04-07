(function () {
  "use strict";

  const DEBUG = true;

  function log() {
    if (DEBUG) console.log("[SwatchNative]", ...arguments);
  }

  function fixImage(img) {
    if (!img) return;

    let src = img.getAttribute("src") || "";
    if (!src.includes("cloudinary") || !src.includes("photos/options")) return;

    src = src.replace(/w_30,/g, "");
    src = src.replace(/h_30,/g, "");

    img.src = src;

    img.removeAttribute("width");
    img.removeAttribute("height");

    img.style.width = "auto";
    img.style.maxWidth = "none";
    img.style.maxHeight = "none";
    img.style.height = "auto";
    img.style.objectFit = "contain";

    log("Updated native-size image:", src);
  }

  function run() {
    const images = document.querySelectorAll('[data-smartmatchids] img[src*="photos/options"]');

    images.forEach((img) => {
      const wrap = img.parentElement;

      fixImage(img);

      if (wrap) {
        wrap.style.width = "auto";
        wrap.style.minWidth = "0";
        wrap.style.maxWidth = "none";
        wrap.style.height = "auto";
        wrap.style.maxHeight = "none";
        wrap.style.padding = "0";
        wrap.style.overflow = "visible";
        wrap.style.flex = "0 0 auto";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  window.addEventListener("load", run);
  setTimeout(run, 300);
  setTimeout(run, 1000);
})();
