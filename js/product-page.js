(function () {
  "use strict";

  const DEBUG = true;

  const CONFIG = {
    tablesUrl: "https://bodovera.github.io/volusion-configurator/pricing/tables.json"
  };

  let tables = null;

  function log(...args) {
    if (DEBUG) console.log("[Pricing]", ...args);
  }

  function money(n) {
    return "$" + Number(n || 0).toFixed(2);
  }

  async function loadTables() {
    if (tables) return tables;

    const res = await fetch(CONFIG.tablesUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load tables.json");
    tables = await res.json();
    log("Loaded tables:", tables);
    return tables;
  }

  function getHeadingBlock(labelText) {
    const els = document.querySelectorAll("h1, h2, h3, h4, h5, h6, p, div, span, label");
    for (const el of els) {
      const txt = (el.textContent || "").replace(/\s+/g, " ").trim().toUpperCase();
      if (txt === labelText.toUpperCase()) {
        return el;
      }
    }
    return null;
  }

  function getFirstSelectAfterHeading(labelText) {
    const heading = getHeadingBlock(labelText);
    if (!heading) {
      log("Heading not found:", labelText);
      return null;
    }

    let node = heading.nextElementSibling;
    while (node) {
      const select = node.matches?.("select") ? node : node.querySelector?.("select");
      if (select) return select;
      node = node.nextElementSibling;
    }

    log("Select not found after heading:", labelText);
    return null;
  }

  function getWidth() {
    const select = getFirstSelectAfterHeading("Width");
    return select ? parseFloat(select.value || 0) || 0 : 0;
  }

  function getLength() {
    const select = getFirstSelectAfterHeading("Length");
    return select ? parseFloat(select.value || 0) || 0 : 0;
  }

  function roundUp(value, breaks) {
    const n = Number(value || 0);
    const sorted = (breaks || []).map(Number).sort((a, b) => a - b);

    for (const b of sorted) {
      if (n <= b) return b;
    }

    return sorted.length ? sorted[sorted.length - 1] : n;
  }

  function findProductCode() {
    const all = document.querySelectorAll("p, div, span, td, li");
    for (const el of all) {
      const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (txt.startsWith("Product Code:")) {
        return txt.replace("Product Code:", "").trim();
      }
    }
    return "default";
  }

  function getPricingContext(allTables) {
    const productCode = findProductCode();
    return (
      (allTables.products && allTables.products[productCode]) ||
      allTables[productCode] ||
      allTables.default ||
      null
    );
  }

  function getBasePrice(context, width, length) {
    const widthBreaks = context.widthBreaks || context.widths || [];
    const lengthBreaks = context.lengthBreaks || context.heights || context.lengths || [];

    const useWidth = roundUp(width, widthBreaks);
    const useLength = roundUp(length, lengthBreaks);

    let basePrice = 0;

    if (
      context.table &&
      context.table[String(useWidth)] &&
      context.table[String(useWidth)][String(useLength)] != null
    ) {
      basePrice = parseFloat(context.table[String(useWidth)][String(useLength)]) || 0;
    }

    return { basePrice, useWidth, useLength };
  }

  function updateVisiblePrice(price) {
    const formatted = money(price);

    document.querySelectorAll(".ProductPrice, [itemprop='price'], #price, .price").forEach((el) => {
      el.textContent = formatted;
    });

    document.querySelectorAll(".ProductPrice_Name, #ProductPrice_Name").forEach((el) => {
      el.textContent = "Product Price";
    });
  }

  function findConfigPriceSelect() {
    const selects = document.querySelectorAll("select");

    for (const select of selects) {
      const optionText = Array.from(select.options).map(o => o.textContent || "").join(" ").toUpperCase();
      if (optionText.includes("CALCULATED PRICE|+")) {
        return select;
      }
    }

    return null;
  }

  function injectPrice(price) {
    const select = findConfigPriceSelect();
    if (!select || !select.options.length) {
      log("CONFIG_PRICE select not found");
      return false;
    }

    const formatted = Number(price || 0).toFixed(2);
    select.options[0].text = `Calculated Price|+${formatted}`;
    select.selectedIndex = 0;
    select.dispatchEvent(new Event("change", { bubbles: true }));

    log("Injected price into CONFIG_PRICE:", formatted);
    return true;
  }

  async function updatePrice() {
    try {
      const allTables = await loadTables();
      const context = getPricingContext(allTables);

      if (!context) {
        log("No pricing context found");
        return;
      }

      const width = getWidth();
      const length = getLength();

      const { basePrice, useWidth, useLength } = getBasePrice(context, width, length);

      log("Width entered:", width);
      log("Length entered:", length);
      log("Width used:", useWidth);
      log("Length used:", useLength);
      log("Base price:", basePrice);

      updateVisiblePrice(basePrice);
      injectPrice(basePrice);
    } catch (err) {
      console.error("[Pricing] Error:", err);
    }
  }

  function bind() {
    document.addEventListener("change", updatePrice);
    document.addEventListener("input", updatePrice);
  }

  async function init() {
    await loadTables();
    bind();
    updatePrice();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
