(function () {
  "use strict";

  const DEBUG = true;

  function log() {
    if (DEBUG) console.log("[OptionImageBoxes]", ...arguments);
  }

  function getOptionGroups() {
    return Array.from(document.querySelectorAll("strong[role='heading']"))
      .map((heading) => heading.parentElement)
      .filter(Boolean);
  }

  function getInputsForGroup(group) {
    return Array.from(
      group.querySelectorAll("input[type='radio'][data-doogma-value], input[type='checkbox'][data-doogma-value]")
    );
  }

  function getSwatchesForGroup(group) {
    return Array.from(group.querySelectorAll(".swatchWrapper[data-doogma-value]"));
  }

  function getLabelText(input) {
    if (!input || !input.id) return "";
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (!label) return "";

    const text = (label.textContent || "").replace(/\s+/g, " ").trim();
    return text;
  }

  function getNativeRow(input) {
    if (!input) return null;
    return input.closest(".flex.items-center");
  }

  function ensureTextNodeInSwatch(swatch, text) {
    if (!swatch) return;

    let textEl = swatch.querySelector(".option-box-text");

    if (!textEl) {
      textEl = document.createElement("div");
      textEl.className = "option-box-text";
      swatch.appendChild(textEl);
    }

    textEl.textContent = text || "";
  }

  function syncVisualState(group) {
    const swatches = getSwatchesForGroup(group);

    swatches.forEach((swatch) => {
      const value = swatch.getAttribute("data-doogma-value");
      if (!value) return;

      const input = group.querySelector(
        `input[type="radio"][data-doogma-value="${value}"], input[type="checkbox"][data-doogma-value="${value}"]`
      );

      if (!input) return;

      if (input.checked) swatch.classList.add("selected");
      else swatch.classList.remove("selected");
    });
  }

  function bindSwatch(group, swatch, input) {
    if (!swatch || !input) return;

    swatch.style.cursor = "pointer";
    swatch.setAttribute("tabindex", "0");
    swatch.setAttribute("role", "button");

    const nativeRow = getNativeRow(input);
    if (nativeRow) nativeRow.style.display = "none";

    const labelText = getLabelText(input);
    ensureTextNodeInSwatch(swatch, labelText);

    function activate() {
      if (input.type === "radio") {
        const relatedInputs = Array.from(
          group.querySelectorAll(`input[type="radio"][name="${CSS.escape(input.name)}"]`)
        );
        relatedInputs.forEach((related) => {
          related.checked = false;
        });
        input.checked = true;
      } else {
        input.checked = !input.checked;
      }

      input.dispatchEvent(new Event("click", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      syncVisualState(group);
    }

    if (!swatch.dataset.optionBoxBound) {
      swatch.addEventListener("click", function (e) {
        e.preventDefault();
        activate();
      });

      swatch.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      });

      swatch.dataset.optionBoxBound = "1";
    }
  }

  function upgradeGroup(group) {
    const inputs = getInputsForGroup(group);
    const swatches = getSwatchesForGroup(group);

    if (!inputs.length || !swatches.length) return;

    const inputMap = new Map();
    inputs.forEach((input) => {
      const value = input.getAttribute("data-doogma-value");
      if (value) inputMap.set(value, input);
    });

    let matched = 0;

    swatches.forEach((swatch) => {
      const value = swatch.getAttribute("data-doogma-value");
      if (!value) return;

      const input = inputMap.get(value);
      if (!input) return;

      bindSwatch(group, swatch, input);
      matched++;
    });

    if (matched) {
      group.classList.add("option-image-boxes-ready");
      syncVisualState(group);
      log("Upgraded group with", matched, "matches");
    }
  }

  function init() {
    const groups = getOptionGroups();
    groups.forEach(upgradeGroup);
    log("Option image boxes initialized");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("load", init);
})();
