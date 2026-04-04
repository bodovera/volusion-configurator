(function () {
  "use strict";

  // checkout only
  var path = (window.location.pathname || "").replace(/\/+$/, "");
  if (path !== "/checkout") return;

  function getVal(label, text) {
    var regex = new RegExp(label + "\\s*:\\s*([^,]+)", "i");
    var match = text.match(regex);
    return match ? parseFloat(match[1]) : 0;
  }

  function replaceVal(label, value, text) {
    var regex = new RegExp(label + "\\s*:\\s*([^,]+)", "i");
    return text.replace(regex, label + ": " + value);
  }

  function cleanText(str) {
    if (!str) return "";

    let width = getVal("Width", str);
    let widthInc = getVal("WidthInc", str);
    let length = getVal("Length", str);
    let lengthInc = getVal("LengthInc", str);

    let finalWidth = width + widthInc;
    let finalLength = length + lengthInc;

    let t = str;

    // apply math
    if (width) t = replaceVal("Width", finalWidth, t);
    if (length) t = replaceVal("Length", finalLength, t);

    return t
      .replace(/^PRICE_[^,]*,\s*/i, "")
      .replace(/WidthInc:[^,]*,?\s*/gi, "")
      .replace(/LengthInc:[^,]*,?\s*/gi, "")
      .replace(/Control Length:N\/A,?\s*/gi, "")
      .replace(/\bN\/A\b/gi, "—")
      .replace(/\s*,\s*/g, " • ")
      .replace(/\s*:\s*/g, ": ")
      .trim();
  }

  function run() {
    var nodes = document.querySelectorAll(".text-sm");

    nodes.forEach(function (el) {
      if (el.dataset.cleaned === "1") return;

      var txt = (el.textContent || "").trim();

      if (!txt.includes("Width:") || !txt.includes("Length:")) return;

      el.textContent = cleanText(txt);
      el.dataset.cleaned = "1";
    });
  }

  run();

  var observer = new MutationObserver(run);
  observer.observe(document.body, { childList: true, subtree: true });

})();
