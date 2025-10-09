import React, { useEffect, useMemo, useState } from "react";

/** Props optionnelle : reçoit les valeurs lors de l’envoi du formulaire */
type Props = {
  onSubmit?: (data: { castle: string; book: string }) => void;
  successImageUrl?: string;
};

/* ===== Réponses possibles ===== */
const POSSIBLE_CASTLES = [
  "Château d’Ussé",
  "Chateau d’Usse",
  "Chateau d'Usse",
  "Usse",
  "Château Usse",
];

const POSSIBLE_BOOKS = [
  "La Belle au bois dormant",
  "Belle au bois dormant",
  "Le livre de la Belle au bois dormant",
  "Conte de la Belle au bois dormant",
  "Livre de la Belle",
];

/* — Helpers — */
function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[’'`]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
}
const tidy = (s: string) =>
  s
    .replace(/[“”]/g, "«")
    .replace(/[’’']/g, "’")
    .replace(/\s+/g, " ")
    .replace(/\s+»/g, " »")
    .replace(/«\s+/g, "« ")
    .trim();
function matchesAny(input: string, possibilities: string[]) {
  const n = normalize(input);
  return possibilities.some((p) => normalize(p) === n);
}

/* — Fond étoilé — */
function Stars({ count = 48 }: { count?: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 3}s`,
        duration: `${1.8 + Math.random() * 1.8}s`,
        scale: 0.7 + Math.random() * 0.9,
      })),
    [count]
  );
  return (
    <>
      <style>{`
        @keyframes twinkleEnd {
          0%,100% { opacity:.25; transform:scale(1); }
          50% { opacity:.9; transform:scale(1.15); }
        }
        @keyframes spinIn {
          0% { opacity: 0; transform: rotateY(90deg) scale(0.5); }
          60% { opacity: 1; transform: rotateY(0deg) scale(1.05); }
          100% { transform: rotateY(0deg) scale(1); }
        }
        /* Animación de cada chispa y halo */
        @keyframes spark {
          0%   { transform: translate(-50%, -50%) rotate(var(--deg)) translateX(0) scale(0.6); opacity: 1; }
          70%  { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(var(--deg)) translateX(var(--dist)) scale(1); opacity: 0; }
        }
        @keyframes flash {
          0% { transform: scale(0); opacity: .9; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
      <div className="pointer-events-none absolute inset-0">
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-yellow-200"
            style={{
              left: s.left,
              top: s.top,
              width: 3 * s.scale,
              height: 3 * s.scale,
              animation: `twinkleEnd ${s.duration} ease-in-out ${s.delay} infinite`,
              boxShadow: "0 0 8px rgba(251,191,36,.35)",
            }}
          />
        ))}
      </div>
    </>
  );
}

/* — Fuegos artificiales mágicos (mejorados) — */
function Fireworks({ show }: { show: boolean }) {
  if (!show) return null;

  // 6 explosiones, cada una con 24 chispas
  const bursts = Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 80 + 10}%`,          // evita bordes
    top: `${Math.random() * 50 + 10}%`,
    delay: Math.random() * 0.6,
    hue: Math.floor(Math.random() * 360),
  }));

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {bursts.map((b) => {
        const sparks = Array.from({ length: 24 });
        return (
          <div key={b.id} style={{ position: "absolute", left: b.left, top: b.top }}>
            {/* Halo flash */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: `radial-gradient(circle, hsla(${b.hue},100%,85%,.9), transparent 60%)`,
                filter: "blur(1px)",
                animation: `flash 900ms ease-out ${b.delay}s forwards`,
                transform: "translate(-50%, -50%)",
              }}
            />
            {/* Chispas */}
            {sparks.map((_, i) => {
              const deg = (360 / sparks.length) * i + Math.random() * 6 - 3; // ligera variación
              const dist = 120 + Math.random() * 40; // px
              const light = 65 + Math.random() * 15;
              const sat = 95;
              const alpha = 0.95;
              const size = 6 + Math.random() * 3;
              return (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: size,
                    height: size,
                    borderRadius: "9999px",
                    background: `radial-gradient(circle, hsla(${b.hue},${sat}%,${light}%,${alpha}), transparent 70%)`,
                    boxShadow: `0 0 10px hsla(${b.hue},${sat}%,${light}%,.7)`,
                    transform: "translate(-50%, -50%)",
                    animation: `spark ${900 + Math.random() * 500}ms cubic-bezier(.2,.7,.2,1) ${b.delay +
                      Math.random() * 0.2}s forwards`,
                    // variables CSS para la trayectoria
                    // @ts-ignore
                    "--deg": `${deg}deg`,
                    "--dist": `${dist}px`,
                  } as React.CSSProperties}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* — Composant principal — */
export default function EndgameSimple({
  onSubmit,
  successImageUrl = "https://cdn-images.dzcdn.net/images/cover/9351c308299ac0348b6808e935c7586c/500x500-000000-80-0-0.jpg",
}: Props) {
  const [castle, setCastle] = useState("");
  const [book, setBook] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "ko">("idle");
  const [celebrating, setCelebrating] = useState(false); // <-- controla los fuegos
  const [msg, setMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ castle?: string; book?: string }>({});

  // Apaga los fuegos artificiales tras 2.5s
  useEffect(() => {
    if (status !== "ok") return;
    setCelebrating(true);
    const t = setTimeout(() => setCelebrating(false), 2500);
    return () => clearTimeout(t);
  }, [status]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const c = tidy(castle);
    const b = tidy(book);
    setCastle(c);
    setBook(b);

    const next: typeof errors = {};
    if (!c) next.castle = "Champ requis";
    if (!b) next.book = "Champ requis";
    setErrors(next);

    if (Object.keys(next).length) {
      setStatus("idle");
      setMsg("⚠️ Complète les deux champs.");
      return;
    }

    const castleOK = matchesAny(c, POSSIBLE_CASTLES);
    const bookOK = matchesAny(b, POSSIBLE_BOOKS);

    if (castleOK && bookOK) {
      setStatus("ok");
      setMsg("✅ Réponses correctes ! Farfadoux est confondu.");
    } else {
      setStatus("ko");
      setMsg("❌ Il y a une erreur dans au moins une réponse. Réessaie !");
    }

    onSubmit?.({ castle: c, book: b });
  }

  function reset() {
    setCastle("");
    setBook("");
    setErrors({});
    setMsg(null);
    setStatus("idle");
    setCelebrating(false);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-stone-900 via-amber-900 to-stone-800 text-amber-50">
      <Stars />
      {/* El vignette va debajo; los fuegos tienen z-50 y quedan por encima */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,.28)_70%)]" />
      <Fireworks show={celebrating} />

      <div className="relative z-10 mx-auto max-w-xl px-4 py-16">
        <h1 className="mb-8 text-center font-serif text-3xl md:text-4xl font-bold text-amber-200 drop-shadow-[0_2px_12px_rgba(251,191,36,.35)]">
          Résolution du Mystère
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Château */}
          <div>
            <label htmlFor="castle" className="mb-2 block font-medium text-amber-100">
              Où se cache Farfadoux ?
            </label>
            <input
              id="castle"
              type="text"
              value={castle}
              onChange={(e) => setCastle(e.target.value)}
              onBlur={() => setCastle((v) => tidy(v))}
              placeholder="Ex. « Un château mystérieux »"
              className={`w-full rounded-lg border-2 bg-white/90 px-4 py-3 text-stone-900 outline-none transition
                ${errors.castle ? "border-red-500" : "border-amber-700 focus:border-amber-400 focus:shadow-[0_0_0_4px_rgba(251,191,36,.25)]"}`}
            />
            {errors.castle && (
              <p className="mt-1 text-sm text-red-300">{errors.castle}</p>
            )}
          </div>

          {/* Livre */}
          <div>
            <label htmlFor="book" className="mb-2 block font-medium text-amber-100">
              Titre de l’ouvrage volé
            </label>
            <input
              id="book"
              type="text"
              value={book}
              onChange={(e) => setBook(e.target.value)}
              onBlur={() => setBook((v) => tidy(v))}
              placeholder="Ex. « Un conte enchanté »"
              className={`w-full rounded-lg border-2 bg-white/90 px-4 py-3 text-stone-900 outline-none transition
                ${errors.book ? "border-red-500" : "border-amber-700 focus:border-amber-400 focus:shadow-[0_0_0_4px_rgba(251,191,36,.25)]"}`}
            />
            {errors.book && (
              <p className="mt-1 text-sm text-red-300">{errors.book}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="rounded-lg border-2 border-amber-900 bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-2.5 font-semibold text-amber-950 shadow-[0_10px_24px_-12px_rgba(0,0,0,.5)] hover:from-amber-200 hover:to-amber-400 active:translate-y-[1px] transition"
            >
              Envoyer les réponses
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border-2 border-amber-900 bg-white/80 px-6 py-2.5 font-semibold text-amber-950 hover:bg-white transition"
            >
              Effacer
            </button>
          </div>

          {/* Feedback */}
          {msg && (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 ${
                status === "ok"
                  ? "border-emerald-400 bg-emerald-50/90 text-emerald-900"
                  : status === "ko"
                  ? "border-red-400 bg-red-50/90 text-red-900"
                  : "border-amber-300/60 bg-amber-50/90 text-amber-900"
              }`}
            >
              <p className="font-medium">{msg}</p>

              {status === "ok" && (
                <div
                  className="mt-3 overflow-hidden rounded-lg animate-[spinIn_1s_ease-out_forwards]"
                  style={{ transformOrigin: "center", perspective: "800px" }}
                >
                  <img
                    src={successImageUrl}
                    alt="Équipe gagnante célébrant la victoire"
                    className="block h-auto w-full"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
