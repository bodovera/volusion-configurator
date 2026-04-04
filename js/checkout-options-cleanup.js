(function () {
  "use strict";

  const DEBUG = true;

  function log() {
    if (DEBUG) console.log("[CheckoutSummaryCleanUp]", ...arguments);
  }

  function normalizeText(str) {
    return String(str || "").replace(/\s+/g, " ").trim();
  }

  function isCheckoutPage() {
    const txt = (document.body?.innerText || "").toLowerCase();
    return (
      txt.includes("shipping address") &&
      txt.includes("promo code") &&
      txt.includes("calculated at payment")
    );
  }

  function findSummaryContainer() {
    return (
      document.querySelector('[data-testid="cartitemsummary-summary"]') ||
      document.querySelector('[data-testid="cartitem-summary"]') ||
      document.querySelector('[data-testid="cartitem-content"]')?.closest("div")
    );
  }

  function injectStyles() {
    if (document.getElementById("bdv-checkout-summary-cleanup-styles")) return;

    const style = document.createElement("style");
    style.id = "bdv-checkout-summary-cleanup-styles";
    style.textContent = `
      .bdv-clean-config {
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

      .bdv-clean-config-main {
        display: block;
      }

      .bdv-clean-config-extra {
        display: none;
        margin-top: 3px;
      }

      .bdv-clean-config.bdv-open .bdv-clean-config-extra {
        display: block;
      }

      .bdv-clean-config-toggle {
        display: inline-block;
        margin-top: 3px;
        font-size: 10px;
        color: #888 !important;
        cursor: pointer;
        user-select: none;
      }
    `;
    document.head.appendChild(style);
  }

  function looksLikeConfigText(text) {
    const t = normalizeText(text).toUpperCase();
    return (
      t.includes("WIDTH:") ||
      t.includes("LENGTH:") ||
      t.includes("STYLE:") ||
      t.includes("MOUNT:") ||
      t.includes("CONTROL TYPE:") ||
      t.includes("CONTROL SIDE:") ||
      t.includes("MOTOR TYPE:") ||
      t.includes("ACCESSORIES:")
    );
  }

  function cleanText(text) {
    let t = normalizeText(text);

    t = t.replace(/^PRICE_[^,]*,\s*/i, "");
    t = t.replace(/\bWIDTHINC:[^,]*,?\s*/gi, "");
    t = t.replace(/\bLENGTHINC:[^,]*,?\s*/gi, "");
    t = t.replace(/\bCONTROL LENGTH:N\/A,?\s*/gi, "");
    t = t.replace(/\bMOTOR CONTROL:1 CHANNEL REMOTE,?\s*/gi, "");
    t = t.replace(/\bN\/A\b/gi, "—");
    t = t.replace(/\s*,\s*/g, ", ");
    t = t.replace(/\s*:\s*/g, ": ");

    return t;
  }

  function splitText(text) {
    const parts = cleanText(text)
      .split(",")
      .map(s => normalizeText(s))
      .filter(Boolean);

    const main = [];
    const extra = [];

    parts.forEach(part => {
      const u = part.toUpperCase();

      if (
        u.startsWith("WIDTH:") ||
        u.startsWith("LENGTH:") ||
        u.startsWith("MOUNT:") ||
        u.startsWith("STYLE:")
      ) {
        main.push(part);
      } else {
        extra.push(part);
      }
    });

    return {
      main: main.join(" • "),
