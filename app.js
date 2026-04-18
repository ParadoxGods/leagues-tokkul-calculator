(function () {
  "use strict";

  const engine = window.TokkulEngine;
  const formatter = new Intl.NumberFormat("en-US");
  const compactFormatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const catalog = engine.getTzhaarCatalog();
  const storesByName = new Map();
  for (const item of catalog) {
    if (!storesByName.has(item.storeName)) {
      storesByName.set(item.storeName, []);
    }
    storesByName.get(item.storeName).push(item);
  }
  const storeNames = Array.from(storesByName.keys());
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
  let lastRenderedStoreName = "";

  const setupView = document.getElementById("setupView");
  const reportView = document.getElementById("reportView");
  const step1View = document.getElementById("step1View");
  const step2View = document.getElementById("step2View");
  const step3View = document.getElementById("step3View");
  const step4View = document.getElementById("step4View");
  const setupStepText = document.getElementById("setupStepText");
  const wizardStepOneDot = document.getElementById("wizardStepOneDot");
  const wizardStepTwoDot = document.getElementById("wizardStepTwoDot");
  const wizardStepThreeDot = document.getElementById("wizardStepThreeDot");
  const wizardStepFourDot = document.getElementById("wizardStepFourDot");
  const setupGloves = document.getElementById("setupGloves");
  const toStep2Btn = document.getElementById("toStep2Btn");
  const backToStep1Btn = document.getElementById("backToStep1Btn");
  const toStep3Btn = document.getElementById("toStep3Btn");
  const backToStep2Btn = document.getElementById("backToStep2Btn");
  const toStep4Btn = document.getElementById("toStep4Btn");
  const backToStep3Btn = document.getElementById("backToStep3Btn");
  const showReportBtn = document.getElementById("showReportBtn");
  const changeItemsBtn = document.getElementById("changeItemsBtn");
  const changeSetupBtn = document.getElementById("changeSetupBtn");
  const errorBox = document.getElementById("errorBox");
  const comboTable = document.getElementById("comboTable");
  const catalogTabs = document.getElementById("catalogTabs");
  const catalogGroups = document.getElementById("catalogGroups");
  const selectedItemsList = document.getElementById("selectedItemsList");
  const activeStoreTitle = document.getElementById("activeStoreTitle");
  const activeStoreNote = document.getElementById("activeStoreNote");
  const setupContinueHint = document.getElementById("setupContinueHint");
  const reportLead = document.getElementById("reportLead");
  const reportSub = document.getElementById("reportSub");
  const reportTargetTokkul = document.getElementById("reportTargetTokkul");
  const reportSelectedItems = document.getElementById("reportSelectedItems");
  const reportRouteName = document.getElementById("reportRouteName");
  const step3RouteNote = document.getElementById("step3RouteNote");
  const step4RouteNote = document.getElementById("step4RouteNote");
  const step2NeedTokkul = document.getElementById("step2NeedTokkul");
  const step2SelectionCount = document.getElementById("step2SelectionCount");
  const step3NeedTokkul = document.getElementById("step3NeedTokkul");
  const step3RuneLabel = document.getElementById("step3RuneLabel");
  const step4NeedTokkul = document.getElementById("step4NeedTokkul");
  const step4BuyBatch = document.getElementById("step4BuyBatch");

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

  function getRouteItemLabel(route, count) {
    return route.itemName.toLowerCase() + (count === 1 ? "" : "s");
  }

  function renderSetupBatchChoices() {
    document.querySelectorAll('[data-role="setup-rune-choice"]').forEach((button) => {
      button.classList.toggle("active", button.dataset.value === state.presetId);
    });

    document.querySelectorAll('[data-role="setup-buy-batch"]').forEach((button) => {
      button.classList.toggle("active", Number(button.dataset.value) === state.buyBatch);
    });

    document.querySelectorAll('[data-role="setup-sell-batch"]').forEach((button) => {
      button.classList.toggle("active", Number(button.dataset.value) === state.sellBatch);
    });
  }

  function renderCatalog() {
    if (!activeStoreName || !storesByName.has(activeStoreName)) {
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
    if (catalogTabs.innerHTML !== tabsHtml) {
      catalogTabs.innerHTML = tabsHtml;
    }

    const activeItems = storesByName.get(activeStoreName) || [];
    const requiresFireCape = activeItems.some((item) => item.requiresFireCape);
    const note = requiresFireCape
      ? "Fire cape required. Click items from stock to add them to your plan."
      : "Click items from stock to add them to your plan.";

    activeStoreTitle.textContent = activeStoreName || "TzHaar shop";
    activeStoreNote.textContent = note;

    if (lastRenderedStoreName === activeStoreName && catalogGroups.children.length) {
      return;
    }

    let html = '<div class="osrs-stock-slots">';

    for (const item of activeItems) {
      html +=
        '<article class="osrs-stock-slot" data-item-row="' +
        item.id +
        '">' +
        '<input class="catalog-check" type="checkbox" data-item-id="' +
        item.id +
        '" />' +
        '<button class="osrs-stock-slot-button" type="button" data-role="toggle-item" data-item-id="' +
        item.id +
        '">' +
        '<span class="osrs-slot-stock">x' +
        item.stock +
        "</span>" +
        '<span class="osrs-slot-sprite-wrap">' +
        '<img class="osrs-slot-sprite" loading="lazy" src="' +
        escapeHtml(item.spriteUrl) +
        '" alt="' +
        escapeHtml(item.name) +
        '" />' +
        "</span>" +
        '<span class="osrs-slot-price" data-role="price" data-item-id="' +
        item.id +
        '">0</span>' +
        '<span class="osrs-slot-name" title="' +
        escapeHtml(item.name) +
        '">' +
        escapeHtml(item.name) +
        "</span>" +
        "</button>" +
        "</article>";
    }

    html += "</div>";
    catalogGroups.innerHTML = html;
    lastRenderedStoreName = activeStoreName;
  }

  function updateCatalogDisplay(cart) {
    const activeItems = storesByName.get(activeStoreName) || [];

    for (const item of activeItems) {
      const checkbox = catalogGroups.querySelector('.catalog-check[data-item-id="' + item.id + '"]');
      const priceNode = catalogGroups.querySelector(
        '[data-role="price"][data-item-id="' + item.id + '"]'
      );
      const row = catalogGroups.querySelector('[data-item-row="' + item.id + '"]');

      if (!checkbox || !priceNode || !row) {
        continue;
      }

      const cartEntry = getCartEntry(item.id);
      const unitPrice = state.useKaramjaGloves ? item.priceWithGloves : item.priceWithoutGloves;

      checkbox.checked = cartEntry.checked;
      row.classList.toggle("selected", cartEntry.checked);
      priceNode.textContent = formatCompact(unitPrice);
    }

    renderSelectedItems(cart);
  }

  function createEmptyPlanNode() {
    const emptyState = document.createElement("div");
    emptyState.className = "osrs-empty-plan";
    emptyState.dataset.emptyState = "true";
    emptyState.innerHTML =
      "<strong>No items selected</strong><span>Pick items from the shop stock on the left.</span>";
    return emptyState;
  }

  function createSelectedItemNode(item) {
    const node = document.createElement("article");
    node.className = "osrs-selected-item";
    node.dataset.itemId = item.id;
    node.innerHTML =
      '<div class="osrs-selected-main">' +
      '<span class="osrs-selected-sprite-wrap">' +
      '<img class="osrs-selected-sprite" loading="lazy" alt="" />' +
      "</span>" +
      '<div class="osrs-selected-copy">' +
      '<strong data-field="name"></strong>' +
      '<span data-field="subtotal"></span>' +
      "</div>" +
      "</div>" +
      '<div class="osrs-selected-controls">' +
      '<button class="shop-qty-btn" type="button" data-role="decrement-item">&#8722;</button>' +
      '<input class="selected-item-qty" type="number" min="1" step="1" />' +
      '<button class="shop-qty-btn" type="button" data-role="increment-item">+</button>' +
      '<button class="osrs-remove-btn" type="button" data-role="remove-item">X</button>' +
      "</div>";
    updateSelectedItemNode(node, item);
    return node;
  }

  function updateSelectedItemNode(node, item) {
    const sprite = node.querySelector(".osrs-selected-sprite");
    const name = node.querySelector('[data-field="name"]');
    const subtotal = node.querySelector('[data-field="subtotal"]');
    const qtyInput = node.querySelector(".selected-item-qty");
    const decrementButton = node.querySelector('[data-role="decrement-item"]');
    const incrementButton = node.querySelector('[data-role="increment-item"]');
    const removeButton = node.querySelector('[data-role="remove-item"]');

    node.dataset.itemId = item.id;
    if (item.spriteUrl) {
      sprite.src = item.spriteUrl;
    } else {
      sprite.removeAttribute("src");
    }
    sprite.alt = item.name;
    name.textContent = item.name;
    subtotal.textContent = formatNumber(item.subtotal, "Tokkul");
    qtyInput.value = item.quantity;
    qtyInput.dataset.itemId = item.id;
    qtyInput.setAttribute("aria-label", "Quantity for " + item.name);
    decrementButton.dataset.itemId = item.id;
    decrementButton.setAttribute("aria-label", "Decrease quantity for " + item.name);
    decrementButton.title = "Decrease quantity";
    incrementButton.dataset.itemId = item.id;
    incrementButton.setAttribute("aria-label", "Increase quantity for " + item.name);
    incrementButton.title = "Increase quantity";
    removeButton.dataset.itemId = item.id;
    removeButton.setAttribute("aria-label", "Remove " + item.name);
    removeButton.title = "Remove item";
  }

  function renderSelectedItems(cart) {
    if (!cart.breakdown.length) {
      const emptyState = selectedItemsList.firstElementChild;
      if (
        selectedItemsList.childElementCount === 1 &&
        emptyState &&
        emptyState.dataset.emptyState === "true"
      ) {
        return;
      }

      selectedItemsList.replaceChildren(createEmptyPlanNode());
      return;
    }

    if (
      selectedItemsList.childElementCount === 1 &&
      selectedItemsList.firstElementChild &&
      selectedItemsList.firstElementChild.dataset.emptyState === "true"
    ) {
      selectedItemsList.replaceChildren();
    }

    const existingNodes = new Map();
    Array.from(selectedItemsList.children).forEach((node) => {
      if (node.dataset.itemId) {
        existingNodes.set(node.dataset.itemId, node);
      }
    });

    let previousNode = null;

    for (const item of cart.breakdown) {
      let node = existingNodes.get(item.id);
      if (!node) {
        node = createSelectedItemNode(item);
      } else {
        updateSelectedItemNode(node, item);
      }

      if (!previousNode) {
        if (selectedItemsList.firstElementChild !== node) {
          selectedItemsList.insertBefore(node, selectedItemsList.firstElementChild);
        }
      } else if (previousNode.nextElementSibling !== node) {
        selectedItemsList.insertBefore(node, previousNode.nextElementSibling);
      }

      previousNode = node;
      existingNodes.delete(item.id);
    }

    existingNodes.forEach((node) => node.remove());
  }

  function renderSetup(cart, route) {
    setupView.classList.toggle("hidden", state.reportVisible);
    if (!state.reportVisible && !reportTransitionTimer) {
      setupView.classList.remove("is-transitioning-out");
    }

    step1View.classList.toggle("hidden", state.step !== 1);
    step2View.classList.toggle("hidden", state.step !== 2);
    step3View.classList.toggle("hidden", state.step !== 3);
    step4View.classList.toggle("hidden", state.step !== 4);
    setupStepText.textContent = "Step " + state.step + " of 4";
    wizardStepOneDot.classList.toggle("active", state.step >= 1);
    wizardStepTwoDot.classList.toggle("active", state.step >= 2);
    wizardStepThreeDot.classList.toggle("active", state.step >= 3);
    wizardStepFourDot.classList.toggle("active", state.step >= 4);
    setupGloves.checked = state.useKaramjaGloves;

    setupCartSelectedItems.textContent = formatNumber(cart.selectedCount);
    setupCartTotalQuantity.textContent = formatNumber(cart.totalQuantity);
    setupCartTokkulTotal.textContent = formatNumber(cart.totalTokkul, "Tokkul");
    setupContinueHint.textContent =
      cart.totalTokkul > 0
        ? describeSelectionCount(cart) + " ready for " + formatNumber(cart.totalTokkul, "Tokkul") + "."
        : "Select at least one item to continue.";
    toStep2Btn.disabled = cart.totalTokkul <= 0;
    toStep3Btn.disabled = cart.totalTokkul <= 0;
    toStep4Btn.disabled = cart.totalTokkul <= 0;
    showReportBtn.disabled = cart.totalTokkul <= 0;

    step2NeedTokkul.textContent = formatNumber(cart.totalTokkul, "Tokkul");
    step2SelectionCount.textContent = describeSelectionCount(cart);
    step3NeedTokkul.textContent = formatNumber(cart.totalTokkul, "Tokkul");
    step3RuneLabel.textContent = route.itemName;
    step4NeedTokkul.textContent = formatNumber(cart.totalTokkul, "Tokkul");
    step4BuyBatch.textContent = formatNumber(state.buyBatch);

    const routeMessage = "Current route: " + route.itemName + " via standard rune shop.";
    step3RouteNote.textContent = routeMessage;
    step4RouteNote.textContent = routeMessage;
  }

  function renderSummary(route, cart, selectedStrategy, bestStrategy) {
    summaryBuyLabel.textContent = route.itemName + " to buy";
    summarySellLabel.textContent = route.itemName + " to sell";
    reportTargetTokkul.textContent = formatNumber(cart.totalTokkul, "Tokkul");
    reportSelectedItems.textContent = "Items: " + summarizeSelections(cart);
    reportRouteName.textContent = route.itemName;

    if (!selectedStrategy || !selectedStrategy.valid) {
      reportLead.textContent = "No valid result";
      reportSub.textContent = "This buy and sell pair does not work. Pick another cell in the table below.";
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

    reportLead.textContent = "Need " + formatNumber(selectedStrategy.gpSpent, "GP");
    reportSub.textContent =
      "Use " +
      getRouteItemLabel(route, selectedStrategy.itemsBought) +
      ". Buy " +
      formatNumber(selectedStrategy.itemsBought) +
      " total, sell " +
      formatNumber(selectedStrategy.itemsSold) +
      " total, and reach " +
      formatNumber(selectedStrategy.tokkulReached, "Tokkul") +
      " with buy " +
      selectedStrategy.buyBatch +
      " / sell " +
      selectedStrategy.sellBatch +
      ".";

    summaryGp.textContent = formatNumber(selectedStrategy.gpSpent, "GP");
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
        formatNumber(bestStrategy.gpSpent, "GP") +
        ")"
      : "-";
  }

  function renderComboTable(route, targetTokkul) {
    const strategies = engine.calculateAllStrategies(route, targetTokkul);
    const bestStrategy = engine.pickBestStrategy(strategies);
    const selectedKey = state.buyBatch + "-" + state.sellBatch;
    const bestKey = bestStrategy ? bestStrategy.buyBatch + "-" + bestStrategy.sellBatch : "";

    let html = "<thead><tr><th>Buy \\ Sell</th>";
    for (const sellBatch of engine.BATCH_SIZES) {
      html += "<th>Sell " + sellBatch + "</th>";
    }
    html += "</tr></thead><tbody>";

    for (const buyBatch of engine.BATCH_SIZES) {
      html += "<tr><th>Buy " + buyBatch + "</th>";

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
            '"><span class="combo-price">N/A</span></div></td>';
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
          formatNumber(strategy.gpSpent, "GP") +
          "</span></div></td>";
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

    if (!state.reportVisible) {
      return;
    }

    if (cart.totalTokkul <= 0) {
      setError("Pick at least one TzHaar item to build the report.");
      renderSummary(route, cart, null, null);
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

    document.addEventListener("click", (event) => {
      const runeChoice = event.target.closest('[data-role="setup-rune-choice"]');
      if (runeChoice) {
        state.presetId = runeChoice.dataset.value;
        render();
        return;
      }

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

    toStep4Btn.addEventListener("click", () => {
      state.step = 4;
      render();
      scrollToTop();
    });

    backToStep3Btn.addEventListener("click", () => {
      state.step = 3;
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

    changeSetupBtn.addEventListener("click", () => {
      if (reportTransitionTimer) {
        window.clearTimeout(reportTransitionTimer);
        reportTransitionTimer = 0;
      }
      state.reportVisible = false;
      state.step = 2;
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
      lastRenderedStoreName = "";
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
      }
    });

    selectedItemsList.addEventListener("click", (event) => {
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
        return;
      }

      const removeButton = event.target.closest('[data-role="remove-item"]');
      if (removeButton) {
        const entry = getCartEntry(removeButton.dataset.itemId);
        entry.checked = false;
        entry.quantity = 1;
        render();
      }
    });

    selectedItemsList.addEventListener("input", (event) => {
      const quantityInput = event.target.closest(".selected-item-qty");
      if (!quantityInput) {
        return;
      }

      const entry = getCartEntry(quantityInput.dataset.itemId);
      entry.checked = true;
      entry.quantity = engine.clampPositiveInteger(quantityInput.value, 1);
    });

    selectedItemsList.addEventListener("change", (event) => {
      const quantityInput = event.target.closest(".selected-item-qty");
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
