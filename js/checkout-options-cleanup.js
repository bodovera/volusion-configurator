(function () {
  "use strict";

  const DEBUG = true;

  function log() {
    if (DEBUG) console.log("[CheckoutCleanUp]", ...arguments);
  }

  function injectStyles() {
    if (document.getElementById("bodovera-checkout-cleanup-styles")) return;

    const css = `
      .bdv-checkout-config {
        display: block !important;
        margin-top: 4px !important;
        font-size: 11px !important;
        line-height: 1.35 !important;
        color: #666 !important;
        white-space: normal !important;
        word-break: break-word !important;
        overflow-wrap: anywhere !important;
        max-width: 100% !important;
      }

      .bdv-checkout-config .bdv-line1 {
        display: block;
        font-weight: 500;
        color: #666;
        margin-bottom: 2px;
      }

      .bdv-checkout-config .bdv-line2 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .bdv-checkout-config .bdv-more {
        display: inline-block;
        margin-top: 2px;
        font-size: 10px;
        color: #888;
        cursor: pointer;
        user-select: none;
      }

      .bdv-checkout-config.bdv-open .bdv-line2 {
        display: block;
        -webkit-line-clamp: unset;
        overflow: visible;
      }

      .bdv-checkout-config.bdv-open .bdv-more::after {
        content: " less";
      }

      .bdv-checkout-config .bdv-more::after {
        content: " more";
      }
    `;

    const style = document.createElement("style");
    style.id = "bodovera-checkout-cleanup-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function normalizeText(str) {
    return String(str || "").replace(/\s+/g, " ").trim();
  }

  function looksLikeConfigText(text) {
    if (!text) return false;

    const upper = text.toUpperCase();

    return (
      upper.includes("WIDTH:") ||
      upper.includes("LENGTH:") ||
      upper.includes("STYLE:") ||
      upper.includes("CONTROL TYPE:") ||
      upper.includes("CONTROL SIDE:") ||
      upper.includes("MOUNT:") ||
      upper.includes("MOTOR TYPE:") ||
      upper.includes("ACCESSORIES:")
    );
  }

  function cleanConfigText(text) {
    let t = normalizeText(text);

    t = t.replace(/^PRICE_[^,]*,\s*/i, "");
    t = t.replace(/^CONFIG[_\s-]*PRICE[:\s-]*/i, "");
    t = t.replace(/\bN\/A\b/gi, "—");
    t = t.replace(/\s*,\s*/g, ", ");
    t = t.replace(/\s*:\s*/g, ": ");

    return t;
  }

  function splitConfigText(text) {
    const parts = cleanConfigText(text)
      .split(",")
      .map((x) => normalizeText(x))
      .filter(Boolean);

    const priority = [];
    const rest = [];

    parts.forEach((part) => {
      const upper = part.toUpperCase();

      if (
        upper.startsWith("WIDTH:") ||
        upper.startsWith("WIDTHINC:") ||
        upper.startsWith("LENGTH:") ||
        upper.startsWith("LENGTHINC:") ||
        upper.startsWith("MOUNT:") ||
        upper.startsWith("STYLE:")
      ) {
        priority.push(part);
      } else {
        rest.push(part);
      }
    });

    return {
      line1: priority.join(" • "),
      line2: rest.join(" • ")
    };
  }

  function buildCleanBlock(originalText) {
    const split = splitConfigText(originalText);

    const wrap = document.createElement("div");
    wrap.className = "bdv-checkout-config";

    const line1 = document.createElement("div");
    line1.className = "bdv-line1";
    line1.textContent = split.line1 || "";

    const line2 = document.createElement("div");
    line2.className = "bdv-line2";
    line2.textContent = split.line2 || "";

    wrap.appendChild(line1);

    if (split.line2) {
      wrap.appendChild(line2);

      const toggle = document.createElement("span");
      toggle.className = "bdv-more";
      toggle.textContent = "Show";
      toggle.addEventListener("click", function () {
        wrap.classList.toggle("bdv-open");
        toggle.textContent = wrap.classList.contains("bdv-open") ? "Show" : "Show";
      });

      wrap.appendChild(toggle);
    }

    return wrap;
  }

  function processTextNode(el) {
    if (!el || el.dataset.bdvCheckoutCleaned === "1") return;

    const text = normalizeText(el.textContent || "");
    if (!looksLikeConfigText(text)) return;

    log("Cleaning checkout config block:", text);

    el.textContent = "";
    el.appendChild(buildCleanBlock(text));
    el.dataset.bdvCheckoutCleaned = "1";
  }

  function scan() {
    document.querySelectorAll("div, p, span").forEach((el) => {
      if (el.children.length > 0) return;

      const text = normalizeText(el.textContent || "");
      if (!looksLikeConfigText(text)) return;

      processTextNode(el);
    });
  }

  function init() {
    injectStyles();
    scan();

    const observer = new MutationObserver(() => {
      scan();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    log("Checkout cleanup running");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
