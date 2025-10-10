/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import authService from "../services/auth.service";

const Register = () => {
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'error' } | null>(null)
  function showToast(message: string, type: 'info' | 'error' = 'info') {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 3000)
  }

  const getRandomNiceColor = (): string => {
    const niceColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
      '#FC427B', '#26D0CE', '#1DD1A1', '#FD79A8', '#FDCB6E',
      '#6C5CE7', '#74B9FF', '#00B894', '#E17055', '#81ECEC'
    ];

    return niceColors[Math.floor(Math.random() * niceColors.length)];
  }

  function validateEmail(value: string) {
    if (!value) return false
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(value)
  }

  const onSubmit = async () => {
    try {
      if (!validateEmail(email)) {
        showToast("Email invalide. Vérifiez le format.", "error")
        return
      }
      if (!username || username.trim().length === 0) {
        showToast("Nom d'utilisateur requis.", "error")
        return
      }

      setLoading(true)
      const hashedEmail = await hashEmail(email)
      const responseRegister = await authService.register(hashedEmail, username, getRandomNiceColor())
      if (responseRegister) {
        await authService.login(hashedEmail)
        window.location.href = "/home"
      } else {
        showToast("Échec de la création de compte.", "error")
      }
    } catch (err: any) {
      console.error("Register error:", err)
      const status = err?.response?.status
      if (status === 409) {
        showToast("Utilisateur existe déjà.", "error")
      } else if (status === 400) {
        showToast("Paramètres invalides.", "error")
      } else {
        showToast("Une erreur est survenue. Réessayez.", "error")
      }
    } finally {
      setLoading(false)
    }
  }
  async function hashEmail(email: string) {
    // Encoder la chaîne en UTF-8
    const encoder = new TextEncoder();
    const data = encoder.encode(email);

    // Calculer le hash avec SHA-256
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    // Convertir le hash en chaîne hexadécimale
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    return hashHex;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1>Register</h1>
      <input
        name="email"
        type="text"
        placeholder="Renseignez votre email"
        onChange={(e) => setEmail(e.target.value)}
        value={email}
        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        name="username"
        type="text"
        placeholder="Renseignez votre nom d'utilisateur"
        onChange={(e) => setUsername(e.target.value)}
        value={username}
        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={onSubmit}
        className=" p-2 m-2 hover:bg-black hover:text-white transition-colors duration-300"
      >
        {loading ? "Loading..." : "Se connecter"}
      </button>
      <a href="/" className="text-blue-500 hover:underline mt-4">
        Déjà un compte ? Connectez-vous
      </a>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-md shadow-md ${toast.type === "error" ? "bg-red-600 text-white" : "bg-amber-300 text-stone-900"
            }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default Register