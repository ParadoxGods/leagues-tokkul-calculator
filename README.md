# Leagues Tokkul Calculator

Simple local GUI for estimating how much GP you need to turn into a target amount of Tokkul under a pinned-stock assumption.

## What it does

- Calculates shop prices with OSRS stock-based pricing instead of using flat item costs.
- Compares all `1 / 5 / 10 / 50` buy and sell batch combinations.
- Assumes each buy click and each sell click starts from fresh base stock again.
- Includes ready-made chaos-rune and death-rune presets, plus a custom mode.
- Includes a TzHaar shopping list with gloves-aware Tokkul prices for real Mor Ul Rek items.
- Can drive the route target directly from the selected shopping list.

## Run it

Open [index.html](./index.html) in a browser.

If you want a local server instead:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Verify the math

```powershell
node .\verify.js
```

## Notes on the model

- Buying from the source shop uses the OSRS shop buy formula with bounds.
- Selling to the Tokkul shop uses the OSRS shop sell formula with the standard 10% value floor.
- Shopping-list totals use each selected TzHaar item's normal-stock Tokkul price per copy at the current gloves setting.
- For preset routes, the target shop is modeled as TzHaar-Mej-Roh's Rune Store with:
  - `15.0%` buy price and `2.0%` stock delta without gloves.
  - `35.0%` buy price and `2.0%` stock delta with Karamja gloves.
- Standard rune-shop presets use `100.0%` sell price and `0.1%` price change per missing stock.

## Sources

- OSRS Wiki shop calculator module: https://oldschool.runescape.wiki/w/Module:Shop_calculator
- TzHaar-Mej-Roh's Rune Store: https://oldschool.runescape.wiki/w/TzHaar-Mej-Roh%27s_Rune_Store
- TzHaar-Hur-Lek's Ore and Gem Store: https://oldschool.runescape.wiki/w/TzHaar-Hur-Lek%27s_Ore_and_Gem_Store
- TzHaar-Hur-Rin's Ore and Gem Store: https://oldschool.runescape.wiki/w/TzHaar-Hur-Rin%27s_Ore_and_Gem_Store
- TzHaar-Hur-Tel's Equipment Store: https://oldschool.runescape.wiki/w/TzHaar-Hur-Tel%27s_Equipment_Store
- TzHaar-Hur-Zal's Equipment Store: https://oldschool.runescape.wiki/w/TzHaar-Hur-Zal%27s_Equipment_Store
- Aubury's Rune Shop: https://oldschool.runescape.wiki/w/Aubury%27s_Rune_Shop.
- The Runic Emporium: https://oldschool.runescape.wiki/w/The_Runic_Emporium
