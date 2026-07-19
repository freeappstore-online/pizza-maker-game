import { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type GameStage = "knead" | "top" | "bake" | "pack" | "done";

type ToppingKind = "sauce" | "cheese" | "pepperoni" | "mushroom" | "olive" | "pepper" | "onion" | "basil";

interface Topping {
  id: string;
  kind: ToppingKind;
  label: string;
  x: number; // % of pizza area
  y: number;
  rotation?: number;
  scale?: number;
}

interface KneadState {
  presses: number;
  total: number;
  done: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const KNEAD_TARGET = 12;
const BAKE_DURATION = 5000;

const TOPPINGS_PALETTE: { id: ToppingKind; label: string; emoji: string }[] = [
  { id: "sauce",     label: "Tomato Sauce", emoji: "🍅" },
  { id: "cheese",    label: "Mozzarella",   emoji: "🧀" },
  { id: "pepperoni", label: "Pepperoni",    emoji: "🔴" },
  { id: "mushroom",  label: "Mushroom",     emoji: "🍄" },
  { id: "pepper",    label: "Bell Pepper",  emoji: "🫑" },
  { id: "onion",     label: "Onion",        emoji: "🧅" },
  { id: "olive",     label: "Olive",        emoji: "🫒" },
  { id: "basil",     label: "Basil",        emoji: "🌿" },
];

// ─── SVG Topping Renderers ────────────────────────────────────────────────────

/** Renders a single topping as an SVG element placed on the pizza */
function ToppingSVG({ t, baked = false }: { t: Topping; baked?: boolean }) {
  const rot = t.rotation ?? 0;

  if (t.kind === "sauce") {
    // Irregular blob spread
    return (
      <g transform={`translate(${t.x},${t.y}) rotate(${rot})`}>
        <ellipse rx={18} ry={12} fill={baked ? "#b91c1c" : "#ef4444"} opacity={0.82} />
        <ellipse rx={13} ry={8} cx={3} cy={-1} fill={baked ? "#dc2626" : "#f87171"} opacity={0.6} />
        <ellipse rx={9} ry={6} cx={-4} cy={3} fill={baked ? "#991b1b" : "#fca5a5"} opacity={0.5} />
      </g>
    );
  }

  if (t.kind === "cheese") {
    // Melted blob
    return (
      <g transform={`translate(${t.x},${t.y}) rotate(${rot})`}>
        <ellipse rx={16} ry={10} fill={baked ? "#ca8a04" : "#fde68a"} opacity={0.88} />
        <ellipse rx={10} ry={6} cx={4} cy={-2} fill={baked ? "#d97706" : "#fef3c7"} opacity={0.7} />
        <ellipse rx={7} ry={4} cx={-5} cy={2} fill={baked ? "#b45309" : "#fef9c3"} opacity={0.55} />
      </g>
    );
  }

  if (t.kind === "pepperoni") {
    return (
      <g transform={`translate(${t.x},${t.y})`}>
        <circle r={9} fill={baked ? "#7f1d1d" : "#b91c1c"} />
        <circle r={7} fill={baked ? "#991b1b" : "#dc2626"} />
        {/* small fat spots */}
        <circle r={1.5} cx={-2} cy={-2} fill={baked ? "#fca5a5" : "#fecaca"} opacity={0.7} />
        <circle r={1} cx={3} cy={1} fill={baked ? "#fca5a5" : "#fecaca"} opacity={0.6} />
        <circle r={1} cx={0} cy={3} fill={baked ? "#fca5a5" : "#fecaca"} opacity={0.5} />
      </g>
    );
  }

  if (t.kind === "mushroom") {
    // Sliced mushroom (top-down cross-section)
    return (
      <g transform={`translate(${t.x},${t.y}) rotate(${rot}) scale(${t.scale ?? 1})`}>
        {/* outer ring */}
        <ellipse rx={9} ry={7} fill={baked ? "#92400e" : "#d97706"} />
        {/* inner lighter flesh */}
        <ellipse rx={6} ry={4.5} fill={baked ? "#b45309" : "#fde68a"} />
        {/* stem cross-section bottom */}
        <rect x={-3} y={3} width={6} height={4} rx={1.5} fill={baked ? "#78350f" : "#fef3c7"} />
        {/* gills lines */}
        <line x1={-4} y1={1} x2={4} y2={1} stroke={baked ? "#78350f" : "#f59e0b"} strokeWidth={0.6} opacity={0.7} />
        <line x1={-3} y1={-1} x2={3} y2={-1} stroke={baked ? "#78350f" : "#f59e0b"} strokeWidth={0.6} opacity={0.5} />
      </g>
    );
  }

  if (t.kind === "pepper") {
    // Sliced bell pepper ring
    return (
      <g transform={`translate(${t.x},${t.y}) rotate(${rot}) scale(${t.scale ?? 1})`}>
        <ellipse rx={10} ry={7} fill="none" stroke={baked ? "#15803d" : "#22c55e"} strokeWidth={3.5} />
        <ellipse rx={10} ry={7} fill={baked ? "#14532d" : "#86efac"} opacity={0.25} />
        {/* seeds */}
        <circle r={1} cx={0} cy={0} fill={baked ? "#ca8a04" : "#fde68a"} opacity={0.8} />
        <circle r={0.8} cx={3} cy={2} fill={baked ? "#ca8a04" : "#fde68a"} opacity={0.7} />
        <circle r={0.8} cx={-3} cy={-2} fill={baked ? "#ca8a04" : "#fde68a"} opacity={0.7} />
      </g>
    );
  }

  if (t.kind === "onion") {
    // Sliced onion ring
    return (
      <g transform={`translate(${t.x},${t.y}) rotate(${rot}) scale(${t.scale ?? 1})`}>
        <ellipse rx={10} ry={6} fill="none" stroke={baked ? "#a16207" : "#fde68a"} strokeWidth={3} />
        <ellipse rx={6} ry={3.5} fill="none" stroke={baked ? "#a16207" : "#fef9c3"} strokeWidth={2} />
        <ellipse rx={10} ry={6} fill={baked ? "#713f12" : "#fef3c7"} opacity={0.2} />
      </g>
    );
  }

  if (t.kind === "olive") {
    return (
      <g transform={`translate(${t.x},${t.y}) rotate(${rot})`}>
        <ellipse rx={5} ry={7} fill={baked ? "#1c1917" : "#292524"} />
        <ellipse rx={2} ry={3} fill={baked ? "#dc2626" : "#ef4444"} />
        <ellipse rx={1} ry={1.5} cx={0} cy={0} fill={baked ? "#fca5a5" : "#fecaca"} opacity={0.6} />
      </g>
    );
  }

  if (t.kind === "basil") {
    return (
      <g transform={`translate(${t.x},${t.y}) rotate(${rot}) scale(${t.scale ?? 1})`}>
        <ellipse rx={8} ry={5} fill={baked ? "#14532d" : "#16a34a"} />
        <ellipse rx={5} ry={3} cx={1} cy={-1} fill={baked ? "#15803d" : "#22c55e"} opacity={0.7} />
        <line x1={-5} y1={0} x2={5} y2={0} stroke={baked ? "#166534" : "#4ade80"} strokeWidth={0.8} opacity={0.8} />
      </g>
    );
  }

  return null;
}

/** Palette preview icon for each topping */
function ToppingIcon({ kind }: { kind: ToppingKind }) {
  if (kind === "sauce") return (
    <svg width={32} height={32} viewBox="-16 -16 32 32">
      <ellipse rx={13} ry={9} fill="#ef4444" opacity={0.9} />
      <ellipse rx={8} ry={5} cx={2} cy={-1} fill="#f87171" opacity={0.7} />
    </svg>
  );
  if (kind === "cheese") return (
    <svg width={32} height={32} viewBox="-16 -16 32 32">
      <ellipse rx={13} ry={8} fill="#fde68a" opacity={0.95} />
      <ellipse rx={8} ry={5} cx={3} cy={-1} fill="#fef9c3" opacity={0.7} />
    </svg>
  );
  if (kind === "pepperoni") return (
    <svg width={32} height={32} viewBox="-16 -16 32 32">
      <circle r={11} fill="#b91c1c" />
      <circle r={8} fill="#dc2626" />
      <circle r={1.5} cx={-2} cy={-2} fill="#fecaca" opacity={0.8} />
    </svg>
  );
  if (kind === "mushroom") return (
    <svg width={32} height={32} viewBox="-16 -16 32 32">
      <ellipse rx={11} ry={8} fill="#d97706" />
      <ellipse rx={7} ry={5} fill="#fde68a" />
      <rect x={-3} y={3} width={6} height={5} rx={1.5} fill="#fef3c7" />
    </svg>
  );
  if (kind === "pepper") return (
    <svg width={32} height={32} viewBox="-16 -16 32 32">
      <ellipse rx={12} ry={8} fill="none" stroke="#22c55e" strokeWidth={4} />
      <ellipse rx={12} ry={8} fill="#86efac" opacity={0.25} />
    </svg>
  );
  if (kind === "onion") return (
    <svg width={32} height={32} viewBox="-16 -16 32 32">
      <ellipse rx={12} ry={7} fill="none" stroke="#fde68a" strokeWidth={3.5} />
      <ellipse rx={7} ry={4} fill="none" stroke="#fef9c3" strokeWidth={2.5} />
    </svg>
  );
  if (kind === "olive") return (
    <svg width={32} height={32} viewBox="-16 -16 32 32">
      <ellipse rx={6} ry={9} fill="#292524" />
      <ellipse rx={2.5} ry={3.5} fill="#ef4444" />
    </svg>
  );
  if (kind === "basil") return (
    <svg width={32} height={32} viewBox="-16 -16 32 32">
      <ellipse rx={11} ry={7} fill="#16a34a" />
      <ellipse rx={7} ry={4} cx={1} cy={-1} fill="#22c55e" opacity={0.7} />
      <line x1={-7} y1={0} x2={7} y2={0} stroke="#4ade80" strokeWidth={1} />
    </svg>
  );
  return null;
}

// ─── Pizza SVG Canvas ─────────────────────────────────────────────────────────
function PizzaSVG({
  toppings, size = 130, baked = false, showCrust = true
}: {
  toppings: Topping[];
  size?: number;
  baked?: boolean;
  showCrust?: boolean;
}) {
  const r = size / 2;
  const crustColor = baked ? "#92400e" : "#f59e0b";
  const baseColor = baked ? "#d97706" : "#fef3c7";
  const innerColor = baked ? "#b45309" : "#fde68a";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <defs>
        <clipPath id={`pizza-clip-${size}`}>
          <circle cx={r} cy={r} r={r - 2} />
        </clipPath>
        {baked && (
          <radialGradient id="bake-glow" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#92400e" stopOpacity="0" />
          </radialGradient>
        )}
      </defs>

      {/* Crust ring */}
      {showCrust && (
        <circle cx={r} cy={r} r={r - 1} fill={crustColor} />
      )}
      {/* Base dough */}
      <circle cx={r} cy={r} r={r - (showCrust ? 10 : 2)} fill={baseColor} />
      {/* Inner gradient */}
      <circle cx={r} cy={r} r={r - (showCrust ? 14 : 4)}
        fill={innerColor} opacity={0.7} />

      {/* Bake glow overlay */}
      {baked && (
        <circle cx={r} cy={r} r={r - 2} fill="url(#bake-glow)" />
      )}

      {/* Toppings clipped to pizza */}
      <g clipPath={`url(#pizza-clip-${size})`} transform={`translate(${r},${r})`}>
        {toppings.map(t => (
          <ToppingSVG key={t.id} t={{ ...t, x: (t.x / 100) * (r - 12) * 2 - (r - 12), y: (t.y / 100) * (r - 12) * 2 - (r - 12) }} baked={baked} />
        ))}
      </g>

      {/* Crust texture dots */}
      {showCrust && baked && [0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
        const rad = (angle * Math.PI) / 180;
        const cx2 = r + Math.cos(rad) * (r - 5);
        const cy2 = r + Math.sin(rad) * (r - 5);
        return <circle key={angle} cx={cx2} cy={cy2} r={2} fill="#78350f" opacity={0.5} />;
      })}
    </svg>
  );
}

// ─── Baked Pizza (rich visual) ────────────────────────────────────────────────
function BakedPizzaSVG({ toppings, size = 160 }: { toppings: Topping[]; size?: number }) {
  const r = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", filter: "drop-shadow(0 8px 24px #92400e60)" }}>
      <defs>
        <clipPath id="baked-clip">
          <circle cx={r} cy={r} r={r - 2} />
        </clipPath>
        <radialGradient id="crust-grad" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#78350f" />
        </radialGradient>
        <radialGradient id="base-grad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="60%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
        <radialGradient id="glow-grad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#92400e" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx={r} cy={r + 8} rx={r - 4} ry={10} fill="#78350f" opacity={0.25} />

      {/* Crust */}
      <circle cx={r} cy={r} r={r - 1} fill="url(#crust-grad)" />

      {/* Crust char spots */}
      {[20, 75, 130, 195, 250, 310].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <circle key={i}
            cx={r + Math.cos(rad) * (r - 5)}
            cy={r + Math.sin(rad) * (r - 5)}
            r={3 + (i % 2) * 1.5}
            fill="#451a03" opacity={0.55} />
        );
      })}

      {/* Base sauce */}
      <circle cx={r} cy={r} r={r - 11} fill="url(#base-grad)" />

      {/* Cheese layer base */}
      <circle cx={r} cy={r} r={r - 14} fill="#fbbf24" opacity={0.55} />

      {/* Glow */}
      <circle cx={r} cy={r} r={r - 2} fill="url(#glow-grad)" />

      {/* Toppings */}
      <g clipPath="url(#baked-clip)" transform={`translate(${r},${r})`}>
        {toppings.map(t => (
          <ToppingSVG
            key={t.id}
            t={{ ...t, x: (t.x / 100) * (r - 14) * 2 - (r - 14), y: (t.y / 100) * (r - 14) * 2 - (r - 14) }}
            baked={true}
          />
        ))}
        {/* Extra cheese blobs scattered */}
        {[{ x: -20, y: -25, rx: 14, ry: 9, rot: 20 },
          { x: 15, y: 10, rx: 16, ry: 10, rot: -15 },
          { x: -10, y: 20, rx: 12, ry: 7, rot: 40 },
          { x: 25, y: -15, rx: 10, ry: 6, rot: 10 }].map((c, i) => (
          <g key={i} transform={`translate(${c.x},${c.y}) rotate(${c.rot})`}>
            <ellipse rx={c.rx} ry={c.ry} fill="#ca8a04" opacity={0.55} />
            <ellipse rx={c.rx * 0.6} ry={c.ry * 0.6} fill="#fef9c3" opacity={0.4} />
          </g>
        ))}
        {/* Bubbled cheese spots */}
        {[{ x: -30, y: 5 }, { x: 20, y: -30 }, { x: 10, y: 25 }, { x: -15, y: -15 }].map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={4} fill="#fef3c7" opacity={0.5} />
        ))}
      </g>

      {/* Sheen */}
      <ellipse cx={r - 15} cy={r - 18} rx={18} ry={10} fill="white" opacity={0.08} transform={`rotate(-30,${r},${r})`} />
    </svg>
  );
}

// ─── Knead Section (Bottom-Left) ─────────────────────────────────────────────
function KneadSection({ knead, onPress, stage }: {
  knead: KneadState;
  onPress: () => void;
  stage: GameStage;
}) {
  const active = stage === "knead";
  const progress = Math.min(knead.presses / KNEAD_TARGET, 1);
  const size = 80 + progress * 40;
  const [bounce, setBounce] = useState(false);

  const handlePress = () => {
    if (!active || knead.done) return;
    setBounce(true);
    setTimeout(() => setBounce(false), 150);
    onPress();
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-full select-none"
      style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)" }}>
      <div className="absolute top-3 left-4 font-bold text-sm" style={{ fontFamily: "Fraunces, serif", color: "#92400e" }}>
        🤌 Knead the Dough
      </div>
      {knead.done && (
        <div className="absolute top-3 right-4 text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded-full">✓ Done!</div>
      )}

      <div className="absolute bottom-12 left-4 right-4">
        <div className="text-xs text-amber-700 mb-1 text-center">
          {knead.done ? "Dough is ready!" : `Knead ${KNEAD_TARGET - knead.presses} more times`}
        </div>
        <div className="w-full h-2 rounded-full bg-amber-200">
          <div className="h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%`, background: "#d97706" }} />
        </div>
      </div>

      <button
        onClick={handlePress}
        disabled={!active || knead.done}
        className="focus:outline-none"
        style={{ cursor: active && !knead.done ? "pointer" : "default", transform: bounce ? "scale(0.88)" : "scale(1)", transition: "transform 0.12s" }}
      >
        <div className="rounded-full shadow-lg flex items-center justify-center transition-all duration-300"
          style={{
            width: size, height: size * 0.65,
            background: knead.done
              ? "radial-gradient(circle at 35% 35%,#fde68a,#f59e0b)"
              : "radial-gradient(circle at 35% 35%,#fff7ed,#fcd34d)",
            boxShadow: knead.done ? "0 8px 24px #d9770660" : "0 4px 16px #d9770640",
            border: "3px solid #f59e0b",
          }}>
          <span style={{ fontSize: size * 0.32 }}>
            {knead.done ? "🍞" : knead.presses === 0 ? "👆" : "👐"}
          </span>
        </div>
      </button>

      {!active && !knead.done && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/10 backdrop-blur-[1px]">
          <span className="text-2xl">🔒</span>
        </div>
      )}
    </div>
  );
}

// ─── Topping Section (Bottom-Right) ──────────────────────────────────────────
function ToppingSection({ toppings, onAddTopping, stage, kneadDone }: {
  toppings: Topping[];
  onAddTopping: (t: Topping) => void;
  stage: GameStage;
  kneadDone: boolean;
}) {
  const active = stage === "top";
  const pizzaRef = useRef<HTMLDivElement>(null);
  const pizzaSvgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<typeof TOPPINGS_PALETTE[0] | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dropFlash, setDropFlash] = useState(false);

  // For sauce/cheese: track drag path and place multiple blobs
  const isDragSpread = (kind: ToppingKind) => kind === "sauce" || kind === "cheese";

  const placeTopping = useCallback((clientX: number, clientY: number, item: typeof TOPPINGS_PALETTE[0]) => {
    if (!pizzaRef.current) return;
    const rect = pizzaRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      const xPct = (x / rect.width) * 100;
      const yPct = (y / rect.height) * 100;
      // Check roughly inside circle
      const cx = 50, cy = 50, rx = 48, ry = 48;
      if (((xPct - cx) / rx) ** 2 + ((yPct - cy) / ry) ** 2 <= 1) {
        onAddTopping({
          id: `${item.id}-${Date.now()}-${Math.random()}`,
          kind: item.id,
          label: item.label,
          x: xPct, y: yPct,
          rotation: Math.random() * 360,
          scale: 0.85 + Math.random() * 0.3,
        });
      }
    }
  }, [onAddTopping]);

  const lastSpreadPos = useRef<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setDragPos({ x: e.clientX, y: e.clientY });
    if (dragging && isDragSpread(dragging.id)) {
      const last = lastSpreadPos.current;
      if (!last || Math.hypot(e.clientX - last.x, e.clientY - last.y) > 18) {
        placeTopping(e.clientX, e.clientY, dragging);
        lastSpreadPos.current = { x: e.clientX, y: e.clientY };
      }
    }
  }, [dragging, placeTopping]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (dragging) {
      if (!isDragSpread(dragging.id)) {
        placeTopping(e.clientX, e.clientY, dragging);
      }
    }
    setDragging(null);
    lastSpreadPos.current = null;
  }, [dragging, placeTopping]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging) return;
    e.preventDefault();
    const t = e.touches[0];
    setDragPos({ x: t.clientX, y: t.clientY });
    if (isDragSpread(dragging.id)) {
      const last = lastSpreadPos.current;
      if (!last || Math.hypot(t.clientX - last.x, t.clientY - last.y) > 18) {
        placeTopping(t.clientX, t.clientY, dragging);
        lastSpreadPos.current = { x: t.clientX, y: t.clientY };
      }
    }
  }, [dragging, placeTopping]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (dragging) {
      const t = e.changedTouches[0];
      if (!isDragSpread(dragging.id)) {
        placeTopping(t.clientX, t.clientY, dragging);
      }
    }
    setDragging(null);
    lastSpreadPos.current = null;
  }, [dragging, placeTopping]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
    }
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [dragging, handleTouchMove, handleTouchEnd]);

  const readyToBake = toppings.length >= 2;

  // Pizza display size
  const pizzaSize = 130;

  return (
    <div className="relative flex flex-col h-full select-none overflow-hidden"
      style={{ background: "linear-gradient(135deg,#ecfdf5,#d1fae5)" }}>
      <div className="absolute top-3 left-4 font-bold text-sm z-10" style={{ fontFamily: "Fraunces, serif", color: "#065f46" }}>
        🍕 Add Toppings
      </div>
      {readyToBake && active && (
        <div className="absolute top-3 right-4 text-green-700 font-bold text-xs bg-green-100 px-2 py-1 rounded-full z-10">✓ Ready!</div>
      )}

      {/* Pizza drop zone */}
      <div className="flex-1 flex items-center justify-center pt-8 pb-1">
        <div
          ref={pizzaRef}
          className="relative rounded-full"
          style={{
            width: pizzaSize, height: pizzaSize,
            outline: dropFlash ? "3px dashed #10b981" : "3px dashed #d97706",
            outlineOffset: 3,
            boxShadow: dropFlash ? "0 0 20px #10b98140" : "none",
            cursor: dragging && active ? "crosshair" : "default",
            transition: "outline 0.2s",
          }}
        >
          <svg ref={pizzaSvgRef} width={pizzaSize} height={pizzaSize} viewBox={`0 0 ${pizzaSize} ${pizzaSize}`}>
            <defs>
              <clipPath id="pizza-top-clip">
                <circle cx={pizzaSize / 2} cy={pizzaSize / 2} r={pizzaSize / 2 - 2} />
              </clipPath>
            </defs>
            {/* Crust */}
            <circle cx={pizzaSize / 2} cy={pizzaSize / 2} r={pizzaSize / 2 - 1} fill="#f59e0b" />
            {/* Base */}
            <circle cx={pizzaSize / 2} cy={pizzaSize / 2} r={pizzaSize / 2 - 10} fill="#fef3c7" />
            <circle cx={pizzaSize / 2} cy={pizzaSize / 2} r={pizzaSize / 2 - 14} fill="#fde68a" opacity={0.7} />
            {/* Toppings */}
            <g clipPath="url(#pizza-top-clip)" transform={`translate(${pizzaSize / 2},${pizzaSize / 2})`}>
              {toppings.map(t => {
                const innerR = pizzaSize / 2 - 14;
                return (
                  <ToppingSVG
                    key={t.id}
                    t={{ ...t, x: (t.x / 100) * innerR * 2 - innerR, y: (t.y / 100) * innerR * 2 - innerR }}
                    baked={false}
                  />
                );
              })}
            </g>
            {toppings.length === 0 && (
              <text x={pizzaSize / 2} y={pizzaSize / 2 + 5} textAnchor="middle" fontSize={10} fill="#d97706" opacity={0.7}>
                Drag here!
              </text>
            )}
          </svg>
        </div>
      </div>

      {/* Topping palette */}
      <div className="px-2 pb-2">
        <div className="grid grid-cols-4 gap-1">
          {TOPPINGS_PALETTE.map((item) => (
            <button
              key={item.id}
              onMouseDown={(e) => { if (!active) return; e.preventDefault(); setDragging(item); setDragPos({ x: e.clientX, y: e.clientY }); lastSpreadPos.current = null; }}
              onTouchStart={(e) => { if (!active) return; const t = e.touches[0]; setDragging(item); setDragPos({ x: t.clientX, y: t.clientY }); lastSpreadPos.current = null; }}
              disabled={!active}
              className="flex flex-col items-center justify-center rounded-xl p-1 transition-all active:scale-90"
              style={{
                background: active ? "#fff" : "#e5e7eb",
                border: "1.5px solid #d1fae5",
                cursor: active ? "grab" : "not-allowed",
                opacity: active ? 1 : 0.5,
                minHeight: 52,
              }}
              title={item.label}
            >
              <ToppingIcon kind={item.id} />
              <span className="text-[9px] text-center leading-tight" style={{ color: "#065f46" }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ghost drag element */}
      {dragging && (
        <div className="fixed pointer-events-none z-50" style={{ left: dragPos.x - 16, top: dragPos.y - 16 }}>
          <ToppingIcon kind={dragging.id} />
        </div>
      )}

      {!active && !kneadDone && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/10 backdrop-blur-[1px]">
          <span className="text-2xl">🔒</span>
        </div>
      )}
    </div>
  );
}

// ─── Bake Section (Top-Right) ─────────────────────────────────────────────────
function BakeSection({ toppings, stage, onBakeDone }: {
  toppings: Topping[];
  stage: GameStage;
  onBakeDone: () => void;
}) {
  const active = stage === "bake";
  const [baking, setBaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startBake = () => {
    if (!active || baking || done) return;
    setBaking(true);
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / BAKE_DURATION, 1);
      setProgress(p);
      if (p >= 1) {
        clearInterval(intervalRef.current!);
        setBaking(false);
        setDone(true);
        setTimeout(onBakeDone, 900);
      }
    }, 50);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);
  useEffect(() => { if (stage === "knead") { setBaking(false); setProgress(0); setDone(false); } }, [stage]);

  const canBake = active && toppings.length >= 2 && !baking && !done;

  return (
    <div className="relative flex flex-col items-center justify-center h-full select-none"
      style={{ background: "linear-gradient(135deg,#fef2f2,#fee2e2)" }}>
      <div className="absolute top-3 left-4 font-bold text-sm" style={{ fontFamily: "Fraunces, serif", color: "#991b1b" }}>
        🔥 Bake in Oven
      </div>
      {done && (
        <div className="absolute top-3 right-4 text-orange-700 font-bold text-xs bg-orange-100 px-2 py-1 rounded-full">✓ Baked!</div>
      )}

      {/* Oven body */}
      <div className="relative flex flex-col items-center">
        <div className="relative rounded-2xl overflow-hidden shadow-xl"
          style={{ width: 160, height: 120, background: "#374151", border: "4px solid #1f2937" }}>
          {/* Oven window */}
          <div className="absolute inset-3 rounded-xl flex items-center justify-center overflow-hidden"
            style={{
              background: baking || done
                ? `radial-gradient(circle,#fbbf24 0%,#f97316 40%,#ef4444 80%)`
                : "#111827",
              boxShadow: baking ? "0 0 24px #fbbf2480 inset" : done ? "0 0 16px #f9731640 inset" : "none",
              transition: "background 0.5s",
            }}>
            {/* Pizza inside oven */}
            {active && toppings.length >= 2 && (
              <div style={{ transform: `scale(${0.55 + progress * 0.05})`, transition: "transform 0.5s" }}>
                {done
                  ? <BakedPizzaSVG toppings={toppings} size={90} />
                  : <PizzaSVG toppings={toppings} size={90} baked={progress > 0.3} />
                }
              </div>
            )}
            {/* Heat shimmer lines */}
            {baking && [0, 1, 2].map(i => (
              <div key={i} className="absolute bottom-0 animate-pulse"
                style={{
                  left: `${25 + i * 20}%`, width: 2, height: `${40 + i * 15}%`,
                  background: "linear-gradient(to top,#fbbf24,transparent)",
                  opacity: 0.5, animationDelay: `${i * 0.2}s`
                }} />
            ))}
          </div>
          {/* Knobs */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-around px-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-3.5 h-3.5 rounded-full border-2"
                style={{
                  background: baking ? "#ef4444" : "#6b7280",
                  borderColor: baking ? "#fca5a5" : "#4b5563",
                  transition: "all 0.3s"
                }} />
            ))}
          </div>
          {/* Temp display */}
          <div className="absolute top-2 right-2 text-xs font-bold"
            style={{ color: baking ? "#fbbf24" : done ? "#f97316" : "#6b7280" }}>
            {done ? "220°C" : baking ? `${Math.round(180 + progress * 40)}°C` : "OFF"}
          </div>
        </div>
        {/* Door handle */}
        <div className="w-24 h-3 rounded-b-xl" style={{ background: "#1f2937" }} />
      </div>

      {/* Progress */}
      {(baking || done) && (
        <div className="mt-3 w-40">
          <div className="w-full h-2.5 rounded-full bg-red-200">
            <div className="h-2.5 rounded-full transition-all"
              style={{ width: `${progress * 100}%`, background: done ? "#16a34a" : "linear-gradient(90deg,#f97316,#ef4444)" }} />
          </div>
          <div className="text-xs text-center mt-1" style={{ color: "#991b1b" }}>
            {done ? "🍕 Pizza is perfect!" : `Baking… ${Math.round(progress * 100)}%`}
          </div>
        </div>
      )}

      <button
        onClick={startBake}
        disabled={!canBake}
        className="mt-3 px-5 py-2 rounded-xl font-bold text-sm transition-all active:scale-95"
        style={{
          background: canBake ? "#ef4444" : "#d1d5db",
          color: canBake ? "#fff" : "#9ca3af",
          cursor: canBake ? "pointer" : "not-allowed",
          boxShadow: canBake ? "0 4px 12px #ef444440" : "none",
        }}
      >
        {done ? "✓ Done!" : baking ? "Baking…" : "Start Baking!"}
      </button>

      {!active && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/10 backdrop-blur-[1px]">
          <span className="text-2xl">🔒</span>
        </div>
      )}
    </div>
  );
}

// ─── Pack Section (Top-Left) ──────────────────────────────────────────────────
function PackSection({ toppings, stage, onPackDone }: {
  toppings: Topping[];
  stage: GameStage;
  onPackDone: () => void;
}) {
  const active = stage === "pack";
  const [packed, setPacked] = useState(false);
  const [closing, setClosing] = useState(false);
  const [lidAngle, setLidAngle] = useState(0);

  const handlePack = () => {
    if (!active || packed || closing) return;
    setClosing(true);
    let angle = 0;
    const iv = setInterval(() => {
      angle += 5;
      setLidAngle(angle);
      if (angle >= 90) {
        clearInterval(iv);
        setPacked(true);
        setClosing(false);
        setTimeout(onPackDone, 700);
      }
    }, 20);
  };

  useEffect(() => { if (stage === "knead") { setPacked(false); setClosing(false); setLidAngle(0); } }, [stage]);

  return (
    <div className="relative flex flex-col items-center justify-center h-full select-none"
      style={{ background: "linear-gradient(135deg,#eff6ff,#dbeafe)" }}>
      <div className="absolute top-3 left-4 font-bold text-sm" style={{ fontFamily: "Fraunces, serif", color: "#1e40af" }}>
        📦 Pack the Pizza
      </div>
      {packed && (
        <div className="absolute top-3 right-4 text-blue-700 font-bold text-xs bg-blue-100 px-2 py-1 rounded-full">✓ Packed!</div>
      )}

      {/* Box */}
      <div className="relative" style={{ width: 150, height: 150 }}>
        {/* Box bottom */}
        <div className="absolute bottom-0 left-0 right-0 rounded-b-2xl overflow-hidden"
          style={{ height: 108, background: "#d97706", border: "3px solid #92400e", borderTop: "none" }}>
          {/* Pizza inside box */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: 8 }}>
            <BakedPizzaSVG toppings={toppings} size={88} />
          </div>
          <div className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-bold" style={{ color: "#92400e" }}>
            🍕 PIZZA
          </div>
          {/* Box inner lines */}
          <div className="absolute top-0 left-1/2 w-px h-full opacity-20" style={{ background: "#92400e" }} />
          <div className="absolute top-1/2 left-0 w-full h-px opacity-20" style={{ background: "#92400e" }} />
        </div>

        {/* Box lid */}
        <div className="absolute top-0 left-0 right-0 rounded-t-2xl origin-bottom"
          style={{
            height: 46,
            background: "linear-gradient(180deg,#fbbf24,#f59e0b)",
            border: "3px solid #92400e",
            borderBottom: "none",
            transform: `perspective(400px) rotateX(${-lidAngle}deg)`,
            transformOrigin: "bottom center",
          }}>
          <div className="absolute inset-0 flex items-center justify-center">
            {packed
              ? <span className="text-xl">✅</span>
              : <span className="text-sm font-bold" style={{ color: "#92400e" }}>📦 OPEN</span>
            }
          </div>
          <div className="absolute bottom-0 left-6 right-6 h-0.5 rounded" style={{ background: "#92400e", opacity: 0.4 }} />
        </div>
      </div>

      <button
        onClick={handlePack}
        disabled={!active || packed || closing}
        className="mt-4 px-5 py-2 rounded-xl font-bold text-sm transition-all active:scale-95"
        style={{
          background: active && !packed && !closing ? "#2563eb" : "#d1d5db",
          color: active && !packed && !closing ? "#fff" : "#9ca3af",
          cursor: active && !packed && !closing ? "pointer" : "not-allowed",
          boxShadow: active && !packed && !closing ? "0 4px 12px #2563eb40" : "none",
        }}
      >
        {packed ? "✓ Packed!" : closing ? "Closing…" : "Close the Box!"}
      </button>

      {!active && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/10 backdrop-blur-[1px]">
          <span className="text-2xl">🔒</span>
        </div>
      )}
    </div>
  );
}

// ─── Done Overlay ─────────────────────────────────────────────────────────────
function DoneOverlay({ toppings, onRestart }: { toppings: Topping[]; onRestart: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
      <div className="rounded-3xl p-8 flex flex-col items-center shadow-2xl max-w-xs mx-4"
        style={{ background: "var(--paper)", border: "3px solid #f59e0b" }}>
        <BakedPizzaSVG toppings={toppings} size={120} />
        <h2 className="text-2xl font-bold mt-3" style={{ fontFamily: "Fraunces, serif", color: "#92400e" }}>
          Pizza Delivered!
        </h2>
        <p className="text-sm text-center mt-2" style={{ color: "var(--muted)" }}>
          Your pizza is kneaded, topped, baked & packed. Buon appetito! 🇮🇹
        </p>
        <button
          onClick={onRestart}
          className="mt-5 px-8 py-3 rounded-xl font-bold text-white text-base transition-all active:scale-95"
          style={{ background: "#f59e0b", boxShadow: "0 4px 16px #f59e0b60" }}
        >
          🔄 Make Another Pizza!
        </button>
      </div>
    </div>
  );
}

// ─── Stage Progress Bar ────────────────────────────────────────────────────────
const STAGES: { key: GameStage; label: string; emoji: string }[] = [
  { key: "knead", label: "Knead", emoji: "🤌" },
  { key: "top",   label: "Top",   emoji: "🍅" },
  { key: "bake",  label: "Bake",  emoji: "🔥" },
  { key: "pack",  label: "Pack",  emoji: "📦" },
];

function StageBar({ stage }: { stage: GameStage }) {
  const idx = STAGES.findIndex(s => s.key === stage);
  return (
    <div className="flex items-center justify-center gap-1 px-2">
      {STAGES.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-base transition-all"
              style={{
                background: i < idx ? "#16a34a" : i === idx ? "#f59e0b" : "#e5e7eb",
                color: i <= idx ? "#fff" : "#9ca3af",
                boxShadow: i === idx ? "0 0 0 3px #fde68a" : "none",
              }}>
              {i < idx ? "✓" : s.emoji}
            </div>
            <span className="text-[9px] mt-0.5 font-semibold"
              style={{ color: i === idx ? "#92400e" : "var(--muted)" }}>
              {s.label}
            </span>
          </div>
          {i < STAGES.length - 1 && (
            <div className="w-6 h-0.5 mb-4 rounded"
              style={{ background: i < idx ? "#16a34a" : "#e5e7eb" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [stage, setStage] = useState<GameStage>("knead");
  const [knead, setKnead] = useState<KneadState>({ presses: 0, total: KNEAD_TARGET, done: false });
  const [toppings, setToppings] = useState<Topping[]>([]);

  const handleKnead = () => {
    setKnead(prev => {
      const next = { ...prev, presses: prev.presses + 1 };
      if (next.presses >= KNEAD_TARGET) {
        next.done = true;
        setTimeout(() => setStage("top"), 600);
      }
      return next;
    });
  };

  const handleAddTopping = (t: Topping) => setToppings(prev => [...prev, t]);
  const handleBakeDone = () => setStage("pack");
  const handlePackDone = () => setStage("done");
  const canAdvanceToBake = stage === "top" && toppings.length >= 2;

  const restart = () => {
    setStage("knead");
    setKnead({ presses: 0, total: KNEAD_TARGET, done: false });
    setToppings([]);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--paper)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ background: "var(--panel)", borderBottom: "1.5px solid var(--line)" }}>
        <h1 className="text-xl font-bold" style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}>
          🍕 Pizza Maker
        </h1>
        <StageBar stage={stage === "done" ? "pack" : stage} />
        <button onClick={restart}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all active:scale-95"
          style={{ background: "var(--line)", color: "var(--muted)" }}>
          🔄 Restart
        </button>
      </div>

      {/* 4-quadrant grid */}
      <div className="relative flex-1 grid grid-cols-2 grid-rows-2 gap-2 p-2 overflow-hidden">
        {/* Top-Left: Pack */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid var(--line)" }}>
          <PackSection toppings={toppings} stage={stage} onPackDone={handlePackDone} />
        </div>
        {/* Top-Right: Bake */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid var(--line)" }}>
          <BakeSection toppings={toppings} stage={stage} onBakeDone={handleBakeDone} />
        </div>
        {/* Bottom-Left: Knead */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid var(--line)" }}>
          <KneadSection knead={knead} onPress={handleKnead} stage={stage} />
        </div>
        {/* Bottom-Right: Toppings */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid var(--line)" }}>
          <ToppingSection toppings={toppings} onAddTopping={handleAddTopping} stage={stage} kneadDone={knead.done} />
        </div>

        {/* Advance: top → bake */}
        {canAdvanceToBake && (
          <button
            onClick={() => setStage("bake")}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 px-5 py-2 rounded-xl font-bold text-sm text-white transition-all active:scale-95 animate-bounce"
            style={{ background: "#ef4444", boxShadow: "0 4px 16px #ef444460" }}
          >
            🔥 Send to Oven!
          </button>
        )}

        {/* Done overlay */}
        {stage === "done" && <DoneOverlay toppings={toppings} onRestart={restart} />}
      </div>

      {/* Footer */}
      <div className="text-center py-1.5 text-xs shrink-0" style={{ color: "var(--muted)" }}>
        <a href="https://freeappstore.online" target="_blank" rel="noopener noreferrer"
          className="hover:underline">Part of FreeAppStore — free forever</a>
      </div>
    </div>
  );
}
