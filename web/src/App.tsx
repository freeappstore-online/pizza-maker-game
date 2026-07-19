import { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type GameStage = "knead" | "top" | "bake" | "pack" | "done";

interface Topping {
  id: string;
  emoji: string;
  label: string;
  x: number; // % of pizza area
  y: number;
}

interface KneadState {
  presses: number;
  total: number;
  done: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const KNEAD_TARGET = 12;
const BAKE_DURATION = 5000; // ms

const TOPPINGS_PALETTE = [
  { id: "sauce",    emoji: "🍅", label: "Tomato Sauce" },
  { id: "cheese",   emoji: "🧀", label: "Cheese" },
  { id: "pepperoni",emoji: "🍕", label: "Pepperoni" },
  { id: "mushroom", emoji: "🍄", label: "Mushroom" },
  { id: "olive",    emoji: "🫒", label: "Olive" },
  { id: "pepper",   emoji: "🫑", label: "Bell Pepper" },
  { id: "onion",    emoji: "🧅", label: "Onion" },
  { id: "basil",    emoji: "🌿", label: "Basil" },
];

// ─── Knead Section (Bottom-Left) ─────────────────────────────────────────────
function KneadSection({ knead, onPress, stage }: {
  knead: KneadState;
  onPress: () => void;
  stage: GameStage;
}) {
  const active = stage === "knead";
  const progress = Math.min(knead.presses / KNEAD_TARGET, 1);
  const size = 80 + progress * 40; // dough grows 80→120px

  return (
    <div className="relative flex flex-col items-center justify-center h-full select-none"
      style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)" }}>
      <div className="absolute top-3 left-4 font-bold text-sm" style={{ fontFamily: "Fraunces, serif", color: "#92400e" }}>
        🤌 Knead the Dough
      </div>
      {knead.done && (
        <div className="absolute top-3 right-4 text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded-full">✓ Done!</div>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-12 left-4 right-4">
        <div className="text-xs text-amber-700 mb-1 text-center">{knead.done ? "Dough is ready!" : `Knead ${KNEAD_TARGET - knead.presses} more times`}</div>
        <div className="w-full h-2 rounded-full bg-amber-200">
          <div className="h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%`, background: "#d97706" }} />
        </div>
      </div>

      {/* Dough blob */}
      <button
        onClick={active && !knead.done ? onPress : undefined}
        disabled={!active || knead.done}
        className="transition-all duration-150 active:scale-90 focus:outline-none"
        style={{ cursor: active && !knead.done ? "pointer" : "default" }}
        title={active ? "Click to knead!" : ""}
      >
        <div
          className="rounded-full shadow-lg flex items-center justify-center transition-all duration-300"
          style={{
            width: size,
            height: size * 0.65,
            background: knead.done
              ? "radial-gradient(circle at 35% 35%,#fde68a,#f59e0b)"
              : `radial-gradient(circle at 35% 35%,#fff7ed,#fcd34d)`,
            boxShadow: knead.done ? "0 8px 24px #d9770660" : "0 4px 16px #d9770640",
            border: "3px solid #f59e0b",
          }}
        >
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
  const [dragging, setDragging] = useState<typeof TOPPINGS_PALETTE[0] | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dropFlash, setDropFlash] = useState(false);

  const handleDragStart = (item: typeof TOPPINGS_PALETTE[0]) => {
    if (!active) return;
    setDragging(item);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setDragPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragging || !pizzaRef.current) { setDragging(null); return; }
    const rect = pizzaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      const xPct = (x / rect.width) * 100;
      const yPct = (y / rect.height) * 100;
      onAddTopping({ ...dragging, id: `${dragging.id}-${Date.now()}`, x: xPct, y: yPct });
      setDropFlash(true);
      setTimeout(() => setDropFlash(false), 400);
    }
    setDragging(null);
  }, [dragging, onAddTopping]);

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

  // Touch support
  const handleTouchStart = (item: typeof TOPPINGS_PALETTE[0]) => {
    if (!active) return;
    setDragging(item);
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging) return;
    e.preventDefault();
    const t = e.touches[0];
    setDragPos({ x: t.clientX, y: t.clientY });
  }, [dragging]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!dragging || !pizzaRef.current) { setDragging(null); return; }
    const t = e.changedTouches[0];
    const rect = pizzaRef.current.getBoundingClientRect();
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      const xPct = (x / rect.width) * 100;
      const yPct = (y / rect.height) * 100;
      onAddTopping({ ...dragging, id: `${dragging.id}-${Date.now()}`, x: xPct, y: yPct });
      setDropFlash(true);
      setTimeout(() => setDropFlash(false), 400);
    }
    setDragging(null);
  }, [dragging, onAddTopping]);

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

  return (
    <div className="relative flex flex-col h-full select-none overflow-hidden"
      style={{ background: "linear-gradient(135deg,#ecfdf5,#d1fae5)" }}>
      <div className="absolute top-3 left-4 font-bold text-sm z-10" style={{ fontFamily: "Fraunces, serif", color: "#065f46" }}>
        🍕 Add Toppings
      </div>
      {readyToBake && active && (
        <div className="absolute top-3 right-4 text-green-700 font-bold text-xs bg-green-100 px-2 py-1 rounded-full z-10">✓ Ready to bake!</div>
      )}

      {/* Pizza drop zone */}
      <div className="flex-1 flex items-center justify-center pt-8 pb-2">
        <div
          ref={pizzaRef}
          className="relative rounded-full transition-all duration-300"
          style={{
            width: 130, height: 130,
            background: "radial-gradient(circle at 40% 35%,#fef3c7,#f59e0b)",
            border: dropFlash ? "3px dashed #10b981" : "3px dashed #d97706",
            boxShadow: dropFlash ? "0 0 20px #10b98160" : "0 4px 20px #d9770640",
            transition: "border 0.2s, box-shadow 0.2s",
          }}
        >
          {toppings.map((t) => (
            <span
              key={t.id}
              className="absolute"
              style={{
                left: `${t.x}%`, top: `${t.y}%`,
                transform: "translate(-50%,-50%)",
                fontSize: 18,
                pointerEvents: "none",
              }}
            >{t.emoji}</span>
          ))}
          {toppings.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-amber-600 text-xs text-center px-2">
              Drag toppings here!
            </div>
          )}
        </div>
      </div>

      {/* Topping palette */}
      <div className="px-3 pb-3">
        <div className="grid grid-cols-4 gap-1">
          {TOPPINGS_PALETTE.map((item) => (
            <button
              key={item.id}
              onMouseDown={() => handleDragStart(item)}
              onTouchStart={() => handleTouchStart(item)}
              disabled={!active}
              className="flex flex-col items-center justify-center rounded-xl p-1 transition-all active:scale-90"
              style={{
                background: active ? "#fff" : "#e5e7eb",
                border: "1.5px solid #d1fae5",
                cursor: active ? "grab" : "not-allowed",
                opacity: active ? 1 : 0.5,
              }}
              title={item.label}
            >
              <span style={{ fontSize: 20 }}>{item.emoji}</span>
              <span className="text-[9px] text-center leading-tight mt-0.5" style={{ color: "#065f46" }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ghost drag element */}
      {dragging && (
        <div
          className="fixed pointer-events-none z-50"
          style={{ left: dragPos.x - 16, top: dragPos.y - 16, fontSize: 32 }}
        >
          {dragging.emoji}
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
        setTimeout(onBakeDone, 800);
      }
    }, 50);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  // Reset when stage changes back
  useEffect(() => {
    if (stage === "knead") { setBaking(false); setProgress(0); setDone(false); }
  }, [stage]);

  const canBake = active && toppings.length >= 2 && !baking && !done;
  const ovenTemp = done ? "🔥🔥🔥" : baking ? "🔥🔥" : "🔥";
  const pizzaColor = done
    ? "radial-gradient(circle at 40% 35%,#fbbf24,#b45309)"
    : baking
    ? `radial-gradient(circle at 40% 35%,#fcd34d,#d97706 ${progress * 80 + 20}%,#b45309)`
    : "radial-gradient(circle at 40% 35%,#fef3c7,#f59e0b)";

  return (
    <div className="relative flex flex-col items-center justify-center h-full select-none"
      style={{ background: "linear-gradient(135deg,#fef2f2,#fee2e2)" }}>
      <div className="absolute top-3 left-4 font-bold text-sm" style={{ fontFamily: "Fraunces, serif", color: "#991b1b" }}>
        🔥 Bake in Oven
      </div>
      {done && (
        <div className="absolute top-3 right-4 text-orange-700 font-bold text-xs bg-orange-100 px-2 py-1 rounded-full">✓ Baked!</div>
      )}

      {/* Oven */}
      <div className="relative flex flex-col items-center">
        {/* Oven body */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl"
          style={{ width: 150, height: 110, background: "#374151", border: "4px solid #1f2937" }}>
          {/* Oven window */}
          <div className="absolute inset-3 rounded-xl flex items-center justify-center overflow-hidden"
            style={{
              background: baking || done ? `radial-gradient(circle,#fbbf24,#ef4444 70%)` : "#111827",
              boxShadow: baking ? "0 0 20px #fbbf2480 inset" : "none",
              transition: "background 0.5s",
            }}>
            {/* Pizza inside oven */}
            {(baking || done || active) && toppings.length >= 2 && (
              <div className="relative rounded-full"
                style={{
                  width: 64, height: 64,
                  background: pizzaColor,
                  transition: "background 0.5s",
                  boxShadow: baking ? "0 0 12px #fbbf24" : "none",
                }}>
                {toppings.slice(0, 6).map((t) => (
                  <span key={t.id} className="absolute" style={{
                    left: `${t.x}%`, top: `${t.y}%`,
                    transform: "translate(-50%,-50%)",
                    fontSize: 10, pointerEvents: "none",
                  }}>{t.emoji}</span>
                ))}
              </div>
            )}
            {(!baking && !done) && (
              <span className="text-4xl">{active && toppings.length < 2 ? "🍕" : ""}</span>
            )}
          </div>
          {/* Oven knobs */}
          <div className="absolute bottom-1.5 left-0 right-0 flex justify-around px-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-3 h-3 rounded-full"
                style={{ background: baking ? "#ef4444" : "#6b7280", transition: "background 0.3s" }} />
            ))}
          </div>
          {/* Temperature display */}
          <div className="absolute top-1.5 right-2 text-xs font-bold" style={{ color: baking ? "#fbbf24" : "#6b7280" }}>
            {ovenTemp}
          </div>
        </div>

        {/* Oven door handle */}
        <div className="w-20 h-3 rounded-b-xl shadow-md" style={{ background: "#1f2937" }} />
      </div>

      {/* Progress bar */}
      {(baking || done) && (
        <div className="mt-4 w-36">
          <div className="w-full h-2.5 rounded-full bg-red-200">
            <div className="h-2.5 rounded-full transition-all"
              style={{ width: `${progress * 100}%`, background: done ? "#16a34a" : "#ef4444" }} />
          </div>
          <div className="text-xs text-center mt-1" style={{ color: "#991b1b" }}>
            {done ? "🍕 Pizza is ready!" : `Baking… ${Math.round(progress * 100)}%`}
          </div>
        </div>
      )}

      {/* Bake button */}
      <button
        onClick={startBake}
        disabled={!canBake}
        className="mt-4 px-5 py-2 rounded-xl font-bold text-sm transition-all active:scale-95"
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
      angle += 6;
      setLidAngle(angle);
      if (angle >= 90) {
        clearInterval(iv);
        setPacked(true);
        setClosing(false);
        setTimeout(onPackDone, 600);
      }
    }, 30);
  };

  useEffect(() => {
    if (stage === "knead") { setPacked(false); setClosing(false); setLidAngle(0); }
  }, [stage]);

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
      <div className="relative" style={{ width: 140, height: 140 }}>
        {/* Box bottom */}
        <div className="absolute bottom-0 left-0 right-0 rounded-b-xl overflow-hidden"
          style={{
            height: 100,
            background: "#d97706",
            border: "3px solid #92400e",
            borderTop: "none",
          }}>
          {/* Pizza inside box */}
          <div className="absolute inset-4 rounded-full flex items-center justify-center"
            style={{ background: "radial-gradient(circle at 40% 35%,#fbbf24,#b45309)" }}>
            {toppings.slice(0, 8).map((t) => (
              <span key={t.id} className="absolute" style={{
                left: `${t.x}%`, top: `${t.y}%`,
                transform: "translate(-50%,-50%)",
                fontSize: 9, pointerEvents: "none",
              }}>{t.emoji}</span>
            ))}
          </div>
          {/* Box side label */}
          <div className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-bold" style={{ color: "#92400e" }}>
            🍕 PIZZA
          </div>
        </div>

        {/* Box lid (animates closed) */}
        <div
          className="absolute top-0 left-0 right-0 rounded-t-xl origin-bottom"
          style={{
            height: 44,
            background: "#f59e0b",
            border: "3px solid #92400e",
            borderBottom: "none",
            transform: `perspective(300px) rotateX(${-lidAngle}deg)`,
            transformOrigin: "bottom center",
            transition: closing ? "none" : "transform 0.1s",
          }}>
          <div className="absolute inset-0 flex items-center justify-center text-lg">
            {packed ? "✅" : "📦"}
          </div>
          {/* Lid flap line */}
          <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded" style={{ background: "#92400e" }} />
        </div>
      </div>

      <button
        onClick={handlePack}
        disabled={!active || packed || closing}
        className="mt-5 px-5 py-2 rounded-xl font-bold text-sm transition-all active:scale-95"
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
function DoneOverlay({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
      <div className="bg-white rounded-3xl p-8 flex flex-col items-center shadow-2xl max-w-xs mx-4"
        style={{ border: "3px solid #f59e0b" }}>
        <div style={{ fontSize: 72 }}>🍕</div>
        <h2 className="text-2xl font-bold mt-2" style={{ fontFamily: "Fraunces, serif", color: "#92400e" }}>
          Pizza Delivered!
        </h2>
        <p className="text-sm text-center mt-2" style={{ color: "#6b7280" }}>
          Your pizza is kneaded, topped, baked, and packed. Buon appetito!
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
  { key: "knead", label: "Knead",  emoji: "🤌" },
  { key: "top",   label: "Top",    emoji: "🍅" },
  { key: "bake",  label: "Bake",   emoji: "🔥" },
  { key: "pack",  label: "Pack",   emoji: "📦" },
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
            <span className="text-[9px] mt-0.5 font-semibold" style={{ color: i === idx ? "#92400e" : "#9ca3af" }}>
              {s.label}
            </span>
          </div>
          {i < STAGES.length - 1 && (
            <div className="w-6 h-0.5 mb-4 rounded" style={{ background: i < idx ? "#16a34a" : "#e5e7eb" }} />
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

  const handleAddTopping = (t: Topping) => {
    setToppings(prev => [...prev, t]);
  };

  // Advance from topping → bake when user has at least 2 toppings and clicks bake
  // (handled by BakeSection)
  const handleBakeDone = () => setStage("pack");
  const handlePackDone = () => setStage("done");

  // Allow advancing from top → bake manually
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
        <button onClick={restart} className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all active:scale-95"
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

        {/* Advance button: top → bake */}
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
        {stage === "done" && <DoneOverlay onRestart={restart} />}
      </div>

      {/* Footer */}
      <div className="text-center py-1.5 text-xs shrink-0" style={{ color: "var(--muted)" }}>
        <a href="https://freeappstore.online" target="_blank" rel="noopener noreferrer"
          className="hover:underline">Part of FreeAppStore — free forever</a>
      </div>
    </div>
  );
}
