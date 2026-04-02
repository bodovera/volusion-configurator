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

    if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str);

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

  function getSelectedText(select) {
    if (!select) return "";
    const opt = select.options[select.selectedIndex];
    return opt ? (opt.textContent || "").trim() : "";
  }

  function getBreakpoints(select) {
    if (!select) return [];

    return Array.from(select.options)
      .map(function (opt) {
        return parseDimension((opt.textContent || "").trim());
      })
      .filter(function (n) {
        return !isNaN(n) && n > 0;
      })
      .filter(function (n, i, arr) {
        return arr.indexOf(n) === i;
      })
      .sort(function (a, b) {
        return a - b;
      });
  }

  function getBucket(value, breaks) {
    for (let i = 0; i < breaks.length; i++) {
      if (value <= breaks[i]) return breaks[i];
    }
    return breaks.length ? breaks[breaks.length - 1] : 0;
  }

  function setSelectByVisibleText(select, targetText) {
    if (!select) return false;

    const target = String(targetText).trim();

    for (let i = 0; i < select.options.length; i++) {
      const opt = select.options[i];
      const txt = (opt.textContent || "").trim();

      if (txt === target) {
        select.selectedIndex = i;
        select.value = opt.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    }

    return false;
  }

  function updateBuckets() {
    const widthSelect = document.querySelector("select.doogma-width");
    const widthIncSelect = document.querySelector("select.doogma-widthinc");
    const lengthSelect = document.querySelector("select.doogma-length");
    const lengthIncSelect = document.querySelector("select.doogma-lengthinc");

    const valuesWidthSelect = document.querySelector("select.doogma-values_width");
    const valuesLengthSelect = document.querySelector("select.doogma-values_length");

    if (!widthSelect || !widthIncSelect || !lengthSelect || !lengthIncSelect || !valuesWidthSelect || !valuesLengthSelect) {
      return;
    }

    const width = parseDimension(getSelectedText(widthSelect));
    const widthInc = parseDimension(getSelectedText(widthIncSelect));
    const length = parseDimension(getSelectedText(lengthSelect));
    const lengthInc = parseDimension(getSelectedText(lengthIncSelect));

    const actualWidth = width + widthInc;
    const actualLength = length + lengthInc;

    const widthBucket = getBucket(actualWidth, getBreakpoints(valuesWidthSelect));
    const lengthBucket = getBucket(actualLength, getBreakpoints(valuesLengthSelect));

    setSelectByVisibleText(valuesWidthSelect, String(widthBucket));
    setSelectByVisibleText(valuesLengthSelect, String(lengthBucket));
  }

  function bind() {
    const watched = [
      document.querySelector("select.doogma-width"),
      document.querySelector("select.doogma-widthinc"),
      document.querySelector("select.doogma-length"),
      document.querySelector("select.doogma-lengthinc")
    ].filter(Boolean);

    watched.forEach(function (select) {
      select.addEventListener("change", function () {
        setTimeout(updateBuckets, 25);
      });
    });
  }

  ready(function () {
    setTimeout(function () {
      bind();
    }, 500);
  });
})();
