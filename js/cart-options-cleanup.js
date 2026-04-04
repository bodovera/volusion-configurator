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
    return v === "0" || v === "0.0" || v === "0.00" || v.toUpperCase() === "N/A";
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

  function processOptionList(ul) {
    if (!ul || ul.dataset.cartOptionsCleaned === "1") return;

    const items = Array.from(ul.querySelectorAll("li"));
    if (!items.length) return;

    let widthLi = null;
    let widthVal = "";
    let widthIncLi = null;
    let widthIncVal = "";

    let lengthLi = null;
    let lengthVal = "";
    let lengthIncLi = null;
    let lengthIncVal = "";

    items.forEach(function (li) {
      const text = normalizeText(li.textContent || "");
      if (!text) return;

      const parsed = parseLabelValue(text);
      if (!parsed) return;

      const labelU = upperText(parsed.label);

      if (labelU === "WIDTH") {
        widthLi = li;
        widthVal = parsed.value;
        return;
      }

      if (labelU === "WIDTHINC") {
        widthIncLi = li;
        widthIncVal = parsed.value;
        return;
      }

      if (labelU === "LENGTH") {
        lengthLi = li;
        lengthVal = parsed.value;
        return;
      }

      if (labelU === "LENGTHINC") {
        lengthIncLi = li;
        lengthIncVal = parsed.value;
        return;
      }

      if (shouldHideLabel(parsed.label)) {
        li.style.display = "none";
        li.setAttribute("aria-hidden", "true");
        log("Hid cart option row:", text);
      }
    });

    if (widthLi) {
      const newWidth = combineDimension(widthVal, widthIncVal);
      const div = widthLi.querySelector("div") || widthLi;
      div.textContent = "Width: " + newWidth;
      log("Combined width:", newWidth);
    }

    if (widthIncLi) {
      widthIncLi.style.display = "none";
      widthIncLi.setAttribute("aria-hidden", "true");
    }

    if (lengthLi) {
      const newLength = combineDimension(lengthVal, lengthIncVal);
      const div = lengthLi.querySelector("div") || lengthLi;
      div.textContent = "Length: " + newLength;
      log("Combined length:", newLength);
    }

    if (lengthIncLi) {
      lengthIncLi.style.display = "none";
      lengthIncLi.setAttribute("aria-hidden", "true");
    }

    ul.dataset.cartOptionsCleaned = "1";
  }

  function processCheckoutBlock(el) {
    if (!el || el.dataset.checkoutOptionsCleaned === "1") return;
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

    const parts = raw
      .split(/,\s*(?=[A-Za-z][A-Za-z0-9 _\/-]*:)/)
      .map(function (s) {
        return normalizeText(s);
      })
      .filter(Boolean);

    if (!parts.length) return;

    let widthVal = "";
    let widthIncVal = "";
    let lengthVal = "";
    let lengthIncVal = "";
    const kept = [];

    parts.forEach(function (part) {
      const parsed = parseLabelValue(part);
      if (!parsed) return;

      const labelU = upperText(parsed.label);

      if (labelU === "WIDTH") {
        widthVal = parsed.value;
        return;
      }

      if (labelU === "WIDTHINC") {
        widthIncVal = parsed.value;
        return;
      }

      if (labelU === "LENGTH") {
        lengthVal = parsed.value;
        return;
      }

      if (labelU === "LENGTHINC") {
        lengthIncVal = parsed.value;
        return;
      }

      if (shouldHideLabel(parsed.label)) {
        log("Hid checkout option text:", part);
        return;
      }

      kept.push(parsed.label + ": " + parsed.value);
    });

    const out = [];

    if (widthVal) {
      out.push("Width: " + combineDimension(widthVal, widthIncVal));
    }

    if (lengthVal) {
      out.push("Length: " + combineDimension(lengthVal, lengthIncVal));
    }

    kept.forEach(function (line) {
      out.push(line);
    });

    if (!out.length) return;

    el.textContent = out.join(", ");
    el.dataset.checkoutOptionsCleaned = "1";
    log("Cleaned checkout block:", el);
  }

  function run() {
    document.querySelectorAll('div[data-modal-body] ul').forEach(processOptionList);

    document.querySelectorAll("div, p, span").forEach(function (el) {
      processCheckoutBlock(el);
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
