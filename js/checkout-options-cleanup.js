(function () {
  "use strict";

  const DEBUG = true;
  const PRICE_PATTERN = /\s*,?\s*PRICE[^,]*.*$/i;

  function log() {
    if (DEBUG) console.log("[cart-text-cleanup]", ...arguments);
  }

  function isCheckoutPage() {
    return window.location.pathname.toLowerCase().indexOf("/checkout") === 0;
  }

  function cleanText(str) {
    if (!str) return str;
    return String(str)
      .replace(PRICE_PATTERN, "")
      .replace(/\s+,/g, ",")
      .replace(/,+\s*$/g, "")
      .trim();
  }

  function shouldCleanNode(el) {
    if (!el) return false;
    if (!el.classList || !el.classList.contains("text-sm")) return false;

    const text = (el.textContent || "").trim();
    if (!text) return false;

    // only touch rows that actually contain PRICE
    if (!/PRICE/i.test(text)) return false;

    // avoid touching unrelated checkout labels like Unit:, terms text, etc.
    const cartItem = el.closest('[data-testid="cartitem-content"]');
    return !!cartItem;
  }

  function cleanNode(el) {
    if (!shouldCleanNode(el)) return;

    const original = el.textContent || "";
    const cleaned = cleanText(original);

    if (cleaned !== original) {
      el.textContent = cleaned;
      log("Cleaned:", { before: original, after: cleaned });
    }
  }

  function scan(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const nodes = scope.querySelectorAll('.text-sm');
    nodes.forEach(cleanNode);
  }

  function startObserver() {
    const observer = new MutationObserver(function (mutations) {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return;

            if (node.matches && node.matches(".text-sm")) {
              cleanNode(node);
            }

            if (node.querySelectorAll) {
              scan(node);
            }
          });
        }

        if (mutation.type === "characterData") {
          const parent = mutation.target && mutation.target.parentElement;
          if (parent) cleanNode(parent);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    log("Observer started");
  }

  function init() {
    if (!isCheckoutPage()) {
      log("Not on /checkout, exiting");
      return;
    }

    log("Init on checkout");
    scan(document);
    startObserver();

    // extra passes for React/Next checkout rendering
    setTimeout(function () { scan(document); }, 300);
    setTimeout(function () { scan(document); }, 1000);
    setTimeout(function () { scan(document); }, 2000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
