(function () {
  "use strict";

  const engine = window.TokkulEngine;
  const formatter = new Intl.NumberFormat("en-US");
  const compactFormatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const catalog = engine.getTzhaarCatalog();
  const TRANSITION_MS = 220;

  const state = {
    step: 1,
    reportVisible: false,
    useKaramjaGloves: true,
    presetId: "death-standard",
    buyBatch: 50,
    sellBatch: 50,
  };

  const cartState = new Map();
  let activeStoreName = "";
  let reportTransitionTimer = 0;

  const setupView = document.getElementById("setupView");
  const reportView = document.getElementById("reportView");
  const step1View = document.getElementById("step1View");
  const step2View = document.getElementById("step2View");
  const step3View = document.getElementById("step3View");
  const setupStepText = document.getElementById("setupStepText");
  const wizardStepOneDot = document.getElementById("wizardStepOneDot");
  const wizardStepTwoDot = document.getElementById("wizardStepTwoDot");
  const wizardStepThreeDot = document.getElementById("wizardStepThreeDot");
  const setupGloves = document.getElementById("setupGloves");
  const reportGloves = document.getElementById("reportGloves");
  const reportPresetSelect = document.getElementById("reportPresetSelect");
  const reportBuyBatchSelect = document.getElementById("reportBuyBatchSelect");
  const reportSellBatchSelect = document.getElementById("reportSellBatchSelect");
  const toStep2Btn = document.getElementById("toStep2Btn");
  const backToStep1Btn = document.getElementById("backToStep1Btn");
  const toStep3Btn = document.getElementById("toStep3Btn");
  const backToStep2Btn = document.getElementById("backToStep2Btn");
  const showReportBtn = document.getElementById("showReportBtn");
  const changeItemsBtn = document.getElementById("changeItemsBtn");
  const errorBox = document.getElementById("errorBox");
  const routeDetails = document.getElementById("routeDetails");
  const comboTable = document.getElementById("comboTable");
  const catalogTabs = document.getElementById("catalogTabs");
  const catalogGroups = document.getElementById("catalogGroups");
  const reportLead = document.getElementById("reportLead");
  const reportSub = document.getElementById("reportSub");
  const reportTargetTokkul = document.getElementById("reportTargetTokkul");
  const reportSelectedItems = document.getElementById("reportSelectedItems");
  const reportRouteHint = document.getElementById("reportRouteHint");
  const step2RouteNote = document.getElementById("step2RouteNote");
  const step3RouteNote = document.getElementById("step3RouteNote");
  const step2NeedTokkul = document.getElementById("step2NeedTokkul");
  const step2SelectionCount = document.getElementById("step2SelectionCount");
  const step3NeedTokkul = document.getElementById("step3NeedTokkul");
  const step3BuyBatch = document.getElementById("step3BuyBatch");

  const setupCartSelectedItems = document.getElementById("setupCartSelectedItems");
  const setupCartTotalQuantity = document.getElementById("setupCartTotalQuantity");
  const setupCartTokkulTotal = document.getElementById("setupCartTokkulTotal");

  const summaryGp = document.getElementById("summaryGp");
  const summaryTokkul = document.getElementById("summaryTokkul");
  const summaryGpPerTokkul = document.getElementById("summaryGpPerTokkul");
  const summarySellLabel = document.getElementById("summarySellLabel");
  const summaryBuyLabel = document.getElementById("summaryBuyLabel");
  const summaryItemsSold = document.getElementById("summaryItemsSold");
  const summaryItemsBought = document.getElementById("summaryItemsBought");
  const summaryBuyBatches = document.getElementById("summaryBuyBatches");
  const summarySellBatches = document.getElementById("summarySellBatches");
  const summaryLeftover = document.getElementById("summaryLeftover");
  const summaryOvershoot = document.getElementById("summaryOvershoot");
  const summaryBuyBatchCost = document.getElementById("summaryBuyBatchCost");
  const summarySellBatchTokkul = document.getElementById("summarySellBatchTokkul");
  const summaryBestCombo = document.getElementById("summaryBestCombo");

  const customFields = document.getElementById("customFields");
  const customInputs = {
    itemName: document.getElementById("customItemName"),
    itemValue: document.getElementById("customItemValue"),
    sourceStock: document.getElementById("customSourceStock"),
    sourceSellsAt: document.getElementById("customSourceSellsAt"),
    sourceDelta: document.getElementById("customSourceDelta"),
    sourceVirtualInfinite: document.getElementById("customSourceInfinite"),
    targetStock: document.getElementById("customTargetStock"),
    targetBuysAt: document.getElementById("customTargetBuysAt"),
    targetDelta: document.getElementById("customTargetDelta"),
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
      const escaped = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return escaped[char];
    });
  }

  function formatNumber(value, suffix) {
    return formatter.format(Math.round(value)) + (suffix ? " " + suffix : "");
  }

  function formatCompact(value) {
    return compactFormatter.format(Math.round(value));
  }

  function scrollToTop(behavior) {
    window.scrollTo({
      top: 0,
      behavior: behavior || "smooth",
    });
  }

  function getCartEntry(itemId) {
    if (!cartState.has(itemId)) {
      cartState.set(itemId, { checked: false, quantity: 1 });
    }

    return cartState.get(itemId);
  }

  function readCartSelections() {
    return Array.from(cartState.entries())
      .filter(([, entry]) => entry.checked)
      .map(([id, entry]) => ({
        id,
        quantity: entry.quantity,
      }));
  }

  function buildRoute() {
    if (state.presetId === "custom") {
      return engine.buildCustomRoute({
        itemName: customInputs.itemName.value,
        itemValue: customInputs.itemValue.value,
        sourceStock: customInputs.sourceStock.value,
        sourceSellsAt: customInputs.sourceSellsAt.value,
        sourceDelta: customInputs.sourceDelta.value,
        sourceVirtualInfinite: customInputs.sourceVirtualInfinite.checked,
        targetStock: customInputs.targetStock.value,
        targetBuysAt: customInputs.targetBuysAt.value,
        targetDelta: customInputs.targetDelta.value,
      });
    }

    return engine.buildPresetRoute(state.presetId, state.useKaramjaGloves);
  }

  function setError(message) {
    if (!message) {
      errorBox.textContent = "";
      errorBox.classList.add("hidden");
      return;
    }

    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
  }

  function summarizeSelections(cart) {
    if (!cart.breakdown.length) {
      return "None";
    }

    if (cart.breakdown.length <= 3) {
      return cart.breakdown.map((item) => item.name + " x" + item.quantity).join(", ");
    }

    const remaining = cart.breakdown.length - 3;
    return (
      cart.breakdown
        .slice(0, 3)
        .map((item) => item.name + " x" + item.quantity)
        .join(", ") + " +" + remaining + " more"
    );
  }

  function describeSelectionCount(cart) {
    const label = cart.selectedCount === 1 ? "selected item" : "selected items";
    return formatNumber(cart.selectedCount) + " " + label;
  }

  function renderSetupBatchChoices() {
    document.querySelectorAll('[data-role="setup-buy-batch"]').forEach((button) => {
      button.classList.toggle("active", Number(button.dataset.value) === state.buyBatch);
    });

    document.querySelectorAll('[data-role="setup-sell-batch"]').forEach((button) => {
      button.classList.toggle("active", Number(button.dataset.value) === state.sellBatch);
    });
  }

  function renderCatalog() {
    const stores = new Map();

    for (const item of catalog) {
      if (!stores.has(item.storeName)) {
        stores.set(item.storeName, []);
      }
      stores.get(item.storeName).push(item);
    }

    const storeNames = Array.from(stores.keys());
    if (!activeStoreName || !stores.has(activeStoreName)) {
      activeStoreName = storeNames[0] || "";
    }

    let tabsHtml = "";
    for (const storeName of storeNames) {
      const activeClass = storeName === activeStoreName ? " active" : "";
      const shortLabel = storeName
        .replace("TzHaar-Mej-Roh's ", "")
        .replace("TzHaar-Hur-Lek's ", "")
        .replace("TzHaar-Hur-Rin's ", "")
        .replace("TzHaar-Hur-Tel's ", "")
        .replace("TzHaar-Hur-Zal's ", "")
        .replace(" Store", "")
        .replace(" and Gem", "")
        .replace(" Equipment", "");

      tabsHtml +=
        '<button class="catalog-tab' +
        activeClass +
        '" type="button" data-store-name="' +
        escapeHtml(storeName) +
        '">' +
        escapeHtml(shortLabel) +
        "</button>";
    }
    catalogTabs.innerHTML = tabsHtml;

    const activeItems = stores.get(activeStoreName) || [];
    const requiresFireCape = activeItems.some((item) => item.requiresFireCape);
    const note = requiresFireCape ? "Fire cape required for this store." : "Outer city store.";

    let html =
      '<section class="catalog-section">' +
      '<div class="catalog-section-head">' +
      "<div>" +
      "<h4>" +
      escapeHtml(activeStoreName) +
      "</h4>" +
      "<p>" +
      escapeHtml(note) +
      "</p>" +
      "</div>" +
      "</div>" +
      '<div class="shop-list">';

    for (const item of activeItems) {
      const sourceNote = item.requiresFireCape ? "Fire cape shop" : "TzHaar shop";

      html +=
        '<article class="shop-row" data-item-row="' +
        item.id +
        '">' +
        '<input class="catalog-check" type="checkbox" data-item-id="' +
        item.id +
        '" />' +
        '<button class="shop-row-main" type="button" data-role="toggle-item" data-item-id="' +
        item.id +
        '">' +
        '<span class="shop-row-sprite-wrap">' +
        '<img class="shop-row-sprite" loading="lazy" src="' +
        escapeHtml(item.spriteUrl) +
        '" alt="' +
        escapeHtml(item.name) +
        '" />' +
        "</span>" +
        '<span class="shop-row-name" title="' +
        escapeHtml(item.name) +
        '"><strong>' +
        escapeHtml(item.name) +
        "</strong><span>" +
        escapeHtml(sourceNote) +
        "</span></span>" +
        "</button>" +
        '<div class="shop-row-price" data-role="price" data-item-id="' +
        item.id +
        '">0 Tokkul</div>' +
        '<div class="shop-row-stock">Stock x' +
        item.stock +
        "</div>" +
        '<div class="shop-row-controls">' +
        '<button class="shop-qty-btn" type="button" aria-label="Decrease quantity for ' +
        escapeHtml(item.name) +
        '" title="Decrease quantity" data-role="decrement-item" data-item-id="' +
        item.id +
        '">&#8722;</button>' +
        '<input class="shop-row-qty" type="number" min="1" step="1" value="1" disabled data-item-id="' +
        item.id +
        '" />' +
        '<button class="shop-qty-btn" type="button" aria-label="Increase quantity for ' +
        escapeHtml(item.name) +
        '" title="Increase quantity" data-role="increment-item" data-item-id="' +
        item.id +
        '">+</button>' +
        "</div>" +
        '<div class="shop-row-subtotal" data-role="subtotal" data-item-id="' +
        item.id +
        '">Not selected</div>' +
        "</article>";
    }

    html += "</div></section>";
    catalogGroups.innerHTML = html;
  }

  function updateCatalogDisplay(cart) {
    const selectedById = new Map(cart.breakdown.map((item) => [item.id, item]));

    for (const item of catalog) {
      const checkbox = document.querySelector('.catalog-check[data-item-id="' + item.id + '"]');
      const quantityInput = document.querySelector('.shop-row-qty[data-item-id="' + item.id + '"]');
      const priceNode = document.querySelector('[data-role="price"][data-item-id="' + item.id + '"]');
      const subtotalNode = document.querySelector('[data-role="subtotal"][data-item-id="' + item.id + '"]');
      const row = document.querySelector('[data-item-row="' + item.id + '"]');
      const decrementButton = document.querySelector(
        '[data-role="decrement-item"][data-item-id="' + item.id + '"]'
      );

      if (!checkbox || !quantityInput || !priceNode || !subtotalNode || !row || !decrementButton) {
        continue;
      }

      const cartEntry = getCartEntry(item.id);
      const selectedItem = selectedById.get(item.id);
      const unitPrice = state.useKaramjaGloves ? item.priceWithGloves : item.priceWithoutGloves;

      checkbox.checked = cartEntry.checked;
      quantityInput.value = String(cartEntry.quantity);
      quantityInput.disabled = !cartEntry.checked;
      decrementButton.disabled = !cartEntry.checked;
      row.classList.toggle("selected", cartEntry.checked);
      priceNode.textContent = formatNumber(unitPrice, "Tokkul");

      if (selectedItem) {
        subtotalNode.textContent =
          "x" + selectedItem.quantity + " = " + formatNumber(selectedItem.subtotal, "Tokkul");
      } else {
        subtotalNode.textContent = "Not selected";
      }
    }
  }

  function renderSetup(cart, route) {
    setupView.classList.toggle("hidden", state.reportVisible);
    if (!state.reportVisible && !reportTransitionTimer) {
      setupView.classList.remove("is-transitioning-out");
    }

    step1View.classList.toggle("hidden", state.step !== 1);
    step2View.classList.toggle("hidden", state.step !== 2);
    step3View.classList.toggle("hidden", state.step !== 3);
    setupStepText.textContent = "Step " + state.step + " of 3";
    wizardStepOneDot.classList.toggle("active", state.step >= 1);
    wizardStepTwoDot.classList.toggle("active", state.step >= 2);
    wizardStepThreeDot.classList.toggle("active", state.step >= 3);
    setupGloves.checked = state.useKaramjaGloves;

    setupCartSelectedItems.textContent = formatNumber(cart.selectedCount);
    setupCartTotalQuantity.textContent = formatNumber(cart.totalQuantity);
    setupCartTokkulTotal.textContent = formatNumber(cart.totalTokkul, "Tokkul");
    toStep2Btn.disabled = cart.totalTokkul <= 0;
    toStep3Btn.disabled = cart.totalTokkul <= 0;
    showReportBtn.disabled = cart.totalTokkul <= 0;

    step2NeedTokkul.textContent = formatNumber(cart.totalTokkul, "Tokkul");
    step2SelectionCount.textContent = describeSelectionCount(cart);
    step3NeedTokkul.textContent = formatNumber(cart.totalTokkul, "Tokkul");
    step3BuyBatch.textContent = formatNumber(state.buyBatch);

    const routeMessage = "Route: " + route.label + ". You can change this later from the result.";
    step2RouteNote.textContent = routeMessage;
    step3RouteNote.textContent = routeMessage;
  }

  function renderReportControls() {
    reportGloves.checked = state.useKaramjaGloves;
    reportPresetSelect.value = state.presetId;
    reportBuyBatchSelect.value = String(state.buyBatch);
    reportSellBatchSelect.value = String(state.sellBatch);
    reportRouteHint.classList.toggle("hidden", state.presetId !== "custom");
    customFields.classList.toggle("hidden", state.presetId !== "custom");
  }

  function renderSummary(route, cart, selectedStrategy, bestStrategy) {
    const itemLabel =
      route.itemName.toLowerCase() + (selectedStrategy && selectedStrategy.itemsBought === 1 ? "" : "s");
    summaryBuyLabel.textContent = route.itemName + " to buy";
    summarySellLabel.textContent = route.itemName + " to sell";
    reportTargetTokkul.textContent = formatNumber(cart.totalTokkul, "Tokkul");
    reportSelectedItems.textContent = "Items: " + summarizeSelections(cart);

    if (!selectedStrategy || !selectedStrategy.valid) {
      reportLead.textContent = "No valid result";
      reportSub.textContent = "Adjust the route or batch sizes and try again.";
      summaryGp.textContent = "-";
      summaryTokkul.textContent = "-";
      summaryGpPerTokkul.textContent = "-";
      summaryItemsSold.textContent = "-";
      summaryItemsBought.textContent = "-";
      summaryBuyBatches.textContent = "-";
      summarySellBatches.textContent = "-";
      summaryLeftover.textContent = "-";
      summaryOvershoot.textContent = "-";
      summaryBuyBatchCost.textContent = "-";
      summarySellBatchTokkul.textContent = "-";
      summaryBestCombo.textContent = bestStrategy
        ? "Buy " + bestStrategy.buyBatch + " / Sell " + bestStrategy.sellBatch
        : "-";
      return;
    }

    reportLead.textContent = "Need " + formatNumber(selectedStrategy.gpSpent, "gp");
    reportSub.textContent =
      "Buy " +
      formatNumber(selectedStrategy.itemsBought) +
      " " +
      itemLabel +
      ", then sell " +
      formatNumber(selectedStrategy.itemsSold) +
      ". Use buy " +
      selectedStrategy.buyBatch +
      " and sell " +
      selectedStrategy.sellBatch +
      " to reach " +
      formatNumber(selectedStrategy.tokkulReached, "Tokkul") +
      ".";

    summaryGp.textContent = formatNumber(selectedStrategy.gpSpent, "gp");
    summaryTokkul.textContent = formatNumber(selectedStrategy.tokkulReached, "Tokkul");
    summaryGpPerTokkul.textContent = selectedStrategy.gpPerTokkul.toFixed(3) + " gp";
    summaryItemsSold.textContent = formatNumber(selectedStrategy.itemsSold);
    summaryItemsBought.textContent = formatNumber(selectedStrategy.itemsBought);
    summaryBuyBatches.textContent = formatNumber(selectedStrategy.buyBatchesNeeded);
    summarySellBatches.textContent = formatNumber(selectedStrategy.sellBatchesNeeded);
    summaryLeftover.textContent = formatNumber(selectedStrategy.leftoverItems);
    summaryOvershoot.textContent = formatNumber(selectedStrategy.overshootTokkul);
    summaryBuyBatchCost.textContent = formatNumber(selectedStrategy.buyBatchCost, "gp");
    summarySellBatchTokkul.textContent = formatNumber(selectedStrategy.sellBatchTokkul, "Tokkul");
    summaryBestCombo.textContent = bestStrategy
      ? "Buy " +
        bestStrategy.buyBatch +
        " / Sell " +
        bestStrategy.sellBatch +
        " (" +
        formatNumber(bestStrategy.gpSpent, "gp") +
        ")"
      : "-";
  }

  function renderRouteDetails(route, cart, selectedStrategy) {
    const info = engine.describeRoute(route);
    const selectedLine =
      cart.breakdown.length > 0
        ? "<p><strong>Selected items:</strong> " +
          cart.breakdown
            .map((item) => escapeHtml(item.name) + " x" + item.quantity)
            .join(", ") +
          "</p>"
        : "";
    const strategyLine =
      selectedStrategy && selectedStrategy.valid
        ? "<p><strong>Chosen batches:</strong> buy " +
          selectedStrategy.buyBatch +
          " at a time, sell " +
          selectedStrategy.sellBatch +
          " at a time.</p>"
        : "";

    routeDetails.innerHTML =
      "<p><strong>Route item:</strong> " +
      escapeHtml(info.itemName) +
      " (value " +
      formatNumber(info.itemValue) +
      ")</p>" +
      "<p><strong>Tokkul target:</strong> " +
      formatNumber(cart.totalTokkul, "Tokkul") +
      "</p>" +
      selectedLine +
      strategyLine +
      "<p><strong>Source shop:</strong> " +
      escapeHtml(info.sourceShopName) +
      " | sells at " +
      info.sourceSellsAtPercent.toFixed(1) +
      "% | change per missing " +
      info.sourceDeltaPercent.toFixed(1) +
      "%</p>" +
      "<p><strong>Target shop:</strong> " +
      escapeHtml(info.targetShopName) +
      " | buys at " +
      info.targetBuysAtPercent.toFixed(1) +
      "% | change per stock swing " +
      info.targetDeltaPercent.toFixed(1) +
      "%</p>" +
      "<p><strong>Karamja gloves:</strong> " +
      (info.useKaramjaGloves ? "Enabled" : "Disabled") +
      "</p>" +
      "<p><strong>Assumption:</strong> every buy click and every sell click starts from default stock again.</p>";
  }

  function renderComboTable(route, targetTokkul) {
    const strategies = engine.calculateAllStrategies(route, targetTokkul);
    const bestStrategy = engine.pickBestStrategy(strategies);
    const selectedKey = state.buyBatch + "-" + state.sellBatch;
    const bestKey = bestStrategy ? bestStrategy.buyBatch + "-" + bestStrategy.sellBatch : "";

    let html = "<thead><tr><th>Buy \\ Sell</th>";
    for (const sellBatch of engine.BATCH_SIZES) {
      html += "<th>" + sellBatch + "</th>";
    }
    html += "</tr></thead><tbody>";

    for (const buyBatch of engine.BATCH_SIZES) {
      html += "<tr><th>" + buyBatch + "</th>";

      for (const sellBatch of engine.BATCH_SIZES) {
        const strategy = strategies.find(
          (entry) => entry.buyBatch === buyBatch && entry.sellBatch === sellBatch
        );
        const key = buyBatch + "-" + sellBatch;

        if (!strategy || !strategy.valid) {
          html +=
            '<td><div class="combo-cell invalid" data-buy="' +
            buyBatch +
            '" data-sell="' +
            sellBatch +
            '"><span class="combo-price">Invalid</span><span class="combo-meta">' +
            escapeHtml(strategy ? strategy.reason : "Unavailable") +
            "</span></div></td>";
          continue;
        }

        const classes = ["combo-cell"];
        if (key === selectedKey) {
          classes.push("selected");
        }
        if (key === bestKey) {
          classes.push("best");
        }

        html +=
          '<td><div class="' +
          classes.join(" ") +
          '" data-buy="' +
          buyBatch +
          '" data-sell="' +
          sellBatch +
          '">' +
          '<span class="combo-price">' +
          formatNumber(strategy.gpSpent) +
          " gp</span>" +
          '<span class="combo-meta">' +
          formatNumber(strategy.tokkulReached) +
          " Tokkul<br>" +
          formatNumber(strategy.itemsBought) +
          " items<br>" +
          strategy.gpPerTokkul.toFixed(3) +
          " gp ea</span></div></td>";
      }

      html += "</tr>";
    }

    html += "</tbody>";
    comboTable.innerHTML = html;
    return bestStrategy;
  }

  function render() {
    const cart = engine.calculateTzhaarSelectionTotal(readCartSelections(), state.useKaramjaGloves);
    const route = buildRoute();

    renderCatalog();
    updateCatalogDisplay(cart);
    renderSetup(cart, route);
    renderSetupBatchChoices();
    reportView.classList.toggle("hidden", !state.reportVisible);
    renderReportControls();

    if (!state.reportVisible) {
      return;
    }

    if (cart.totalTokkul <= 0) {
      setError("Pick at least one TzHaar item to build the report.");
      renderSummary(route, cart, null, null);
      routeDetails.innerHTML = "";
      comboTable.innerHTML = "";
      return;
    }

    const selectedStrategy = engine.calculateStrategy(
      route,
      cart.totalTokkul,
      state.buyBatch,
      state.sellBatch
    );
    const bestStrategy = renderComboTable(route, cart.totalTokkul);
    renderSummary(route, cart, selectedStrategy, bestStrategy);
    renderRouteDetails(route, cart, selectedStrategy);

    if (!selectedStrategy.valid) {
      setError(selectedStrategy.reason || "No valid strategy.");
      return;
    }

    setError("");
  }

  function startReportTransition() {
    const cart = engine.calculateTzhaarSelectionTotal(readCartSelections(), state.useKaramjaGloves);
    if (cart.totalTokkul <= 0) {
      return;
    }

    if (reportTransitionTimer) {
      window.clearTimeout(reportTransitionTimer);
    }

    setupView.classList.add("is-transitioning-out");
    showReportBtn.disabled = true;

    reportTransitionTimer = window.setTimeout(() => {
      reportTransitionTimer = 0;
      state.reportVisible = true;
      setupView.classList.remove("is-transitioning-out");
      render();
      scrollToTop();
    }, TRANSITION_MS);
  }

  function attachEvents() {
    setupGloves.addEventListener("change", () => {
      state.useKaramjaGloves = setupGloves.checked;
      render();
    });

    reportGloves.addEventListener("change", () => {
      state.useKaramjaGloves = reportGloves.checked;
      render();
    });

    reportPresetSelect.addEventListener("change", () => {
      state.presetId = reportPresetSelect.value;
      render();
    });

    reportBuyBatchSelect.addEventListener("change", () => {
      state.buyBatch = Number(reportBuyBatchSelect.value);
      render();
    });

    reportSellBatchSelect.addEventListener("change", () => {
      state.sellBatch = Number(reportSellBatchSelect.value);
      render();
    });

    Object.values(customInputs).forEach((element) => {
      element.addEventListener("input", render);
      element.addEventListener("change", render);
    });

    document.addEventListener("click", (event) => {
      const buyButton = event.target.closest('[data-role="setup-buy-batch"]');
      if (buyButton) {
        state.buyBatch = Number(buyButton.dataset.value);
        render();
        return;
      }

      const sellButton = event.target.closest('[data-role="setup-sell-batch"]');
      if (sellButton) {
        state.sellBatch = Number(sellButton.dataset.value);
        render();
      }
    });

    toStep2Btn.addEventListener("click", () => {
      const cart = engine.calculateTzhaarSelectionTotal(readCartSelections(), state.useKaramjaGloves);
      if (cart.totalTokkul <= 0) {
        return;
      }
      state.step = 2;
      render();
      scrollToTop();
    });

    backToStep1Btn.addEventListener("click", () => {
      state.step = 1;
      render();
      scrollToTop();
    });

    toStep3Btn.addEventListener("click", () => {
      state.step = 3;
      render();
      scrollToTop();
    });

    backToStep2Btn.addEventListener("click", () => {
      state.step = 2;
      render();
      scrollToTop();
    });

    showReportBtn.addEventListener("click", startReportTransition);

    changeItemsBtn.addEventListener("click", () => {
      if (reportTransitionTimer) {
        window.clearTimeout(reportTransitionTimer);
        reportTransitionTimer = 0;
      }
      state.reportVisible = false;
      state.step = 1;
      setupView.classList.remove("is-transitioning-out");
      render();
      scrollToTop();
    });

    catalogTabs.addEventListener("click", (event) => {
      const tab = event.target.closest(".catalog-tab");
      if (!tab) {
        return;
      }

      activeStoreName = tab.dataset.storeName;
      render();
    });

    catalogGroups.addEventListener("click", (event) => {
      const toggleButton = event.target.closest('[data-role="toggle-item"]');
      if (toggleButton) {
        const entry = getCartEntry(toggleButton.dataset.itemId);
        entry.checked = !entry.checked;
        if (entry.checked && entry.quantity < 1) {
          entry.quantity = 1;
        }
        render();
        return;
      }

      const incrementButton = event.target.closest('[data-role="increment-item"]');
      if (incrementButton) {
        const entry = getCartEntry(incrementButton.dataset.itemId);
        entry.checked = true;
        entry.quantity += 1;
        render();
        return;
      }

      const decrementButton = event.target.closest('[data-role="decrement-item"]');
      if (decrementButton) {
        const entry = getCartEntry(decrementButton.dataset.itemId);
        const current = engine.clampPositiveInteger(entry.quantity, 1);
        if (current > 1) {
          entry.checked = true;
          entry.quantity = current - 1;
        }
        render();
      }
    });

    catalogGroups.addEventListener("input", (event) => {
      const quantityInput = event.target.closest(".shop-row-qty");
      if (!quantityInput) {
        return;
      }

      const entry = getCartEntry(quantityInput.dataset.itemId);
      entry.checked = true;
      entry.quantity = engine.clampPositiveInteger(quantityInput.value, 1);
    });

    catalogGroups.addEventListener("change", (event) => {
      const quantityInput = event.target.closest(".shop-row-qty");
      if (!quantityInput) {
        return;
      }

      const entry = getCartEntry(quantityInput.dataset.itemId);
      entry.checked = true;
      entry.quantity = engine.clampPositiveInteger(quantityInput.value, 1);
      render();
    });

    comboTable.addEventListener("click", (event) => {
      const cell = event.target.closest(".combo-cell");
      if (!cell || cell.classList.contains("invalid")) {
        return;
      }

      state.buyBatch = Number(cell.dataset.buy);
      state.sellBatch = Number(cell.dataset.sell);
      render();
    });
  }

  attachEvents();
  render();
})();
