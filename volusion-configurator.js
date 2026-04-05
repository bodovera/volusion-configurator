(function () {
  "use strict";

  const DEBUG = true;
  const RULES_URL = "https://bodovera.github.io/volusion-configurator/volusion-option-rules.json?v=1";

  let OPTION_RULES = {};
  let isRefreshing = false;
  let buildTimer = null;
  let observer = null;

  function log() {
    if (DEBUG) console.log("[OptionsUI]", ...arguments);
  }

  function injectStyles() {
    if (document.getElementById("bod-options-ui-styles")) return;

    const css = `
      .bod-option-boxes {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 8px;
        margin-bottom: 8px;
      }

      .bod-option-box {
        width: 96px;
        min-height: 104px;
        border: 2px solid #cfcfcf;
        border-radius: 10px;
        background: #fff;
        padding: 8px 6px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        text-align: center;
        cursor: pointer;
        user-select: none;
      }

      .bod-option-box:hover {
        border-color: #666;
      }

      .bod-option-box.is-selected {
        border-color: #5850ec;
        box-shadow: 0 0 0 2px rgba(88, 80, 236, 0.14);
      }

      .bod-option-box.is-hidden {
        display: none !important;
      }

      .bod-option-box img {
        max-width: 52px;
        max-height: 52px;
        width: auto;
        height: auto;
        display: block;
        margin: 0 0 6px 0;
      }

      .bod-option-box-text {
        font-size: 12px;
        line-height: 1.2;
        color: #1f2937;
        white-space: normal;
        text-align: center;
      }

      .bod-option-hidden {
        display: none !important;
      }
    `;

    const style = document.createElement("style");
    style.id = "bod-options-ui-styles";
    style.textContent = css;
    document.head.appendChild(style);
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
    if (wrapper) wrapper.style.display = visibleCount > 0 ? "" : "none";
  }

  function refreshRadioGroup(radios, selectedIds) {
    let visibleCount = 0;

    radios.forEach(function (radio) {
      const optionId = parseInt(radio.value, 10);
      const show = !isNaN(optionId) ? optionAllowed(optionId, selectedIds) : true;

      radio.dataset.bodAllowed = show ? "1" : "0";

      const row = radio.closest(".flex.items-center");
      if (row) row.style.display = show ? "" : "none";

      if (!show && radio.checked) radio.checked = false;
      if (show) visibleCount++;
    });

    const groupWrap = radios[0] ? radios[0].closest(".flex.flex-wrap") || radios[0].closest(".w-100") : null;
    if (groupWrap && !groupWrap.querySelector(".bod-option-boxes")) {
      groupWrap.style.display = visibleCount > 0 ? "" : "none";
    }
  }

  function refreshCheckboxGroup(checkboxes, selectedIds) {
    let visibleCount = 0;

    checkboxes.forEach(function (checkbox) {
      const optionId = parseInt(checkbox.value, 10);
      const show = !isNaN(optionId) ? optionAllowed(optionId, selectedIds) : true;

      checkbox.dataset.bodAllowed = show ? "1" : "0";

      const row = checkbox.closest(".flex.items-center");
      if (row) row.style.display = show ? "" : "none";

      if (!show && checkbox.checked) checkbox.checked = false;
      if (show) visibleCount++;
    });

    const groupWrap = checkboxes[0] ? checkboxes[0].closest(".flex.flex-wrap") || checkboxes[0].closest(".w-100") : null;
    if (groupWrap && !groupWrap.querySelector(".bod-option-boxes")) {
      groupWrap.style.display = visibleCount > 0 ? "" : "none";
    }
  }

  function applyRulesOnly() {
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
  }

  function getGroups() {
    return Array.from(document.querySelectorAll("strong[role='heading']")).map(function (heading) {
      return {
        heading: heading,
        wrap: heading.parentElement
      };
    }).filter(function (x) {
      return x.wrap;
    });
  }

  function getInputRows(groupWrap) {
    return Array.from(
      groupWrap.querySelectorAll('input[type="radio"][data-doogma-value], input[type="checkbox"][data-doogma-value]')
    ).map(function (input) {
      return {
        input: input,
        row: input.closest(".flex.items-center")
      };
    }).filter(function (x) {
      return x.row;
    });
  }

  function getLabelTextForInput(input) {
    if (!input || !input.id) return "";
    const label = document.querySelector('label[for="' + input.id + '"]');
    if (!label) return "";
    return (label.textContent || "").replace(/\s+/g, " ").trim();
  }

  function getSwatchMap(groupWrap) {
    const map = new Map();

    const swatchNodes = Array.from(groupWrap.querySelectorAll("[data-doogma-value]")).filter(function (el) {
      return !!el.querySelector("img");
    });

    swatchNodes.forEach(function (node) {
      const value = node.getAttribute("data-doogma-value");
      if (!value || map.has(value)) return;

      const img = node.querySelector("img");
      if (!img) return;

      map.set(value, {
        src: img.getAttribute("data-src") || img.getAttribute("src") || "",
        alt: img.getAttribute("alt") || "",
        title: img.getAttribute("title") || ""
      });
    });

    return map;
  }

  function findOriginalSwatchWrap(groupWrap) {
    const candidates = Array.from(groupWrap.children).filter(function (el) {
      return el.tagName === "DIV";
    });

    for (let i = 0; i < candidates.length; i++) {
      if (candidates[i].querySelector("[data-doogma-value] img")) {
        return candidates[i];
      }
    }

    return null;
  }

  function findNativeRowsWrap(groupWrap) {
    const wraps = Array.from(groupWrap.querySelectorAll(":scope > div .w-100"));
    if (wraps.length) return wraps[0];
    return groupWrap.querySelector(".w-100");
  }

  function syncGroupState(groupWrap, boxesWrap) {
    const boxes = Array.from(boxesWrap.querySelectorAll(".bod-option-box"));

    boxes.forEach(function (box) {
      const value = box.getAttribute("data-doogma-value");
      if (!value) return;

      const input = groupWrap.querySelector(
        'input[type="radio"][data-doogma-value="' + value + '"], input[type="checkbox"][data-doogma-value="' + value + '"]'
      );

      if (!input) return;

      const allowed = input.dataset.bodAllowed !== "0";
      if (!allowed) box.classList.add("is-hidden");
      else box.classList.remove("is-hidden");

      if (input.checked && allowed) box.classList.add("is-selected");
      else box.classList.remove("is-selected");
    });

    const anyVisible = boxes.some(function (box) {
      return !box.classList.contains("is-hidden");
    });

    boxesWrap.style.display = anyVisible ? "flex" : "none";
  }

  function createBoxes(group) {
    const groupWrap = group.wrap;
    const inputRows = getInputRows(groupWrap);
    const swatchMap = getSwatchMap(groupWrap);

    if (!inputRows.length || !swatchMap.size) return null;

    const matched = inputRows.filter(function (item) {
      return swatchMap.has(item.input.getAttribute("data-doogma-value"));
    });

    if (!matched.length) return null;

    const boxesWrap = document.createElement("div");
    boxesWrap.className = "bod-option-boxes";

    matched.forEach(function (item) {
      const input = item.input;
      const value = input.getAttribute("data-doogma-value");
      const swatch = swatchMap.get(value);
      const text = getLabelTextForInput(input) || (swatch ? swatch.alt : "") || value;

      const box = document.createElement("div");
      box.className = "bod-option-box";
      box.setAttribute("data-doogma-value", value);
      box.setAttribute("tabindex", "0");
      box.setAttribute("role", "button");
      box.setAttribute("aria-label", text);

      if (swatch && swatch.src) {
        const img = document.createElement("img");
        img.src = swatch.src;
        img.alt = text;
        box.appendChild(img);
      }

      const textEl = document.createElement("div");
      textEl.className = "bod-option-box-text";
      textEl.textContent = text;
      box.appendChild(textEl);

      function activate(evt) {
        if (evt) evt.preventDefault();

        if (input.dataset.bodAllowed === "0") return;

        if (input.type === "radio") {
          const radios = Array.from(groupWrap.querySelectorAll('input[type="radio"]'));
          radios.forEach(function (r) {
            if (r.name === input.name) r.checked = false;
          });
          input.checked = true;
        } else {
          input.checked = !input.checked;
        }

        input.dispatchEvent(new Event("click", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));

        scheduleRefresh(40);
      }

      box.addEventListener("click", activate);
      box.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") activate(e);
      });

      boxesWrap.appendChild(box);
    });

    return boxesWrap;
  }

  function buildOrUpdateGroup(group) {
    const groupWrap = group.wrap;
    if (!groupWrap) return;

    let boxesWrap = groupWrap.querySelector(":scope > .bod-option-boxes");
    const originalSwatches = findOriginalSwatchWrap(groupWrap);
    const nativeRowsWrap = findNativeRowsWrap(groupWrap);

    if (originalSwatches) originalSwatches.classList.add("bod-option-hidden");
    if (nativeRowsWrap) nativeRowsWrap.classList.add("bod-option-hidden");

    if (!boxesWrap) {
      boxesWrap = createBoxes(group);
      if (!boxesWrap) return;
      group.heading.insertAdjacentElement("afterend", boxesWrap);
    }

    syncGroupState(groupWrap, boxesWrap);
  }

  function refreshAll() {
    if (isRefreshing) return;
    isRefreshing = true;

    try {
      applyRulesOnly();

      getGroups().forEach(function (group) {
        buildOrUpdateGroup(group);
      });

      log("refreshed");
    } finally {
      isRefreshing = false;
    }
  }

  function scheduleRefresh(delay) {
    if (buildTimer) clearTimeout(buildTimer);
    buildTimer = setTimeout(refreshAll, typeof delay === "number" ? delay : 80);
  }

  function bindEvents() {
    document.addEventListener("change", function (e) {
      if (
        e.target.matches('select[name^="SELECT_"]') ||
        e.target.matches('input[type="radio"][name^="SELECT_"]') ||
        e.target.matches('input[type="checkbox"][name^="SELECT_"]')
      ) {
        scheduleRefresh(20);
      }
    });
  }

  function startObserver() {
    if (observer) observer.disconnect();

    observer = new MutationObserver(function () {
      scheduleRefresh(100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  async function init() {
    injectStyles();
    bindEvents();

    try {
      const res = await fetch(RULES_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load rules JSON: " + res.status);

      OPTION_RULES = await res.json();
      log("rules loaded", OPTION_RULES);

      refreshAll();
      setTimeout(refreshAll, 250);
      setTimeout(refreshAll, 700);
      setTimeout(refreshAll, 1400);

      startObserver();
    } catch (err) {
      console.error("Options UI failed to load:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("load", function () {
    scheduleRefresh(50);
    setTimeout(refreshAll, 400);
  });
})();
