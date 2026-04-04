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
    if (!i || isZeroInc(i) || upperText(i) === "N/A") return b;

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

  function cleanOptionLines(lines) {
    let width = "";
    let widthInc = "";
    let length = "";
    let lengthInc = "";
    const kept = [];

    lines.forEach(function (line) {
      const parsed = parseLabelValue(line);
      if (!parsed) {
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

    const finalLines = [];

    if (width) finalLines.push("Width: " + combineDimension(width, widthInc));
    if (length) finalLines.push("Length: " + combineDimension(length, lengthInc));

    kept.forEach(function (line) {
      finalLines.push(line);
    });

    return finalLines;
  }

  function cleanModalLists() {
    document.querySelectorAll('div[data-modal-body] ul').forEach(function (ul) {
      const items = Array.from(ul.querySelectorAll("li"));
      if (!items.length) return;

      const rawLines = items
        .map(function (li) {
          return normalizeText(li.textContent || "");
        })
        .filter(Boolean);

      const cleaned = cleanOptionLines(rawLines);
      if (!cleaned.length) return;

      ul.innerHTML = "";

      cleaned.forEach(function (line) {
        const li = document.createElement("li");
        li.className = "small_bul19";

        const div = document.createElement("div");
        div.textContent = line;

        li.appendChild(div);
        ul.appendChild(li);
      });

      log("Cleaned modal options list");
    });
  }

  function splitInlineOptionsText(text) {
    return String(text || "")
      .split(/,\s*(?=[A-Za-z][A-Za-z0-9 _\/-]*:)/)
      .map(function (part) {
        return normalizeText(part);
      })
      .filter(Boolean);
  }

  function looksLikeOptionsBlob(text) {
    const t = upperText(text);
    return (
      t.includes("WIDTH:") &&
      t.includes("LENGTH:")
    );
  }

  function cleanInlineOptionBlocks() {
    document.querySelectorAll("div, p, span").forEach(function (el) {
      const raw = normalizeText(el.textContent || "");
      if (!raw) return;
      if (!looksLikeOptionsBlob(raw)) return;
      if (el.children.length > 0) return;

      const lines = splitInlineOptionsText(raw);
      if (!lines.length) return;

      const cleaned = cleanOptionLines(lines);
      if (!cleaned.length) return;

      el.textContent = cleaned.join(", ");
      log("Cleaned inline options block", el);
    });
  }

  function run() {
    cleanModalLists();
    cleanInlineOptionBlocks();
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
