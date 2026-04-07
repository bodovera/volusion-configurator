(function () {
  "use strict";

  const DEBUG = true;

  function log() {
    if (DEBUG) console.log("[checkout-text-cleanup]", ...arguments);
  }

  function isCheckoutPage() {
    return window.location.pathname.toLowerCase().indexOf("/checkout") === 0;
  }

  function cleanupText(text) {
    if (!text) return text;

    return String(text)
      .replace(/\s*,?\s*PRICE[^,]*$/i, "")
      .replace(/\s+,/g, ",")
      .replace(/,+\s*$/g, "")
      .trim();
  }

  function getDescriptionNodes(root) {
    const scope = root && root.querySelectorAll ? root : document;

    return scope.querySelectorAll(
      '[data-testid="cartitem-content"] .flex.flex-col.w-full .text-sm'
    );
  }

  function processNode(el) {
    if (!el) return;

    const text = (el.textContent || "").trim();
    if (!text) return;
    if (!/PRICE/i.test(text)) return;

    const cleaned = cleanupText(text);

    if (cleaned !== text) {
      el.textContent = cleaned;
      log("cleaned", { before: text, after: cleaned });
    }
  }

  function scan(root) {
    getDescriptionNodes(root).forEach(processNode);
  }

  function observe() {
    const observer = new MutationObserver(function () {
      scan(document);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    log("observer started");
  }

  function init() {
    if (!isCheckoutPage()) {
      log("not checkout, exit");
      return;
    }

    log("init");
    scan(document);
    observe();

    setTimeout(function () { scan(document); }, 250);
    setTimeout(function () { scan(document); }, 750);
    setTimeout(function () { scan(document); }, 1500);
    setTimeout(function () { scan(document); }, 3000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
