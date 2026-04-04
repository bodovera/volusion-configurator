(function () {
  "use strict";

  var path = (window.location.pathname || "").replace(/\/+$/, "");
  if (path !== "/checkout") return;

  function parseNumber(v) {
    var n = parseFloat(String(v || "").trim());
    return isNaN(n) ? 0 : n;
  }

  function formatNumber(n) {
    var s = String(Math.round(n * 1000) / 1000);
    return s.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
  }

  function parseFields(text) {
    var out = [];
    String(text || "").split(",").forEach(function (part) {
      part = part.trim();
      if (!part) return;
      var idx = part.indexOf(":");
      if (idx === -1) {
        out.push({ key: "", value: part });
      } else {
        out.push({
          key: part.slice(0, idx).trim(),
          value: part.slice(idx + 1).trim()
        });
      }
    });
    return out;
  }

  function buildCleanText(raw) {
    var fields = parseFields(raw);
    var map = {};

    fields.forEach(function (f) {
      if (f.key) map[f.key] = f.value;
    });

    var width = parseNumber(map["Width"]);
    var widthInc = parseNumber(map["WidthInc"]);
    var length = parseNumber(map["Length"]);
    var lengthInc = parseNumber(map["LengthInc"]);

    var finalWidth = width + widthInc;
    var finalLength = length + lengthInc;

    var result = [];

    if ("Width" in map) result.push("Width: " + formatNumber(finalWidth));
    if ("Length" in map) result.push("Length: " + formatNumber(finalLength));

    fields.forEach(function (f) {
      var k = f.key;
      var v = f.value;

      if (!k) return;
      if (/^PRICE_/i.test(k)) return;
      if (k === "Width" || k === "WidthInc" || k === "Length" || k === "LengthInc") return;
      if (k === "Control Length" && /^N\/A$/i.test(v)) return;
      if (k === "Motor Control" && /^Please Select/i.test(v)) return;
      if (k === "Motor Type" && /^Please Select/i.test(v)) return;

      result.push(k + ": " + v);
    });

    return result.join(" • ");
  }

  function getOptionNodes() {
    return document.querySelectorAll(
      '[data-testid="cartitemsummary-summary"] [data-testid="cartitem-content"] > .flex.flex-row.space-x-4 > .flex.flex-col.w-full > .text-sm'
    );
  }

  function processNode(node) {
    if (!node) return;

    var raw = (node.getAttribute("data-bdv-raw") || node.textContent || "").trim();
    if (!raw.includes("Width:") || !raw.includes("Length:") || !raw.includes("PRICE_")) return;

    if (!node.getAttribute("data-bdv-raw")) {
      node.setAttribute("data-bdv-raw", raw);
    }

    var cleaned = buildCleanText(raw);

    if (node.textContent.trim() !== cleaned) {
      node.textContent = cleaned;
    }

    node.setAttribute("data-bdv-cleaned", "1");
  }

  function run() {
    getOptionNodes().forEach(processNode);
  }

  var tries = 0;
  var timer = setInterval(function () {
    run();
    tries++;
    if (tries > 40) clearInterval(timer);
  }, 500);

  var observer = new MutationObserver(function () {
    run();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  run();
})();
