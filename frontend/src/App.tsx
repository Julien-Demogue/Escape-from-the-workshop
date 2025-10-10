import { Routes, Route } from "react-router-dom";

// Pages originales
import Home from "./pages/Home";
import About from "./pages/About";
import GroupAdmin from "./pages/GroupAdmin";
import Group from "./pages/Group";
import Dashboard from "./pages/Dashboard";
import HeraldryQuiz from "./pages/HeraldryQuiz";
import Puzzle from "./pages/Puzzle";
import ChambordEnigma from "./pages/ChambordEnigma";
import BrissacEnigma from "./pages/BrissacEnigma";
import MemoryLoire from "./pages/MemoryLoire";
import CourierLoire from "./pages/CourierLoire";
import Messages from "./pages/Messages";
import Register from "./pages/Register";
import Login from './pages/Login';

// Nouvelles pages magiques
import MagicalBrissacEnigma from "./pages/MagicalBrissacEnigma";
import MagicalHome from "./pages/MagicalHome";
import MagicalDashboard from "./pages/MagicalDashboard";
import MagicalChambordEnigma from "./pages/MagicalChambordEnigma";
import MagicalAbout from "./pages/MagicalAbout";
import MagicalPuzzle from "./pages/MagicalPuzzle";
import EndGame from "./pages/Endgame";

const App: React.FC = () => (
  <Routes>
    {/* Nouvelles pages magiques */}
    <Route path="/" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/home" element={<MagicalHome />} />
    <Route path="/dashboard" element={<MagicalDashboard />} />
    <Route path="/about" element={<MagicalAbout />} />
    <Route path="/chambord-enigma" element={<MagicalChambordEnigma />} />

    {/* Pages originales pour compatibilité */}
    <Route path="/original-home" element={<Home />} />
    <Route path="/original-dashboard" element={<Dashboard />} />
    <Route path="/original-about" element={<About />} />
    <Route path="/original-chambord-enigma" element={<ChambordEnigma />} />

    <Route path="/puzzle" element={<MagicalPuzzle />} />
    <Route path="/original-puzzle" element={<Puzzle />} />
    <Route path="/heraldry-quiz" element={<HeraldryQuiz />} />
    <Route path="/brissac-enigma" element={<MagicalBrissacEnigma />} />
    <Route path="/original-brissac-enigma" element={<BrissacEnigma />} />
    <Route path="/memory-loire" element={<MemoryLoire />} />
    <Route path="/courrier-loire" element={<CourierLoire />} />
    <Route path="/groupadmin/:id" element={<GroupAdmin />} />
    <Route path="/groupadmin" element={<GroupAdmin />} />
    <Route path="/group/:id" element={<Group />} />
    <Route path="/messages" element={<Messages />} />
    <Route path="/end-game" element={<EndGame />} />
  </Routes>
);

export default App;