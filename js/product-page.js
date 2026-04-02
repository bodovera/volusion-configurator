(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function normalizeLabel(str) {
    return (str || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function parseFraction(value) {
    if (value == null) return 0;

    let str = String(value).trim();
    if (!str) return 0;

    str = str.replace(/"/g, "").trim();

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
    if (!select) return "";
    const option = select.options[select.selectedIndex];
    if (!option) return "";
    return (
      option.getAttribute("data-doogma-value") ||
      option.textContent ||
      option.value ||
      ""
    ).trim();
  }

  function getSelectBreakpoints(select) {
    if (!select) return [];

    const values = [];

    Array.from(select.options).forEach(function (option) {
      const raw = (
        option.getAttribute("data-doogma-value") ||
        option.textContent ||
        option.value ||
        ""
      ).trim();

      const num = parseFraction(raw);

      if (!isNaN(num) && num > 0) {
        values.push(num);
      }
    });

    return Array.from(new Set(values)).sort(function (a, b) {
      return a - b;
    });
  }

  function getBucket(value, breaks) {
    if (!breaks || !breaks.length) return 0;

    for (let i = 0; i < breaks.length; i++) {
      if (value <= breaks[i]) return breaks[i];
    }

    return breaks[breaks.length - 1];
  }

  function findOptionGroups() {
    const groups = [];
    const headings = document.querySelectorAll(
      "strong[role='heading'], .doogma h1, .doogma h2, .doogma h3, .doogma h4, .doogma h5, .doogma h6"
    );

    headings.forEach(function (heading) {
      const label = normalizeLabel(heading.textContent);
      if (!label) return;

      let container = heading.closest("div");
      if (!container) return;

      let selects = container.querySelectorAll("select");
      if (!selects.length && container.parentElement) {
        selects = container.parentElement.querySelectorAll("select");
        if (selects.length) container = container.parentElement;
      }

      if (selects.length) {
        groups.push({
          label: label,
          heading: heading,
          container: container,
          selects: Array.from(selects)
        });
      }
    });

    return groups;
  }

  function getGroupByLabel(groups, labelName) {
    const target = normalizeLabel(labelName);
    return groups.find(function (g) {
      return g.label === target;
    }) || null;
  }

  function setSelectToBucket(select, bucket) {
    if (!select) return false;
    const bucketStr = String(bucket);

    for (let i = 0; i < select.options.length; i++) {
      const option = select.options[i];
      const dataVal = (option.getAttribute("data-doogma-value") || "").trim();
      const textVal = (option.textContent || "").trim();
      const rawVal = (option.value || "").trim();

      if (
        dataVal === bucketStr ||
        textVal === bucketStr ||
        rawVal === bucketStr ||
        parseFraction(dataVal) === bucket ||
        parseFraction(textVal) === bucket ||
        parseFraction(rawVal) === bucket
      ) {
        select.selectedIndex = i;
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    }

    return false;
  }

  function updateBuckets() {
    const groups = findOptionGroups();

    const widthGroup = getGroupByLabel(groups, "width");
    const lengthGroup = getGroupByLabel(groups, "length");
    const valuesGroup = getGroupByLabel(groups, "values");

    if (!widthGroup || !lengthGroup || !valuesGroup) {
      console.log("Bucket script: missing one or more groups", {
        widthGroup: !!widthGroup,
        lengthGroup: !!lengthGroup,
        valuesGroup: !!valuesGroup
      });
      return;
    }

    const widthSelect = widthGroup.selects[0] || null;
    const widthIncSelect = widthGroup.selects[1] || null;

    const lengthSelect = lengthGroup.selects[0] || null;
    const lengthIncSelect = lengthGroup.selects[1] || null;

    const valuesWidthSelect = valuesGroup.selects[0] || null;
    const valuesLengthSelect = valuesGroup.selects[1] || null;

    const widthBreaks = getSelectBreakpoints(valuesWidthSelect);
    const lengthBreaks = getSelectBreakpoints(valuesLengthSelect);

    const width = parseFraction(getSelectedOptionText(widthSelect));
    const widthInc = parseFraction(getSelectedOptionText(widthIncSelect));
    const length = parseFraction(getSelectedOptionText(lengthSelect));
    const lengthInc = parseFraction(getSelectedOptionText(lengthIncSelect));

    const actualWidth = width + widthInc;
    const actualLength = length + lengthInc;

    const widthBucket = getBucket(actualWidth, widthBreaks);
    const lengthBucket = getBucket(actualLength, lengthBreaks);

    console.log("Bucket script:", {
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

    const widthSet = setSelectToBucket(valuesWidthSelect, widthBucket);
    const lengthSet = setSelectToBucket(valuesLengthSelect, lengthBucket);

    console.log("Bucket set results:", {
      widthSet,
      lengthSet,
      valuesWidthSelected: getSelectedOptionText(valuesWidthSelect),
      valuesLengthSelected: getSelectedOptionText(valuesLengthSelect)
    });
  }

  function bindEvents() {
    const groups = findOptionGroups();
    const widthGroup = getGroupByLabel(groups, "width");
    const lengthGroup = getGroupByLabel(groups, "length");

    const watched = [];

    if (widthGroup) watched.push.apply(watched, widthGroup.selects);
    if (lengthGroup) watched.push.apply(watched, lengthGroup.selects);

    watched.forEach(function (select) {
      select.addEventListener("change", function () {
        setTimeout(updateBuckets, 0);
      });
    });

    const form = document.querySelector("form");
    if (form) {
      form.addEventListener("submit", function () {
        updateBuckets();
      });
    }
  }

  ready(function () {
    setTimeout(function () {
      updateBuckets();
      bindEvents();
    }, 300);
  });
})();
