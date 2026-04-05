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
    });

    document.querySelectorAll(".ProductCode, #ProductCode").forEach(function (el) {
      hide(el);
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
      }
    });
  }

  function runCleanup() {
    hideProductCode();
    cleanPriceLabel();
  }

  function injectVisualSwatchStyles() {
    if (document.getElementById("bod-safe-swatch-styles")) return;

    const css = `
      [data-doogma-value].swatchWrapper {
        display: inline-flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: flex-start !important;
        width: 160px !important;
        min-height: 190px !important;
        padding: 12px !important;
        margin: 6px !important;
        border: 2px solid #cfcfcf !important;
        border-radius: 10px !important;
        background: #fff !important;
        cursor: pointer !important;
        box-sizing: border-box !important;
        text-align: center !important;
        vertical-align: top !important;
      }

      [data-doogma-value].swatchWrapper:hover {
        border-color: #666 !important;
      }

      [data-doogma-value].swatchWrapper.bod-selected {
        border-color: #222 !important;
        box-shadow: 0 0 0 2px rgba(0,0,0,0.12) !important;
      }

      [data-doogma-value].swatchWrapper img {
        width: 120px !important;
        height: 120px !important;
        max-width: 120px !important;
        max-height: 120px !important;
        object-fit: contain !important;
        display: block !important;
        margin: 0 0 10px 0 !important;
        border: 0 !important;
      }

      .bod-swatch-label {
        display: block !important;
        font-size: 13px !important;
        line-height: 1.2 !important;
        color: #111 !important;
        white-space: normal !important;
        text-align: center !important;
        margin-top: 6px !important;
      }
    `;

    const style = document.createElement("style");
    style.id = "bod-safe-swatch-styles";
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

  function getAllChoiceInputs() {
    return Array.from(
      document.querySelectorAll('input[type="radio"][name^="SELECT_"], input[type="checkbox"][name^="SELECT_"]')
    );
  }

  function findMatchingInputForSwatch(sw) {
    const rawValue =
      sw.getAttribute("data-doogma-value") ||
      (sw.querySelector("img") && (
        sw.querySelector("img").getAttribute("alt") ||
        sw.querySelector("img").getAttribute("title")
      )) ||
      "";

    const swatchKey = normalizeText(rawValue);
    if (!swatchKey) return null;

    const inputs = getAllChoiceInputs();

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const labelText = normalizeText(getOptionInputLabelText(input));
      if (labelText && labelText === swatchKey) {
        return input;
      }
    }

    return null;
  }

  function syncSwatchSelections() {
    document.querySelectorAll("[data-doogma-value].swatchWrapper").forEach(function (sw) {
      sw.classList.remove("bod-selected");

      const input = findMatchingInputForSwatch(sw);
      if (input && input.checked) {
        sw.classList.add("bod-selected");
      }
    });
  }

  function ensureSwatchLabels() {
    document.querySelectorAll("[data-doogma-value].swatchWrapper").forEach(function (sw) {
      if (sw.querySelector(".bod-swatch-label")) return;

      const input = findMatchingInputForSwatch(sw);
      const rawValue =
        sw.getAttribute("data-doogma-value") ||
        (sw.querySelector("img") && (
          sw.querySelector("img").getAttribute("alt") ||
          sw.querySelector("img").getAttribute("title")
        )) ||
        "";

      const labelText = (input ? getOptionInputLabelText(input) : rawValue || "").trim();
      if (!labelText) return;

      const label = document.createElement("div");
      label.className = "bod-swatch-label";
      label.textContent = labelText;
      sw.appendChild(label);
    });
  }

  function wireSwatchClicks() {
    document.querySelectorAll("[data-doogma-value].swatchWrapper").forEach(function (sw) {
      if (sw.dataset.bodClickBound === "1") return;
      sw.dataset.bodClickBound = "1";

      sw.addEventListener("click", function (e) {
        const tag = (e.target && e.target.tagName ? e.target.tagName : "").toLowerCase();
        if (tag === "input" || tag === "label" || tag === "select" || tag === "option") return;

        const input = findMatchingInputForSwatch(sw);
        if (!input) return;

        if (input.type === "radio") {
          input.checked = true;
        } else if (input.type === "checkbox") {
          input.checked = !input.checked;
        }

        input.dispatchEvent(new Event("change", { bubbles: true }));
        syncSwatchSelections();
      });
    });
  }

  function enhanceVisualSwatches() {
    injectVisualSwatchStyles();
    ensureSwatchLabels();
    wireSwatchClicks();
    syncSwatchSelections();
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

  function startObserver() {
    if (!document.body) return;
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver);
  } else {
    startObserver();
  }
})();
