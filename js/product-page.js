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

  function getSelectedDisplayText(select) {
    if (!select) return "";
    const opt = select.options[select.selectedIndex];
    if (!opt) return "";
    return (opt.textContent || "").trim();
  }

  function getBucketBreakpoints(select) {
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

  function qs(sel) {
    return document.querySelector(sel);
  }

  function triggerSelectChange(select) {
    if (!select) return;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setSelectByBucket(select, bucket) {
    if (!select) return false;

    const bucketNum = parseFloat(bucket);

    for (let i = 0; i < select.options.length; i++) {
      const opt = select.options[i];
      const txt = (opt.textContent || "").trim();
      const txtNum = parseDimension(txt);

      if (txtNum === bucketNum || txt === String(bucket)) {
        if (select.selectedIndex !== i) {
          select.selectedIndex = i;
          select.value = opt.value;
          triggerSelectChange(select);
        }
        return true;
      }
    }

    return false;
  }

  function updateBuckets() {
    const widthSelect = qs('select[class*="doogma-width_dropdown"]');
    const widthIncSelect = qs('select[class*="doogma-widthinc_dropdown"]');
    const lengthSelect = qs('select[class*="doogma-length_dropdown"]');
    const lengthIncSelect = qs('select[class*="doogma-lengthinc_dropdown"]');

    const valuesWidthSelect = qs('select[class*="doogma-values_width_dropdown"]');
    const valuesLengthSelect = qs('select[class*="doogma-values_length_dropdown"]');

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

    const width = parseDimension(getSelectedDisplayText(widthSelect));
    const widthInc = parseDimension(getSelectedDisplayText(widthIncSelect));
    const length = parseDimension(getSelectedDisplayText(lengthSelect));
    const lengthInc = parseDimension(getSelectedDisplayText(lengthIncSelect));

    const actualWidth = width + widthInc;
    const actualLength = length + lengthInc;

    const widthBreaks = getBucketBreakpoints(valuesWidthSelect);
    const lengthBreaks = getBucketBreakpoints(valuesLengthSelect);

    const widthBucket = getBucket(actualWidth, widthBreaks);
    const lengthBucket = getBucket(actualLength, lengthBreaks);

    const widthSet = setSelectByBucket(valuesWidthSelect, widthBucket);
    const lengthSet = setSelectByBucket(valuesLengthSelect, lengthBucket);

    console.log("bucket results", {
      widthText: getSelectedDisplayText(widthSelect),
      widthIncText: getSelectedDisplayText(widthIncSelect),
      width,
      widthInc,
      actualWidth,
      widthBreaks,
      widthBucket,
      widthSet,
      valuesWidthNow: getSelectedDisplayText(valuesWidthSelect),

      lengthText: getSelectedDisplayText(lengthSelect),
      lengthIncText: getSelectedDisplayText(lengthIncSelect),
      length,
      lengthInc,
      actualLength,
      lengthBreaks,
      lengthBucket,
      lengthSet,
      valuesLengthNow: getSelectedDisplayText(valuesLengthSelect)
    });
  }

  function bind() {
    [
      qs('select[class*="doogma-width_dropdown"]'),
      qs('select[class*="doogma-widthinc_dropdown"]'),
      qs('select[class*="doogma-length_dropdown"]'),
      qs('select[class*="doogma-lengthinc_dropdown"]')
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
