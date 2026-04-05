(function () {
  "use strict";

  var DEBUG = true;

  function log() {
    if (DEBUG) console.log("[OptionBoxes]", ...arguments);
  }

  function injectStyles() {
    if (document.getElementById("bod-option-box-styles")) return;

    var css = `
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

    var style = document.createElement("style");
    style.id = "bod-option-box-styles";
    style.textContent = css;
    document.head.appendChild(style);
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

  function getTopSwatchArea(groupWrap) {
    var firstLevelDivs = Array.from(groupWrap.children).filter(function (el) {
      return el.tagName === "DIV";
    });

    for (var i = 0; i < firstLevelDivs.length; i++) {
      var div = firstLevelDivs[i];
      if (div.querySelector('[data-doogma-value] img')) {
        return div;
      }
    }

    return null;
  }

  function getNativeRowsWrap(groupWrap) {
    return groupWrap.querySelector(".w-100");
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
    var label = document.querySelector('label[for="' + input.id + '"]');
    if (!label) return "";
    return (label.textContent || "").replace(/\s+/g, " ").trim();
  }

  function getSwatchMap(groupWrap) {
    var map = new Map();

    var swatchNodes = Array.from(groupWrap.querySelectorAll("[data-doogma-value]")).filter(function (el) {
      return !!el.querySelector("img");
    });

    swatchNodes.forEach(function (node) {
      var value = node.getAttribute("data-doogma-value");
      if (!value || map.has(value)) return;

      var img = node.querySelector("img");
      if (!img) return;

      map.set(value, {
        src: img.getAttribute("data-src") || img.getAttribute("src") || "",
        alt: img.getAttribute("alt") || "",
        title: img.getAttribute("title") || ""
      });
    });

    return map;
  }

  function syncGroupState(groupWrap, boxesWrap) {
    var boxes = Array.from(boxesWrap.querySelectorAll(".bod-option-box"));

    boxes.forEach(function (box) {
      var value = box.getAttribute("data-doogma-value");
      if (!value) return;

      var input = groupWrap.querySelector(
        'input[type="radio"][data-doogma-value="' + value + '"], input[type="checkbox"][data-doogma-value="' + value + '"]'
      );

      if (!input) return;

      if (input.checked) box.classList.add("is-selected");
      else box.classList.remove("is-selected");
    });
  }

  function buildGroup(group) {
    var groupWrap = group.wrap;

    if (!groupWrap || groupWrap.dataset.bodOptionBoxesReady === "1") return;

    var inputRows = getInputRows(groupWrap);
    if (!inputRows.length) return;

    var swatchMap = getSwatchMap(groupWrap);
    if (!swatchMap.size) return;

    var topSwatchArea = getTopSwatchArea(groupWrap);
    var nativeRowsWrap = getNativeRowsWrap(groupWrap);

    var matched = inputRows.filter(function (item) {
      return swatchMap.has(item.input.getAttribute("data-doogma-value"));
    });

    if (!matched.length) return;

    var boxesWrap = document.createElement("div");
    boxesWrap.className = "bod-option-boxes";

    matched.forEach(function (item) {
      var input = item.input;
      var value = input.getAttribute("data-doogma-value");
      var swatch = swatchMap.get(value);
      var text = getLabelTextForInput(input) || swatch.alt || value;

      var box = document.createElement("div");
      box.className = "bod-option-box";
      box.setAttribute("data-doogma-value", value);
      box.setAttribute("tabindex", "0");
      box.setAttribute("role", "button");
      box.setAttribute("aria-label", text);

      if (swatch && swatch.src) {
        var img = document.createElement("img");
        img.src = swatch.src;
        img.alt = text;
        box.appendChild(img);
      }

      var textEl = document.createElement("div");
      textEl.className = "bod-option-box-text";
      textEl.textContent = text;
      box.appendChild(textEl);

      function activate(currentInput) {
        return function (evt) {
          if (evt) evt.preventDefault();

          if (currentInput.type === "radio") {
            var radios = Array.from(groupWrap.querySelectorAll('input[type="radio"]'));
            radios.forEach(function (r) {
              if (r.name === currentInput.name) r.checked = false;
            });
            currentInput.checked = true;
          } else {
            currentInput.checked = !currentInput.checked;
          }

          currentInput.dispatchEvent(new Event("click", { bubbles: true }));
          currentInput.dispatchEvent(new Event("change", { bubbles: true }));

          syncGroupState(groupWrap, boxesWrap);
        };
      }

      var handler = activate(input);

      box.addEventListener("click", handler);
      box.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          handler(e);
        }
      });

      boxesWrap.appendChild(box);
    });

    if (topSwatchArea) topSwatchArea.classList.add("bod-option-hidden");
    if (nativeRowsWrap) nativeRowsWrap.classList.add("bod-option-hidden");

    group.heading.insertAdjacentElement("afterend", boxesWrap);

    syncGroupState(groupWrap, boxesWrap);
    groupWrap.dataset.bodOptionBoxesReady = "1";

    log("Built option boxes for group:", group.heading.textContent.trim(), "matched:", matched.length);
  }

  function init() {
    injectStyles();

    getGroups().forEach(function (group) {
      buildGroup(group);
    });

    log("done");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("load", init);
})();
