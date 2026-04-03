(function () {
  "use strict";

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

    if (/^\d+(\.\d+)?$/.test(str)) {
      return parseFloat(str);
    }

    if (/^\d+\s+\d+\/\d+$/.test(str)) {
      const parts = str.split(/\s+/);
      const whole = parseFloat(parts[0]) || 0;
      const frac = parts[1].split("/");
      const num = parseFloat(frac[0]) || 0;
      const den = parseFloat(frac[1]) || 1;
      return whole + (den ? num / den : 0);
    }

    if (/^\d+\/\d+$/.test(str)) {
      const frac = str.split("/");
      const num = parseFloat(frac[0]) || 0;
      const den = parseFloat(frac[1]) || 1;
      return den ? num / den : 0;
    }

    return 0;
  }

  function getSelectedOptionText(select) {
    if (!select || select.selectedIndex < 0) return "";
    const opt = select.options[select.selectedIndex];
    return opt ? (opt.textContent || "").trim() : "";
  }

  function getBreakpointsFromPriceSelect(select, index) {
    if (!select) return [];

    const points = Array.from(select.options)
      .map(function (opt) {
        const combo =
          (opt.getAttribute("data-doogma-value") || "").trim() ||
          ((opt.textContent || "").trim().split(/\s+/)[0] || "").trim();

        if (!combo || combo.indexOf("x") < 0) return null;

        const parts = combo.toLowerCase().split("x");
        if (parts.length !== 2) return null;

        const num = parseDimension(parts[index]);
        return !isNaN(num) && num > 0 ? num : null;
      })
      .filter(function (n) {
        return n != null;
      })
      .sort(function (a, b) {
        return a - b;
      });

    return Array.from(new Set(points));
  }

  function getNextBucket(actualValue, breakpoints) {
    for (let i = 0; i < breakpoints.length; i++) {
      if (actualValue <= breakpoints[i]) {
        return breakpoints[i];
      }
    }
    return breakpoints.length ? breakpoints[breakpoints.length - 1] : 0;
  }

  function normalizeBucketNumber(n) {
    return Number.isInteger(n) ? String(parseInt(n, 10)) : String(n);
  }

  function findPriceSelect() {
    const selects = Array.from(document.querySelectorAll("select"));

    for (let i = 0; i < selects.length; i++) {
      const sel = selects[i];
      const className = (sel.className || "").toLowerCase();

      if (className.indexOf("doogma-price_") >= 0) {
        return sel;
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

  function setSelectByCombo(select, comboText) {
    if (!select) return false;

    const target = String(comboText).trim().toLowerCase();
    let matchedIndex = -1;
    let matchedOption = null;

    for (let i = 0; i < select.options.length; i++) {
      const opt = select.options[i];

      const doogmaValue = (opt.getAttribute("data-doogma-value") || "").trim().toLowerCase();
      const textToken = ((opt.textContent || "").trim().split(/\s+/)[0] || "").trim().toLowerCase();

      if (doogmaValue === target || textToken === target) {
        matchedIndex = i;
        matchedOption = opt;
        break;
      }
    }

    if (matchedIndex < 0 || !matchedOption) {
      console.warn("No PRICE match found for combo:", comboText);
      return false;
    }

    if (select.selectedIndex === matchedIndex) {
      return true;
    }

    select.selectedIndex = matchedIndex;
    select.value = matchedOption.value;

    Array.from(select.options).forEach(function (opt, idx) {
      opt.selected = idx === matchedIndex;
      if (idx === matchedIndex) {
        opt.setAttribute("selected", "selected");
      } else {
        opt.removeAttribute("selected");
      }
    });

    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));

    return true;
  }

  function updatePriceBucket() {
    const s = getSelects();

    if (!s.width || !s.widthInc || !s.length || !s.lengthInc || !s.price) {
      console.warn("Missing select(s)", {
        width: !!s.width,
        widthInc: !!s.widthInc,
        length: !!s.length,
        lengthInc: !!s.lengthInc,
        price: !!s.price
      });
      return;
    }

    const width = parseDimension(getSelectedOptionText(s.width));
    const widthInc = parseDimension(getSelectedOptionText(s.widthInc));
    const length = parseDimension(getSelectedOptionText(s.length));
    const lengthInc = parseDimension(getSelectedOptionText(s.lengthInc));

    const actualWidth = width + widthInc;
    const actualLength = length + lengthInc;

    const widthBreakpoints = getBreakpointsFromPriceSelect(s.price, 0);
    const lengthBreakpoints = getBreakpointsFromPriceSelect(s.price, 1);

    const widthBucket = getNextBucket(actualWidth, widthBreakpoints);
    const lengthBucket = getNextBucket(actualLength, lengthBreakpoints);

    const targetCombo =
      normalizeBucketNumber(widthBucket) + "x" + normalizeBucketNumber(lengthBucket);

    const matched = setSelectByCombo(s.price, targetCombo);

    console.log("Price bucket update", {
      width: width,
      widthInc: widthInc,
      actualWidth: actualWidth,
      length: length,
      lengthInc: lengthInc,
      actualLength: actualLength,
      widthBucket: widthBucket,
      lengthBucket: lengthBucket,
      targetCombo: targetCombo,
      matched: matched,
      currentPriceText: getSelectedOptionText(s.price)
    });
  }

  function bindEvents() {
    document.addEventListener("change", function (e) {
      const t = e.target;
      if (!t || t.tagName !== "SELECT") return;

      if (
        t.classList.contains("doogma-width") ||
        t.classList.contains("doogma-widthinc") ||
        t.classList.contains("doogma-length") ||
        t.classList.contains("doogma-lengthinc")
      ) {
        setTimeout(updatePriceBucket, 50);
      }
    });
  }

  function init() {
    bindEvents();
    setTimeout(updatePriceBucket, 500);
    setTimeout(updatePriceBucket, 1000);
    setTimeout(updatePriceBucket, 1500);
  }

  ready(init);
})();
