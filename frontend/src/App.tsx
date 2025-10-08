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
import CourierLoire from "./pages/CourierLoire";
import WebSocketTest from "./pages/WebsocketTest";
import Register from "./pages/Register";
import Login from './pages/Login';

const App: React.FC = () => (
  <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/home" element={<Home />} />
    <Route path="/puzzle" element={<Puzzle />} />
    <Route path="/heraldry-quiz" element={<HeraldryQuiz />} />
    <Route path="/chambord-enigma" element={<ChambordEnigma />} />
    <Route path="/brissac-enigma" element={<BrissacEnigma />} />
    <Route path="/memory-loire" element={<MemoryLoire />} />
    <Route path="/courier-loire" element={<CourierLoire />} />
    <Route path="/groupadmin" element={<GroupAdmin />} />
    <Route path="/group" element={<Group />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/websocket-test" element={<WebSocketTest />} />
    <Route path="/about" element={<About />} />
  </Routes>
);

export default App;