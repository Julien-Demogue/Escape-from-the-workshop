import { Link } from "react-router-dom"
import ThickBorderButton from "../components/ui/ThickBorderButton"
import ThickBorderInput from "../components/ui/ThickBorderInput"

const Home = () => {
  return (
    <div className="w-full h-[100vh] flex justify-center items-center flex-col gap-8 p-4">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <Link to="/groupadmin" style={{ textDecoration: 'none' }}>
              <ThickBorderButton>
                Créer une partie
              </ThickBorderButton>
            </Link>
            <div className="flex-1 space-y-2">
              <ThickBorderInput
                type="text"
                placeholder="Code de la partie"
                className="w-full"
              />
              <ThickBorderButton className="w-full">
                Rejoindre une partie
              </ThickBorderButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home