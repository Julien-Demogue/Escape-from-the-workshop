import { Link } from "react-router-dom"
import ThickBorderButton from "../components/ui/ThickBorderButton"
import ThickBorderInput from "../components/ui/ThickBorderInput"

const Home = () => {
  return (
    <div className="w-full h-[100vh] flex flex-col justify-center items-center gap-8">
      <div className="flex gap-8">
        <Link to="/groupadmin" style={{ textDecoration: 'none' }}>
          <ThickBorderButton>
            Créer une partie
          </ThickBorderButton>
        </Link>
        <ThickBorderInput
          type="text"
          placeholder="Code ici"
        />
      </div>
      <div>
        <Link to="/group" style={{ textDecoration: 'none' }}>
          <ThickBorderButton>
            Rejoindre
          </ThickBorderButton>
        </Link>
      </div>
    </div>
  )
}

export default Home