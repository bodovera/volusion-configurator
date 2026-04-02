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

  function setSelectToNumber(select, targetNumber) {
    if (!select) return false;

    console.log("Trying to set select", {
      className: select.className,
      targetNumber: targetNumber,
      currentText: getSelectedText(select)
    });

    for (let i = 0; i < select.options.length; i++) {
      const opt = select.options[i];
      const txt = (opt.textContent || "").trim();
      const num = parseDimension(txt);

      console.log("Checking option", {
        index: i,
        txt: txt,
        num: num,
        optValue: opt.value
      });

      if (num === targetNumber) {
        select.selectedIndex = i;
        select.value = opt.value;

        console.log("Matched and set", {
          index: i,
          txt: txt,
          optValue: opt.value,
          selectedTextNow: getSelectedText(select),
          selectedIndexNow: select.selectedIndex,
          selectValueNow: select.value
        });

        return true;
      }
    }

    console.log("No match found", {
      targetNumber: targetNumber,
      options: Array.from(select.options).map(function (o) {
        return (o.textContent || "").trim();
      })
    });

    return false;
  }

  function updateBucketValues() {
    const widthSelect = document.querySelector("select.doogma-width");
    const widthIncSelect = document.querySelector("select.doogma-widthinc");
    const lengthSelect = document.querySelector("select.doogma-length");
    const lengthIncSelect = document.querySelector("select.doogma-lengthinc");
    const valuesWidthSelect = document.querySelector("select.doogma-values_width");
    const valuesLengthSelect = document.querySelector("select.doogma-values_length");

    console.log("Found selects", {
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

    console.log("Calculated buckets", {
      width,
      widthInc,
      actualWidth,
      widthBreaks,
      widthBucket,
      length,
      lengthInc,
      actualLength,
      lengthBreaks,
      lengthBucket
    });

    const widthSet = setSelectToNumber(valuesWidthSelect, widthBucket);
    const lengthSet = setSelectToNumber(valuesLengthSelect, lengthBucket);

    console.log("Final result", {
      widthSet: widthSet,
      lengthSet: lengthSet,
      valuesWidthNow: getSelectedText(valuesWidthSelect),
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
          console.log("Triggering update from", select.className, getSelectedText(select));
          updateBucketValues();
        });
      });
  }

  ready(function () {
    setTimeout(function () {
      bind();
      console.log("Bucket debug script ready");
    }, 800);
  });
})();
