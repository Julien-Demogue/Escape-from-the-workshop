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

/** Load local images if present (photos in /castles or blasons in /blason). */
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
    const photo = Object.entries(photos).find(([p]) => p.toLowerCase().includes(`/${id}.`));
    if (photo) return photo[1].default;
    const blason = Object.entries(blasons).find(([p]) => p.toLowerCase().includes(id));
    return blason?.[1].default;
  };

  return BASE.map((p) => ({ ...p, img: findImg(p.id) }));
}

/** ---- Distances ---- */
function haversine(a: Place, b: Place) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI/180;
  const dLon = (b.lon - a.lon) * Math.PI/180;
  const lat1 = a.lat * Math.PI/180;
  const lat2 = b.lat * Math.PI/180;
  const s = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function totalDistance(seq: Place[]) {
  let sum = 0;
  for (let i = 0; i < seq.length - 1; i++) sum += haversine(seq[i], seq[i+1]);
  return sum;
}

/** ---- Mini map SVG ---- */
function MiniMap({ route }: { route: Place[] }) {
  const lats = route.map(p => p.lat), lons = route.map(p => p.lon);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const pad = 16, W = 560, H = 320;

  const toXY = (p: Place) => {
    const x = ((p.lon - minLon) / (maxLon - minLon || 1)) * (W - 2*pad) + pad;
    const y = ((maxLat - p.lat) / (maxLat - minLat || 1)) * (H - 2*pad) + pad; // invert Y
    return { x, y };
  };

  const pts = route.map(toXY);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");

  return (
    <svg width={W} height={H} style={{ width: "100%", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 12 }}>
      <rect x={0} y={0} width={W} height={H} fill="#f8fafc" />
      <path d={d} stroke="#2563eb" strokeWidth={3} fill="none" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={7} fill="white" stroke="#2563eb" strokeWidth={2} />
          <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="11" fill="#111827">{i + 1}</text>
        </g>
      ))}
    </svg>
  );
}

/** ---- Scoring 50 / 50 ----
 * Distance (0..50):
 *  - ≤ 166 km -> 50
 *  - 166..200 km -> linear 50..0
 *  - ≥ 200 km -> 0
 *
 * Time (0..50):
 *  - ≤ 3:00 -> 50
 *  - 3..8 min -> linear 50..0
 *  - ≥ 8:00 -> 0
 */
function distanceScoreKm(distanceKm: number): number {
  const best = 166; // near-optimal
  const worst = 200;
  if (distanceKm <= best) return 50;
  if (distanceKm >= worst) return 0;
  const t = (distanceKm - best) / (worst - best); // 0..1
  return Math.round(50 * (1 - t));
}
function timeScoreMs(elapsedMs: number): number {
  const best = 3 * 60 * 1000;
  const worst = 8 * 60 * 1000;
  if (elapsedMs <= best) return 50;
  if (elapsedMs >= worst) return 0;
  const t = (elapsedMs - best) / (worst - best); // 0..1
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
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** ---- Page ---- */
const SUCCESS_DISTANCE_CAP = 200; // if > 200 km, we mark as failed

export default function CourierLoire() {
  const media = useCastleMedia();
  const [route, setRoute] = useState<Place[]>(() => media.slice());
  const dist = useMemo(() => totalDistance(route), [route]);

  // Timer
  const startRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(true);

  // Persistence (dashboard) + session gate for the key
  const [status, setStatus] = useState<"unvisited" | "completed" | "failed">("unvisited");
  const [score, setScore] = useState<number>(0);
  const [codePart, setCodePart] = useState<string>("");
  const [solvedThisSession, setSolvedThisSession] = useState<boolean>(false);

  // Ticking
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setElapsed(Date.now() - startRef.current), 500);
    return () => window.clearInterval(id);
  }, [running]);

  // Load saved + subscribe
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

  // Native DnD
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
    // If they change the route after validating, hide the key until they re-validate
    setSolvedThisSession(false);
    setRunning(true);
  }

  // Heuristic helpers
  function nearestNeighbor() {
    const [start, ...rest] = route;
    const ordered = [start];
    const pool = rest.slice();
    while (pool.length) {
      const last = ordered[ordered.length - 1];
      let kBest = 0, dBest = Infinity;
      for (let k = 0; k < pool.length; k++) {
        const d = haversine(last, pool[k]);
        if (d < dBest) { dBest = d; kBest = k; }
      }
      ordered.push(pool.splice(kBest, 1)[0]);
    }
    setRoute(ordered);
    setSolvedThisSession(false);
  }
  function resetAll() {
    setRoute(media.slice());
    startRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
    setSolvedThisSession(false);
  }

  // Validate and score
  function validateRoute() {
    const elapsedMs = Date.now() - startRef.current;
    const finalScore = computeCourierScore(dist, elapsedMs);

    // Stop timer
    setRunning(false);
    setElapsed(elapsedMs);

    if (dist <= SUCCESS_DISTANCE_CAP) {
      setScore(finalScore);
      setSolvedThisSession(true);
      reportGameResult("courrier-loire", {
        status: "completed",
        score: finalScore,
        codePart: codePartFor("courrier-loire"), // <-- la clave de ESTE juego
      });
    } else {
      setSolvedThisSession(false);
      reportGameResult("courrier-loire", { status: "failed" });
      alert("Distance trop élevée (> 200 km). Essaie d'améliorer l'itinéraire !");
    }
  }

  return (
    <div style={styles.shell}>
      <ThickBorderCloseButton />
      {/* LEFT: info + map */}
      <div style={styles.leftCol}>
        <div style={styles.panel}>
          <h1 style={{ margin: 0 }}>Courrier de la Loire</h1>
          <p style={{ margin: "6px 0 8px" }}>
            <strong>Objectif :</strong> fais glisser les cartes des châteaux (à droite) pour construire
            <strong> l’itinéraire le plus court</strong>. Utilise <em>Améliorer</em> pour une piste.
          </p>

          <div style={{ marginBottom: 8 }}>
            Distance totale :{" "}
            <strong style={{ color: dist <= 166 ? "#16a34a" : "#111827" }}>
              {dist.toFixed(1)} km
            </strong>
            <div style={{ color: "#6b7280", fontSize: 12 }}>
              Barème distance (0–50 pts) : ≤ 166 km = 50 pts, 166–200 km = dégressif, ≥ 200 km = 0.
            </div>
            <div style={{ color: "#6b7280", fontSize: 12 }}>
              Barème temps (0–50 pts) : ≤ 3:00 = 50 pts, 3–8 min dégressif, ≥ 8:00 = 0.
            </div>
            <div style={{ color: "#6b7280", fontSize: 12 }}>
              Valide en dessous de 200 km pour terminer le jeu.
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={nearestNeighbor} style={styles.btnPrimary}>
              Améliorer (plus proche voisin)
            </button>
            <button onClick={resetAll} style={styles.btnGhost}>
              Réinitialiser
            </button>
            <button onClick={validateRoute} style={styles.btnValidate}>
              Valider l’itinéraire
            </button>
          </div>

          {/* Status + Score + Time + Key */}
          <div style={styles.statusBox}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontWeight: 700 }}>Statut du jeu</span>
              <span style={{ padding: "2px 8px", border: "2px solid black", borderRadius: 8 }}>
                {status === "completed" ? "Terminé" : status === "failed" ? "Échoué" : "Non visité"}
              </span>
              <span style={{ padding: "2px 8px", border: "2px solid black", borderRadius: 8 }}>
                Score&nbsp;: {score}
              </span>
              <span style={{ padding: "2px 8px", border: "2px solid black", borderRadius: 8 }}>
                Temps&nbsp;: {formatDuration(elapsed)}
              </span>
            </div>

            {/* 🔑 Clé: SOLO si se completó AHORA en esta sesión */}
            {solvedThisSession && status === "completed" && codePart && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Clé</div>
                <div style={{ padding: "8px 10px", border: "2px dashed black", borderRadius: 8 }}>
                  {codePart /* ce jeu apporte le mot défini par codePartFor("courrier-loire") */}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={styles.mapPanel}>
          <MiniMap route={route} />
        </div>
      </div>

      {/* RIGHT: reorder list */}
      <div style={styles.rightCol}>
        <h2 style={{ margin: "0 0 8px 0", fontSize: 18 }}>Ordre (glisser pour réorganiser)</h2>
        <div style={styles.list}>
          {route.map((p, i) => (
            <div
              key={p.id}
              draggable
              onDragStart={(e) => onDragStart(e, i)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, i)}
              style={styles.card}
              aria-label={`Glisser ${p.name}`}
              title="Glisser pour réorganiser"
            >
              <div style={styles.posBadge}>{i + 1}</div>
              <div style={styles.thumb}>
                {p.img ? (
                  <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontWeight: 700, color: "#374151" }}>{p.name[0]}</span>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 800 }}>{p.name}</div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>Fais glisser vers le haut/bas pour changer l’itinéraire.</div>
              </div>
            </div>
          ))}
        </div>
        <p style={{ color: "#6b7280", marginTop: 10 }}>
          Astuce : après “Améliorer”, continue à ajuster à la main pour optimiser.
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    padding: 16,
    maxWidth: 1200,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: 16,
    alignItems: "start",
  },
  leftCol: { display: "grid", gridTemplateRows: "auto 1fr", gap: 16 },
  panel: {
    background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12,
  },
  mapPanel: {
    background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12,
    display: "grid", placeItems: "center",
  },
  rightCol: {
    background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12,
  },
  list: { display: "grid", gap: 10 },
  card: {
    display: "grid",
    gridTemplateColumns: "36px 56px 1fr",
    gap: 10,
    alignItems: "center",
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 10,
    boxShadow: "0 1px 0 #e5e7eb",
    cursor: "grab",
    userSelect: "none",
  },
  posBadge: {
    width: 36,
    height: 36,
    borderRadius: 999,
    background: "#eef2ff",
    color: "#3730a3",
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
  },
  thumb: {
    width: 56, height: 56, borderRadius: 8, overflow: "hidden",
    background: "#e5e7eb", display: "grid", placeItems: "center",
  },
  btnPrimary: {
    padding: "8px 12px", borderRadius: 10, border: "1px solid #1d4ed8",
    background: "#2563eb", color: "white", cursor: "pointer", fontWeight: 600,
  },
  btnGhost: {
    padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb",
    background: "white", cursor: "pointer", fontWeight: 600,
  },
  btnValidate: {
    padding: "8px 12px", borderRadius: 10, border: "1px solid #065f46",
    background: "#10b981", color: "white", cursor: "pointer", fontWeight: 700,
  },
  statusBox: {
    marginTop: 12, padding: 12, borderRadius: 12, border: "4px solid black", background: "white",
  },
};
