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
import WebSocketTest from "./pages/WebsocketTest";
import Register from "./pages/Register";
import Login from './pages/Login';

// Nouvelles pages magiques
import MagicalHome from "./pages/MagicalHome";
import MagicalDashboard from "./pages/MagicalDashboard";
import MagicalChambordEnigmaFixed from "./pages/MagicalChambordEnigmaFixed";
import MagicalAbout from "./pages/MagicalAbout";

const App: React.FC = () => (
  <Routes>
    {/* Nouvelles pages magiques */}
    <Route path="/" element={<MagicalHome />} />
    <Route path="/dashboard" element={<MagicalDashboard />} />
    <Route path="/about" element={<MagicalAbout />} />
    <Route path="/chambord-enigma" element={<MagicalChambordEnigmaFixed />} />
    
    {/* Pages originales pour compatibilité */}
    <Route path="/original-home" element={<Home />} />
    <Route path="/original-dashboard" element={<Dashboard />} />
    <Route path="/original-about" element={<About />} />
    <Route path="/original-chambord-enigma" element={<ChambordEnigma />} />
    
    <Route path="/puzzle" element={<Puzzle />} />
    <Route path="/heraldry-quiz" element={<HeraldryQuiz />} />
    <Route path="/brissac-enigma" element={<BrissacEnigma />} />
    <Route path="/memory-loire" element={<MemoryLoire />} />
    <Route path="/courier-loire" element={<CourierLoire />} />
    <Route path="/groupadmin" element={<GroupAdmin />} />
    <Route path="/group" element={<Group />} />
    <Route path="/websocket-test" element={<WebSocketTest />} />
  </Routes>
);

export default App;