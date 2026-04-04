(function () {
  "use strict";

  const DEBUG = true;

  function log() {
    if (DEBUG) console.log("[CartOptionsCleanUp]", ...arguments);
  }

  function normalizeText(str) {
    return String(str || "").replace(/\s+/g, " ").trim();
  }

  function upperText(str) {
    return normalizeText(str).toUpperCase();
  }

  function parseLabelValue(text) {
    const cleaned = normalizeText(text);
    const idx = cleaned.indexOf(":");
    if (idx < 0) return null;

    return {
      label: normalizeText(cleaned.slice(0, idx)),
      value: normalizeText(cleaned.slice(idx + 1))
    };
  }

  function isZeroInc(val) {
    const v = normalizeText(val);
    return v === "0" || v === "0.0" || v === "0.00";
  }

  function combineDimension(base, inc) {
    const b = normalizeText(base);
    const i = normalizeText(inc);

    if (!b) return "";
    if (!i || isZeroInc(i)) return b;

    return b + " " + i;
  }

  function shouldHideLabel(label) {
    const u = upperText(label);

    return (
      u === "WIDTHINC" ||
      u === "LENGTHINC" ||
      u.indexOf("PRICE_") === 0 ||
      u.indexOf("CONFIG_PRICE") >= 0 ||
      u.indexOf("CALCULATED PRICE") >= 0 ||
      u === "VALUES_WIDTH" ||
      u === "VALUES_LENGTH" ||
      u === "VALUESWIDTH" ||
      u === "VALUESLENGTH"
    );
  }

  function processLines(lines) {
    let width = "";
    let widthInc = "";
    let length = "";
    let lengthInc = "";
    const kept = [];

    lines.forEach(function (line) {
      const parsed = parseLabelValue(line);
      if (!parsed) {
        if (normalizeText(line)) kept.push(normalizeText(line));
        return;
      }

      const labelU = upperText(parsed.label);

      if (labelU === "WIDTH") {
        width = parsed.value;
        return;
      }

      if (labelU === "WIDTHINC") {
        widthInc = parsed.value;
        return;
      }

      if (labelU === "LENGTH") {
        length = parsed.value;
        return;
      }

      if (labelU === "LENGTHINC") {
        lengthInc = parsed.value;
        return;
      }

      if (shouldHideLabel(parsed.label)) {
        log("Hid line:", line);
        return;
      }

      kept.push(parsed.label + ": " + parsed.value);
    });

    if (width) {
      kept.unshift("Width: " + combineDimension(width, widthInc));
    }

    if (length) {
      const insertAt = width ? 1 : 0;
      kept.splice(insertAt, 0, "Length: " + combineDimension(length, lengthInc));
    }

    return kept;
  }

  function processOptionList(ul) {
    if (!ul || ul.dataset.cartOptionsCleaned === "1") return;

    const items = Array.from(ul.querySelectorAll("li"));
    if (!items.length) return;

    const lines = items.map(function (li) {
      return normalizeText(li.textContent || "");
    });

    const cleaned = processLines(lines);
    if (!cleaned || !cleaned.length) return;

    const lineDivs = items.map(function (li) {
      return li.querySelector("div") || li;
    });

    cleaned.forEach(function (line, i) {
      if (lineDivs[i]) {
        lineDivs[i].textContent = line;
        items[i].style.display = "";
        items[i].removeAttribute("aria-hidden");
      }
    });

    for (let i = cleaned.length; i < items.length; i++) {
      items[i].style.display = "none";
      items[i].setAttribute("aria-hidden", "true");
    }

    ul.dataset.cartOptionsCleaned = "1";
    log("Cleaned modal/cart option list", ul);
  }

  function looksLikeOptionsText(text) {
    const t = upperText(text);
    return (
      t.includes("WIDTH:") ||
      t.includes("LENGTH:") ||
      t.includes("WIDTHINC:") ||
      t.includes("LENGTHINC:") ||
      t.includes("CONTROL SIDE:") ||
      t.includes("CONTROL TYPE:") ||
      t.includes("MOUNT:") ||
      t.includes("STYLE:") ||
      t.includes("MOTOR TYPE:") ||
      t.includes("PRICE_")
    );
  }

  function processInlineOptionsBlock(el) {
    if (!el || el.dataset.cartOptionsInlineCleaned === "1") return;

    const raw = normalizeText(el.textContent || "");
    if (!raw || !looksLikeOptionsText(raw)) return;

    const lines = raw
      .split(/,\s*(?=[A-Za-z][A-Za-z0-9 _\/-]*:)/)
      .map(function (s) {
        return normalizeText(s);
      })
      .filter(Boolean);

    if (!lines.length) return;

    const cleaned = processLines(lines);
    if (!cleaned || !cleaned.length) return;

    el.textContent = cleaned.join(", ");
    el.dataset.cartOptionsInlineCleaned = "1";
    log("Cleaned inline cart options block", el);
  }

  function run() {
    document.querySelectorAll('div[data-modal-body] ul').forEach(processOptionList);

    document.querySelectorAll(".cartitem-content, [data-testid='cartitem-content'], .text-sm").forEach(function (el) {
      processInlineOptionsBlock(el);
    });
  }

  function init() {
    run();

    const observer = new MutationObserver(function () {
      run();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
