import { Link } from "react-router-dom"

const Home = () => {
  return (
    <div>
      <h1>Accueil</h1>
      <p>Bienvenue sur la page d'accueil.</p>
      <Link to="/about" className="red">Aller à la page About</Link>
      <Link to="/puzzle" className="red">Aller à la page Puzzle</Link>
    </div>
  )
}

export default Home