import { useState, useMemo } from "react"
import authService from "../services/auth.service"

const Login = () => {
  const [email, setEmail] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit() {
    try {
      setLoading(true)
      setError(null)
      const hashedEmail = await hashEmail(email)
      const response = await authService.login(hashedEmail)
      if (response) {
        window.location.href = "/home"
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Une erreur est survenue. Réessayez ✨")
      setLoading(false)
    }
  }

  async function hashEmail(email: string) {
    const encoder = new TextEncoder()
    const data = encoder.encode(email)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  // — Decorative animated stars —
  const stars = useMemo(
    () =>
      Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 2 + 1,
        delay: `${Math.random() * 2}s`,
        duration: `${2 + Math.random() * 2}s`,
      })),
    []
  )

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-rose-900 text-amber-50">
      {/* Background stars */}
      <style>{`
        @keyframes sparkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes glowText {
          0%,100% { text-shadow: 0 0 10px rgba(255, 230, 150, .7), 0 0 25px rgba(255, 180, 200, .4); }
          50% { text-shadow: 0 0 20px rgba(255, 200, 255, .9), 0 0 35px rgba(255, 255, 255, .6); }
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute bg-amber-100 rounded-full"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animation: `sparkle ${s.duration} ease-in-out ${s.delay} infinite`,
              boxShadow: "0 0 6px rgba(255,255,255,.6)",
            }}
          />
        ))}
      </div>

      {/* Floating card */}
      <div className="relative z-10 w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_0_25px_rgba(255,255,255,.1)] p-8 animate-[float_5s_ease-in-out_infinite]">
        <h1 className="text-center text-3xl font-serif font-bold text-amber-200 mb-8 animate-[glowText_3s_ease-in-out_infinite]">
          Portail Mystique
        </h1>

        <div className="flex flex-col space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Renseignez votre email magique"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border-2 border-amber-600/40 bg-white/80 px-4 py-2 text-stone-900 placeholder-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-300/30 outline-none transition"
          />

          {error && <p className="text-red-200 text-sm">{error}</p>}

          <button
            onClick={onSubmit}
            disabled={loading}
            className="rounded-lg bg-gradient-to-r from-amber-300 to-amber-500 text-amber-950 font-semibold py-2 shadow-[0_0_20px_rgba(255,220,150,.4)] hover:from-amber-200 hover:to-amber-400 active:translate-y-[1px] transition"
          >
            {loading ? "✨ Connexion..." : "Se connecter"}
          </button>

          <a
            href="/register"
            className="text-center text-sm text-amber-100 hover:text-amber-300 transition mt-4"
          >
            Vous n'avez pas de compte ? <span className="underline">Inscrivez-vous</span>
          </a>
        </div>
      </div>
    </div>
  )
}

export default Login
