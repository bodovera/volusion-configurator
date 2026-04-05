(function () {
  "use strict";

  const DEBUG = true;

  function log() {
    if (DEBUG) console.log("[SwatchUpgrade]", ...arguments);
  }

  function init() {
    const swatches = document.querySelectorAll(".swatchWrapper");

    if (!swatches.length) {
      log("No swatches found");
      return;
    }

    swatches.forEach((swatch) => {
      const parent = swatch.closest(".flex.items-center");

      if (!parent) return;

      const input = parent.querySelector("input[type='radio'], input[type='checkbox']");
      if (!input) return;

      // Click entire box
      swatch.style.cursor = "pointer";

      swatch.addEventListener("click", () => {
        if (input.type === "radio") {
          input.checked = true;

          // remove active from siblings
          const group = parent.closest("div");
          group.querySelectorAll(".swatchWrapper").forEach(s => s.classList.remove("selected"));

          swatch.classList.add("selected");

        } else {
          input.checked = !input.checked;
          swatch.classList.toggle("selected");
        }

        input.dispatchEvent(new Event("change", { bubbles: true }));
      });

      // Sync initial state
      if (input.checked) {
        swatch.classList.add("selected");
      }
    });

    log("Swatches upgraded");
  }

  window.addEventListener("load", init);
})();
