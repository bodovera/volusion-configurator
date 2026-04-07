(function () {
  "use strict";

  const DEBUG = true;
  const SWATCH_WIDTH = 200;

  function log() {
    if (DEBUG) console.log("[CleanUpTest]", ...arguments);
  }

  function qsAll(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function setStyles(el, styles) {
    if (!el) return;
    Object.keys(styles).forEach((k) => {
      el.style[k] = styles[k];
    });
  }

  function hide(el) {
    if (!el) return;
    el.style.display = "none";
    el.setAttribute("aria-hidden", "true");
  }

  function hideProductCode() {
    qsAll("[data-product-code]").forEach(hide);
  }

  function hideConfigPrice() {
    qsAll("strong, div, p, span, label").forEach((el) => {
      const txt = (el.textContent || "").replace(/\s+/g, " ").trim().toUpperCase();
      if (txt === "CONFIG_PRICE:" || txt === "CONFIG_PRICE") {
        hide(el.closest(".flex.flex-wrap") || el.parentElement || el);
      }
    });

    qsAll("select").forEach((select) => {
      const optionText = Array.from(select.options)
        .map((o) => o.textContent || "")
        .join(" ")
        .toUpperCase();

      if (optionText.includes("CALCULATED PRICE")) {
        hide(
          select.closest(".flex.flex-wrap") ||
          select.closest(".w-100") ||
          select.parentElement ||
          select
        );
      }
    });
  }

  function cleanPriceLabel() {
    qsAll(".ProductPrice_Name, #ProductPrice_Name").forEach((el) => {
      const txt = (el.textContent || "").trim();
      if (
        txt &&
        (
          txt.includes("starting at") ||
          txt.includes("ProductPrice_Name") ||
          /\d+\s*x\s*\d+/i.test(txt)
        )
      ) {
        el.textContent = "Product Price";
      }
    });
  }

  function getProductCodeFromInput(input) {
    if (!input) return "";
    const name = input.getAttribute("name") || "";
    const m = name.match(/SELECT___([^_]+)___/i);
    return m ? m[1] : "";
  }

  function buildOptionImageUrl(productCode, optionId) {
    if (!productCode || !optionId) return "";
    return window.location.origin + "/v/vspfiles/photos/options/" + productCode + "-" + optionId + "-S.jpg";
  }

  function findMatchingInput(swatchEl) {
    if (!swatchEl) return null;

    const valueKey = (swatchEl.getAttribute("data-doogma-value") || "").trim();
    if (!valueKey) return null;

    const section = swatchEl.closest(".w-100.flex.pt2.items-center") || swatchEl.closest(".flex.flex-wrap") || document;

    let inputs = qsAll('input[type="radio"].doogma-mount, input[type="checkbox"].doogma-mount', section);

    if (!inputs.length) {
      inputs = qsAll('input[type="radio"][data-doogma-value], input[type="checkbox"][data-doogma-value]', document);
    }

    return inputs.find((inp) => {
      return ((inp.getAttribute("data-doogma-value") || "").trim() === valueKey);
    }) || null;
  }

  function upgradeSwatchBox(swatchEl) {
    if (!swatchEl) return;

    const img = swatchEl.querySelector("img");
    if (!img) return;

    const input = findMatchingInput(swatchEl);
    if (!input) {
      log("No matching input found for swatch", swatchEl);
      return;
    }

    const productCode = getProductCodeFromInput(input);
    const optionId = input.value || input.id || "";
    const realUrl = buildOptionImageUrl(productCode, optionId);

    if (!realUrl) {
      log("Could not build URL", { productCode, optionId, swatchEl });
      return;
    }

    // Force real Volusion image and kill lazy/Cloudinary fallback
    img.setAttribute("src", realUrl);
    img.setAttribute("data-src", realUrl);
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
    if (img.dataset) {
      img.dataset.src = realUrl;
    }

    // Sometimes Volusion keeps a parent tiny; size both wrapper and its outer cell
    const outerCell = swatchEl.closest(".pr1.pb1") || swatchEl.parentElement;

    setStyles(outerCell, {
      width: SWATCH_WIDTH + "px",
      minWidth: SWATCH_WIDTH + "px",
      maxWidth: SWATCH_WIDTH + "px",
      flex: "0 0 " + SWATCH_WIDTH + "px",
      boxSizing: "border-box"
    });

    setStyles(swatchEl, {
      width: SWATCH_WIDTH + "px",
      minWidth: SWATCH_WIDTH + "px",
      maxWidth: SWATCH_WIDTH + "px",
      flex: "0 0 " + SWATCH_WIDTH + "px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      boxSizing: "border-box",
      cursor: "pointer",
      verticalAlign: "top"
    });

    setStyles(img, {
      width: SWATCH_WIDTH + "px",
      minWidth: SWATCH_WIDTH + "px",
      maxWidth: SWATCH_WIDTH + "px",
      height: "auto",
      display: "block",
      objectFit: "contain"
    });

    log("Swatch fixed", {
      productCode: productCode,
      optionId: optionId,
      url: realUrl
    });
  }

  function resizeSwatches() {
    // target the actual visual swatch boxes, selected and unselected
    const swatches = qsAll("div.doogma-mount[data-doogma-value]");
    swatches.forEach(upgradeSwatchBox);

    // help the row layout
    qsAll(".flex.flex-wrap.items-center").forEach((row) => {
      if (row.querySelector("div.doogma-mount[data-doogma-value]")) {
        setStyles(row, {
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          gap: "8px"
        });
      }
    });
  }

  function run() {
    hideProductCode();
    hideConfigPrice();
    cleanPriceLabel();
    resizeSwatches();
  }

  function init() {
    run();

    const observer = new MutationObserver(() => {
      run();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "data-src", "srcset", "class", "style"]
    });

    document.addEventListener("change", run, true);
    document.addEventListener("click", run, true);

    setTimeout(run, 150);
    setTimeout(run, 500);
    setTimeout(run, 1000);
    setTimeout(run, 2000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
