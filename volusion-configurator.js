(function () {
  "use strict";

  const DEBUG = true;
  const RULES_URL = "https://bodovera.github.io/volusion-configurator/volusion-option-rules.json?v=2";

  let OPTION_RULES = {};
  let isRefreshing = false;

  function log() {
    if (DEBUG) console.log("[Configurator]", ...arguments);
  }

  function hide(el) {
    if (!el) return;
    el.style.display = "none";
    el.setAttribute("aria-hidden", "true");
  }

  function normalizeText(str) {
    return String(str || "")
      .replace(/\s+/g, " ")
      .replace(/["']/g, "")
      .trim()
      .toLowerCase();
  }

  function getSelectedOptionIds() {
    const ids = [];

    document.querySelectorAll('select[name^="SELECT_"]').forEach(function (sel) {
      const v = parseInt(sel.value, 10);
      if (!isNaN(v)) ids.push(v);
    });

    document.querySelectorAll('input[type="radio"][name^="SELECT_"]:checked').forEach(function (input) {
      const v = parseInt(input.value, 10);
      if (!isNaN(v)) ids.push(v);
    });

    document.querySelectorAll('input[type="checkbox"][name^="SELECT_"]:checked').forEach(function (input) {
      const v = parseInt(input.value, 10);
      if (!isNaN(v)) ids.push(v);
    });

    return ids;
  }

  function optionAllowed(optionId, selectedIds) {
    const rule = OPTION_RULES[String(optionId)];
    if (!rule) return true;

    if (Array.isArray(rule.only) && rule.only.length) {
      const ok = rule.only.some(function (parentId) {
        return selectedIds.includes(parentId);
      });
      if (!ok) return false;
    }

    if (Array.isArray(rule.not) && rule.not.length) {
      const blocked = rule.not.some(function (blockedId) {
        return selectedIds.includes(blockedId);
      });
      if (blocked) return false;
    }

    return true;
  }

  function getFieldWrapper(el) {
    return (
      el.closest(".w-100.flex.pt2.items-center") ||
      el.closest(".flex.items-center") ||
      el.closest(".w-100") ||
      el.closest("label") ||
      el.parentElement
    );
  }

  function refreshSelect(sel, selectedIds) {
    let visibleCount = 0;
    let selectedStillValid = false;

    Array.from(sel.options).forEach(function (opt, index) {
      const optionId = parseInt(opt.value, 10);

      if (isNaN(optionId)) {
        opt.hidden = false;
        if (index === sel.selectedIndex) selectedStillValid = true;
        return;
      }

      const show = optionAllowed(optionId, selectedIds);
      opt.hidden = !show;

      if (show) visibleCount++;
      if (show && opt.selected) selectedStillValid = true;
    });

    if (!selectedStillValid) {
      sel.selectedIndex = 0;
    }

    const wrapper = getFieldWrapper(sel);
    if (wrapper) {
      wrapper.style.display = visibleCount > 0 ? "" : "none";
    }
  }

  function refreshRadioGroup(radios, selectedIds) {
    let visibleCount = 0;

    radios.forEach(function (radio) {
      const optionId = parseInt(radio.value, 10);
      const show = !isNaN(optionId) ? optionAllowed(optionId, selectedIds) : true;

      const wrapper = getFieldWrapper(radio);
      if (wrapper) wrapper.style.display = show ? "" : "none";

      if (!show && radio.checked) {
        radio.checked = false;
      }

      if (show) visibleCount++;
    });

    const groupWrapper = getFieldWrapper(radios[0]);
    if (groupWrapper) {
      groupWrapper.style.display = visibleCount > 0 ? "" : "none";
    }
  }

  function refreshCheckboxGroup(checkboxes, selectedIds) {
    let visibleCount = 0;

    checkboxes.forEach(function (checkbox) {
      const optionId = parseInt(checkbox.value, 10);
      const show = !isNaN(optionId) ? optionAllowed(optionId, selectedIds) : true;

      const wrapper = getFieldWrapper(checkbox);
      if (wrapper) wrapper.style.display = show ? "" : "none";

      if (!show && checkbox.checked) {
        checkbox.checked = false;
      }

      if (show) visibleCount++;
    });

    const groupWrapper = getFieldWrapper(checkboxes[0]);
    if (groupWrapper) {
      groupWrapper.style.display = visibleCount > 0 ? "" : "none";
    }
  }

  function hideProductCode() {
    document.querySelectorAll("[data-product-code]").forEach(function (el) {
      hide(el);
      log("Hid product code container", el);
    });

    document.querySelectorAll(".ProductCode, #ProductCode").forEach(function (el) {
      hide(el);
      log("Hid ProductCode element", el);
    });

    document.querySelectorAll("strong, div, p, span, label").forEach(function (el) {
      const txt = (el.textContent || "").replace(/\s+/g, " ").trim().toUpperCase();

      if (
        txt === "PRODUCTCODE:" ||
        txt === "PRODUCTCODE" ||
        txt === "PRODUCT CODE:" ||
        txt === "PRODUCT CODE"
      ) {
        const wrap = el.closest(".flex.flex-wrap") || el.parentElement || el;
        hide(wrap);
        log("Hid ProductCode text wrapper", wrap);
      }
    });
  }

  function cleanPriceLabel() {
    document.querySelectorAll(".ProductPrice_Name, #ProductPrice_Name").forEach(function (el) {
      const txt = (el.textContent || "").trim();
      if (!txt) return;

      if (
        txt.includes("starting at") ||
        txt.includes("ProductPrice_Name") ||
        /\d+\s*x\s*\d+/i.test(txt)
      ) {
        el.textContent = "Product Price";
        log("Cleaned ProductPrice_Name", el);
      }
    });
  }

  function runCleanup() {
    hideProductCode();
    cleanPriceLabel();
  }

  function injectVisualSwatchStyles() {
    if (document.getElementById("bod-visual-swatch-styles")) return;

    const css = `
      .bod-option-hidden-row {
        display: none !important;
      }

      .bod-swatch-grid {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 12px !important;
        margin-top: 10px !important;
        width: 100% !important;
      }

      .bod-swatch-box {
        display: inline-flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: flex-start !important;
        width: 170px !important;
        min-height: 190px !important;
        padding: 12px !important;
        border: 2px solid #cfcfcf !important;
        border-radius: 10px !important;
        background: #fff !important;
        cursor: pointer !important;
        box-sizing: border-box !important;
        text-align: center !important;
        transition: all 0.15s ease !important;
      }

      .bod-swatch-box:hover {
        border-color: #666 !important;
      }

      .bod-swatch-box.bod-selected {
        border-color: #222 !important;
        box-shadow: 0 0 0 2px rgba(0,0,0,0.12) !important;
      }

      .bod-swatch-box img {
        width: 120px !important;
        height: 120px !important;
        max-width: 120px !important;
        max-height: 120px !important;
        object-fit: contain !important;
        display: block !important;
        margin: 0 0 10px 0 !important;
        border: 0 !important;
      }

      .bod-swatch-box-label {
        display: block !important;
        font-size: 13px !important;
        line-height: 1.2 !important;
        color: #111 !important;
        white-space: normal !important;
        text-align: center !important;
      }
    `;

    const style = document.createElement("style");
    style.id = "bod-visual-swatch-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function getOptionInputLabelText(input) {
    if (!input) return "";

    if (input.id) {
      const label = document.querySelector('label[for="' + input.id + '"]');
      if (label) return label.textContent || "";
    }

    const wrap = getFieldWrapper(input);
    if (wrap) {
      const label = wrap.querySelector("label");
      if (label) return label.textContent || "";
    }

    return "";
  }

  function findHeadingForOptionRow(row) {
    if (!row) return null;

    let node = row.previousElementSibling;
    while (node) {
      if (
        node.matches &&
        (
          node.matches('strong[role="heading"]') ||
          node.matches("strong") ||
          node.matches("h1,h2,h3,h4,h5,h6")
        )
      ) {
        return node;
      }
      node = node.previousElementSibling;
    }

    return null;
  }

  function collectInputsForHeading(heading) {
    const results = [];
    if (!heading || !heading.parentElement) return results;

    const kids = Array.from(heading.parentElement.children);
    const start = kids.indexOf(heading);
    if (start < 0) return results;

    for (let i = start + 1; i < kids.length; i++) {
      const el = kids[i];

      if (
        el.matches &&
        (
          el.matches('strong[role="heading"]') ||
          el.matches("strong") ||
          el.matches("h1,h2,h3,h4,h5,h6")
        )
      ) {
        break;
      }

      el.querySelectorAll('input[type="radio"][name^="SELECT_"], input[type="checkbox"][name^="SELECT_"]').forEach(function (input) {
        results.push(input);
      });
    }

    return results;
  }

  function getSwatchAreaForHeading(heading) {
    if (!heading || !heading.parentElement) return null;

    const kids = Array.from(heading.parentElement.children);
    const start = kids.indexOf(heading);
    if (start < 0) return null;

    for (let i = start + 1; i < kids.length; i++) {
      const el = kids[i];

      if (
        el.matches &&
        (
          el.matches('strong[role="heading"]') ||
          el.matches("strong") ||
          el.matches("h1,h2,h3,h4,h5,h6")
        )
      ) {
        break;
      }

      if (el.querySelector && el.querySelector("[data-doogma-value].swatchWrapper")) {
        return el;
      }
    }

    return null;
  }

  function buildSwatchInputMap(inputs) {
    const map = {};
    inputs.forEach(function (input) {
      const txt = normalizeText(getOptionInputLabelText(input));
      if (txt) map[txt] = input;
    });
    return map;
  }

  function syncSelectedVisualState(container) {
    if (!container) return;

    container.querySelectorAll(".bod-swatch-box").forEach(function (box) {
      const inputId = box.getAttribute("data-input-id");
      const input = inputId ? document.getElementById(inputId) : null;

      if (input && input.checked) {
        box.classList.add("bod-selected");
      } else {
        box.classList.remove("bod-selected");
      }
    });
  }

  function createVisualBoxesForHeading(heading) {
    const swatchArea = getSwatchAreaForHeading(heading);
    if (!swatchArea) return;

    const inputs = collectInputsForHeading(heading);
    if (!inputs.length) return;

    const inputMap = buildSwatchInputMap(inputs);
    const swatches = Array.from(swatchArea.querySelectorAll("[data-doogma-value].swatchWrapper"));
    if (!swatches.length) return;

    let grid = swatchArea.querySelector(".bod-swatch-grid");
    if (!grid) {
      grid = document.createElement("div");
      grid.className = "bod-swatch-grid";
      swatchArea.appendChild(grid);
    } else {
      grid.innerHTML = "";
    }

    swatches.forEach(function (sw) {
      const imgEl = sw.querySelector("img");
      const rawValue =
        sw.getAttribute("data-doogma-value") ||
        (imgEl && (imgEl.getAttribute("alt") || imgEl.getAttribute("title"))) ||
        "";

      const key = normalizeText(rawValue);
      const input = inputMap[key];

      if (!input) {
        log("No matching input found for swatch", rawValue);
        return;
      }

      const imgSrc = imgEl ? imgEl.getAttribute("src") : "";
      const labelText = (getOptionInputLabelText(input).trim() || rawValue).replace(/\s+/g, " ").trim();

      const box = document.createElement("button");
      box.type = "button";
      box.className = "bod-swatch-box";
      if (input.id) box.setAttribute("data-input-id", input.id);

      if (imgSrc) {
        const boxImg = document.createElement("img");
        boxImg.src = imgSrc;
        boxImg.alt = labelText;
        box.appendChild(boxImg);
      }

      const label = document.createElement("span");
      label.className = "bod-swatch-box-label";
      label.textContent = labelText;
      box.appendChild(label);

      box.addEventListener("click", function () {
        if (input.type === "radio") {
          input.checked = true;
        } else if (input.type === "checkbox") {
          input.checked = !input.checked;
        }

        input.dispatchEvent(new Event("change", { bubbles: true }));
        syncSelectedVisualState(grid);
      });

      grid.appendChild(box);
    });

    const rowWrap = getFieldWrapper(inputs[0]);
    if (rowWrap) {
      rowWrap.classList.add("bod-option-hidden-row");
    }

    syncSelectedVisualState(grid);
  }

  function enhanceVisualSwatches() {
    injectVisualSwatchStyles();

    const seen = new Set();

    document.querySelectorAll('input[type="radio"][name^="SELECT_"], input[type="checkbox"][name^="SELECT_"]').forEach(function (input) {
      const row = getFieldWrapper(input);
      const heading = findHeadingForOptionRow(row);
      if (!heading) return;

      const key = heading.textContent.trim();
      if (seen.has(key)) return;
      seen.add(key);

      createVisualBoxesForHeading(heading);
    });
  }

  function refreshAll() {
    if (isRefreshing) return;
    isRefreshing = true;

    try {
      const selectedIds = getSelectedOptionIds();

      document.querySelectorAll('select[name^="SELECT_"]').forEach(function (sel) {
        refreshSelect(sel, selectedIds);
      });

      const radioGroups = {};
      document.querySelectorAll('input[type="radio"][name^="SELECT_"]').forEach(function (radio) {
        if (!radioGroups[radio.name]) radioGroups[radio.name] = [];
        radioGroups[radio.name].push(radio);
      });

      Object.keys(radioGroups).forEach(function (name) {
        refreshRadioGroup(radioGroups[name], selectedIds);
      });

      const checkboxGroups = {};
      document.querySelectorAll('input[type="checkbox"][name^="SELECT_"]').forEach(function (checkbox) {
        if (!checkboxGroups[checkbox.name]) checkboxGroups[checkbox.name] = [];
        checkboxGroups[checkbox.name].push(checkbox);
      });

      Object.keys(checkboxGroups).forEach(function (name) {
        refreshCheckboxGroup(checkboxGroups[name], selectedIds);
      });

      runCleanup();
      enhanceVisualSwatches();
    } finally {
      isRefreshing = false;
    }
  }

  function bindEvents() {
    document.addEventListener("change", function (e) {
      if (
        e.target.matches('select[name^="SELECT_"]') ||
        e.target.matches('input[type="radio"][name^="SELECT_"]') ||
        e.target.matches('input[type="checkbox"][name^="SELECT_"]')
      ) {
        refreshAll();
      }
    });
  }

  async function init() {
    try {
      const res = await fetch(RULES_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load rules JSON: " + res.status);

      OPTION_RULES = await res.json();
      bindEvents();

      refreshAll();
      setTimeout(refreshAll, 50);
      setTimeout(refreshAll, 250);
      setTimeout(refreshAll, 750);
      setTimeout(refreshAll, 1500);

      log("Volusion rules loaded", OPTION_RULES);
    } catch (err) {
      console.error("Volusion rules failed to load:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("load", function () {
    setTimeout(refreshAll, 100);
    setTimeout(refreshAll, 500);
    setTimeout(refreshAll, 1200);
  });

  const observer = new MutationObserver(function () {
    runCleanup();
    enhanceVisualSwatches();
  });

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }
})();
