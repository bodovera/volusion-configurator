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
    img.style.borderRadius = "0";
    img.style.background = "none";
    img.style.boxShadow = "none";
    img.style.display = "block";

    log("Updated native-size image:", src);
  }

  function cleanWrap(wrap, img) {
    if (!wrap) return;

    wrap.style.width = "auto";
    wrap.style.minWidth = "0";
    wrap.style.maxWidth = "none";
    wrap.style.height = "auto";
    wrap.style.maxHeight = "none";
    wrap.style.padding = "0";
    wrap.style.margin = "0";
    wrap.style.overflow = "visible";
    wrap.style.flex = "0 0 auto";
    wrap.style.borderRadius = "0";
    wrap.style.background = "none";
    wrap.style.boxShadow = "none";
    wrap.style.border = "none";

    Array.from(wrap.classList).forEach((cls) => {
      if (cls.toLowerCase().includes("borderradius")) {
        wrap.classList.remove(cls);
      }
    });

    const outer = wrap.closest(".pr1.pb1");
    if (outer) {
      outer.style.padding = "0";
      outer.style.margin = "0";
      outer.style.width = "auto";
      outer.style.minWidth = "0";
      outer.style.maxWidth = "none";
      outer.style.flex = "0 0 auto";
      outer.style.background = "none";
      outer.style.border = "none";
      outer.style.boxShadow = "none";
      outer.style.borderRadius = "0";
    }

    if (img) {
      img.style.borderRadius = "0";
      img.style.background = "none";
      img.style.boxShadow = "none";
    }
  }

  function run() {
    const images = document.querySelectorAll('[data-smartmatchids] img[src*="photos/options"]');

    images.forEach((img) => {
      const wrap = img.parentElement;
      fixImage(img);
      cleanWrap(wrap, img);
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
