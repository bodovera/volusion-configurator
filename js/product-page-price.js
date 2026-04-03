(function () {
  "use strict";

  // =========================================================
  // HELPERS
  // =========================================================

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function parseDimension(value) {
    if (value == null) return 0;

    const str = String(value).trim().replace(/"/g, "");
    if (!str) return 0;

    if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str);

    if (/^\d+\s+\d+\/\d+$/.test(str)) {
      const parts = str.split(/\s+/);
      const whole = parseFloat(parts[0]) || 0;
      const frac = parts[1].split("/");
      return whole + ((parseFloat(frac[0]) || 0) / (parseFloat(frac[1]) || 1));
    }

    if (/^\d+\/\d+$/.test(str)) {
      const frac = str.split("/");
      return (parseFloat(frac[0]) || 0) / (parseFloat(frac[1]) || 1);
    }

    return 0;
  }

  function getSelectedText(select) {
    if (!select || select.selectedIndex < 0) return "";
    return (select.options[select.selectedIndex].textContent || "").trim();
  }

  function normalize(n) {
    return Number.isInteger(n) ? String(parseInt(n, 10)) : String(n);
  }

  // =========================================================
  // FIND SELECTS
  // =========================================================

  function findPriceSelect() {
    const selects = document.querySelectorAll("select");

    for (let i = 0; i < selects.length; i++) {
      const name = selects[i].name || "";

      // MATCH: PRICE_*
      if (name.toUpperCase().includes("PRICE_")) {
        return selects[i];
      }
    }

    return null;
  }

  function getSelects() {
    return {
      width: document.querySelector("select.doogma-width"),
      widthInc: document.querySelector("select.doogma-widthinc"),
      length: document.querySelector("select.doogma-length"),
      lengthInc: document.querySelector("select.doogma-lengthinc"),
      price: findPriceSelect()
    };
  }

  // =========================================================
  // BREAKPOINTS FROM PRICE OPTIONS
  // =========================================================

  function getBreakpoints(priceSelect, index) {
    if (!priceSelect) return [];

    const values = Array.from(priceSelect.options)
      .map(function (opt) {
        const combo =
          opt.getAttribute("data-doogma-value") ||
          (opt.textContent || "").split(" ")[0];

        if (!combo) return null;

        const parts = combo.toLowerCase().split("x");
        if (parts.length !== 2) return null;

        const val = parseDimension(parts[index]);
        return isNaN(val) ? null : val;
      })
      .filter(Boolean)
      .sort((a, b) => a - b);

    return [...new Set(values)];
  }

  function getNextBucket(value, breakpoints) {
    for (let i = 0; i < breakpoints.length; i++) {
      if (value <= breakpoints[i]) return breakpoints[i];
    }
    return breakpoints.length ? breakpoints[breakpoints.length - 1] : 0;
  }

  // =========================================================
  // SET PRICE OPTION
  // =========================================================

  function setPrice(select, target) {
    if (!select) return false;

    const targetLower = target.toLowerCase();

    for (let i = 0; i < select.options.length; i++) {
      const opt = select.options[i];

      const val =
        (opt.getAttribute("data-doogma-value") || "").toLowerCase() ||
        ((opt.textContent || "").split(" ")[0] || "").toLowerCase();

      if (val === targetLower) {
        select.selectedIndex = i;
        select.value = opt.value;

        select.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    }

    console.warn("No price bucket match:", target);
    return false;
  }

  // =========================================================
  // MAIN LOGIC
  // =========================================================

  function updatePrice() {
    const s = getSelects();

    if (!s.width || !s.widthInc || !s.length || !s.lengthInc || !s.price) {
      return;
    }

    const width = parseDimension(getSelectedText(s.width));
    const widthInc = parseDimension(getSelectedText(s.widthInc));
    const length = parseDimension(getSelectedText(s.length));
    const lengthInc = parseDimension(getSelectedText(s.lengthInc));

    const actualWidth = width + widthInc;
    const actualLength = length + lengthInc;

    const widthBreaks = getBreakpoints(s.price, 0);
    const lengthBreaks = getBreakpoints(s.price, 1);

    const widthBucket = getNextBucket(actualWidth, widthBreaks);
    const lengthBucket = getNextBucket(actualLength, lengthBreaks);

    const combo = normalize(widthBucket) + "x" + normalize(lengthBucket);

    setPrice(s.price, combo);

    console.log("PRICE SELECTED:", combo);
  }

  function bind() {
    document.addEventListener("change", function (e) {
      if (!e.target || e.target.tagName !== "SELECT") return;

      if (
        e.target.classList.contains("doogma-width") ||
        e.target.classList.contains("doogma-widthinc") ||
        e.target.classList.contains("doogma-length") ||
        e.target.classList.contains("doogma-lengthinc")
      ) {
        setTimeout(updatePrice, 50);
      }
    });
  }

  function init() {
    bind();

    setTimeout(updatePrice, 500);
    setTimeout(updatePrice, 1000);
    setTimeout(updatePrice, 1500);
  }

  ready(init);
})();
