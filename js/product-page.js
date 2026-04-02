(function () {
  "use strict";

  const DEBUG = true;

  const CONFIG = {
    tablesUrl: "https://bodovera.github.io/volusion-configurator/pricing/tables.json"
  };

  let tables = null;

  const FRACTIONS = {
    "0": 0,
    "18": 0.125,
    "14": 0.25,
    "38": 0.375,
    "12": 0.5,
    "58": 0.625,
    "34": 0.75,
    "78": 0.875
  };

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

  function getProductCode() {
    const el = document.querySelector("[data-product-code]");
    if (!el) return "default";
    return (el.getAttribute("data-product-code") || "default").trim();
  }

  function getSelectedDoogmaValue(select) {
    if (!select) return 0;
    const opt = select.options[select.selectedIndex];
    if (!opt) return 0;
    return (opt.getAttribute("data-doogma-value") || "0").trim();
  }

  function getWholeAndFraction(wholeSelector, fractionSelector, label) {
    const wholeSelect = document.querySelector(`select.${wholeSelector}`);
    const fractionSelect = document.querySelector(`select.${fractionSelector}`);

    if (!wholeSelect) {
      log(`${label} whole select not found`, wholeSelector);
      return 0;
    }

    const wholeRaw = getSelectedDoogmaValue(wholeSelect);
    const fractionRaw = fractionSelect ? getSelectedDoogmaValue(fractionSelect) : "0";

    const whole = parseFloat(wholeRaw) || 0;
    const fraction = FRACTIONS[fractionRaw] ?? 0;

    log(`${label} whole raw:`, wholeRaw, "=>", whole);
    log(`${label} fraction raw:`, fractionRaw, "=>", fraction);

    return whole + fraction;
  }

  function getWidth() {
    return getWholeAndFraction("doogma-width", "doogma-widthinc", "Width");
  }

  function getLength() {
    return getWholeAndFraction("doogma-length", "doogma-lengthinc", "Length");
  }

  function roundUp(value, breaks) {
    const n = Number(value || 0);
    const sorted = (breaks || []).map(Number).sort((a, b) => a - b);

    for (const b of sorted) {
      if (n <= b) return b;
    }

    return sorted.length ? sorted[sorted.length - 1] : n;
  }

  function getContext(allTables) {
    const productCode = getProductCode();

    const context =
      (allTables.products && allTables.products[productCode]) ||
      allTables[productCode] ||
      allTables.default ||
      null;

    log("Product code:", productCode);
    log("Pricing context:", context);

    return context;
  }

  function getBasePrice(context, width, length) {
    const widthBreaks = context.widthBreaks || context.widths || [];
    const lengthBreaks = context.lengthBreaks || context.lengths || context.heights || [];

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

    log("Lookup keys tried:", {
      useWidth,
      useLength,
      availableWidths: Object.keys(context.table || {})
    });

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
      if (optionText.includes("CALCULATED PRICE")) {
        return select;
      }
    }

    return null;
  }

function injectPrice(price) {
  const select = findConfigPriceSelect();

  if (!select || !select.options.length) {
    log("CONFIG_PRICE select not found");
    return;
  }

  const formatted = Number(price || 0).toFixed(2);

  // Only update the hidden option text
  select.options[0].text = `Calculated Price|+${formatted}`;

  // Keep it selected
  select.selectedIndex = 0;

  log("Injected CONFIG_PRICE (NO change event):", formatted);
}
  
  async function updatePrice() {
    try {
      const allTables = await loadTables();
      const context = getContext(allTables);
      if (!context) return;

      const width = getWidth();
      const length = getLength();

      const { basePrice, useWidth, useLength } = getBasePrice(context, width, length);

      log("Entered dimensions:", { width, length });
      log("Rounded dimensions:", { useWidth, useLength });
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
