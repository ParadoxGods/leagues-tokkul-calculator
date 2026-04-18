const assert = require("node:assert/strict");
const engine = require("./engine.js");

function check(label, actual, expected) {
  assert.equal(actual, expected, label + " expected " + expected + ", got " + actual);
  console.log("ok - " + label + " = " + expected);
}

const genericBuy = engine.calculateBuyTotal({
  itemValue: 80,
  sellsAtMultiplier: 1.0,
  delta: 0.01,
  baseStock: 600,
  currentStock: 601,
  quantityBought: 50,
  virtualInfinite: false,
});
check("Generic buy example", genericBuy.total, 4920);

const genericBuyUnderstock = engine.calculateBuyTotal({
  itemValue: 50,
  sellsAtMultiplier: 1.0,
  delta: 0.03,
  baseStock: 10,
  currentStock: 5,
  quantityBought: 1,
  virtualInfinite: false,
});
check("Generic understock buy example", genericBuyUnderstock.total, 57);

const genericSell = engine.calculateSellTotal({
  itemValue: 80,
  buysAtMultiplier: 1.0,
  delta: 0.01,
  baseStock: 600,
  currentStock: 600,
  quantitySold: 50,
});
check("Generic sell example", genericSell.total, 3000);

const genericSellWithFloor = engine.calculateSellTotal({
  itemValue: 80,
  buysAtMultiplier: 0.55,
  delta: 0.01,
  baseStock: 600,
  currentStock: 600,
  quantitySold: 50,
});
check("Generic sell floor example", genericSellWithFloor.total, 1210);

const deathWithGloves = engine.buildPresetRoute("death-standard", true);
const deathSell50 = engine.calculateSellTotal({
  itemValue: deathWithGloves.itemValue,
  buysAtMultiplier: deathWithGloves.targetShop.buysAtMultiplier,
  delta: deathWithGloves.targetShop.delta,
  baseStock: deathWithGloves.targetShop.baseStock,
  currentStock: deathWithGloves.targetShop.baseStock,
  quantitySold: 50,
});
check("Death rune sell-50 with gloves", deathSell50.total, 1199);

const deathWithoutGloves = engine.buildPresetRoute("death-standard", false);
const deathSell50NoGloves = engine.calculateSellTotal({
  itemValue: deathWithoutGloves.itemValue,
  buysAtMultiplier: deathWithoutGloves.targetShop.buysAtMultiplier,
  delta: deathWithoutGloves.targetShop.delta,
  baseStock: deathWithoutGloves.targetShop.baseStock,
  currentStock: deathWithoutGloves.targetShop.baseStock,
  quantitySold: 50,
});
check("Death rune sell-50 without gloves", deathSell50NoGloves.total, 915);

const shoppingListWithGloves = engine.calculateTzhaarSelectionTotal(
  [{ id: "uncut-onyx", quantity: 1 }],
  true
);
check("Onyx shopping list with gloves", shoppingListWithGloves.totalTokkul, 260000);

const shoppingListWithoutGloves = engine.calculateTzhaarSelectionTotal(
  [{ id: "uncut-onyx", quantity: 1 }],
  false
);
check("Onyx shopping list without gloves", shoppingListWithoutGloves.totalTokkul, 300000);

const shieldWithGloves = engine.calculateTzhaarSelectionTotal(
  [{ id: "toktz-ket-xil", quantity: 1 }],
  true
);
check("Toktz-ket-xil with gloves", shieldWithGloves.totalTokkul, 58500);

const shieldWithoutGloves = engine.calculateTzhaarSelectionTotal(
  [{ id: "toktz-ket-xil", quantity: 1 }],
  false
);
check("Toktz-ket-xil without gloves", shieldWithoutGloves.totalTokkul, 67500);

console.log("All verification checks passed.");
