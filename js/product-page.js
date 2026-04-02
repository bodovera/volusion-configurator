(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function parseFraction(value) {
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
    if (!opt) return "";
    return (
      opt.getAttribute("data-doogma-value") ||
      opt.textContent ||
      opt.value ||
      ""
    ).trim();
  }

  function getBreakpoints(select) {
    if (!select) return [];
    const vals = Array.from(select.options)
      .map(function (opt) {
        return parseFraction(
          (opt.getAttribute("data-doogma-value") ||
            opt.textContent ||
            opt.value ||
            "").trim()
        );
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

  function findSelect(selector) {
    return document.querySelector(selector);
  }

  function setSelectByBucket(select, bucket) {
    if (!select) return false;

    for (let i = 0; i < select.options.length; i++) {
      const opt = select.options[i];
      const raw = (
        opt.getAttribute("data-doogma-value") ||
        opt.textContent ||
        opt.value ||
        ""
      ).trim();

      if (parseFraction(raw) === bucket || raw === String(bucket)) {
        select.selectedIndex = i;
        select.value = opt.value;
        return true;
      }
    }

    return false;
  }

  function updateBuckets() {
    const widthSelect = findSelect('select[class*="doogma-width_dropdown"]');
    const widthIncSelect = findSelect('select[class*="doogma-widthinc_dropdown"]');
    const lengthSelect = findSelect('select[class*="doogma-length_dropdown"]');
    const lengthIncSelect = findSelect('select[class*="doogma-lengthinc_dropdown"]');

    const valuesWidthSelect = findSelect('select[class*="doogma-values_width_dropdown"]');
    const valuesLengthSelect = findSelect('select[class*="doogma-values_length_dropdown"]');

    console.log("Bucket script selects found:", {
      widthSelect: !!widthSelect,
      widthIncSelect: !!widthIncSelect,
      lengthSelect: !!lengthSelect,
      lengthIncSelect: !!lengthIncSelect,
      valuesWidthSelect: !!valuesWidthSelect,
      valuesLengthSelect: !!valuesLengthSelect
    });

    if (!widthSelect || !widthIncSelect || !lengthSelect || !lengthIncSelect || !valuesWidthSelect || !valuesLengthSelect) {
      return;
    }

    const width = parseFraction(getSelectedText(widthSelect));
    const widthInc = parseFraction(getSelectedText(widthIncSelect));
    const length = parseFraction(getSelectedText(lengthSelect));
    const lengthInc = parseFraction(getSelectedText(lengthIncSelect));

    const actualWidth = width + widthInc;
    const actualLength = length + lengthInc;

    const widthBreaks = getBreakpoints(valuesWidthSelect);
    const lengthBreaks = getBreakpoints(valuesLengthSelect);

    const widthBucket = getBucket(actualWidth, widthBreaks);
    const lengthBucket = getBucket(actualLength, lengthBreaks);

    const widthSet = setSelectByBucket(valuesWidthSelect, widthBucket);
    const lengthSet = setSelectByBucket(valuesLengthSelect, lengthBucket);

    console.log("Bucket script result:", {
      width,
      widthInc,
      actualWidth,
      widthBreaks,
      widthBucket,
      widthSet,
      selectedValuesWidth: getSelectedText(valuesWidthSelect),
      length,
      lengthInc,
      actualLength,
      lengthBreaks,
      lengthBucket,
      lengthSet,
      selectedValuesLength: getSelectedText(valuesLengthSelect)
    });
  }

  function bind() {
    const watched = [
      document.querySelector('select[class*="doogma-width_dropdown"]'),
      document.querySelector('select[class*="doogma-widthinc_dropdown"]'),
      document.querySelector('select[class*="doogma-length_dropdown"]'),
      document.querySelector('select[class*="doogma-lengthinc_dropdown"]')
    ].filter(Boolean);

    watched.forEach(function (select) {
      select.addEventListener("change", function () {
        updateBuckets();
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
