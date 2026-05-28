const app = document.querySelector("#app");

const state = {
  inputMode: "count",
  items: [],
  message: "",
  winner: null,
  isSpinning: false,
  rotation: 0,
};

const maxItemCount = 20;

const segmentColors = [
  "#2563eb",
  "#f97316",
  "#16a34a",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#ca8a04",
  "#db2777",
  "#4f46e5",
  "#059669",
  "#ea580c",
  "#9333ea",
  "#0d9488",
  "#e11d48",
  "#65a30d",
  "#0284c7",
  "#c2410c",
  "#be123c",
  "#4338ca",
  "#15803d",
];

const spinDuration = 3600;
const minimumSpinTurns = 5;

function getModeConfig() {
  if (state.inputMode === "percent") {
    return {
      valueLabel: "당첨 비율(%)",
      valuePlaceholder: "예: 33",
      submitLabel: "비율 추가",
    };
  }

  return {
    valueLabel: "당첨 개수",
    valuePlaceholder: "예: 3",
    submitLabel: "개수 추가",
  };
}

function getTotalWeight() {
  return state.items.reduce((total, item) => total + item.weight, 0);
}

function getWheelSegments() {
  const totalWeight = getTotalWeight();
  let currentAngle = 0;

  if (totalWeight === 0) {
    return [];
  }

  return state.items.map((item, index) => {
    const startAngle = currentAngle;
    const endAngle = currentAngle + (item.weight / totalWeight) * 360;

    currentAngle = endAngle;

    return {
      item,
      color: segmentColors[index % segmentColors.length],
      startAngle,
      endAngle,
      middleAngle: (startAngle + endAngle) / 2,
    };
  });
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${Number(value.toFixed(1))}%`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getWheelGradient() {
  const segments = getWheelSegments();

  if (segments.length === 0) {
    return "conic-gradient(#e5e7eb 0deg 360deg)";
  }

  return `conic-gradient(${segments
    .map((segment) => `${segment.color} ${segment.startAngle}deg ${segment.endAngle}deg`)
    .join(", ")})`;
}

function getModeSummary() {
  const totalWeight = getTotalWeight();

  if (state.inputMode !== "percent") {
    return `${state.items.length}/${maxItemCount}개 항목 · 총 ${formatNumber(totalWeight)}개`;
  }

  if (isPercentTotalComplete()) {
    return `${state.items.length}/${maxItemCount}개 항목 · 비율 합계 100%`;
  }

  if (totalWeight > 100) {
    return `${state.items.length}/${maxItemCount}개 항목 · 비율 합계 ${formatNumber(totalWeight)}%`;
  }

  return `${state.items.length}/${maxItemCount}개 항목 · 비율 합계 ${formatNumber(totalWeight)}% / 100%`;
}

function isPercentTotalComplete() {
  return Math.abs(getTotalWeight() - 100) < 0.001;
}

function getWinnerPercent() {
  if (!state.winner) {
    return 0;
  }

  const totalWeight = getTotalWeight();

  if (totalWeight === 0) {
    return 0;
  }

  return (state.winner.weight / totalWeight) * 100;
}

function getSpinDisabledReason() {
  if (state.isSpinning) {
    return "룰렛이 돌아가는 중입니다.";
  }

  if (state.items.length === 0) {
    return "항목을 먼저 추가해주세요.";
  }

  if (state.inputMode === "percent" && !isPercentTotalComplete()) {
    return "비율 합계가 100%일 때 추첨할 수 있습니다.";
  }

  return "";
}

function getSpinButtonLabel() {
  return state.isSpinning ? "추첨 중..." : "추첨하기";
}

function isPercentEntryComplete() {
  return state.inputMode === "percent" && isPercentTotalComplete();
}

function isMaxItemCountReached() {
  return state.items.length >= maxItemCount;
}

function pickWinnerSegment() {
  const totalWeight = getTotalWeight();
  const segments = getWheelSegments();
  const randomValue = Math.random() * totalWeight;
  let cumulativeWeight = 0;

  return segments.find((segment) => {
    cumulativeWeight += segment.item.weight;
    return randomValue < cumulativeWeight;
  });
}

function normalizeDegree(degree) {
  return ((degree % 360) + 360) % 360;
}

function getTargetRotation(segment) {
  const currentRotation = normalizeDegree(state.rotation);
  const targetRotation = normalizeDegree(-segment.middleAngle);
  const adjustment = normalizeDegree(targetRotation - currentRotation);

  return state.rotation + minimumSpinTurns * 360 + adjustment;
}

function renderItems() {
  const totalWeight = getTotalWeight();

  if (state.items.length === 0) {
    return `
      <li class="empty-state">
        아직 등록된 항목이 없습니다.
      </li>
    `;
  }

  return state.items
    .map((item, index) => {
      const actualPercent = totalWeight === 0 ? 0 : (item.weight / totalWeight) * 100;
      const color = segmentColors[index % segmentColors.length];

      return `
        <li class="item-row">
          <span class="item-color" style="background: ${color}"></span>
          <div class="item-main">
            <strong>${escapeHtml(item.name)}</strong>
            <span>입력값 ${formatNumber(item.weight)} · 실제 확률 ${formatPercent(actualPercent)}</span>
          </div>
          <button class="icon-button" type="button" data-remove-id="${item.id}" aria-label="${escapeHtml(item.name)} 삭제" ${state.isSpinning ? "disabled" : ""}>
            삭제
          </button>
        </li>
      `;
    })
    .join("");
}

function render() {
  const modeConfig = getModeConfig();
  const spinDisabledReason = getSpinDisabledReason();
  const entryDisabled = state.isSpinning || isPercentEntryComplete() || isMaxItemCountReached();
  const entryDisabledMessage =
    (isPercentEntryComplete() && "비율 합계가 100%라서 더 이상 항목을 추가할 수 없습니다.") ||
    (isMaxItemCountReached() && `항목은 최대 ${maxItemCount}개까지 추가할 수 있습니다.`) ||
    "";

  app.innerHTML = `
    <section class="app-shell">
      <header class="app-header">
        <p class="eyebrow">Lucky Wheel</p>
        <h1>당첨 룰렛</h1>
      </header>

      <section class="app-layout">
        <section class="setup-panel" aria-labelledby="setup-title">
          <div class="panel-title-row">
            <div>
              <h2 id="setup-title">항목 설정</h2>
              <p>${getModeSummary()}</p>
            </div>
            <button class="text-button" type="button" data-clear-items ${state.items.length === 0 || state.isSpinning ? "disabled" : ""}>
              초기화
            </button>
          </div>

          <div class="mode-toggle" aria-label="입력 방식">
            <button type="button" data-mode="count" class="${state.inputMode === "count" ? "active" : ""}" aria-pressed="${state.inputMode === "count"}" ${state.isSpinning ? "disabled" : ""}>
              개수 모드
            </button>
            <button type="button" data-mode="percent" class="${state.inputMode === "percent" ? "active" : ""}" aria-pressed="${state.inputMode === "percent"}" ${state.isSpinning ? "disabled" : ""}>
              비율 모드
            </button>
          </div>

          <form class="entry-form" id="item-form" novalidate>
            <label>
              항목 이름
              <input id="item-name" name="name" type="text" maxlength="24" placeholder="예: A상품" autocomplete="off" ${entryDisabled ? "disabled" : ""} />
            </label>

            <label>
              ${modeConfig.valueLabel}
              <input id="item-weight" name="weight" type="number" min="0.01" step="0.01" placeholder="${modeConfig.valuePlaceholder}" ${entryDisabled ? "disabled" : ""} />
            </label>

            <button class="primary-button" type="submit" ${entryDisabled ? "disabled" : ""}>
              ${modeConfig.submitLabel}
            </button>
          </form>

          <p class="form-message" role="status">${state.message || entryDisabledMessage}</p>

          <ul class="item-list" aria-label="등록된 항목">
            ${renderItems()}
          </ul>
        </section>

        <section class="wheel-panel" aria-labelledby="wheel-title">
          <div>
            <h2 id="wheel-title">룰렛 미리보기</h2>
            <p>등록 항목 ${state.items.length}개</p>
          </div>

          <div class="wheel-wrap">
            <div class="wheel-pointer" aria-hidden="true"></div>
            <div class="wheel ${state.isSpinning ? "spinning" : ""}" style="background: ${getWheelGradient()}; transform: rotate(${state.rotation}deg); --spin-duration: ${spinDuration}ms;">
              <div class="wheel-center"></div>
            </div>
          </div>

          <div class="spin-controls">
            <button class="primary-button spin-button" type="button" data-spin-wheel ${spinDisabledReason ? "disabled" : ""}>
              ${getSpinButtonLabel()}
            </button>
            <p class="spin-hint">${spinDisabledReason}</p>
          </div>

          <div class="result-box" aria-live="polite">
            ${
              state.winner
                ? `
                  <p>당첨 결과</p>
                  <strong>${escapeHtml(state.winner.name)}</strong>
                  <span>실제 확률 ${formatPercent(getWinnerPercent())}</span>
                `
                : `
                  <p>당첨 결과</p>
                  <strong>${state.isSpinning ? "추첨 중..." : "-"}</strong>
                  <span>${state.isSpinning ? "룰렛이 멈추면 결과가 표시됩니다." : "아직 추첨 전입니다."}</span>
                `
            }
          </div>
        </section>
      </section>
    </section>
  `;
}

function setMessage(message) {
  state.message = message;
}

function focusItemNameInput() {
  window.requestAnimationFrame(() => {
    app.querySelector("#item-name")?.focus();
  });
}

function resetWinner() {
  state.winner = null;
}

function resetItems() {
  state.items = [];
  state.rotation = 0;
  resetWinner();
}

function addItem(name, weight) {
  const nextTotal = getTotalWeight() + weight;

  if (isMaxItemCountReached()) {
    setMessage(`항목은 최대 ${maxItemCount}개까지 추가할 수 있습니다.`);
    render();
    return;
  }

  if (state.inputMode === "percent" && nextTotal > 100) {
    setMessage("비율 합계는 100%를 넘을 수 없습니다.");
    render();
    return;
  }

  if (isPercentEntryComplete()) {
    setMessage("비율 합계가 100%라서 더 이상 항목을 추가할 수 없습니다.");
    render();
    return;
  }

  state.items.push({
    id: createId(),
    name,
    weight,
  });

  resetWinner();
  setMessage("");
  render();
  focusItemNameInput();
}

function spinWheel() {
  const spinDisabledReason = getSpinDisabledReason();

  if (spinDisabledReason) {
    setMessage(spinDisabledReason);
    render();
    return;
  }

  const winnerSegment = pickWinnerSegment();

  if (!winnerSegment) {
    setMessage("추첨할 수 있는 항목이 없습니다.");
    render();
    return;
  }

  const targetRotation = getTargetRotation(winnerSegment);

  state.isSpinning = true;
  state.winner = null;
  state.message = "";
  render();

  const wheel = app.querySelector(".wheel");

  if (wheel) {
    wheel.getBoundingClientRect();
    state.rotation = targetRotation;
    wheel.style.transform = `rotate(${state.rotation}deg)`;
  }

  window.setTimeout(() => {
    state.isSpinning = false;
    state.winner = winnerSegment.item;
    render();
  }, spinDuration);
}

app.addEventListener("click", (event) => {
  const modeButton = event.target.closest("[data-mode]");
  const removeButton = event.target.closest("[data-remove-id]");
  const clearButton = event.target.closest("[data-clear-items]");
  const spinButton = event.target.closest("[data-spin-wheel]");

  if (state.isSpinning && !spinButton) {
    return;
  }

  if (modeButton) {
    const nextMode = modeButton.dataset.mode;

    if (state.inputMode !== nextMode) {
      state.inputMode = nextMode;
      resetItems();
    }

    setMessage("");
    render();
    return;
  }

  if (removeButton) {
    state.items = state.items.filter((item) => item.id !== removeButton.dataset.removeId);
    resetWinner();
    setMessage("");
    render();
    return;
  }

  if (clearButton) {
    resetItems();
    setMessage("");
    render();
    return;
  }

  if (spinButton) {
    spinWheel();
  }
});

app.addEventListener("submit", (event) => {
  event.preventDefault();

  if (event.target.id !== "item-form") {
    return;
  }

  const formData = new FormData(event.target);
  const name = String(formData.get("name")).trim();
  const weight = Number(formData.get("weight"));

  if (!name) {
    setMessage("항목 이름을 입력해주세요.");
    render();
    return;
  }

  if (!Number.isFinite(weight) || weight <= 0) {
    setMessage("0보다 큰 값을 입력해주세요.");
    render();
    return;
  }

  addItem(name, weight);
});

render();
