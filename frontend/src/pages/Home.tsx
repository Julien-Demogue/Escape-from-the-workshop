import { Link } from "react-router-dom"

const Home = () => {
  return (
    <div className="w-full h-[100vh] flex justify-center items-center flex-col gap-4 p-4">
      <Link to="/group">
        <a className="font-bold text-black no-underline hover:underline">
          Lancer une partie
        </a>
      </Link>
      <input
        type="text"
        placeholder="Code de la partie"
        className="border border-black"
      />
      <Link to="/puzzle" className="red">
        Accéder au puzzle
      </Link>
      <Link to="/heraldry-quiz" className="red">
        Accéder au quiz héraldique
      </Link>
      <Link to="/chambord-enigma" className="red">
        Accéder à l'énigme de Chambord
      </Link>
      <Link to="/brissac-enigma" className="red">
        Accéder à l'énigme de Brissac
      </Link>
    </div>
  )
}

export default Home