import { Routes, Route } from "react-router-dom";

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

const App: React.FC = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
    <Route path="/puzzle" element={<Puzzle />} />
    <Route path="/heraldry-quiz" element={<HeraldryQuiz />} />
    <Route path="/chambord-enigma" element={<ChambordEnigma />} />
    <Route path="/brissac-enigma" element={<BrissacEnigma />} />
    <Route path="/memory-loire" element={<MemoryLoire />} />
    <Route path="/groupadmin" element={<GroupAdmin />} />
    <Route path="/group" element={<Group />} />
    <Route path="/dashboard" element={<Dashboard />} />

  </Routes>
);

export default App;