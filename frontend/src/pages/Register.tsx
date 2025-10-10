import { useState } from "react"
import authService from "../services/auth.service";

const Register = () => {

  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const getRandomNiceColor = (): string => {
    const niceColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
      '#FC427B', '#26D0CE', '#1DD1A1', '#FD79A8', '#FDCB6E',
      '#6C5CE7', '#74B9FF', '#00B894', '#E17055', '#81ECEC'
    ];

    return niceColors[Math.floor(Math.random() * niceColors.length)];
  }

  const onSubmit = async () => {
    try {
      setLoading(true)
      const hashedEmail = await hashEmail(email)
      const responseRegister = await authService.register(hashedEmail, username, getRandomNiceColor())
      if (responseRegister) {
        await authService.login(hashedEmail)
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
        onClick={onSubmit}
        className=" p-2 m-2 hover:bg-black hover:text-white transition-colors duration-300"
      >
        {loading ? "Loading..." : "Se connecter"}
      </button>
      <a href="/" className="text-blue-500 hover:underline mt-4">
        Déjà un compte ? Connectez-vous
      </a>
    </div>
  )
}

export default Register