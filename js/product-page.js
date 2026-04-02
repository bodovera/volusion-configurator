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
      const fracParts = parts[1].split("/");
      const num = parseFloat(fracParts[0]) || 0;
      const den = parseFloat(fracParts[1]) || 1;
      return whole + (den ? num / den : 0);
    }

    if (/^\d+\/\d+$/.test(str)) {
      const fracParts = str.split("/");
      const num = parseFloat(fracParts[0]) || 0;
      const den = parseFloat(fracParts[1]) || 1;
      return den ? num / den : 0;
    }

    return 0;
  }

  function getSelectedOptionText(select) {
    if (!select || select.selectedIndex < 0) return "";
    const opt = select.options[select.selectedIndex];
    return opt ? (opt.textContent || "").trim() : "";
  }

  function getBreakpoints(select) {
    if (!select) return [];

    const points = Array.from(select.options)
      .map(function (opt) {
        return parseDimension((opt.textContent || "").trim());
      })
      .filter(function (n) {
        return !isNaN(n) && n > 0;
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

  function getSelects() {
    return {
      width: document.querySelector("select.doogma-width"),
      widthInc: document.querySelector("select.doogma-widthinc"),
      length: document.querySelector("select.doogma-length"),
      lengthInc: document.querySelector("select.doogma-lengthinc"),
      valuesWidth: document.querySelector("select.doogma-values_width"),
      valuesLength: document.querySelector("select.doogma-values_length")
    };
  }

  function setSelectToBucket(select, bucketNumber) {
    if (!select) return false;

    const bucketText = String(bucketNumber).trim();
    let matchedOption = null;
    let matchedIndex = -1;

    for (let i = 0; i < select.options.length; i++) {
      const opt = select.options[i];
      const optText = (opt.textContent || "").trim();
      if (optText === bucketText) {
        matchedOption = opt;
        matchedIndex = i;
        break;
      }
    }

    if (!matchedOption || matchedIndex < 0) {
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

  function updateValueBuckets() {
    const s = getSelects();

    if (!s.width || !s.widthInc || !s.length || !s.lengthInc || !s.valuesWidth || !s.valuesLength) {
      return;
    }

    const width = parseDimension(getSelectedOptionText(s.width));
    const widthInc = parseDimension(getSelectedOptionText(s.widthInc));
    const length = parseDimension(getSelectedOptionText(s.length));
    const lengthInc = parseDimension(getSelectedOptionText(s.lengthInc));

    const actualWidth = width + widthInc;
    const actualLength = length + lengthInc;

    const widthBreakpoints = getBreakpoints(s.valuesWidth);
    const lengthBreakpoints = getBreakpoints(s.valuesLength);

    const widthBucket = getNextBucket(actualWidth, widthBreakpoints);
    const lengthBucket = getNextBucket(actualLength, lengthBreakpoints);

    setSelectToBucket(s.valuesWidth, widthBucket);
    setSelectToBucket(s.valuesLength, lengthBucket);

    console.log("Bucket update", {
      width: width,
      widthInc: widthInc,
      actualWidth: actualWidth,
      widthBucket: widthBucket,
      length: length,
      lengthInc: lengthInc,
      actualLength: actualLength,
      lengthBucket: lengthBucket,
      valuesWidthNow: getSelectedOptionText(s.valuesWidth),
      valuesLengthNow: getSelectedOptionText(s.valuesLength)
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
        setTimeout(updateValueBuckets, 50);
      }
    });
  }

  function init() {
    bindEvents();

    setTimeout(updateValueBuckets, 500);
    setTimeout(updateValueBuckets, 1000);
    setTimeout(updateValueBuckets, 1500);
  }

  ready(init);
})();
