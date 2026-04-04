(function () {
  "use strict";

  var path = (window.location.pathname || "").replace(/\/+$/, "");
  if (path !== "/checkout") return;

  console.log("[CHECKOUT TEST] running");

  function highlight() {
    var nodes = document.querySelectorAll(
      '[data-testid="cartitemsummary-summary"] [data-testid="cartitem-content"] div.text-sm'
    );

    console.log("[CHECKOUT TEST] nodes found:", nodes.length);

    nodes.forEach(function (el, i) {
      var txt = (el.textContent || "").trim();

      if (!txt.includes("PRICE_")) return;

      console.log("[CHECKOUT TEST] HIT:", txt);

      el.style.background = "yellow";
      el.style.color = "black";
      el.style.border = "2px solid red";
      el.style.padding = "4px";
    });
  }

  // run repeatedly in case checkout renders late
  var count = 0;
  var timer = setInterval(function () {
    highlight();
    count++;
    if (count > 40) clearInterval(timer);
  }, 500);

  highlight();
})();
