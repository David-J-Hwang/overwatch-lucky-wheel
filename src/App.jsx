import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_LANGUAGE, LANGUAGES, TRANSLATIONS } from "./data/localization.js";
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

const languageStorageKey = "overwatch-lucky-wheel-language";

function getInitialLanguage() {
  let savedLanguage = null;

  try {
    savedLanguage = globalThis.localStorage?.getItem(languageStorageKey);
  } catch {
    savedLanguage = null;
  }

  return LANGUAGES.some((language) => language.id === savedLanguage) ? savedLanguage : DEFAULT_LANGUAGE;
}

function getTranslation(language) {
  return TRANSLATIONS[language] ?? TRANSLATIONS[DEFAULT_LANGUAGE];
}

function getLanguageMeta(language) {
  return LANGUAGES.find((item) => item.id === language) ?? LANGUAGES[0];
}

function createMessage(key, params = {}) {
  return { key, params };
}

function formatMessage(message, t) {
  if (!message) {
    return "";
  }

  const entry = t.messages[message.key];

  if (!entry) {
    return "";
  }

  return typeof entry === "function" ? entry(message.params ?? {}) : entry;
}

function getRoleText(t, roleId) {
  return t.roles[roleId] ?? { name: roleId, subtitle: "" };
}

function getDrawTypeText(t, drawTypeId) {
  return t.drawTypes[drawTypeId] ?? { name: drawTypeId, description: "" };
}

function getPresetHeroId(item) {
  if (item.source !== "preset" || !item.id?.startsWith("hero-")) {
    return "";
  }

  return item.id.slice("hero-".length);
}

function getItemDisplayName(item, t) {
  if (item.source === "preset" && item.id?.startsWith("role-") && item.roleId) {
    return getRoleText(t, item.roleId).name;
  }

  const heroId = getPresetHeroId(item);

  if (heroId) {
    return t.heroes?.[heroId] ?? item.name;
  }

  return item.name;
}

function getItemSubtitle(item, t) {
  if (item.source === "preset" && item.id?.startsWith("role-") && item.roleId) {
    return getRoleText(t, item.roleId).subtitle;
  }

  return item.subtitle ?? "";
}

function sortItemsByDisplayName(items, t, locale) {
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });

  return items
    .map((item, index) => ({ index, item }))
    .sort((first, second) => {
      const compared = collator.compare(getItemDisplayName(first.item, t), getItemDisplayName(second.item, t));
      return compared || first.index - second.index;
    })
    .map(({ item }) => item);
}

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

function getItemNamePlaceholder(drawType, selectedRoleId, t) {
  if (drawType === "role") {
    return t.itemEditor.placeholders.role;
  }

  if (drawType === "allHeroes") {
    return t.itemEditor.placeholders.allHeroes;
  }

  if (drawType === "roleHeroes") {
    return t.itemEditor.placeholders.roleHeroes[selectedRoleId] ?? t.itemEditor.placeholders.fallback;
  }

  return t.itemEditor.placeholders.fallback;
}

function App() {
  const [language, setLanguage] = useState(getInitialLanguage);
  const [drawType, setDrawType] = useState("role");
  const [selectedRoleId, setSelectedRoleId] = useState("tank");
  const [inputMode, setInputMode] = useState("count");
  const [items, setItems] = useState(() => getPresetItems("role", "tank"));
  const [newItemName, setNewItemName] = useState("");
  const [newItemWeight, setNewItemWeight] = useState("1");
  const [message, setMessage] = useState(null);
  const [winner, setWinner] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const spinTimerRef = useRef(null);

  const t = getTranslation(language);
  const activeLanguage = getLanguageMeta(language);
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

  useEffect(() => {
    document.documentElement.lang = activeLanguage.htmlLang;
    document.title = t.documentTitle;

    try {
      globalThis.localStorage?.setItem(languageStorageKey, language);
    } catch {
      // Language switching should still work when storage is unavailable.
    }
  }, [activeLanguage.htmlLang, language, t.documentTitle]);

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
  const spinDisabledReasonText = formatMessage(spinDisabledReason, t);
  const messageText = formatMessage(message, t);

  function replaceItems(nextDrawType = drawType, nextRoleId = selectedRoleId) {
    setItems(getPresetItems(nextDrawType, nextRoleId));
    setRotation(0);
    setWinner(null);
    setMessage(null);
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
    setMessage(null);
  }

  function updateItemWeight(itemId, nextWeight) {
    if (isSpinning) {
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) => (item.id === itemId ? { ...item, weight: nextWeight } : item)),
    );
    setWinner(null);
    setMessage(null);
  }

  function removeItem(itemId) {
    if (isSpinning) {
      return;
    }

    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
    setWinner(null);
    setMessage(null);
  }

  function sortItemsByName() {
    if (items.length < 2 || isSpinning) {
      return;
    }

    setItems((currentItems) => sortItemsByDisplayName(currentItems, t, activeLanguage.htmlLang));
    setWinner(null);
    setMessage(null);
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
      setMessage(createMessage("itemNameRequired"));
      return;
    }

    if (!Number.isFinite(weight) || weight <= 0) {
      setMessage(createMessage("positiveWeightRequired"));
      return;
    }

    if (items.length >= maxItemCount) {
      setMessage(createMessage("maxItemsReached", { maxItemCount }));
      return;
    }

    if (inputMode === "percent" && nextTotal > 100.01) {
      setMessage(createMessage("percentTotalOverflow"));
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
    setMessage(null);
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
    setMessage(null);
  }

  function clearItems() {
    if (isSpinning) {
      return;
    }

    setItems([]);
    setRotation(0);
    setWinner(null);
    setMessage(null);
  }

  function spinWheel() {
    if (spinDisabledReason) {
      setMessage(spinDisabledReason);
      return;
    }

    const winnerSegment = pickWinnerSegment(wheelSegments, totalWeight);

    if (!winnerSegment) {
      setMessage(createMessage("noDrawableItems"));
      return;
    }

    window.clearTimeout(spinTimerRef.current);
    setIsSpinning(true);
    setWinner(null);
    setMessage(null);
    setRotation((currentRotation) => getTargetRotation(currentRotation, winnerSegment));

    spinTimerRef.current = window.setTimeout(() => {
      setIsSpinning(false);
      setWinner(winnerSegment.item);
    }, spinDuration);
  }

  return (
    <main className="px-4 pb-8 pt-5 text-slate-950 sm:px-6 sm:pb-10 lg:fixed lg:inset-0 lg:h-screen lg:overflow-hidden lg:px-8 lg:py-5">
      <div className="mx-auto grid w-full max-w-7xl gap-5 lg:h-full lg:grid-rows-[auto_minmax(0,1fr)]">
        <header className="grid gap-4 rounded-lg border border-white/80 bg-white/75 px-5 py-5 shadow-panel backdrop-blur lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-normal text-orange-600">{t.appEyebrow}</p>
            <h1 className="mt-1 break-words text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              {t.appTitle}
            </h1>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:flex lg:justify-end">
            <LanguageToggle language={language} onLanguageChange={setLanguage} t={t} />
            <RoleStats roleCounts={roleCounts} t={t} />
          </div>
        </header>

        <section className="grid gap-5 lg:min-h-0 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)]">
          <div className="grid gap-5 lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)]">
            <DrawTypeSelector
              drawType={drawType}
              isSpinning={isSpinning}
              onDrawTypeChange={handleDrawTypeChange}
              onRoleChange={handleRoleChange}
              roleCounts={roleCounts}
              selectedRoleId={selectedRoleId}
              t={t}
            />

            <ItemEditor
              drawType={drawType}
              drawTypeName={getDrawTypeText(t, drawType).name}
              inputMode={inputMode}
              isSpinning={isSpinning}
              items={items}
              message={messageText}
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
              onSortItems={sortItemsByName}
              onUpdateItemWeight={updateItemWeight}
              selectedRoleId={selectedRoleId}
              t={t}
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
            spinDisabledReason={spinDisabledReasonText}
            t={t}
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
    return createMessage("wheelSpinning");
  }

  if (itemCount === 0) {
    return createMessage("addItemsFirst");
  }

  if (invalidWeight) {
    return createMessage("invalidWeight");
  }

  if (inputMode === "percent" && !isPercentTotalComplete(totalWeight)) {
    return createMessage("percentTotalIncomplete");
  }

  return null;
}

function LanguageToggle({ language, onLanguageChange, t }) {
  return (
    <div
      className="grid w-full grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 text-sm font-black sm:w-auto"
      aria-label={t.languageToggleLabel}
      role="group"
    >
      {LANGUAGES.map((item) => {
        const active = language === item.id;

        return (
          <button
            key={item.id}
            type="button"
            className={`min-h-10 rounded-md px-4 transition ${
              active ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:bg-white/70"
            }`}
            aria-pressed={active}
            onClick={() => onLanguageChange(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function RoleStats({ roleCounts, t }) {
  return (
    <dl className="grid grid-cols-3 gap-2 text-center text-sm">
      {roleCounts.map((role) => (
        <div key={role.id} className="min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-2 sm:min-w-20">
          <dt className="truncate text-xs font-bold text-slate-500 sm:text-sm">{getRoleText(t, role.id).name}</dt>
          <dd className="text-lg font-black leading-tight text-slate-950">{role.count}</dd>
        </div>
      ))}
    </dl>
  );
}

function DrawTypeSelector({
  drawType,
  isSpinning,
  onDrawTypeChange,
  onRoleChange,
  roleCounts,
  selectedRoleId,
  t,
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">{t.drawTypeSection.title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{t.drawTypeSection.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {DRAW_TYPES.map((type) => {
          const active = drawType === type.id;
          const typeText = getDrawTypeText(t, type.id);

          return (
            <button
              key={type.id}
              type="button"
              className={`min-h-16 rounded-lg border px-2 py-3 text-center transition sm:min-h-24 sm:p-4 sm:text-left ${
                active
                  ? "border-orange-400 bg-orange-50 text-slate-950 shadow-sm"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
              }`}
              disabled={isSpinning}
              onClick={() => onDrawTypeChange(type.id)}
            >
              <span className="block text-sm font-black leading-tight sm:text-base">{typeText.name}</span>
              <span className="mt-2 hidden text-sm font-semibold leading-5 text-slate-500 sm:block">
                {typeText.description}
              </span>
            </button>
          );
        })}
      </div>

      {drawType === "roleHeroes" && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {roleCounts.map((role) => {
            const active = selectedRoleId === role.id;
            const roleText = getRoleText(t, role.id);

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
                <span className="block text-sm font-black">{roleText.name}</span>
                <span
                  className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-black ring-1 ${
                    active ? "bg-white/20 text-white ring-white/40" : role.softColor
                  }`}
                >
                  {t.drawTypeSection.roleMemberCount(role.count)}
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
  onSortItems,
  onUpdateItemWeight,
  selectedRoleId,
  t,
  totalWeight,
}) {
  const itemNamePlaceholder = getItemNamePlaceholder(drawType, selectedRoleId, t);
  const valueLabel = inputMode === "percent" ? t.itemEditor.labels.winningChance : t.itemEditor.labels.winningCount;
  const valuePlaceholder =
    inputMode === "percent" ? t.itemEditor.placeholders.valuePercent : t.itemEditor.placeholders.valueCount;
  const formattedTotalWeight = formatNumber(totalWeight);
  const totalLabel = inputMode === "percent" ? t.itemEditor.totalChanceLabel : t.itemEditor.totalCountLabel;
  const totalValue =
    inputMode === "percent"
      ? t.itemEditor.totalChanceValue(formattedTotalWeight)
      : t.itemEditor.totalCountValue(formattedTotalWeight);
  const [isItemListOpen, setIsItemListOpen] = useState(false);
  const itemListId = "registered-item-list";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel sm:p-5 lg:flex lg:min-h-0 lg:flex-col">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">{t.itemEditor.title}</h2>
          <div className="mt-2 flex flex-wrap gap-2 text-sm font-black">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{drawTypeName}</span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
              {t.itemEditor.registeredItems(items.length)}
            </span>
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
            {t.itemEditor.inputMode.count}
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-2 ${inputMode === "percent" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500"}`}
            disabled={isSpinning}
            onClick={() => onInputModeChange("percent")}
          >
            {t.itemEditor.inputMode.percent}
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          className="whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-black text-slate-700 hover:bg-white disabled:opacity-50 sm:px-3 sm:text-sm"
          disabled={isSpinning || items.length < 2}
          onClick={onSortItems}
        >
          {t.itemEditor.actions.sortByName}
        </button>
        <button
          type="button"
          className="whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-black text-slate-700 hover:bg-white disabled:opacity-50 sm:px-3 sm:text-sm"
          disabled={isSpinning || items.length === 0}
          onClick={onApplyEvenWeights}
        >
          {t.itemEditor.actions.applyEvenWeights}
        </button>
        <button
          type="button"
          className="whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-black text-slate-700 hover:bg-white disabled:opacity-50 sm:px-3 sm:text-sm"
          disabled={isSpinning}
          onClick={onResetPreset}
        >
          {t.itemEditor.actions.resetPreset}
        </button>
        <button
          type="button"
          className="whitespace-nowrap rounded-lg border border-rose-200 bg-rose-50 px-2 py-2 text-xs font-black text-rose-700 hover:bg-white disabled:opacity-50 sm:px-3 sm:text-sm"
          disabled={isSpinning || items.length === 0}
          onClick={onClearItems}
        >
          {t.itemEditor.actions.clearItems}
        </button>
      </div>

      <form
        className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(120px,150px)_110px]"
        onSubmit={onAddItem}
      >
        <label className="grid min-w-0 gap-1 text-sm font-black text-slate-700">
          {t.itemEditor.labels.itemName}
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
          className="min-h-11 self-end rounded-lg bg-orange-500 px-4 font-black text-white transition hover:bg-slate-950 active:bg-slate-950 disabled:opacity-50"
          disabled={isSpinning || items.length >= maxItemCount}
        >
          {t.itemEditor.actions.add}
        </button>
      </form>

      <p className="min-h-6 pt-3 text-sm font-black text-rose-600" role="status">
        {message}
      </p>

      <button
        type="button"
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 hover:bg-white sm:hidden"
        aria-controls={itemListId}
        aria-expanded={isItemListOpen}
        onClick={() => setIsItemListOpen((current) => !current)}
      >
        {isItemListOpen ? t.itemEditor.hideList : t.itemEditor.showList}
      </button>

      <ul
        id={itemListId}
        className={`mt-2 max-h-[520px] auto-rows-max content-start gap-2 overflow-y-auto pr-1 [scrollbar-gutter:stable] lg:min-h-0 lg:max-h-none lg:flex-1 ${isItemListOpen ? "grid" : "hidden"} sm:grid`}
        aria-label={t.itemEditor.itemListAria}
      >
        {items.length === 0 ? (
          <li className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-500">
            {t.itemEditor.emptyItems}
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
              t={t}
            />
          ))
        )}
      </ul>
    </section>
  );
}

function ItemRow({ inputMode, isSpinning, item, itemIndex, onRemoveItem, onUpdateItemWeight, t, totalWeight }) {
  const role = item.roleId ? getRoleById(item.roleId) : null;
  const roleText = role ? getRoleText(t, role.id) : null;
  const itemName = getItemDisplayName(item, t);
  const itemSubtitle = getItemSubtitle(item, t);
  const actualPercent = totalWeight > 0 ? (Number(item.weight) / totalWeight) * 100 : 0;
  const inputModeLabel = inputMode === "percent" ? t.itemEditor.labels.chance : t.itemEditor.labels.count;

  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[auto_minmax(0,1fr)_minmax(96px,116px)_84px] md:items-center">
      <span
        className="mt-1 h-10 w-3 rounded-full sm:mt-0"
        style={{ backgroundColor: getItemColor(item, itemIndex, item.source === "preset") }}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <strong className="min-w-0 [overflow-wrap:anywhere] text-base font-black text-slate-950">
            {itemName}
          </strong>
          {role && (
            <span className={`rounded-full px-2 py-1 text-xs font-black ring-1 ${role.softColor}`}>
              {roleText.name}
            </span>
          )}
          {itemSubtitle && (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-500">
              {itemSubtitle}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {t.itemEditor.winningChance(formatPercent(actualPercent))}
        </p>
      </div>

      <label className="col-span-2 grid min-w-0 gap-1 self-center text-xs font-black text-slate-500 md:col-span-1 md:flex md:items-center">
        <span className="md:sr-only">{inputModeLabel}</span>
        <input
          aria-label={t.itemEditor.weightAria(itemName, inputModeLabel)}
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
        className="col-span-2 grid min-h-10 w-full place-items-center self-center rounded-lg border border-rose-200 bg-rose-50 px-2 text-center text-sm font-black text-rose-700 hover:bg-white disabled:opacity-50 md:col-span-1"
        disabled={isSpinning}
        onClick={() => onRemoveItem(item.id)}
      >
        {t.itemEditor.actions.remove}
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
  t,
  wheelGradient,
  winner,
  winnerPercent,
}) {
  const selectedRoleName = selectedRole ? getRoleText(t, selectedRole.id).name : "";
  const spinButtonLabel = isSpinning ? t.wheel.spinningButton : winner ? t.wheel.spinAgain : t.wheel.spin;
  const winnerName = winner ? getItemDisplayName(winner, t) : "";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel sm:p-5 lg:sticky lg:top-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">{t.wheel.title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {t.wheel.registeredItems(itemCount, selectedRoleName)}
          </p>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
          {inputMode === "percent" ? t.wheel.percentMode : t.wheel.countMode}
        </span>
      </div>

      <div className="mx-auto mt-7 grid w-full max-w-[390px] place-items-center">
        <div className="relative grid aspect-square w-full place-items-center">
          <div
            className="absolute -top-1 z-10 h-0 w-0 border-x-[16px] border-t-[28px] border-x-transparent border-t-slate-950 drop-shadow-lg"
            aria-hidden="true"
          />
          <div className="absolute inset-0 overflow-hidden rounded-full border-[12px] border-white bg-white shadow-[0_24px_55px_rgb(15_23_42_/_22%),inset_0_0_0_1px_rgb(15_23_42_/_16%)]">
            <div
              className={`wheel h-full w-full rounded-full ${isSpinning ? "is-spinning" : ""}`}
              style={{
                "--spin-duration": `${spinDuration}ms`,
                background: wheelGradient,
                transform: `rotate(${rotation}deg)`,
              }}
              aria-hidden="true"
            />
          </div>
          <div className="relative z-10 grid aspect-square w-[28%] place-items-center rounded-full border-[8px] border-white bg-slate-950 text-center text-white shadow-xl">
            <span className="text-xl font-black">{itemCount}</span>
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
        <p className="text-sm font-black uppercase tracking-normal text-slate-500">{t.wheel.resultLabel}</p>
        {winner ? (
          <>
            <strong className="mt-2 break-words text-3xl font-black text-slate-950">{winnerName}</strong>
            <span className="mt-2 text-sm font-black text-orange-600">
              {t.wheel.winningChance(formatPercent(winnerPercent))}
            </span>
          </>
        ) : (
          <>
            <strong className="mt-2 text-3xl font-black text-slate-400">
              {isSpinning ? t.wheel.spinning : t.wheel.noResult}
            </strong>
            <span className="mt-2 text-sm font-bold text-slate-500">
              {isSpinning ? t.wheel.waitForResult : t.wheel.notStarted}
            </span>
          </>
        )}
      </div>
    </section>
  );
}

export default App;
