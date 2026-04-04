(function () {
  "use strict";

  const DEBUG = true;

  function log() {
    if (DEBUG) console.log("[CheckoutCleanUp]", ...arguments);
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
    const v = upperText(val);
    return v === "0" || v === "0.0" || v === "0.00" || v === "N/A" || v === "";
  }

  function combineDimension(base, inc) {
    const b = normalizeText(base);
    const i = normalizeText(inc);

    if (!b) return "";
    if (isZeroInc(i)) return b;

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

  function splitOptionText(raw) {
    return String(raw || "")
      .split(/,\s*(?=[A-Za-z][A-Za-z0-9 _\/-]*:)/)
      .map(function (s) {
        return normalizeText(s);
      })
      .filter(Boolean);
  }

  function processCheckoutTextBlock(el) {
    if (!el || el.dataset.checkoutCleaned === "1") return;
    if (el.children.length > 0) return;

    const raw = normalizeText(el.textContent || "");
    if (!raw) return;

    if (!raw.includes("Width:") || !raw.includes("Length:")) return;
    if (
      !raw.includes("WidthInc:") &&
      !raw.includes("LengthInc:") &&
      !raw.includes("PRICE_") &&
      !raw.includes("VALUES_WIDTH") &&
      !raw.includes("VALUES_LENGTH")
    ) return;

    const parts = splitOptionText(raw);
    if (!parts.length) return;

    let width = "";
    let widthInc = "";
    let length = "";
    let lengthInc = "";
    const kept = [];

    parts.forEach(function (part) {
      const parsed = parseLabelValue(part);
      if (!parsed) return;

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
        log("Hid checkout text:", part);
        return;
      }

      kept.push(parsed.label + ": " + parsed.value);
    });

    const out = [];

    if (width) out.push("Width: " + combineDimension(width, widthInc));
    if (length) out.push("Length: " + combineDimension(length, lengthInc));

    kept.forEach(function (line) {
      out.push(line);
    });

    if (!out.length) return;

    el.textContent = out.join(", ");
    el.dataset.checkoutCleaned = "1";
    log("Cleaned checkout block", el);
  }

  function run() {
    document.querySelectorAll("div.text-sm").forEach(function (el) {
      processCheckoutTextBlock(el);
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
