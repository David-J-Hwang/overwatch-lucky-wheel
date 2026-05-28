import { useEffect, useMemo, useRef, useState } from "react";
import { DRAW_TYPES, HEROES, ROLES, getPresetItems, getRoleById } from "./data/overwatch.js";

const maxItemCount = 72;
const spinDuration = 3600;
const minimumSpinTurns = 6;

const segmentColors = [
  "#f97316",
  "#2563eb",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#eab308",
  "#ec4899",
  "#14b8a6",
  "#f43f5e",
  "#6366f1",
  "#84cc16",
  "#0ea5e9",
  "#d946ef",
  "#22c55e",
  "#f59e0b",
];

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${Number(value.toFixed(1))}%`;
}

function normalizeDegree(degree) {
  return ((degree % 360) + 360) % 360;
}

function getTotalWeight(items) {
  return items.reduce((total, item) => total + Number(item.weight || 0), 0);
}

function hasInvalidWeight(items) {
  return items.some((item) => !Number.isFinite(Number(item.weight)) || Number(item.weight) <= 0);
}

function isPercentTotalComplete(totalWeight) {
  return Math.abs(totalWeight - 100) < 0.01;
}

function getItemColor(item, index, isRoleDraw) {
  if (item.color) {
    return item.color;
  }

  if (isRoleDraw && item.roleId) {
    return getRoleById(item.roleId)?.color ?? segmentColors[index % segmentColors.length];
  }

  return segmentColors[index % segmentColors.length];
}

function getWheelSegments(items, isRoleDraw) {
  const totalWeight = getTotalWeight(items);
  let currentAngle = 0;

  if (items.length === 0 || totalWeight <= 0) {
    return [];
  }

  return items.map((item, index) => {
    const startAngle = currentAngle;
    const sweepAngle = (Number(item.weight) / totalWeight) * 360;
    const endAngle = startAngle + sweepAngle;

    currentAngle = endAngle;

    return {
      item,
      color: getItemColor(item, index, isRoleDraw),
      startAngle,
      endAngle,
      middleAngle: startAngle + sweepAngle / 2,
    };
  });
}

function getWheelGradient(segments) {
  if (segments.length === 0) {
    return "conic-gradient(#d8dee9 0deg 360deg)";
  }

  return `conic-gradient(${segments
    .map((segment) => `${segment.color} ${segment.startAngle}deg ${segment.endAngle}deg`)
    .join(", ")})`;
}

function getTargetRotation(currentRotation, segment) {
  const current = normalizeDegree(currentRotation);
  const target = normalizeDegree(-segment.middleAngle);
  const adjustment = normalizeDegree(target - current);

  return currentRotation + minimumSpinTurns * 360 + adjustment;
}

function pickWinnerSegment(segments, totalWeight) {
  const randomValue = Math.random() * totalWeight;
  let cumulativeWeight = 0;

  return segments.find((segment) => {
    cumulativeWeight += Number(segment.item.weight);
    return randomValue < cumulativeWeight;
  });
}

function getEvenPercentWeights(itemCount) {
  if (itemCount === 0) {
    return [];
  }

  const baseWeight = Number((100 / itemCount).toFixed(2));
  const weights = Array.from({ length: itemCount }, () => baseWeight);
  const sumBeforeLast = weights.slice(0, -1).reduce((total, weight) => total + weight, 0);
  weights[weights.length - 1] = Number((100 - sumBeforeLast).toFixed(2));

  return weights;
}

function getItemNamePlaceholder(drawType, selectedRoleId) {
  if (drawType === "role") {
    return "예: 돌격군";
  }

  if (drawType === "allHeroes") {
    return "예: 레킹볼";
  }

  if (drawType === "roleHeroes") {
    if (selectedRoleId === "damage") {
      return "예: 겐지";
    }

    if (selectedRoleId === "support") {
      return "예: 루시우";
    }

    return "예: 라인하르트";
  }

  return "예: 랜덤 듀오";
}

function App() {
  const [drawType, setDrawType] = useState("role");
  const [selectedRoleId, setSelectedRoleId] = useState("tank");
  const [inputMode, setInputMode] = useState("count");
  const [items, setItems] = useState(() => getPresetItems("role", "tank"));
  const [newItemName, setNewItemName] = useState("");
  const [newItemWeight, setNewItemWeight] = useState("1");
  const [message, setMessage] = useState("");
  const [winner, setWinner] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const spinTimerRef = useRef(null);

  const selectedDrawType = DRAW_TYPES.find((type) => type.id === drawType);
  const selectedRole = getRoleById(selectedRoleId);
  const totalWeight = useMemo(() => getTotalWeight(items), [items]);
  const invalidWeight = useMemo(() => hasInvalidWeight(items), [items]);
  const isRoleDraw = drawType === "role";
  const wheelSegments = useMemo(() => getWheelSegments(items, isRoleDraw), [items, isRoleDraw]);
  const wheelGradient = useMemo(() => getWheelGradient(wheelSegments), [wheelSegments]);
  const winnerPercent = winner && totalWeight > 0 ? (Number(winner.weight) / totalWeight) * 100 : 0;

  useEffect(() => {
    return () => {
      window.clearTimeout(spinTimerRef.current);
    };
  }, []);

  const roleCounts = useMemo(
    () =>
      ROLES.map((role) => ({
        ...role,
        count: HEROES.filter((hero) => hero.roleId === role.id).length,
      })),
    [],
  );

  const spinDisabledReason = getSpinDisabledReason({
    inputMode,
    invalidWeight,
    isSpinning,
    itemCount: items.length,
    totalWeight,
  });

  function replaceItems(nextDrawType = drawType, nextRoleId = selectedRoleId) {
    setItems(getPresetItems(nextDrawType, nextRoleId));
    setRotation(0);
    setWinner(null);
    setMessage("");
  }

  function handleDrawTypeChange(nextDrawType) {
    if (isSpinning || drawType === nextDrawType) {
      return;
    }

    setDrawType(nextDrawType);
    replaceItems(nextDrawType, selectedRoleId);
  }

  function handleRoleChange(nextRoleId) {
    if (isSpinning || selectedRoleId === nextRoleId) {
      return;
    }

    setSelectedRoleId(nextRoleId);

    if (drawType === "roleHeroes") {
      replaceItems(drawType, nextRoleId);
    }
  }

  function handleInputModeChange(nextInputMode) {
    if (isSpinning || inputMode === nextInputMode) {
      return;
    }

    setInputMode(nextInputMode);
    setWinner(null);
    setMessage("");
  }

  function updateItemWeight(itemId, nextWeight) {
    if (isSpinning) {
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) => (item.id === itemId ? { ...item, weight: nextWeight } : item)),
    );
    setWinner(null);
    setMessage("");
  }

  function removeItem(itemId) {
    if (isSpinning) {
      return;
    }

    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
    setWinner(null);
    setMessage("");
  }

  function addItem(event) {
    event.preventDefault();

    if (isSpinning) {
      return;
    }

    const name = newItemName.trim();
    const weight = Number(newItemWeight);
    const nextTotal = totalWeight + weight;

    if (!name) {
      setMessage("항목 이름을 입력해주세요.");
      return;
    }

    if (!Number.isFinite(weight) || weight <= 0) {
      setMessage("0보다 큰 값을 입력해주세요.");
      return;
    }

    if (items.length >= maxItemCount) {
      setMessage(`항목은 최대 ${maxItemCount}개까지 추가할 수 있습니다.`);
      return;
    }

    if (inputMode === "percent" && nextTotal > 100.01) {
      setMessage("확률 합계는 100%를 넘을 수 없습니다.");
      return;
    }

    setItems((currentItems) => [
      ...currentItems,
      {
        id: `custom-${createId()}`,
        name,
        roleId: null,
        weight,
        source: "custom",
      },
    ]);
    setNewItemName("");
    setNewItemWeight(inputMode === "percent" ? "" : "1");
    setWinner(null);
    setMessage("");
  }

  function applyEvenWeights() {
    if (items.length === 0 || isSpinning) {
      return;
    }

    if (inputMode === "percent") {
      const weights = getEvenPercentWeights(items.length);
      setItems((currentItems) =>
        currentItems.map((item, index) => ({
          ...item,
          weight: weights[index],
        })),
      );
    } else {
      setItems((currentItems) => currentItems.map((item) => ({ ...item, weight: 1 })));
    }

    setWinner(null);
    setMessage("");
  }

  function clearItems() {
    if (isSpinning) {
      return;
    }

    setItems([]);
    setRotation(0);
    setWinner(null);
    setMessage("");
  }

  function spinWheel() {
    if (spinDisabledReason) {
      setMessage(spinDisabledReason);
      return;
    }

    const winnerSegment = pickWinnerSegment(wheelSegments, totalWeight);

    if (!winnerSegment) {
      setMessage("추첨할 수 있는 항목이 없습니다.");
      return;
    }

    window.clearTimeout(spinTimerRef.current);
    setIsSpinning(true);
    setWinner(null);
    setMessage("");
    setRotation((currentRotation) => getTargetRotation(currentRotation, winnerSegment));

    spinTimerRef.current = window.setTimeout(() => {
      setIsSpinning(false);
      setWinner(winnerSegment.item);
    }, spinDuration);
  }

  return (
    <main className="min-h-screen px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-5">
        <header className="flex flex-col gap-4 rounded-lg border border-white/80 bg-white/75 px-5 py-5 shadow-panel backdrop-blur md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-orange-600">overwatch-lucky-wheel</p>
            <h1 className="mt-1 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              오버워치 당첨 룰렛
            </h1>
          </div>
          <dl className="grid grid-cols-3 gap-2 text-center text-sm">
            {roleCounts.map((role) => (
              <div key={role.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <dt className="font-bold text-slate-500">{role.name}</dt>
                <dd className="text-lg font-black text-slate-950">{role.count}</dd>
              </div>
            ))}
          </dl>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)]">
          <div className="grid gap-5">
            <DrawTypeSelector
              drawType={drawType}
              isSpinning={isSpinning}
              onDrawTypeChange={handleDrawTypeChange}
              onRoleChange={handleRoleChange}
              roleCounts={roleCounts}
              selectedRoleId={selectedRoleId}
            />

            <ItemEditor
              drawType={drawType}
              drawTypeName={selectedDrawType?.name ?? ""}
              inputMode={inputMode}
              isSpinning={isSpinning}
              items={items}
              message={message}
              newItemName={newItemName}
              newItemWeight={newItemWeight}
              onAddItem={addItem}
              onApplyEvenWeights={applyEvenWeights}
              onClearItems={clearItems}
              onInputModeChange={handleInputModeChange}
              onNewItemNameChange={setNewItemName}
              onNewItemWeightChange={setNewItemWeight}
              onRemoveItem={removeItem}
              onResetPreset={() => replaceItems()}
              onUpdateItemWeight={updateItemWeight}
              selectedRoleId={selectedRoleId}
              totalWeight={totalWeight}
            />
          </div>

          <WheelPanel
            inputMode={inputMode}
            isSpinning={isSpinning}
            itemCount={items.length}
            onSpin={spinWheel}
            rotation={rotation}
            selectedRole={drawType === "roleHeroes" ? selectedRole : null}
            spinDisabledReason={spinDisabledReason}
            wheelGradient={wheelGradient}
            winner={winner}
            winnerPercent={winnerPercent}
          />
        </section>
      </div>
    </main>
  );
}

function getSpinDisabledReason({ inputMode, invalidWeight, isSpinning, itemCount, totalWeight }) {
  if (isSpinning) {
    return "룰렛이 돌아가는 중입니다.";
  }

  if (itemCount === 0) {
    return "항목을 먼저 추가해주세요.";
  }

  if (invalidWeight) {
    return "모든 항목에 0보다 큰 값을 입력해주세요.";
  }

  if (inputMode === "percent" && !isPercentTotalComplete(totalWeight)) {
    return "확률 합계가 100%일 때 추첨할 수 있습니다.";
  }

  return "";
}

function DrawTypeSelector({
  drawType,
  isSpinning,
  onDrawTypeChange,
  onRoleChange,
  roleCounts,
  selectedRoleId,
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">뽑기 유형</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">기본 항목은 유형에 맞춰 자동으로 채워집니다.</p>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {DRAW_TYPES.map((type) => {
          const active = drawType === type.id;

          return (
            <button
              key={type.id}
              type="button"
              className={`min-h-24 rounded-lg border p-4 text-left transition ${
                active
                  ? "border-orange-400 bg-orange-50 text-slate-950 shadow-sm"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
              }`}
              disabled={isSpinning}
              onClick={() => onDrawTypeChange(type.id)}
            >
              <span className="block text-base font-black">{type.name}</span>
              <span className="mt-2 block text-sm font-semibold leading-5 text-slate-500">{type.description}</span>
            </button>
          );
        })}
      </div>

      {drawType === "roleHeroes" && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {roleCounts.map((role) => {
            const active = selectedRoleId === role.id;

            return (
              <button
                key={role.id}
                type="button"
                className={`rounded-lg border px-4 py-3 text-left transition ${
                  active
                    ? "border-orange-500 bg-orange-500 text-white shadow-sm shadow-orange-200"
                    : "border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50"
                }`}
                disabled={isSpinning}
                onClick={() => onRoleChange(role.id)}
              >
                <span className="block text-sm font-black">{role.name}</span>
                <span
                  className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-black ring-1 ${
                    active ? "bg-white/20 text-white ring-white/40" : role.softColor
                  }`}
                >
                  {role.count}명
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ItemEditor({
  drawType,
  drawTypeName,
  inputMode,
  isSpinning,
  items,
  message,
  newItemName,
  newItemWeight,
  onAddItem,
  onApplyEvenWeights,
  onClearItems,
  onInputModeChange,
  onNewItemNameChange,
  onNewItemWeightChange,
  onRemoveItem,
  onResetPreset,
  onUpdateItemWeight,
  selectedRoleId,
  totalWeight,
}) {
  const itemNamePlaceholder = getItemNamePlaceholder(drawType, selectedRoleId);
  const valueLabel = inputMode === "percent" ? "당첨 확률(%)" : "당첨 개수";
  const valuePlaceholder = inputMode === "percent" ? "예: 25" : "예: 3";
  const totalLabel = inputMode === "percent" ? "확률 합계" : "총 당첨 개수";
  const totalValue = inputMode === "percent" ? `${formatNumber(totalWeight)}%` : `${formatNumber(totalWeight)}개`;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">항목 설정</h2>
          <div className="mt-2 flex flex-wrap gap-2 text-sm font-black">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{drawTypeName}</span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">등록 항목 {items.length}개</span>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700">
              {totalLabel} {totalValue}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 text-sm font-black">
          <button
            type="button"
            className={`rounded-md px-3 py-2 ${inputMode === "count" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500"}`}
            disabled={isSpinning}
            onClick={() => onInputModeChange("count")}
          >
            개수
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-2 ${inputMode === "percent" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500"}`}
            disabled={isSpinning}
            onClick={() => onInputModeChange("percent")}
          >
            확률
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700 hover:bg-white disabled:opacity-50"
          disabled={isSpinning || items.length === 0}
          onClick={onApplyEvenWeights}
        >
          균등 적용
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700 hover:bg-white disabled:opacity-50"
          disabled={isSpinning}
          onClick={onResetPreset}
        >
          기본값 복원
        </button>
        <button
          type="button"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-black text-rose-700 hover:bg-white disabled:opacity-50"
          disabled={isSpinning || items.length === 0}
          onClick={onClearItems}
        >
          전체 삭제
        </button>
      </div>

      <form
        className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(120px,150px)_110px]"
        onSubmit={onAddItem}
      >
        <label className="grid min-w-0 gap-1 text-sm font-black text-slate-700">
          항목 이름
          <input
            className="min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 font-semibold outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-slate-100"
            disabled={isSpinning || items.length >= maxItemCount}
            maxLength={32}
            onChange={(event) => onNewItemNameChange(event.target.value)}
            placeholder={itemNamePlaceholder}
            type="text"
            value={newItemName}
          />
        </label>
        <label className="grid min-w-0 gap-1 text-sm font-black text-slate-700">
          {valueLabel}
          <input
            className="min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 font-semibold outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-slate-100"
            disabled={isSpinning || items.length >= maxItemCount}
            min="0.01"
            onChange={(event) => onNewItemWeightChange(event.target.value)}
            placeholder={valuePlaceholder}
            step="0.01"
            type="number"
            value={newItemWeight}
          />
        </label>
        <button
          type="submit"
          className="min-h-11 self-end rounded-lg bg-slate-950 px-4 font-black text-white transition hover:bg-orange-600 disabled:opacity-50"
          disabled={isSpinning || items.length >= maxItemCount}
        >
          추가
        </button>
      </form>

      <p className="min-h-6 pt-3 text-sm font-black text-rose-600" role="status">
        {message}
      </p>

      <ul className="mt-2 grid max-h-[520px] gap-2 overflow-y-auto pr-1" aria-label="등록된 항목">
        {items.length === 0 ? (
          <li className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-500">
            등록된 항목이 없습니다.
          </li>
        ) : (
          items.map((item, index) => (
            <ItemRow
              key={item.id}
              inputMode={inputMode}
              item={item}
              itemIndex={index}
              onRemoveItem={onRemoveItem}
              onUpdateItemWeight={onUpdateItemWeight}
              totalWeight={totalWeight}
              isSpinning={isSpinning}
            />
          ))
        )}
      </ul>
    </section>
  );
}

function ItemRow({ inputMode, isSpinning, item, itemIndex, onRemoveItem, onUpdateItemWeight, totalWeight }) {
  const role = item.roleId ? getRoleById(item.roleId) : null;
  const actualPercent = totalWeight > 0 ? (Number(item.weight) / totalWeight) * 100 : 0;

  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[auto_minmax(0,1fr)_minmax(96px,116px)_72px] md:items-center">
      <span
        className="mt-1 h-10 w-3 rounded-full sm:mt-0"
        style={{ backgroundColor: getItemColor(item, itemIndex, item.source === "preset") }}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <strong className="min-w-0 [overflow-wrap:anywhere] text-base font-black text-slate-950">
            {item.name}
          </strong>
          {role && (
            <span className={`rounded-full px-2 py-1 text-xs font-black ring-1 ${role.softColor}`}>{role.name}</span>
          )}
          {item.subtitle && (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-500">{item.subtitle}</span>
          )}
        </div>
        <p className="mt-1 text-sm font-semibold text-slate-500">당첨확률 {formatPercent(actualPercent)}</p>
      </div>

      <label className="col-span-2 grid min-w-0 gap-1 self-center text-xs font-black text-slate-500 md:col-span-1 md:flex md:items-center">
        <span className="md:sr-only">{inputMode === "percent" ? "확률" : "개수"}</span>
        <input
          aria-label={inputMode === "percent" ? `${item.name} 확률` : `${item.name} 개수`}
          className="min-h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm font-black text-slate-950 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-slate-100"
          disabled={isSpinning}
          min="0.01"
          onChange={(event) => onUpdateItemWeight(item.id, event.target.value)}
          step="0.01"
          type="number"
          value={item.weight}
        />
      </label>

      <button
        type="button"
        className="col-span-2 min-h-10 w-full self-center rounded-lg border border-rose-200 bg-rose-50 px-3 text-sm font-black text-rose-700 hover:bg-white disabled:opacity-50 md:col-span-1"
        disabled={isSpinning}
        onClick={() => onRemoveItem(item.id)}
      >
        삭제
      </button>
    </li>
  );
}

function WheelPanel({
  inputMode,
  isSpinning,
  itemCount,
  onSpin,
  rotation,
  selectedRole,
  spinDisabledReason,
  wheelGradient,
  winner,
  winnerPercent,
}) {
  const spinButtonLabel = isSpinning ? "추첨 중..." : winner ? "다시 추첨" : "추첨하기";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel sm:p-5 lg:sticky lg:top-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">룰렛</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            등록 항목 {itemCount}개{selectedRole ? ` · ${selectedRole.name}` : ""}
          </p>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
          {inputMode === "percent" ? "확률 모드" : "개수 모드"}
        </span>
      </div>

      <div className="mx-auto mt-7 grid w-full max-w-[390px] place-items-center">
        <div className="relative grid aspect-square w-full place-items-center">
          <div
            className="absolute -top-1 z-10 h-0 w-0 border-x-[16px] border-t-[28px] border-x-transparent border-t-slate-950 drop-shadow-lg"
            aria-hidden="true"
          />
          <div
            className={`wheel grid h-full w-full place-items-center rounded-full border-[12px] border-white shadow-[0_24px_55px_rgb(15_23_42_/_22%),inset_0_0_0_1px_rgb(15_23_42_/_16%)] ${
              isSpinning ? "is-spinning" : ""
            }`}
            style={{
              "--spin-duration": `${spinDuration}ms`,
              background: wheelGradient,
              transform: `rotate(${rotation}deg)`,
            }}
          >
            <div className="grid aspect-square w-[28%] place-items-center rounded-full border-[8px] border-white bg-slate-950 text-center text-white shadow-xl">
              <span className="text-xl font-black">{itemCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-3">
        <button
          type="button"
          className="min-h-12 rounded-lg bg-orange-500 px-5 text-base font-black text-white transition hover:bg-slate-950 disabled:bg-slate-300 disabled:text-slate-500"
          disabled={Boolean(spinDisabledReason)}
          onClick={onSpin}
        >
          {spinButtonLabel}
        </button>
        <p className="min-h-5 text-center text-sm font-bold text-slate-500">{spinDisabledReason}</p>
      </div>

      <div className="mt-5 grid min-h-32 content-center rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
        <p className="text-sm font-black uppercase tracking-normal text-slate-500">당첨 결과</p>
        {winner ? (
          <>
            <strong className="mt-2 break-words text-3xl font-black text-slate-950">{winner.name}</strong>
            <span className="mt-2 text-sm font-black text-orange-600">당첨확률 {formatPercent(winnerPercent)}</span>
          </>
        ) : (
          <>
            <strong className="mt-2 text-3xl font-black text-slate-400">{isSpinning ? "추첨 중..." : "-"}</strong>
            <span className="mt-2 text-sm font-bold text-slate-500">
              {isSpinning ? "룰렛이 멈추면 결과가 표시됩니다." : "아직 추첨 전입니다."}
            </span>
          </>
        )}
      </div>
    </section>
  );
}

export default App;
