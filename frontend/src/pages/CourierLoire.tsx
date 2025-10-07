import { useMemo, useState } from "react";

/** ---- Data ---- */
type Place = { id: string; name: string; lat: number; lon: number; img?: string };

// 10 castillos (coordenadas aproximadas)
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

/** Carga imágenes locales si existen (fotos en /castles o escudos en /blason). */
function useCastleMedia(): Place[] {
  const photos = import.meta.glob("/src/assets/images/castles/*.{png,jpg,jpeg,webp,svg}", { eager: true }) as Record<string, { default: string }>;
  const blasons = import.meta.glob("/src/assets/images/blason/*", { eager: true }) as Record<string, { default: string }>;

  const findImg = (id: string): string | undefined => {
    const photo = Object.entries(photos).find(([p]) => p.toLowerCase().includes(`/${id}.`));
    if (photo) return photo[1].default;
    const blason = Object.entries(blasons).find(([p]) => p.toLowerCase().includes(id));
    return blason?.[1].default;
  };

  return BASE.map((p) => ({ ...p, img: findImg(p.id) }));
}

/** ---- Distancias ---- */
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

/** ---- Mini-mapa SVG (abajo-izquierda) ---- */
function MiniMap({ route }: { route: Place[] }) {
  const lats = route.map(p => p.lat), lons = route.map(p => p.lon);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const pad = 16, W = 560, H = 320;

  const toXY = (p: Place) => {
    const x = ((p.lon - minLon) / (maxLon - minLon || 1)) * (W - 2*pad) + pad;
    const y = ((maxLat - p.lat) / (maxLat - minLat || 1)) * (H - 2*pad) + pad; // invertimos Y
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

/** ---- Página con DnD nativo ---- */
const GOAL_KM = 250; // con 10 castillos la meta puede ser más alta—ajústala si quieres

export default function CourierLoire() {
  const media = useCastleMedia();
  const [route, setRoute] = useState<Place[]>(() => media.slice());
  const dist = useMemo(() => totalDistance(route), [route]);

  // Drag & drop nativo
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
    setRoute(items => {
      const next = items.slice();
      const [moved] = next.splice(from, 1);
      next.splice(overIndex, 0, moved);
      return next;
    });
  }

  // Heurística simple
  function nearestNeighbor() {
    const [start, ...rest] = route;
    const ordered = [start];
    let pool = rest.slice();
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
  }
  function reset() { setRoute(media.slice()); }

  return (
    <div style={styles.shell}>
      {/* Columna izquierda: info arriba, mapa abajo */}
      <div style={styles.leftCol}>
        <div style={styles.panel}>
          <h1 style={{ margin: 0 }}>Courier of the Loire</h1>
          <p style={{ margin: "6px 0 8px" }}>
            <strong>Goal:</strong> drag the castle cards (right) to build the <strong>shortest route</strong>.
            Put nearby castles next to each other. Use <em>Improve</em> if you want a hint.
          </p>

          <div style={{ marginBottom: 8 }}>
            Total distance:{" "}
            <strong style={{ color: dist <= GOAL_KM ? "#16a34a" : "#111827" }}>
              {dist.toFixed(1)} km
            </strong>
            {dist <= GOAL_KM && " 🎯"}
            <div style={{ color: "#6b7280", fontSize: 12 }}>Target ≤ {GOAL_KM} km</div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={nearestNeighbor} style={styles.btnPrimary}>Improve (nearest neighbor)</button>
            <button onClick={reset} style={styles.btnGhost}>Reset</button>
          </div>
        </div>

        <div style={styles.mapPanel}>
          <MiniMap route={route} />
        </div>
      </div>

      {/* Columna derecha: lista en columna clara */}
      <div style={styles.rightCol}>
        <h2 style={{ margin: "0 0 8px 0", fontSize: 18 }}>Order (drag to reorder)</h2>
        <div style={styles.list}>
          {route.map((p, i) => (
            <div
              key={p.id}
              draggable
              onDragStart={(e) => onDragStart(e, i)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, i)}
              style={styles.card}
              aria-label={`Drag ${p.name}`}
              title="Drag to reorder"
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
                <div style={{ color: "#6b7280", fontSize: 12 }}>Drag up/down to change the route.</div>
              </div>
            </div>
          ))}
        </div>
        <p style={{ color: "#6b7280", marginTop: 10 }}>
          Tip: after improving, keep dragging to fine-tune the order.
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
    gridTemplateColumns: "1.2fr 1fr", // izquierda (info + mapa) / derecha (lista)
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
};
