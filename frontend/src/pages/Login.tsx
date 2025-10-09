import { useState } from "react"
import authService from "../services/auth.service";

const Login = () => {

  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const onSubmit = async () => {
    try {
      setLoading(true)
      const hashedEmail = await hashEmail(email)
      const response = await authService.login(hashedEmail)
      if (response) {
        window.location.href = "/home"
      }
    } catch (error) {
      console.error("Login error:", error)
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
      <h1>Login</h1>
      <input
        name="email"
        type="text"
        placeholder="Renseignez votre email"
        onChange={(e) => setEmail(e.target.value)}
        value={email}
        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={onSubmit}
        className="p-2 m-2 hover:bg-black hover:text-white transition-colors duration-300"
      >
        {loading ? "Loading..." : "Se connecter"}
      </button>
      <a href="/register" className="text-blue-500 hover:underline mt-4">
        Vous n'avez pas de compte ? Inscrivez-vous
      </a>
    </div>
  )
}

export default Login