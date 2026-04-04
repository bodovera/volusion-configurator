(function () {
  "use strict";

  var path = (window.location.pathname || "").replace(/\/+$/, "");
  if (path !== "/checkout") return;

  function parseNumber(v) {
    var n = parseFloat(String(v || "").trim());
    return isNaN(n) ? 0 : n;
  }

  function formatNumber(n) {
    return Number.isInteger(n) ? String(n) : String(n).replace(/\.0+$/, "");
  }

  function getFieldMap(text) {
    var parts = String(text || "").split(",");
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].trim();
      var idx = p.indexOf(":");
      if (idx > -1) {
        out.push({
          key: p.slice(0, idx).trim(),
          value: p.slice(idx + 1).trim()
        });
      } else if (p) {
        out.push({ key: "", value: p });
      }
    }
    return out;
  }

  function cleanOptionText(text) {
    var fields = getFieldMap(text);
    var map = {};
    fields.forEach(function (f) {
      map[f.key] = f.value;
    });

    var width = parseNumber(map["Width"]);
    var widthInc = parseNumber(map["WidthInc"]);
    var length = parseNumber(map["Length"]);
    var lengthInc = parseNumber(map["LengthInc"]);

    var finalWidth = width + widthInc;
    var finalLength = length + lengthInc;

    var result = [];

    if (finalWidth || map["Width"]) result.push("Width: " + formatNumber(finalWidth));
    if (finalLength || map["Length"]) result.push("Length: " + formatNumber(finalLength));

    fields.forEach(function (f) {
      var k = f.key;
      var v = f.value;

      if (!k) return;

      if (
        k === "Width" ||
        k === "WidthInc" ||
        k === "Length" ||
        k === "LengthInc"
      ) {
        return;
      }

      if (/^PRICE_/i.test(k)) return;
      if (k === "Control Length" && /^N\/A$/i.test(v)) return;
      if (k === "Motor Control" && /^Please Select/i.test(v)) return;
      if (k === "Motor Type" && /^Please Select/i.test(v)) return;

      result.push(k + ": " + v);
    });

    return result.join(" • ");
  }

  function processOptionsNode(el) {
    if (!el || el.dataset.bdvCheckoutCleaned === "1") return;

    var txt = (el.textContent || "").trim();
    if (!txt.includes("Width:") || !txt.includes("Length:")) return;
    if (!txt.includes("PRICE_")) return;

    el.textContent = cleanOptionText(txt);
    el.dataset.bdvCheckoutCleaned = "1";
  }

  function run() {
    var rows = document.querySelectorAll(
      'div[data-testid="cartitemsummary-summary"] div[data-testid="cartitem-content"]'
    );

    rows.forEach(function (row) {
      var optionsNode = row.querySelector(
        ':scope > div.flex.flex-row.space-x-4 > div.flex.flex-col.w-full > div.text-sm'
      );

      if (optionsNode) processOptionsNode(optionsNode);
    });
  }

  run();
})();
