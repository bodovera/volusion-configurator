(function () {
  "use strict";

  const DEBUG = true;

  const CONFIG = {
    tablesUrl: "https://bodovera.github.io/volusion-configurator/pricing/tables.json",
    configPriceName: "CONFIG_PRICE",
    visiblePriceLabel: "Product Price",

    widthSelectors: ['[name="width"]', '[name="Width"]', "#width", "#Width"],
    heightSelectors: ['[name="height"]', '[name="Height"]', "#height", "#Height"],

    priceSelectors: [".ProductPrice", '[itemprop="price"]', "#price", ".price"]
  };

  const state = {
    tables: null,
    loading: false
  };

  function log(...args) {
    if (DEBUG) console.log("[Pricing]", ...args);
  }

  function money(n) {
    return "$" + Number(n || 0).toFixed(2);
  }

  function parseMoney(v) {
    if (typeof v === "number") return v;
    return parseFloat(String(v || "").replace(/[^0-9.-]/g, "")) || 0;
  }

  function first(selectors) {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  function getNumber(selectors) {
    const el = first(selectors);
    if (!el) return 0;
    return parseFloat(el.value || el.textContent || 0) || 0;
  }

  function normalizeKey(str) {
    return String(str || "")
      .replace(/\[|\]|\(|\)|#/g, " ")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .replace(/^_+|_+$/g, "")
      .toLowerCase();
  }

  function getSelections() {
    const selections = {};

    document.querySelectorAll("select").forEach((el) => {
      if (!el.name) return;
      const key = normalizeKey(el.name);
      const value = (el.value || "").trim();
      if (value) selections[key] = value;
    });

    document.querySelectorAll('input[type="radio"]:checked').forEach((el) => {
      if (!el.name) return;
      const key = normalizeKey(el.name);
      const value = (el.value || "").trim();
      if (value) selections[key] = value;
    });

    document.querySelectorAll('input[type="text"], input[type="number"]').forEach((el) => {
      if (!el.name) return;
      const key = normalizeKey(el.name);
      const value = (el.value || "").trim();
      if (value) selections[key] = value;
    });

    return selections;
  }

  async function loadTables() {
    if (state.tables) return state.tables;
    if (state.loading) {
      return new Promise((resolve) => {
        const wait = setInterval(() => {
          if (state.tables) {
            clearInterval(wait);
            resolve(state.tables);
          }
        }, 50);
      });
    }

    state.loading = true;
    const res = await fetch(CONFIG.tablesUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load tables.json");
    state.tables = await res.json();
    state.loading = false;
    log("tables loaded", state.tables);
    return state.tables;
  }

  function roundUpToBreak(value, breaks) {
    const n = Number(value || 0);
    const sorted = (breaks || []).map(Number).sort((a, b) => a - b);

    for (const b of sorted) {
      if (n <= b) return b;
    }

    return sorted.length ? sorted[sorted.length - 1] : n;
  }

  function getProductCode() {
    const candidates = [
      document.querySelector('[name="ProductCode"]'),
      document.querySelector("#ProductCode"),
      document.querySelector(".ProductCode"),
      document.querySelector("[data-product-code]")
    ].filter(Boolean);

    for (const el of candidates) {
      if (el.value) return el.value.trim();
      if (el.dataset?.productCode) return el.dataset.productCode.trim();
      const txt = (el.textContent || "").trim();
      if (txt) return txt;
    }

    return "default";
  }

  function getPricingContext(tables) {
    const productCode = getProductCode();

    return (
      (tables.products && tables.products[productCode]) ||
      tables[productCode] ||
      tables.default ||
      null
    );
  }

  function getBaseTablePrice(context, width, height) {
    const widthBreaks = context.widthBreaks || context.widths || [];
    const heightBreaks = context.heightBreaks || context.heights || [];

    const useWidth = roundUpToBreak(width, widthBreaks);
    const useHeight = roundUpToBreak(height, heightBreaks);

    let basePrice = 0;

    if (
      context.table &&
      context.table[String(useWidth)] &&
      context.table[String(useWidth)][String(useHeight)] != null
    ) {
      basePrice = parseMoney(context.table[String(useWidth)][String(useHeight)]);
    }

    return { basePrice, useWidth, useHeight };
  }

  function getUpcharges(context, selections) {
    let total = 0;
    const upcharges = context?.upcharges || {};

    Object.keys(upcharges).forEach((rawKey) => {
      const normalized = normalizeKey(rawKey);
      const selectedValue = selections[normalized];
      if (!selectedValue) return;

      const map = upcharges[rawKey] || upcharges[normalized] || {};
      if (map[selectedValue] != null) {
        total += parseMoney(map[selectedValue]);
      }
    });

    return total;
  }

  function updateVisiblePrice(price) {
    const formatted = money(price);

    CONFIG.priceSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        el.textContent = formatted;
      });
    });

    document.querySelectorAll(".ProductPrice_Name, #ProductPrice_Name, [name='ProductPrice_Name']").forEach((el) => {
      el.textContent = CONFIG.visiblePriceLabel;
    });
  }

  function findConfigPriceSelect() {
    const selects = document.querySelectorAll("select");

    for (const select of selects) {
      const name = (select.name || "").toUpperCase();
      const id = (select.id || "").toUpperCase();
      const row = select.closest("tr, li, p, div, .form-row, .option-row");
      const rowText = (row?.textContent || "").toUpperCase();

      if (
        name.includes(CONFIG.configPriceName) ||
        id.includes(CONFIG.configPriceName) ||
        rowText.includes(CONFIG.configPriceName) ||
        rowText.includes("CALCULATED PRICE")
      ) {
        return select;
      }
    }

    return null;
  }

  function injectVolusionPrice(price) {
    const select = findConfigPriceSelect();
    if (!select || !select.options.length) {
      log("CONFIG_PRICE select not found");
      return false;
    }

    const formatted = Number(price || 0).toFixed(2);
    const option = select.options[0];

    option.text = `Calculated Price|+${formatted}`;
    select.selectedIndex = 0;
    select.dispatchEvent(new Event("change", { bubbles: true }));

    log("Injected CONFIG_PRICE", formatted);
    return true;
  }

  async function calculatePrice() {
    const tables = await loadTables();
    const context = getPricingContext(tables);

    if (!context) {
      log("No pricing context found");
      return;
    }

    const width = getNumber(CONFIG.widthSelectors);
    const height = getNumber(CONFIG.heightSelectors);
    const selections = getSelections();

    const { basePrice, useWidth, useHeight } = getBaseTablePrice(context, width, height);
    const upcharges = getUpcharges(context, selections);
    const finalPrice = basePrice + upcharges;

    log("Entered", { width, height });
    log("Rounded", { useWidth, useHeight });
    log("Base", basePrice);
    log("Upcharges", upcharges);
    log("Final", finalPrice);

    updateVisiblePrice(finalPrice);
    injectVolusionPrice(finalPrice);
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function bind() {
    const rerun = debounce(() => {
      calculatePrice().catch(console.error);
    }, 120);

    document.addEventListener("change", rerun);
    document.addEventListener("input", rerun);

    const addToCart = document.querySelector('input[type="submit"], button[type="submit"], .AddToCartButton');
    if (addToCart) {
      addToCart.addEventListener("click", () => {
        calculatePrice().catch(console.error);
      });
    }
  }

  async function init() {
    await loadTables();
    bind();
    await calculatePrice();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init().catch(console.error));
  } else {
    init().catch(console.error);
  }
})();
