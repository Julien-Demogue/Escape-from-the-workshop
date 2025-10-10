import React, { useEffect, useMemo, useRef, useState } from "react";
import ThickBorderCloseButton from "../components/ui/ThickBorderCloseButton";
import {
  codePartFor,
  reportGameResult,
  readGameResults,
  onGameResultsChange,
} from "../state/gameResults";

/** ---- Data ---- */
type Place = { id: string; name: string; lat: number; lon: number; img?: string };

// 10 châteaux (coordonnées approx.)
const BASE: Omit<Place, "img">[] = [
  { id: "chambord",   name: "Chambord",           lat: 47.6163, lon: 1.5160 },
  { id: "chenonceau", name: "Chenonceau",         lat: 47.3249, lon: 1.0706 },
  { id: "amboise",    name: "Amboise",            lat: 47.4136, lon: 0.9846 },
  { id: "blois",      name: "Blois",              lat: 47.5861, lon: 1.3338 },
  { id: "cheverny",   name: "Cheverny",           lat: 47.5002, lon: 1.4597 },
  { id: "chaumont",   name: "Chaumont-sur-Loire", lat: 47.4781, lon: 1.1839 },
  { id: "villandry",  name: "Villandry",          lat: 47.3406, lon: 0.5140 },
  { id: "azay",       name: "Azay-le-Rideau",     lat: 47.2624, lon: 0.4690 },
  { id: "saumur",     name: "Saumur",             lat: 47.2597, lon: -0.0776 },
  { id: "langeais",   name: "Langeais",           lat: 47.3250, lon: 0.4020 },
];

/** Media local (fotos/blason) */
function useCastleMedia(): Place[] {
  const photos = import.meta.glob(
    "/src/assets/images/castles/*.{png,jpg,jpeg,webp,svg}",
    { eager: true }
  ) as Record<string, { default: string }>;
  const blasons = import.meta.glob(
    "/src/assets/images/blason/*",
    { eager: true }
  ) as Record<string, { default: string }>;

  const findImg = (id: string): string | undefined => {
    const photo = Object.entries(photos).find(([p]) =>
      p.toLowerCase().includes(`/${id}.`)
    );
    if (photo) return photo[1].default;
    const blason = Object.entries(blasons).find(([p]) =>
      p.toLowerCase().includes(id)
    );
    return blason?.[1].default;
  };

  return BASE.map((p) => ({ ...p, img: findImg(p.id) }));
}

/** Distancias */
function haversine(a: Place, b: Place) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function totalDistance(seq: Place[]) {
  let sum = 0;
  for (let i = 0; i < seq.length - 1; i++) sum += haversine(seq[i], seq[i + 1]);
  return sum;
}

/** Mini-mapa con gutter dinámico (no se cortan puntos) */
function MiniMap({ route }: { route: Place[] }) {
  // Bounds base
  const lats = route.map((p) => p.lat),
    lons = route.map((p) => p.lon);
  let minLat = Math.min(...lats),
    maxLat = Math.max(...lats);
  let minLon = Math.min(...lons),
    maxLon = Math.max(...lons);

  // Evitar rangos 0
  if (minLat === maxLat) {
    minLat -= 0.001;
    maxLat += 0.001;
  }
  if (minLon === maxLon) {
    minLon -= 0.001;
    maxLon += 0.001;
  }

  // Gutter ~6% del rango (mínimo 0.01) para círculos y brillo
  const latRange = maxLat - minLat;
  const lonRange = maxLon - minLon;
  const gLat = Math.max(latRange * 0.06, 0.01);
  const gLon = Math.max(lonRange * 0.06, 0.01);
  minLat -= gLat;
  maxLat += gLat;
  minLon -= gLon;
  maxLon += gLon;

  // Canvas + padding interno
  const W = 640,
    H = 380;
  const PAD = 28;
  const R = 8;
  const STROKE = 3;

  // Proyección
  const toXY = (p: Place) => {
    const x =
      ((p.lon - minLon) / (maxLon - minLon)) * (W - 2 * PAD) + PAD;
    const y =
      ((maxLat - p.lat) / (maxLat - minLat)) * (H - 2 * PAD) + PAD; // invert Y
    return { x, y };
  };

  const pts = route.map(toXY);
  const pathD = pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full rounded-xl bg-stone-50 border border-stone-200 shadow-inner"
    >
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width={W} height={H} fill="#f8fafc" />

      {/* Ruta bajo los puntos */}
      <path
        d={pathD}
        stroke="#f59e0b"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#glow)"
      />

      {/* Puntos + numeración */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r={R}
            fill="#ffffff"
            stroke="#f59e0b"
            strokeWidth={STROKE}
          />
          <text
            x={p.x}
            y={p.y - (R + 6)}
            fontSize="11"
            textAnchor="middle"
            fill="#111827"
          >
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Scoring */
function distanceScoreKm(distanceKm: number): number {
  const best = 166,
    worst = 200;
  if (distanceKm <= best) return 50;
  if (distanceKm >= worst) return 0;
  const t = (distanceKm - best) / (worst - best);
  return Math.round(50 * (1 - t));
}
function timeScoreMs(elapsedMs: number): number {
  const best = 3 * 60 * 1000,
    worst = 8 * 60 * 1000;
  if (elapsedMs <= best) return 50;
  if (elapsedMs >= worst) return 0;
  const t = (elapsedMs - best) / (worst - best);
  return Math.round(50 * (1 - t));
}
function computeCourierScore(distanceKm: number, elapsedMs: number) {
  const s = distanceScoreKm(distanceKm) + timeScoreMs(elapsedMs);
  return Math.max(0, Math.min(100, s));
}
function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

/** Fondo estrellado suave */
function Stars() {
  const stars = Array.from({ length: 48 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 2 + Math.random() * 2,
    delay: Math.random() * 3,
    dur: 1.8 + Math.random() * 1.6,
  }));
  return (
    <>
      <style>{`
        @keyframes twinkle { 0%,100%{opacity:.25;transform:scale(1)} 50%{opacity:.9;transform:scale(1.2)} }
      `}</style>
      <div className="pointer-events-none absolute inset-0">
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-amber-200"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
              boxShadow: "0 0 10px rgba(251,191,36,.35)",
            }}
          />
        ))}
      </div>
    </>
  );
}

const SUCCESS_DISTANCE_CAP = 200;

export default function CourierLoire() {
  const media = useCastleMedia();
  const [route, setRoute] = useState<Place[]>(() => media.slice());
  const dist = useMemo(() => totalDistance(route), [route]);

  // Timer
  const startRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(true);

  // Persistencia + clave
  const [status, setStatus] = useState<
    "unvisited" | "completed" | "failed" | "in_progress"
  >("unvisited");
  const [score, setScore] = useState<number>(0);
  const [codePart, setCodePart] = useState<string>("");
  const [solvedThisSession, setSolvedThisSession] = useState<boolean>(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(
      () => setElapsed(Date.now() - startRef.current),
      500
    );
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    const saved = readGameResults();
    setStatus(saved["courrier-loire"].status);
    setScore(saved["courrier-loire"].score);
    setCodePart(saved["courrier-loire"].codePart);

    return onGameResultsChange((r) => {
      setStatus(r["courrier-loire"].status);
      setScore(r["courrier-loire"].score);
      setCodePart(r["courrier-loire"].codePart);
    });
  }, []);

  /** DnD */
  function onDragStart(e: React.DragEvent<HTMLDivElement>, dragIndex: number) {
    e.dataTransfer.setData("text/plain", String(dragIndex));
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }
  function onDrop(e: React.DragEvent<HTMLDivElement>, overIndex: number) {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData("text/plain"));
    if (Number.isNaN(from) || from === overIndex) return;
    setRoute((items) => {
      const next = items.slice();
      const [moved] = next.splice(from, 1);
      next.splice(overIndex, 0, moved);
      return next;
    });
    setSolvedThisSession(false);
    setRunning(true);
    if (status === "unvisited") {
      setStatus("in_progress");
      reportGameResult("courrier-loire", { status: "in_progress" });
    }
  }

  /** Heurística */
  function nearestNeighbor() {
    const [start, ...rest] = route;
    const ordered = [start];
    const pool = rest.slice();
    while (pool.length) {
      const last = ordered[ordered.length - 1];
      let kBest = 0,
        dBest = Infinity;
      for (let k = 0; k < pool.length; k++) {
        const d = haversine(last, pool[k]);
        if (d < dBest) {
          dBest = d;
          kBest = k;
        }
      }
      ordered.push(pool.splice(kBest, 1)[0]);
    }
    setRoute(ordered);
    setSolvedThisSession(false);
    if (status === "unvisited") {
      setStatus("in_progress");
      reportGameResult("courrier-loire", { status: "in_progress" });
    }
  }

  function resetAll() {
    setRoute(media.slice());
    startRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
    setSolvedThisSession(false);
  }

  function validateRoute() {
    const elapsedMs = Date.now() - startRef.current;
    const finalScore = computeCourierScore(dist, elapsedMs);
    setRunning(false);
    setElapsed(elapsedMs);

    if (dist <= SUCCESS_DISTANCE_CAP) {
      setScore(finalScore);
      setSolvedThisSession(true);
      reportGameResult("courrier-loire", {
        status: "completed",
        score: finalScore,
        codePart: codePartFor("courrier-loire"),
      });
    } else {
      setSolvedThisSession(false);
      reportGameResult("courrier-loire", { status: "failed" });
      alert(
        "Distance trop élevée (> 200 km). Essaie d'améliorer l'itinéraire !"
      );
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-stone-900 via-amber-900 to-stone-800 text-amber-50">
      <Stars />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,.28)_70%)]" />

      {/* Close */}
      <div className="absolute left-4 top-4 z-20">
        <ThickBorderCloseButton />
      </div>

      {/* Title */}
      <header className="relative z-10 mx-auto max-w-6xl px-4 pt-10 pb-4 text-center">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-amber-200 drop-shadow-[0_2px_12px_rgba(251,191,36,.35)]">
          Courrier de la Loire
        </h1>
        <p className="mt-2 text-amber-100/90">
          Réorganise les châteaux pour tracer{" "}
          <span className="font-semibold">l’itinéraire le plus court</span>.
        </p>
      </header>

      {/* MAIN — dos columnas claras y ordenadas */}
      <main className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-16 lg:grid-cols-[1.25fr_1fr]">
        {/* LEFT: mapa + métricas + acciones + estado */}
        <section className="rounded-2xl border-2 border-amber-900/70 bg-white/10 backdrop-blur-xl p-5 md:p-6 shadow-xl">
          {/* Mapa */}
          <div className="rounded-xl border border-amber-200/40 bg-amber-50/10 p-3 shadow-inner">
            <MiniMap route={route} />
          </div>

          {/* Métricas */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-amber-200/40 bg-white/10 p-3 text-center">
              <div className="text-xs text-amber-100/80">Distance</div>
              <div className="text-xl font-extrabold text-amber-200">
                {dist.toFixed(1)} km
              </div>
            </div>
            <div className="rounded-lg border border-amber-200/40 bg-white/10 p-3 text-center">
              <div className="text-xs text-amber-100/80">Temps</div>
              <div className="text-xl font-extrabold text-amber-200">
                {formatDuration(elapsed)}
              </div>
            </div>
            <div className="rounded-lg border border-amber-200/40 bg-white/10 p-3 text-center">
              <div className="text-xs text-amber-100/80">Score</div>
              <div className="text-xl font-extrabold text-amber-200">
                {score}
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={nearestNeighbor}
              className="rounded-lg border-2 border-amber-900 bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-2 font-semibold text-amber-950 shadow-[0_10px_24px_-12px_rgba(0,0,0,.5)] hover:from-amber-200 hover:to-amber-400 active:translate-y-[1px] transition"
            >
              Améliorer (voisin le plus proche)
            </button>
            <button
              onClick={resetAll}
              className="rounded-lg border-2 border-amber-900 bg-white/80 px-4 py-2 font-semibold text-amber-950 hover:bg-white transition"
            >
              Réinitialiser
            </button>
            <button
              onClick={validateRoute}
              className="rounded-lg border-2 border-emerald-900 bg-gradient-to-r from-emerald-300 to-emerald-500 px-4 py-2 font-semibold text-emerald-950 shadow-[0_10px_24px_-12px_rgba(0,0,0,.5)] hover:from-emerald-200 hover:to-emerald-400 active:translate-y-[1px] transition"
            >
              Valider l’itinéraire
            </button>
          </div>

          {/* Estado + clave */}
          <div className="mt-4 rounded-xl border-2 border-amber-900/70 bg-white/10 p-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-bold">Statut</span>
              <span className="rounded-md border-2 border-amber-900 bg-amber-50/90 px-2 py-0.5 text-amber-950">
                {status === "completed"
                  ? "Terminé"
                  : status === "failed"
                  ? "Échoué"
                  : status === "in_progress"
                  ? "En cours"
                  : "Non visité"}
              </span>
            </div>

            {solvedThisSession && status === "completed" && codePart && (
              <div className="mt-3">
                <div className="font-bold mb-1">Clé</div>
                <div className="rounded-lg border-2 border-dashed border-amber-900 bg-amber-50/90 px-3 py-2 text-amber-950">
                  {codePart}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: lista de escudos (draggable) */}
        <section className="rounded-2xl border-2 border-amber-900/70 bg-white/10 backdrop-blur-xl p-5 md:p-6 shadow-xl">
          <h2 className="mb-3 font-serif text-xl text-amber-100">
            Ordre (glisser pour réorganiser)
          </h2>

          <div className="max-h-[560px] overflow-auto pr-1">
            <div className="grid gap-2">
              {route.map((p, i) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, i)}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, i)}
                  className="grid grid-cols-[42px_56px_1fr] items-center gap-3 rounded-xl border border-amber-200/50 bg-white/90 p-2 text-stone-900 shadow hover:shadow-lg cursor-grab active:cursor-grabbing transition"
                  title="Glisser pour réorganiser"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-100 font-extrabold text-amber-800">
                    {i + 1}
                  </div>
                  <div className="h-14 w-14 overflow-hidden rounded-lg bg-stone-200 grid place-items-center">
                    {p.img ? (
                      <img
                        src={p.img}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="font-extrabold text-stone-600">
                        {p.name[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold">{p.name}</div>
                    <div className="text-xs text-stone-600">
                      Glisse pour ajuster l’itinéraire.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 text-sm text-amber-100/80">
            Astuce : après “Améliorer”, ajuste encore à la main pour gagner des
            kilomètres.
          </p>
        </section>
      </main>
    </div>
  );
}
