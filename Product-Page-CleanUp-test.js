(function () {
  "use strict";

  const DEBUG = true;
  const SWATCH_WIDTH = 200;

  function log(...args) {
    if (DEBUG) console.log("[CleanUpTest]", ...args);
  }

  function extractVolusionImage(img) {
    if (!img) return "";

    const sources = [
      img.getAttribute("src"),
      img.getAttribute("data-src"),
      img.outerHTML
    ].filter(Boolean);

    for (const s of sources) {
      const match = s.match(/\/v\/vspfiles\/photos\/options\/[^"' )]+/i);
      if (match) {
        return window.location.origin + match[0];
      }
    }

    return "";
  }

  function fixSwatch(el) {
    const img = el.querySelector("img");
    if (!img) return;

    const realSrc = extractVolusionImage(img);

    if (realSrc && img.src !== realSrc) {
      img.src = realSrc;
      log("Fixed image:", realSrc);
    }

    // FORCE SIZE
    el.style.width = SWATCH_WIDTH + "px";
    el.style.flex = "0 0 " + SWATCH_WIDTH + "px";

    img.style.width = SWATCH_WIDTH + "px";
    img.style.height = "auto";
    img.style.objectFit = "contain";
  }

  function run() {
    // 🔥 FIX ALL SWATCHES (selected + unselected)
    document.querySelectorAll(".doogma-mount").forEach(fixSwatch);
  }

  function init() {
    run();

    const observer = new MutationObserver(run);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

    setTimeout(run, 200);
    setTimeout(run, 600);
    setTimeout(run, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
