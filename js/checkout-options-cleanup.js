(function () {
  "use strict";

  var path = (window.location.pathname || "").replace(/\/+$/, "");
  if (path !== "/checkout") return;

  function parseFields(text) {
    return String(text || "")
      .split(",")
      .map(function (part) {
        part = part.trim();
        var idx = part.indexOf(":");
        if (idx === -1) return { key: "", value: part };
        return {
          key: part.slice(0, idx).trim(),
          value: part.slice(idx + 1).trim()
        };
      })
      .filter(function (x) {
        return x.value;
      });
  }

  function num(v) {
    var n = parseFloat(String(v || "").trim());
    return isNaN(n) ? 0 : n;
  }

  function fmt(n) {
    return String(Math.round(n * 1000) / 1000)
      .replace(/\.0+$/, "")
      .replace(/(\.\d*[1-9])0+$/, "$1");
  }

  function clean(raw) {
    var fields = parseFields(raw);
    var map = {};

    fields.forEach(function (f) {
      if (f.key) map[f.key] = f.value;
    });

    var width = num(map.Width);
    var widthInc = num(map.WidthInc);
    var length = num(map.Length);
    var lengthInc = num(map.LengthInc);

    var out = [];

    if ("Width" in map) out.push("Width: " + fmt(width + widthInc));
    if ("Length" in map) out.push("Length: " + fmt(length + lengthInc));

    fields.forEach(function (f) {
      var k = f.key;
      var v = f.value;

      if (!k) return;
      if (/^PRICE_/i.test(k)) return;
      if (k === "Width" || k === "WidthInc" || k === "Length" || k === "LengthInc") return;
      if (k === "Control Length" && /^N\/A$/i.test(v)) return;
      if (k === "Motor Control" && /^Please Select/i.test(v)) return;
      if (k === "Motor Type" && /^Please Select/i.test(v)) return;

      out.push(k + ": " + v);
    });

    return out.join(" • ");
  }

  function process() {
    var nodes = document.querySelectorAll(
      '[data-testid="cartitemsummary-summary"] [data-testid="cartitem-content"] div.text-sm'
    );

    nodes.forEach(function (el) {
      var raw = (el.getAttribute("data-bdv-raw") || el.textContent || "").trim();

      if (!raw.includes("PRICE_")) return;
      if (!raw.includes("Width:")) return;
      if (!raw.includes("Length:")) return;

      if (!el.getAttribute("data-bdv-raw")) {
        el.setAttribute("data-bdv-raw", raw);
      }

      var cleaned = clean(raw);

      if (el.textContent !== cleaned) {
        el.textContent = cleaned;
      }
    });
  }

  var count = 0;
  var maxRuns = 120;

  var timer = setInterval(function () {
    process();
    count += 1;
    if (count >= maxRuns) clearInterval(timer);
  }, 500);

  process();
})();
