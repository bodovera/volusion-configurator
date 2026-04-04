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

  function processOptionList(ul) {
    if (!ul) return;

    const items = Array.from(ul.querySelectorAll(":scope > li"));
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
        li.style.display = "";
        li.removeAttribute("aria-hidden");
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
        li.style.display = "";
        li.removeAttribute("aria-hidden");
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
      } else {
        li.style.display = "";
        li.removeAttribute("aria-hidden");
      }
    });

    if (widthLi) {
      const div = widthLi.querySelector("div") || widthLi;
      div.textContent = "Width: " + combineDimension(widthVal, widthIncVal);
    }

    if (widthIncLi) {
      widthIncLi.style.display = "none";
      widthIncLi.setAttribute("aria-hidden", "true");
    }

    if (lengthLi) {
      const div = lengthLi.querySelector("div") || lengthLi;
      div.textContent = "Length: " + combineDimension(lengthVal, lengthIncVal);
    }

    if (lengthIncLi) {
      lengthIncLi.style.display = "none";
      lengthIncLi.setAttribute("aria-hidden", "true");
    }
  }

  function cleanCheckoutSummary() {
    document.querySelectorAll("div").forEach(function (el) {
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

      const parts = raw
        .split(/,\s*(?=[A-Za-z][A-Za-z0-9 _\/-]*:)/)
        .map(function (s) {
          return normalizeText(s);
        })
        .filter(Boolean);

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

      el.textContent = out.join(", ");
      el.dataset.checkoutCleaned = "1";
      log("Cleaned checkout summary block");
    });
  }

  function run() {
    document.querySelectorAll('div[data-modal-body] ul').forEach(processOptionList);
    cleanCheckoutSummary();
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
