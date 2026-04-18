(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.TokkulEngine = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const BATCH_SIZES = [1, 5, 10, 50];
  const TZHAAR_PRICE_RULES = {
    withoutGloves: {
      shopSellMultiplier: 1.5,
      shopBuyMultiplier: 0.15,
      delta: 0.02,
    },
    withGloves: {
      shopSellMultiplier: 1.3,
      shopBuyMultiplier: 0.35,
      delta: 0.02,
    },
  };

  const TZHAAR_CATALOG_DATA = [
    {
      id: "fire-rune",
      name: "Fire rune",
      group: "Rune Store",
      storeName: "TzHaar-Mej-Roh's Rune Store",
      requiresFireCape: false,
      stock: 5000,
      itemValue: 4,
    },
    {
      id: "water-rune",
      name: "Water rune",
      group: "Rune Store",
      storeName: "TzHaar-Mej-Roh's Rune Store",
      requiresFireCape: false,
      stock: 5000,
      itemValue: 4,
    },
    {
      id: "air-rune",
      name: "Air rune",
      group: "Rune Store",
      storeName: "TzHaar-Mej-Roh's Rune Store",
      requiresFireCape: false,
      stock: 5000,
      itemValue: 4,
    },
    {
      id: "earth-rune",
      name: "Earth rune",
      group: "Rune Store",
      storeName: "TzHaar-Mej-Roh's Rune Store",
      requiresFireCape: false,
      stock: 5000,
      itemValue: 4,
    },
    {
      id: "mind-rune",
      name: "Mind rune",
      group: "Rune Store",
      storeName: "TzHaar-Mej-Roh's Rune Store",
      requiresFireCape: false,
      stock: 5000,
      itemValue: 3,
    },
    {
      id: "body-rune",
      name: "Body rune",
      group: "Rune Store",
      storeName: "TzHaar-Mej-Roh's Rune Store",
      requiresFireCape: false,
      stock: 5000,
      itemValue: 3,
    },
    {
      id: "chaos-rune",
      name: "Chaos rune",
      group: "Rune Store",
      storeName: "TzHaar-Mej-Roh's Rune Store",
      requiresFireCape: false,
      stock: 2500,
      itemValue: 90,
    },
    {
      id: "death-rune",
      name: "Death rune",
      group: "Rune Store",
      storeName: "TzHaar-Mej-Roh's Rune Store",
      requiresFireCape: false,
      stock: 2500,
      itemValue: 180,
    },
    {
      id: "tzhaar-fire-rune-pack",
      name: "Tzhaar fire rune pack",
      group: "Rune Store",
      storeName: "TzHaar-Mej-Roh's Rune Store",
      requiresFireCape: false,
      stock: 50,
      itemValue: 430,
    },
    {
      id: "tzhaar-water-rune-pack",
      name: "Tzhaar water rune pack",
      group: "Rune Store",
      storeName: "TzHaar-Mej-Roh's Rune Store",
      requiresFireCape: false,
      stock: 50,
      itemValue: 430,
    },
    {
      id: "tzhaar-air-rune-pack",
      name: "Tzhaar air rune pack",
      group: "Rune Store",
      storeName: "TzHaar-Mej-Roh's Rune Store",
      requiresFireCape: false,
      stock: 50,
      itemValue: 430,
    },
    {
      id: "tzhaar-earth-rune-pack",
      name: "Tzhaar earth rune pack",
      group: "Rune Store",
      storeName: "TzHaar-Mej-Roh's Rune Store",
      requiresFireCape: false,
      stock: 50,
      itemValue: 430,
    },
    {
      id: "tin-ore",
      name: "Tin ore",
      group: "Outer City Ore & Gems",
      storeName: "TzHaar-Hur-Lek's Ore and Gem Store",
      requiresFireCape: false,
      stock: 5,
      itemValue: 3,
    },
    {
      id: "copper-ore",
      name: "Copper ore",
      group: "Outer City Ore & Gems",
      storeName: "TzHaar-Hur-Lek's Ore and Gem Store",
      requiresFireCape: false,
      stock: 5,
      itemValue: 3,
    },
    {
      id: "iron-ore",
      name: "Iron ore",
      group: "Outer City Ore & Gems",
      storeName: "TzHaar-Hur-Lek's Ore and Gem Store",
      requiresFireCape: false,
      stock: 2,
      itemValue: 17,
    },
    {
      id: "uncut-sapphire",
      name: "Uncut sapphire",
      group: "Outer City Ore & Gems",
      storeName: "TzHaar-Hur-Lek's Ore and Gem Store",
      requiresFireCape: false,
      stock: 1,
      itemValue: 25,
    },
    {
      id: "uncut-emerald",
      name: "Uncut emerald",
      group: "Outer City Ore & Gems",
      storeName: "TzHaar-Hur-Lek's Ore and Gem Store",
      requiresFireCape: false,
      stock: 1,
      itemValue: 50,
    },
    {
      id: "uncut-onyx",
      name: "Uncut onyx",
      group: "Outer City Ore & Gems",
      storeName: "TzHaar-Hur-Lek's Ore and Gem Store",
      requiresFireCape: false,
      stock: 1,
      itemValue: 200000,
    },
    {
      id: "onyx-bolt-tips",
      name: "Onyx bolt tips",
      group: "Outer City Ore & Gems",
      storeName: "TzHaar-Hur-Lek's Ore and Gem Store",
      requiresFireCape: false,
      stock: 50,
      itemValue: 1000,
    },
    {
      id: "toktz-xil-ul",
      name: "Toktz-xil-ul",
      group: "Obsidian Gear",
      storeName: "TzHaar-Hur-Tel's Equipment Store",
      requiresFireCape: false,
      stock: 500,
      itemValue: 250,
    },
    {
      id: "toktz-xil-ak",
      name: "Toktz-xil-ak",
      group: "Obsidian Gear",
      storeName: "TzHaar-Hur-Tel's Equipment Store",
      requiresFireCape: false,
      stock: 1,
      itemValue: 40000,
    },
    {
      id: "toktz-xil-ek",
      name: "Toktz-xil-ek",
      group: "Obsidian Gear",
      storeName: "TzHaar-Hur-Tel's Equipment Store",
      requiresFireCape: false,
      stock: 1,
      itemValue: 25000,
    },
    {
      id: "tzhaar-ket-om",
      name: "Tzhaar-ket-om",
      group: "Obsidian Gear",
      storeName: "TzHaar-Hur-Tel's Equipment Store",
      requiresFireCape: false,
      stock: 1,
      itemValue: 50001,
    },
    {
      id: "toktz-mej-tal",
      name: "Toktz-mej-tal",
      group: "Obsidian Gear",
      storeName: "TzHaar-Hur-Tel's Equipment Store",
      requiresFireCape: false,
      stock: 1,
      itemValue: 35000,
    },
    {
      id: "tzhaar-ket-em",
      name: "Tzhaar-ket-em",
      group: "Obsidian Gear",
      storeName: "TzHaar-Hur-Tel's Equipment Store",
      requiresFireCape: false,
      stock: 1,
      itemValue: 30000,
    },
    {
      id: "obsidian-cape",
      name: "Obsidian cape",
      group: "Obsidian Gear",
      storeName: "TzHaar-Hur-Tel's Equipment Store",
      requiresFireCape: false,
      stock: 1,
      itemValue: 60000,
    },
    {
      id: "toktz-ket-xil",
      name: "Toktz-ket-xil",
      group: "Obsidian Gear",
      storeName: "TzHaar-Hur-Tel's Equipment Store",
      requiresFireCape: false,
      stock: 1,
      itemValue: 45000,
    },
    {
      id: "silver-ore",
      name: "Silver ore",
      group: "Inner City Extras",
      storeName: "TzHaar-Hur-Rin's Ore and Gem Store",
      requiresFireCape: true,
      stock: 12,
      itemValue: 75,
    },
    {
      id: "coal",
      name: "Coal",
      group: "Inner City Extras",
      storeName: "TzHaar-Hur-Rin's Ore and Gem Store",
      requiresFireCape: true,
      stock: 20,
      itemValue: 45,
    },
    {
      id: "gold-ore",
      name: "Gold ore",
      group: "Inner City Extras",
      storeName: "TzHaar-Hur-Rin's Ore and Gem Store",
      requiresFireCape: true,
      stock: 12,
      itemValue: 150,
    },
    {
      id: "mithril-ore",
      name: "Mithril ore",
      group: "Inner City Extras",
      storeName: "TzHaar-Hur-Rin's Ore and Gem Store",
      requiresFireCape: true,
      stock: 4,
      itemValue: 162,
    },
    {
      id: "adamantite-ore",
      name: "Adamantite ore",
      group: "Inner City Extras",
      storeName: "TzHaar-Hur-Rin's Ore and Gem Store",
      requiresFireCape: true,
      stock: 2,
      itemValue: 400,
    },
    {
      id: "runite-ore",
      name: "Runite ore",
      group: "Inner City Extras",
      storeName: "TzHaar-Hur-Rin's Ore and Gem Store",
      requiresFireCape: true,
      stock: 1,
      itemValue: 3200,
    },
    {
      id: "uncut-ruby",
      name: "Uncut ruby",
      group: "Inner City Extras",
      storeName: "TzHaar-Hur-Rin's Ore and Gem Store",
      requiresFireCape: true,
      stock: 8,
      itemValue: 100,
    },
    {
      id: "uncut-diamond",
      name: "Uncut diamond",
      group: "Inner City Extras",
      storeName: "TzHaar-Hur-Rin's Ore and Gem Store",
      requiresFireCape: true,
      stock: 6,
      itemValue: 200,
    },
    {
      id: "obsidian-helmet",
      name: "Obsidian helmet",
      group: "Inner City Extras",
      storeName: "TzHaar-Hur-Zal's Equipment Store",
      requiresFireCape: true,
      stock: 1,
      itemValue: 56320,
    },
    {
      id: "obsidian-platebody",
      name: "Obsidian platebody",
      group: "Inner City Extras",
      storeName: "TzHaar-Hur-Zal's Equipment Store",
      requiresFireCape: true,
      stock: 1,
      itemValue: 84000,
    },
    {
      id: "obsidian-platelegs",
      name: "Obsidian platelegs",
      group: "Inner City Extras",
      storeName: "TzHaar-Hur-Zal's Equipment Store",
      requiresFireCape: true,
      stock: 1,
      itemValue: 67000,
    },
  ];
  const TZHAAR_SPRITE_URLS = {
    "Adamantite ore": "https://oldschool.runescape.wiki/images/Adamantite_ore.png?c7acf",
    "Air rune": "https://oldschool.runescape.wiki/images/Air_rune.png?248b4",
    "Body rune": "https://oldschool.runescape.wiki/images/Body_rune.png?acf91",
    "Chaos rune": "https://oldschool.runescape.wiki/images/Chaos_rune.png?3fbd5",
    Coal: "https://oldschool.runescape.wiki/images/Coal.png?09bb0",
    "Copper ore": "https://oldschool.runescape.wiki/images/Copper_ore.png?2aac1",
    "Death rune": "https://oldschool.runescape.wiki/images/Death_rune.png?3a184",
    "Earth rune": "https://oldschool.runescape.wiki/images/Earth_rune.png?0b998",
    "Fire rune": "https://oldschool.runescape.wiki/images/Fire_rune.png?3859a",
    "Gold ore": "https://oldschool.runescape.wiki/images/Gold_ore.png?fc2ef",
    "Iron ore": "https://oldschool.runescape.wiki/images/Iron_ore.png?9e4d4",
    "Mind rune": "https://oldschool.runescape.wiki/images/Mind_rune.png?92ebd",
    "Mithril ore": "https://oldschool.runescape.wiki/images/Mithril_ore.png?8b58a",
    "Obsidian cape": "https://oldschool.runescape.wiki/images/Obsidian_cape.png?e6c2a",
    "Obsidian helmet": "https://oldschool.runescape.wiki/images/Obsidian_helmet.png?e6c2a",
    "Obsidian platebody": "https://oldschool.runescape.wiki/images/Obsidian_platebody.png?e6c2a",
    "Obsidian platelegs": "https://oldschool.runescape.wiki/images/Obsidian_platelegs.png?e6c2a",
    "Onyx bolt tips": "https://oldschool.runescape.wiki/images/Onyx_bolt_tips_5.png?3e70a",
    "Runite ore": "https://oldschool.runescape.wiki/images/Runite_ore.png?26f89",
    "Silver ore": "https://oldschool.runescape.wiki/images/Silver_ore.png?0df0a",
    "Tin ore": "https://oldschool.runescape.wiki/images/Tin_ore.png?04f28",
    "Toktz-ket-xil": "https://oldschool.runescape.wiki/images/Toktz-ket-xil.png?04f28",
    "Toktz-mej-tal": "https://oldschool.runescape.wiki/images/Toktz-mej-tal.png?c9227",
    "Toktz-xil-ak": "https://oldschool.runescape.wiki/images/Toktz-xil-ak.png?c9227",
    "Toktz-xil-ek": "https://oldschool.runescape.wiki/images/Toktz-xil-ek.png?04f28",
    "Toktz-xil-ul": "https://oldschool.runescape.wiki/images/Toktz-xil-ul.png?04f28",
    "Tzhaar-ket-em": "https://oldschool.runescape.wiki/images/Tzhaar-ket-em.png?fc550",
    "Tzhaar-ket-om": "https://oldschool.runescape.wiki/images/Tzhaar-ket-om.png?08f42",
    "Tzhaar air rune pack": "https://oldschool.runescape.wiki/images/Tzhaar_air_rune_pack.png?08f42",
    "Tzhaar earth rune pack": "https://oldschool.runescape.wiki/images/Tzhaar_earth_rune_pack.png?08f42",
    "Tzhaar fire rune pack": "https://oldschool.runescape.wiki/images/Tzhaar_fire_rune_pack.png?08f42",
    "Tzhaar water rune pack": "https://oldschool.runescape.wiki/images/Tzhaar_water_rune_pack.png?08f42",
    "Uncut diamond": "https://oldschool.runescape.wiki/images/Uncut_diamond.png?ad4b1",
    "Uncut emerald": "https://oldschool.runescape.wiki/images/Uncut_emerald.png?fc550",
    "Uncut onyx": "https://oldschool.runescape.wiki/images/Uncut_onyx.png?ad4b1",
    "Uncut ruby": "https://oldschool.runescape.wiki/images/Uncut_ruby.png?ad4b1",
    "Uncut sapphire": "https://oldschool.runescape.wiki/images/Uncut_sapphire.png?3f8f7",
    "Water rune": "https://oldschool.runescape.wiki/images/Water_rune.png?75a26",
  };

  const PRESETS = {
    "chaos-standard": {
      id: "chaos-standard",
      label: "Chaos rune via standard rune shop",
      itemName: "Chaos rune",
      itemValue: 90,
      sourceShopName: "Standard rune shop pricing",
      sourceShop: {
        baseStock: 250,
        sellsAtMultiplier: 1.0,
        delta: 0.001,
        virtualInfinite: false,
      },
      targetShopName: "TzHaar-Mej-Roh's Rune Store",
      targetWithoutGloves: {
        baseStock: 2500,
        buysAtMultiplier: TZHAAR_PRICE_RULES.withoutGloves.shopBuyMultiplier,
        delta: TZHAAR_PRICE_RULES.withoutGloves.delta,
      },
      targetWithGloves: {
        baseStock: 2500,
        buysAtMultiplier: TZHAAR_PRICE_RULES.withGloves.shopBuyMultiplier,
        delta: TZHAAR_PRICE_RULES.withGloves.delta,
      },
    },
    "death-standard": {
      id: "death-standard",
      label: "Death rune via standard rune shop",
      itemName: "Death rune",
      itemValue: 180,
      sourceShopName: "Standard rune shop pricing",
      sourceShop: {
        baseStock: 250,
        sellsAtMultiplier: 1.0,
        delta: 0.001,
        virtualInfinite: false,
      },
      targetShopName: "TzHaar-Mej-Roh's Rune Store",
      targetWithoutGloves: {
        baseStock: 2500,
        buysAtMultiplier: TZHAAR_PRICE_RULES.withoutGloves.shopBuyMultiplier,
        delta: TZHAAR_PRICE_RULES.withoutGloves.delta,
      },
      targetWithGloves: {
        baseStock: 2500,
        buysAtMultiplier: TZHAAR_PRICE_RULES.withGloves.shopBuyMultiplier,
        delta: TZHAAR_PRICE_RULES.withGloves.delta,
      },
    },
  };

  function truncate(num) {
    return Math.floor(Number(num) + 0.000001);
  }

  function clampPositiveInteger(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.max(1, truncate(parsed));
  }

  function percentToMultiplier(percentValue) {
    return Number(percentValue) / 100;
  }

  function calculateNormalTzhaarPurchasePrice(itemValue, useKaramjaGloves) {
    const profile = useKaramjaGloves
      ? TZHAAR_PRICE_RULES.withGloves
      : TZHAAR_PRICE_RULES.withoutGloves;

    return truncate(Math.max(itemValue * profile.shopSellMultiplier, itemValue * 0.1));
  }

  function getTzhaarCatalog() {
    return TZHAAR_CATALOG_DATA.map((item) => ({
      ...item,
      priceWithoutGloves: calculateNormalTzhaarPurchasePrice(item.itemValue, false),
      priceWithGloves: calculateNormalTzhaarPurchasePrice(item.itemValue, true),
      spriteUrl: TZHAAR_SPRITE_URLS[item.name] || "",
    }));
  }

  function calculateTzhaarSelectionTotal(selections, useKaramjaGloves) {
    const catalogById = new Map(getTzhaarCatalog().map((item) => [item.id, item]));
    const breakdown = [];
    let totalTokkul = 0;
    let selectedCount = 0;
    let totalQuantity = 0;

    for (const selection of selections || []) {
      const item = catalogById.get(selection.id);
      if (!item) {
        continue;
      }

      const quantity = clampPositiveInteger(selection.quantity, 1);
      const unitPrice = useKaramjaGloves ? item.priceWithGloves : item.priceWithoutGloves;
      const subtotal = unitPrice * quantity;

      totalTokkul += subtotal;
      selectedCount += 1;
      totalQuantity += quantity;

      breakdown.push({
        ...item,
        quantity,
        unitPrice,
        subtotal,
      });
    }

    return {
      totalTokkul,
      selectedCount,
      totalQuantity,
      breakdown,
    };
  }

  function buildPresetRoute(presetId, useKaramjaGloves) {
    const preset = PRESETS[presetId];
    if (!preset) {
      throw new Error("Unknown preset: " + presetId);
    }

    return {
      mode: "preset",
      id: preset.id,
      label: preset.label,
      itemName: preset.itemName,
      itemValue: preset.itemValue,
      sourceShopName: preset.sourceShopName,
      targetShopName: preset.targetShopName,
      useKaramjaGloves: Boolean(useKaramjaGloves),
      sourceShop: { ...preset.sourceShop },
      targetShop: {
        ...(useKaramjaGloves ? preset.targetWithGloves : preset.targetWithoutGloves),
      },
    };
  }

  function buildCustomRoute(config) {
    return {
      mode: "custom",
      id: "custom",
      label: (config.itemName || "Custom item").trim() || "Custom item",
      itemName: (config.itemName || "Custom item").trim() || "Custom item",
      itemValue: clampPositiveInteger(config.itemValue, 1),
      sourceShopName: "Custom source shop",
      targetShopName: "Custom target shop",
      useKaramjaGloves: false,
      sourceShop: {
        baseStock: clampPositiveInteger(config.sourceStock, 1),
        sellsAtMultiplier: percentToMultiplier(config.sourceSellsAt),
        delta: percentToMultiplier(config.sourceDelta),
        virtualInfinite: Boolean(config.sourceVirtualInfinite),
      },
      targetShop: {
        baseStock: clampPositiveInteger(config.targetStock, 1),
        buysAtMultiplier: percentToMultiplier(config.targetBuysAt),
        delta: percentToMultiplier(config.targetDelta),
      },
    };
  }

  function applyBuyBounds(itemValue, sellsAtMultiplier, value) {
    const upperBound = truncate(itemValue * (sellsAtMultiplier + 5));
    const lowerBound = truncate(itemValue * (sellsAtMultiplier - 1));
    const lowererBound = truncate(itemValue * 0.1);
    const minimumBound = 1;

    if (value > upperBound) {
      return upperBound;
    }
    if (value < minimumBound) {
      return minimumBound;
    }
    if (value < lowererBound) {
      return lowererBound;
    }
    if (value < lowerBound) {
      return lowerBound;
    }

    return value;
  }

  function applySellBounds(itemValue, buysAtMultiplier, value) {
    const upperBound = truncate(itemValue * (1 + buysAtMultiplier));
    const lowerBound = truncate(itemValue * 0.1);

    if (value > upperBound) {
      return upperBound;
    }
    if (value <= lowerBound) {
      return lowerBound;
    }

    return value;
  }

  function calculateBuyTotal(params) {
    let currentStock = clampPositiveInteger(params.currentStock, 1);
    const baseStock = clampPositiveInteger(params.baseStock, 1);
    const quantityBought = clampPositiveInteger(params.quantityBought, 1);
    const itemValue = clampPositiveInteger(params.itemValue, 1);
    const sellsAtMultiplier = Number(params.sellsAtMultiplier);
    const delta = Number(params.delta);
    const virtualInfinite = Boolean(params.virtualInfinite);
    const basePrice = truncate(itemValue * sellsAtMultiplier);
    let total = 0;

    if (!virtualInfinite && quantityBought > currentStock) {
      return {
        valid: false,
        reason: "Buy batch is larger than the source shop's base stock.",
      };
    }

    for (let i = quantityBought; i >= 1; i -= 1) {
      let price = 0;

      if (currentStock > baseStock) {
        const stockDelta = currentStock - baseStock;
        price = truncate(itemValue / (stockDelta * delta + sellsAtMultiplier));
      } else if (currentStock === baseStock) {
        price = basePrice;
      } else {
        const stockDelta = baseStock - currentStock;
        price = truncate(itemValue * (stockDelta * delta + sellsAtMultiplier));
      }

      total += applyBuyBounds(itemValue, sellsAtMultiplier, price);
      currentStock -= 1;
    }

    return {
      valid: true,
      total,
    };
  }

  function calculateSellTotal(params) {
    let currentStock = clampPositiveInteger(params.currentStock, 1);
    const baseStock = clampPositiveInteger(params.baseStock, 1);
    const quantitySold = clampPositiveInteger(params.quantitySold, 1);
    const itemValue = clampPositiveInteger(params.itemValue, 1);
    const buysAtMultiplier = Number(params.buysAtMultiplier);
    const delta = Number(params.delta);
    const basePrice = truncate(itemValue * buysAtMultiplier);
    let total = 0;

    for (let i = quantitySold; i >= 1; i -= 1) {
      let payout = 0;

      if (currentStock < baseStock) {
        const stockDelta = baseStock - currentStock;
        payout = truncate(itemValue * (buysAtMultiplier + delta * stockDelta));
      } else if (currentStock === baseStock) {
        payout = basePrice;
      } else {
        const stockDelta = currentStock - baseStock;
        payout = truncate(itemValue * (buysAtMultiplier - delta * stockDelta));
      }

      total += applySellBounds(itemValue, buysAtMultiplier, payout);
      currentStock += 1;
    }

    return {
      valid: true,
      total,
    };
  }

  function calculateStrategy(route, targetTokkul, buyBatch, sellBatch) {
    const cleanTargetTokkul = Math.max(1, truncate(targetTokkul));
    const cleanBuyBatch = clampPositiveInteger(buyBatch, 1);
    const cleanSellBatch = clampPositiveInteger(sellBatch, 1);

    const buyBatchCost = calculateBuyTotal({
      itemValue: route.itemValue,
      sellsAtMultiplier: route.sourceShop.sellsAtMultiplier,
      delta: route.sourceShop.delta,
      baseStock: route.sourceShop.baseStock,
      currentStock: route.sourceShop.baseStock,
      quantityBought: cleanBuyBatch,
      virtualInfinite: route.sourceShop.virtualInfinite,
    });

    if (!buyBatchCost.valid) {
      return {
        valid: false,
        buyBatch: cleanBuyBatch,
        sellBatch: cleanSellBatch,
        reason: buyBatchCost.reason,
      };
    }

    const sellBatchTokkul = calculateSellTotal({
      itemValue: route.itemValue,
      buysAtMultiplier: route.targetShop.buysAtMultiplier,
      delta: route.targetShop.delta,
      baseStock: route.targetShop.baseStock,
      currentStock: route.targetShop.baseStock,
      quantitySold: cleanSellBatch,
    });

    if (!sellBatchTokkul.valid || sellBatchTokkul.total <= 0) {
      return {
        valid: false,
        buyBatch: cleanBuyBatch,
        sellBatch: cleanSellBatch,
        reason: "That sell batch produces no Tokkul with the current settings.",
      };
    }

    const sellBatchesNeeded = Math.ceil(cleanTargetTokkul / sellBatchTokkul.total);
    const itemsNeeded = sellBatchesNeeded * cleanSellBatch;
    const buyBatchesNeeded = Math.ceil(itemsNeeded / cleanBuyBatch);
    const itemsBought = buyBatchesNeeded * cleanBuyBatch;
    const gpSpent = buyBatchesNeeded * buyBatchCost.total;
    const tokkulReached = sellBatchesNeeded * sellBatchTokkul.total;

    return {
      valid: true,
      buyBatch: cleanBuyBatch,
      sellBatch: cleanSellBatch,
      targetTokkul: cleanTargetTokkul,
      gpSpent,
      tokkulReached,
      overshootTokkul: tokkulReached - cleanTargetTokkul,
      itemsSold: itemsNeeded,
      itemsBought,
      leftoverItems: itemsBought - itemsNeeded,
      buyBatchCost: buyBatchCost.total,
      sellBatchTokkul: sellBatchTokkul.total,
      buyBatchesNeeded,
      sellBatchesNeeded,
      totalActions: buyBatchesNeeded + sellBatchesNeeded,
      gpPerTokkul: gpSpent / tokkulReached,
    };
  }

  function calculateAllStrategies(route, targetTokkul) {
    const strategies = [];

    for (const buyBatch of BATCH_SIZES) {
      for (const sellBatch of BATCH_SIZES) {
        strategies.push(calculateStrategy(route, targetTokkul, buyBatch, sellBatch));
      }
    }

    return strategies;
  }

  function pickBestStrategy(strategies) {
    const validStrategies = strategies.filter((strategy) => strategy.valid);
    if (validStrategies.length === 0) {
      return null;
    }

    return validStrategies.reduce((best, current) => {
      if (!best) {
        return current;
      }

      if (current.gpSpent !== best.gpSpent) {
        return current.gpSpent < best.gpSpent ? current : best;
      }

      if (current.totalActions !== best.totalActions) {
        return current.totalActions < best.totalActions ? current : best;
      }

      if (current.leftoverItems !== best.leftoverItems) {
        return current.leftoverItems < best.leftoverItems ? current : best;
      }

      if (current.sellBatch !== best.sellBatch) {
        return current.sellBatch > best.sellBatch ? current : best;
      }

      return current.buyBatch > best.buyBatch ? current : best;
    }, null);
  }

  function describeRoute(route) {
    return {
      label: route.label,
      itemName: route.itemName,
      itemValue: route.itemValue,
      sourceShopName: route.sourceShopName,
      sourceStock: route.sourceShop.baseStock,
      sourceSellsAtPercent: route.sourceShop.sellsAtMultiplier * 100,
      sourceDeltaPercent: route.sourceShop.delta * 100,
      sourceVirtualInfinite: route.sourceShop.virtualInfinite,
      targetShopName: route.targetShopName,
      targetStock: route.targetShop.baseStock,
      targetBuysAtPercent: route.targetShop.buysAtMultiplier * 100,
      targetDeltaPercent: route.targetShop.delta * 100,
      useKaramjaGloves: route.useKaramjaGloves,
    };
  }

  return {
    BATCH_SIZES,
    PRESETS,
    TZHAAR_PRICE_RULES,
    buildPresetRoute,
    buildCustomRoute,
    calculateBuyTotal,
    calculateSellTotal,
    calculateStrategy,
    calculateAllStrategies,
    calculateNormalTzhaarPurchasePrice,
    calculateTzhaarSelectionTotal,
    getTzhaarCatalog,
    pickBestStrategy,
    describeRoute,
    clampPositiveInteger,
    percentToMultiplier,
    truncate,
  };
});
