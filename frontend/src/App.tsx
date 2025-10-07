import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import About from "./pages/About";
import GroupAdmin from "./pages/GroupAdmin";
import Group from "./pages/Group";
import Dashboard from "./pages/Dashboard";

const App: React.FC = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
    <Route path="/groupadmin" element={<GroupAdmin />} />
    <Route path="/group" element={<Group />} />
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
);

export default App;