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

    let str = String(value).trim().replace(/"/g, "");
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

    const vals = Array.from(select.options)
      .map(function (opt) {
        return parseDimension((opt.textContent || "").trim());
      })
      .filter(function (n) {
        return !isNaN(n) && n > 0;
      })
      .sort(function (a, b) {
        return a - b;
      });

    return Array.from(new Set(vals));
  }

  function getBucket(value, breaks) {
    for (let i = 0; i < breaks.length; i++) {
      if (value <= breaks[i]) return breaks[i];
    }
    return breaks.length ? breaks[breaks.length - 1] : 0;
  }

  function trigger(select) {
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setSelectByBucket(select, bucket) {
    if (!select) return false;

    for (let i = 0; i < select.options.length; i++) {
      const opt = select.options[i];
      const txt = (opt.textContent || "").trim();
      const num = parseDimension(txt);

      if (num === bucket || txt === String(bucket)) {
        if (select.selectedIndex !== i) {
          select.selectedIndex = i;
          select.value = opt.value;
          trigger(select);
        }
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

    console.log("bucket selects found", {
      width: !!widthSelect,
      widthInc: !!widthIncSelect,
      length: !!lengthSelect,
      lengthInc: !!lengthIncSelect,
      valuesWidth: !!valuesWidthSelect,
      valuesLength: !!valuesLengthSelect
    });

    if (!widthSelect || !widthIncSelect || !lengthSelect || !lengthIncSelect || !valuesWidthSelect || !valuesLengthSelect) {
      return;
    }

    const width = parseDimension(getSelectedText(widthSelect));
    const widthInc = parseDimension(getSelectedText(widthIncSelect));
    const length = parseDimension(getSelectedText(lengthSelect));
    const lengthInc = parseDimension(getSelectedText(lengthIncSelect));

    const actualWidth = width + widthInc;
    const actualLength = length + lengthInc;

    const widthBreaks = getBreakpoints(valuesWidthSelect);
    const lengthBreaks = getBreakpoints(valuesLengthSelect);

    const widthBucket = getBucket(actualWidth, widthBreaks);
    const lengthBucket = getBucket(actualLength, lengthBreaks);

    const widthSet = setSelectByBucket(valuesWidthSelect, widthBucket);
    const lengthSet = setSelectByBucket(valuesLengthSelect, lengthBucket);

    console.log("bucket results", {
      width,
      widthInc,
      actualWidth,
      widthBreaks,
      widthBucket,
      widthSet,
      valuesWidthNow: getSelectedText(valuesWidthSelect),
      length,
      lengthInc,
      actualLength,
      lengthBreaks,
      lengthBucket,
      lengthSet,
      valuesLengthNow: getSelectedText(valuesLengthSelect)
    });
  }

  function bind() {
    [
      document.querySelector("select.doogma-width"),
      document.querySelector("select.doogma-widthinc"),
      document.querySelector("select.doogma-length"),
      document.querySelector("select.doogma-lengthinc")
    ]
      .filter(Boolean)
      .forEach(function (select) {
        select.addEventListener("change", function () {
          setTimeout(updateBuckets, 50);
        });
      });
  }

  ready(function () {
    setTimeout(function () {
      bind();
      updateBuckets();
    }, 500);
  });
})();
